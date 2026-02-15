import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http, recoverTypedDataAddress, parseUnits, defineChain } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { MOCK_LISTINGS, MOCK_SOULS } from '@/lib/mockData'
import { EIP712_DOMAIN, PAYMENT_TYPES } from '@/lib/x402/types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const FACILITATOR_ADDRESS = process.env.NEXT_PUBLIC_FACILITATOR_ADDRESS as `0x${string}`
const SOUL_SALE_ADDRESS = process.env.NEXT_PUBLIC_SOUL_SALE_ADDRESS as `0x${string}`
const AUSD_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_AUSD_TOKEN_ADDRESS as `0x${string}`
const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '143')
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545'
const OPERATOR_KEY = process.env.OPERATOR_PRIVATE_KEY as `0x${string}` | undefined

const X402_FACILITATOR_ABI = [
  {
    inputs: [
      {
        components: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'paymentRef', type: 'bytes32' },
        ],
        name: 'payload',
        type: 'tuple',
      },
      { name: 'signature', type: 'bytes' },
      { name: 'purchaseAmount', type: 'uint256' },
      { name: 'recipient', type: 'address' },
    ],
    name: 'settleAndBuy',
    outputs: [{ name: 'paymentHash', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'agent', type: 'address' }],
    name: 'getNonce',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

/**
 * POST /api/agent/buy
 * Agent purchases a soul via x402 payment protocol
 *
 * Step 1: Agent calls without payment headers → gets 402 with PaymentRequirements
 * Step 2: Agent calls with X-Payment-Signature header → settlement + purchase
 *
 * Body: { listing_id: number, amount?: number, recipient?: string }
 * Headers: X-Agent-Id: 0x<agent_wallet>
 */
export async function POST(request: NextRequest) {
  try {
    const agentId = request.headers.get('X-Agent-Id')
    if (!agentId) {
      return NextResponse.json({ error: 'Missing X-Agent-Id header' }, { status: 401 })
    }

    const body = await request.json()
    const { listing_id, amount = 1, recipient } = body
    const buyRecipient = (recipient || agentId) as `0x${string}`

    if (!listing_id) {
      return NextResponse.json({ error: 'Missing listing_id' }, { status: 400 })
    }

    // Look up listing
    const listing = await getListing(listing_id)
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (listing.remaining_amount < amount) {
      return NextResponse.json({ error: 'Insufficient supply' }, { status: 400 })
    }

    // Calculate total price in wei
    const priceWei = parseUnits(String(listing.price), 18) * BigInt(amount)

    // Check for payment signature (step 2)
    const paymentSignature = request.headers.get('X-Payment-Signature')
    const paymentPayload = request.headers.get('X-Payment-Payload')

    if (!paymentSignature || !paymentPayload) {
      // Step 1: Return 402 Payment Required
      const publicClient = createPublicClient({ transport: http(RPC_URL) })

      let nonce = '0'
      try {
        const onChainNonce = await publicClient.readContract({
          address: FACILITATOR_ADDRESS,
          abi: X402_FACILITATOR_ABI,
          functionName: 'getNonce',
          args: [agentId as `0x${string}`],
        })
        nonce = onChainNonce.toString()
      } catch {
        // Use 0 as fallback
      }

      const deadline = Math.floor(Date.now() / 1000) + 3600 // 1 hour
      const listingRef = `0x${listing_id.toString(16).padStart(64, '0')}`

      return NextResponse.json(
        {
          message: 'Payment required to purchase this soul',
          requirements: {
            scheme: 'exact',
            network: String(CHAIN_ID),
            token: AUSD_TOKEN_ADDRESS,
            amount: priceWei.toString(),
            recipient: SOUL_SALE_ADDRESS,
            facilitator: FACILITATOR_ADDRESS,
            nonce,
            deadline,
            paymentRef: listingRef,
          },
          soul: listing.soul || null,
        },
        { status: 402 }
      )
    }

    // Step 2: Verify signature and settle
    const payload = JSON.parse(paymentPayload)

    // Verify EIP-712 signature
    const domain = {
      ...EIP712_DOMAIN,
      chainId: CHAIN_ID,
      verifyingContract: FACILITATOR_ADDRESS,
    }

    const recoveredAddress = await recoverTypedDataAddress({
      domain,
      types: PAYMENT_TYPES,
      primaryType: 'PaymentPayload',
      message: {
        from: payload.from,
        to: payload.to,
        token: payload.token,
        amount: BigInt(payload.amount),
        nonce: BigInt(payload.nonce),
        deadline: BigInt(payload.deadline),
        paymentRef: payload.paymentRef,
      },
      signature: paymentSignature as `0x${string}`,
    })

    if (recoveredAddress.toLowerCase() !== payload.from.toLowerCase()) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    if (BigInt(payload.deadline) < BigInt(Math.floor(Date.now() / 1000))) {
      return NextResponse.json({ error: 'Payment expired' }, { status: 400 })
    }

    // Settle on-chain
    if (!OPERATOR_KEY) {
      return NextResponse.json(
        { error: 'Server not configured for settlement (OPERATOR_PRIVATE_KEY missing)' },
        { status: 500 }
      )
    }

    const account = privateKeyToAccount(OPERATOR_KEY)
    const chain = defineChain({
      id: CHAIN_ID,
      name: 'Monad',
      nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
      rpcUrls: { default: { http: [RPC_URL] } },
    })
    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(RPC_URL),
    })
    const publicClient = createPublicClient({ transport: http(RPC_URL) })

    const payloadTuple = {
      from: payload.from as `0x${string}`,
      to: payload.to as `0x${string}`,
      token: payload.token as `0x${string}`,
      amount: BigInt(payload.amount),
      nonce: BigInt(payload.nonce),
      deadline: BigInt(payload.deadline),
      paymentRef: payload.paymentRef as `0x${string}`,
    }

    const hash = await walletClient.writeContract({
      address: FACILITATOR_ADDRESS,
      abi: X402_FACILITATOR_ABI,
      functionName: 'settleAndBuy',
      args: [payloadTuple, paymentSignature as `0x${string}`, BigInt(amount), buyRecipient],
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    // Fetch soul data for the response
    const soul = listing.soul || null

    return NextResponse.json({
      success: receipt.status === 'success',
      txHash: hash,
      listing_id,
      amount,
      recipient: buyRecipient,
      price_paid: priceWei.toString(),
      soul,
    })
  } catch (error) {
    console.error('Agent buy error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Purchase failed' },
      { status: 500 }
    )
  }
}

// Helper: look up listing from Supabase or mock
async function getListing(listingId: number) {
  if (SUPABASE_URL && SUPABASE_KEY) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/listings?listing_id=eq.${listingId}&select=*,souls(*)`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    )
    if (res.ok) {
      const rows = await res.json()
      if (rows.length > 0) {
        const row = rows[0]
        return { ...row, soul: row.souls || null }
      }
    }
    return null
  }

  // Mock fallback
  const listing = MOCK_LISTINGS.find(l => l.listing_id === listingId)
  if (!listing) return null

  const soul = MOCK_SOULS.find(s => s.id === listing.soul_id || s.token_id === listing.token_id)
  return { ...listing, soul: soul || null }
}
