/**
 * x402 Client SDK for AI Agents
 * Handles payment signing and submission for Soul purchases
 */

import { signTypedData } from 'viem/accounts'
import type { Account } from 'viem'
import {
  PaymentPayload,
  PaymentRequirements,
  SignedPayment,
  SettlementResult,
  EIP712_DOMAIN,
  PAYMENT_TYPES,
} from './types'

export class X402Client {
  private account: Account
  private chainId: number
  private facilitatorAddress: `0x${string}`
  private baseUrl: string

  constructor(config: {
    account: Account
    chainId: number
    facilitatorAddress: `0x${string}`
    baseUrl?: string
  }) {
    this.account = config.account
    this.chainId = config.chainId
    this.facilitatorAddress = config.facilitatorAddress
    this.baseUrl = config.baseUrl || ''
  }

  /**
   * Get next nonce for this agent
   */
  async getNonce(): Promise<bigint> {
    const res = await fetch(
      `${this.baseUrl}/api/x402?agent=${this.account.address}`
    )
    if (!res.ok) {
      throw new Error('Failed to get nonce')
    }
    const data = await res.json()
    return BigInt(data.nonce)
  }

  /**
   * Create and sign a payment payload
   */
  async createPayment(
    requirements: PaymentRequirements
  ): Promise<SignedPayment> {
    const payload: PaymentPayload = {
      from: this.account.address,
      to: requirements.recipient,
      token: requirements.token,
      amount: BigInt(requirements.amount),
      nonce: BigInt(requirements.nonce),
      deadline: BigInt(requirements.deadline),
      paymentRef: requirements.paymentRef as `0x${string}`,
    }

    const domain = {
      ...EIP712_DOMAIN,
      chainId: this.chainId,
      verifyingContract: this.facilitatorAddress,
    }

    const signature = await signTypedData({
      privateKey: (this.account as any).privateKey,
      domain,
      types: PAYMENT_TYPES,
      primaryType: 'PaymentPayload',
      message: {
        from: payload.from,
        to: payload.to,
        token: payload.token,
        amount: payload.amount,
        nonce: payload.nonce,
        deadline: payload.deadline,
        paymentRef: payload.paymentRef,
      },
    })

    return { payload, signature }
  }

  /**
   * Submit a signed payment for settlement
   */
  async settle(signedPayment: SignedPayment): Promise<SettlementResult> {
    const res = await fetch(`${this.baseUrl}/api/x402`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'settle',
        payload: {
          ...signedPayment.payload,
          amount: signedPayment.payload.amount.toString(),
          nonce: signedPayment.payload.nonce.toString(),
          deadline: signedPayment.payload.deadline.toString(),
        },
        signature: signedPayment.signature,
      }),
    })

    return res.json()
  }

  /**
   * Handle a 402 response - extract requirements, sign, and retry
   */
  async handlePaymentRequired(response: Response): Promise<SignedPayment> {
    if (response.status !== 402) {
      throw new Error('Not a 402 response')
    }

    const body = await response.json()
    const requirements: PaymentRequirements = body.requirements

    // Sign the payment
    return this.createPayment(requirements)
  }

  /**
   * Make a request with automatic 402 handling
   * If 402 is returned, sign payment and retry with signature
   */
  async requestWithPayment(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    // Add agent headers
    const headers = new Headers(options.headers)
    headers.set('X-Agent-Id', this.account.address)
    headers.set('X-Agent-Wallet', this.account.address)

    // First request
    let response = await fetch(url, { ...options, headers })

    // Handle 402
    if (response.status === 402) {
      const signedPayment = await this.handlePaymentRequired(response)

      // Retry with payment signature
      headers.set('X-Payment-Payload', JSON.stringify({
        ...signedPayment.payload,
        amount: signedPayment.payload.amount.toString(),
        nonce: signedPayment.payload.nonce.toString(),
        deadline: signedPayment.payload.deadline.toString(),
      }))
      headers.set('X-Payment-Signature', signedPayment.signature)

      response = await fetch(url, { ...options, headers })
    }

    return response
  }
}

/**
 * Parse 402 response to get payment requirements
 */
export function parse402Response(response: Response): PaymentRequirements | null {
  if (response.status !== 402) return null

  const header = response.headers.get('X-Payment-Required')
  if (!header) return null

  try {
    return JSON.parse(header)
  } catch {
    return null
  }
}
