/**
 * x402 Payment Protocol Module
 *
 * x402 is used ONLY for AI Agent purchases.
 * Human users continue to use the standard buy/buyWithPermit flow.
 *
 * Flow for Agents:
 * 1. Agent requests purchase endpoint with X-Agent-Id header
 * 2. Server returns 402 Payment Required with PaymentRequirements
 * 3. Agent signs EIP-712 PaymentPayload
 * 4. Agent retries with X-Payment-Signature header
 * 5. Server verifies signature and calls X402Facilitator.settle()
 * 6. Facilitator transfers tokens and emits PaymentSettled event
 * 7. Server calls SoulSale.buyViaX402() to transfer NFT
 */

export * from './types'
export * from './middleware'
export * from './client'
