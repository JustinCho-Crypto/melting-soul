/**
 * x402 Payment Protocol Types
 * For Agent-only payment flow
 */

export interface PaymentPayload {
  from: `0x${string}`      // Agent wallet (payer)
  to: `0x${string}`        // Recipient (SoulSale contract)
  token: `0x${string}`     // Payment token address (aUSD)
  amount: bigint           // Amount in wei
  nonce: bigint            // Unique nonce for replay protection
  deadline: bigint         // Unix timestamp expiration
  paymentRef: `0x${string}` // 32-byte paymentRef ID (listing ID encoded)
}

export interface PaymentRequirements {
  scheme: 'exact'
  network: string          // 'monad' or chain ID
  token: `0x${string}`     // Payment token address
  amount: string           // Amount in wei (string for JSON)
  recipient: `0x${string}` // SoulSale contract address
  facilitator: `0x${string}` // X402Facilitator address
  nonce: string            // Next available nonce
  deadline: number         // Unix timestamp
  paymentRef: string        // Listing paymentRef
}

export interface SignedPayment {
  payload: PaymentPayload
  signature: `0x${string}`
}

export interface SettlementResult {
  success: boolean
  paymentHash?: `0x${string}`
  txHash?: `0x${string}`
  error?: string
}

export interface X402Response {
  status: 402
  headers: {
    'X-Payment-Required': string  // JSON PaymentRequirements
    'X-Facilitator': string       // Facilitator contract address
    'X-Network': string           // Chain ID
  }
  body: {
    message: string
    requirements: PaymentRequirements
  }
}

// EIP-712 Domain for signing
export const EIP712_DOMAIN = {
  name: 'SoulMarketplace',
  version: '1',
} as const

export const PAYMENT_TYPES = {
  PaymentPayload: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'token', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
    { name: 'paymentRef', type: 'bytes32' },
  ],
} as const
