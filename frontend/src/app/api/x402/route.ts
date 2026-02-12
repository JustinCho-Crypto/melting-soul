import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http, recoverTypedDataAddress, defineChain } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { PAYMENT_TYPES, EIP712_DOMAIN, SettlementResult } from '@/lib/x402/types'

// Contract addresses from env
const FACILITATOR_ADDRESS = process.env.NEXT_PUBLIC_FACILITATOR_ADDRESS as `0x${string}`
const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '1')
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545'

// Operator private key (server-side only)
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
    ],
    name: 'verify',
    outputs: [
      { name: 'valid', type: 'bool' },
      { name: 'signer', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
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
    ],
    name: 'settle',
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
 * POST /api/x402
 * Verify and settle x402 payments
 *
 * Request body:
 * {
 *   action: 'verify' | 'settle',
 *   payload: PaymentPayload,
 *   signature: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, payload, signature } = body

    if (!payload || !signature) {
      return NextResponse.json(
        { error: 'Missing payload or signature' },
        { status: 400 }
      )
    }

    // Create public client for reading
    const publicClient = createPublicClient({
      transport: http(RPC_URL),
    })

    // Verify signature locally first (faster)
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
      signature,
    })

    if (recoveredAddress.toLowerCase() !== payload.from.toLowerCase()) {
      return NextResponse.json(
        { error: 'Invalid signature - signer mismatch' },
        { status: 401 }
      )
    }

    // Check deadline
    if (BigInt(payload.deadline) < BigInt(Math.floor(Date.now() / 1000))) {
      return NextResponse.json(
        { error: 'Payment expired' },
        { status: 400 }
      )
    }

    if (action === 'verify') {
      // Just verify, don't settle
      return NextResponse.json({
        valid: true,
        signer: recoveredAddress,
      })
    }

    if (action === 'settle') {
      if (!OPERATOR_KEY) {
        return NextResponse.json(
          { error: 'Server not configured for settlement' },
          { status: 500 }
        )
      }

      // Create wallet client for writing
      const account = privateKeyToAccount(OPERATOR_KEY)
      const chain = defineChain({
        id: CHAIN_ID,
        name: 'Custom',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: [RPC_URL] } },
      })
      const walletClient = createWalletClient({
        account,
        chain,
        transport: http(RPC_URL),
      })

      // Call settle on facilitator contract
      const hash = await walletClient.writeContract({
        address: FACILITATOR_ADDRESS,
        abi: X402_FACILITATOR_ABI,
        functionName: 'settle',
        args: [
          {
            from: payload.from,
            to: payload.to,
            token: payload.token,
            amount: BigInt(payload.amount),
            nonce: BigInt(payload.nonce),
            deadline: BigInt(payload.deadline),
            paymentRef: payload.paymentRef,
          },
          signature,
        ],
      })

      // Wait for receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      const result: SettlementResult = {
        success: receipt.status === 'success',
        txHash: hash,
      }

      return NextResponse.json(result)
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('x402 error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Settlement failed' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/x402?agent=0x...
 * Get next nonce for an agent
 */
export async function GET(request: NextRequest) {
  try {
    const agent = request.nextUrl.searchParams.get('agent') as `0x${string}`

    if (!agent) {
      return NextResponse.json(
        { error: 'Missing agent address' },
        { status: 400 }
      )
    }

    const publicClient = createPublicClient({
      transport: http(RPC_URL),
    })

    const nonce = await publicClient.readContract({
      address: FACILITATOR_ADDRESS,
      abi: X402_FACILITATOR_ABI,
      functionName: 'getNonce',
      args: [agent],
    })

    return NextResponse.json({
      agent,
      nonce: nonce.toString(),
      facilitator: FACILITATOR_ADDRESS,
      chainId: CHAIN_ID,
    })
  } catch (error) {
    console.error('x402 nonce error:', error)
    return NextResponse.json(
      { error: 'Failed to get nonce' },
      { status: 500 }
    )
  }
}
