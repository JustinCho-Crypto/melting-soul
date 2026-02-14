/**
 * x402 E2E Test Script
 * Signs EIP-712 PaymentPayload and calls POST /api/x402 to settle
 */
import { createWalletClient, createPublicClient, http, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { defineChain } from 'viem'

const PRIVATE_KEY = '0x7f24c9f594304de01cca88c912ffaf14b5ebd9a3338cb7ea22f10310c1e4f22d'
const FACILITATOR = '0x2f9584a3eBA4149D10f7EC6c040c5346ccc938eA'
const SALE = '0x72b0d16e3DDFF187c5a785BF66408a3cC9Ac2225'
const TOKEN = '0xFBD84ab1526BfbA7533b1EC2842894eE92777777'
const CHAIN_ID = 10143
const API_URL = 'http://localhost:3002/api/x402'

const account = privateKeyToAccount(PRIVATE_KEY)
console.log('Agent address:', account.address)

// Step 1: Get nonce from API
const nonceRes = await fetch(`${API_URL}?agent=${account.address}`)
const nonceData = await nonceRes.json()
console.log('Nonce data:', nonceData)

// Step 2: Build payload
const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600) // 1 hour
const payload = {
  from: account.address,
  to: SALE,           // payment goes to SoulSale
  token: TOKEN,       // DRA token
  amount: parseEther('1'),  // 1 DRA (price of 1 Soul unit)
  nonce: BigInt(nonceData.nonce),
  deadline,
  paymentRef: '0x0000000000000000000000000000000000000000000000000000000000000001', // listing #1
}

console.log('Payload:', {
  ...payload,
  amount: payload.amount.toString(),
  nonce: payload.nonce.toString(),
  deadline: payload.deadline.toString(),
})

// Step 3: Sign EIP-712
const domain = {
  name: 'SoulMarketplace',
  version: '1',
  chainId: CHAIN_ID,
  verifyingContract: FACILITATOR,
}

const types = {
  PaymentPayload: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'token', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
    { name: 'paymentRef', type: 'bytes32' },
  ],
}

const signature = await account.signTypedData({
  domain,
  types,
  primaryType: 'PaymentPayload',
  message: payload,
})

console.log('Signature:', signature)

// Step 4: Verify first
console.log('\n=== Verify ===')
const verifyRes = await fetch(API_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'verify',
    payload: {
      ...payload,
      amount: payload.amount.toString(),
      nonce: payload.nonce.toString(),
      deadline: payload.deadline.toString(),
    },
    signature,
  }),
})
const verifyData = await verifyRes.json()
console.log('Verify result:', verifyData)

if (!verifyData.valid) {
  console.error('Verification failed! Aborting settle.')
  process.exit(1)
}

// Step 5: Settle
console.log('\n=== Settle ===')
const settleRes = await fetch(API_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'settle',
    payload: {
      ...payload,
      amount: payload.amount.toString(),
      nonce: payload.nonce.toString(),
      deadline: payload.deadline.toString(),
    },
    signature,
  }),
})
const settleData = await settleRes.json()
console.log('Settle result:', settleData)

if (settleData.txHash) {
  console.log(`\nTransaction: https://testnet.monadexplorer.com/tx/${settleData.txHash}`)
}
