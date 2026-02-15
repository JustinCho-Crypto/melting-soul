import { NextRequest, NextResponse } from 'next/server'
import { PaymentRequirements } from './types'

// Contract addresses
const FACILITATOR_ADDRESS = process.env.NEXT_PUBLIC_FACILITATOR_ADDRESS as `0x${string}`
const SOUL_SALE_ADDRESS = process.env.NEXT_PUBLIC_SOUL_SALE_ADDRESS as `0x${string}`
const AUSD_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_AUSD_TOKEN_ADDRESS as `0x${string}`
const DISCOUNT_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_DISCOUNT_TOKEN_ADDRESS as `0x${string}`
const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || '143'

/**
 * Check if request is from an AI Agent
 * Agents should include X-Agent-Id header
 */
export function isAgentRequest(request: NextRequest): boolean {
  return request.headers.has('X-Agent-Id') ||
    request.headers.has('X-Agent-Wallet')
}

/**
 * Check if payment signature is present
 */
export function hasPaymentSignature(request: NextRequest): boolean {
  return request.headers.has('X-Payment-Signature') &&
    request.headers.has('X-Payment-Payload')
}

/**
 * Extract payment from headers
 */
export function extractPayment(request: NextRequest) {
  const payloadHeader = request.headers.get('X-Payment-Payload')
  const signature = request.headers.get('X-Payment-Signature') as `0x${string}` | null

  if (!payloadHeader || !signature) {
    return null
  }

  try {
    const payload = JSON.parse(payloadHeader)
    return { payload, signature }
  } catch {
    return null
  }
}

/**
 * Create 402 Payment Required response with multi-token support
 */
export function create402Response(
  listingId: number,
  amount: string,
  nonce: string,
  deadlineSeconds = 3600 // 1 hour default
): NextResponse {
  const deadline = Math.floor(Date.now() / 1000) + deadlineSeconds

  // Encode listing ID as bytes32 paymentRef
  const paymentRef = `0x${listingId.toString(16).padStart(64, '0')}` as `0x${string}`

  // Primary requirements (aUSD at full price)
  const requirements: PaymentRequirements = {
    scheme: 'exact',
    network: CHAIN_ID,
    token: AUSD_TOKEN_ADDRESS,
    amount,
    recipient: SOUL_SALE_ADDRESS,
    facilitator: FACILITATOR_ADDRESS,
    nonce,
    deadline,
    paymentRef,
  }

  // Compute discounted amount for $SOUL (20% off)
  const discountedAmount = (BigInt(amount) * BigInt(8000) / BigInt(10000)).toString()

  // Accepted tokens list
  const acceptedTokens = [
    {
      token: AUSD_TOKEN_ADDRESS,
      symbol: 'aUSD',
      amount,
      discount: null,
    },
    ...(DISCOUNT_TOKEN_ADDRESS ? [{
      token: DISCOUNT_TOKEN_ADDRESS,
      symbol: '$SOUL',
      amount: discountedAmount,
      discount: '20%',
    }] : []),
  ]

  const response = NextResponse.json(
    {
      message: 'Payment Required',
      requirements,
      acceptedTokens,
    },
    { status: 402 }
  )

  // Set standard x402 headers
  response.headers.set('X-Payment-Required', JSON.stringify(requirements))
  response.headers.set('X-Facilitator', FACILITATOR_ADDRESS)
  response.headers.set('X-Network', CHAIN_ID)
  response.headers.set('X-Accepted-Tokens', JSON.stringify(acceptedTokens))

  return response
}

/**
 * Detect agent and enforce x402 payment flow
 * Use this in API routes that require payment
 */
export async function enforceX402(
  request: NextRequest,
  listingId: number,
  amount: string,
  agentWallet?: `0x${string}`
): Promise<NextResponse | null> {
  // Only apply to agent requests
  if (!isAgentRequest(request)) {
    return null // Continue with normal human flow
  }

  // Check if payment signature is present
  if (!hasPaymentSignature(request)) {
    // Get nonce for agent
    const wallet = agentWallet || request.headers.get('X-Agent-Wallet') as `0x${string}`

    if (!wallet) {
      return NextResponse.json(
        { error: 'Agent wallet required' },
        { status: 400 }
      )
    }

    // Fetch nonce from facilitator
    let nonce = '0'
    try {
      const nonceRes = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/x402?agent=${wallet}`
      )
      if (nonceRes.ok) {
        const data = await nonceRes.json()
        nonce = data.nonce
      }
    } catch {
      // Use default nonce
    }

    // Return 402 Payment Required
    return create402Response(listingId, amount, nonce)
  }

  // Payment signature present - verify and settle
  const payment = extractPayment(request)
  if (!payment) {
    return NextResponse.json(
      { error: 'Invalid payment data' },
      { status: 400 }
    )
  }

  // Verify and settle via x402 API
  try {
    const settleRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/x402`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'settle',
          payload: payment.payload,
          signature: payment.signature,
        }),
      }
    )

    if (!settleRes.ok) {
      const error = await settleRes.json()
      return NextResponse.json(
        { error: error.error || 'Payment settlement failed' },
        { status: 402 }
      )
    }

    // Payment settled successfully - continue with purchase
    return null
  } catch (_error) {
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    )
  }
}
