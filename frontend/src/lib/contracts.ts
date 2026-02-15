export const SOUL_NFT_ADDRESS = process.env.NEXT_PUBLIC_SOUL_NFT_ADDRESS as `0x${string}` | undefined
export const SOUL_SALE_ADDRESS = process.env.NEXT_PUBLIC_SOUL_SALE_ADDRESS as `0x${string}` | undefined
export const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}` | undefined
export const AUSD_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_AUSD_TOKEN_ADDRESS as `0x${string}` | undefined
export const DISCOUNT_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_DISCOUNT_TOKEN_ADDRESS as `0x${string}` | undefined
export const AGENT_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS as `0x${string}` | undefined
export const FACILITATOR_ADDRESS = process.env.NEXT_PUBLIC_FACILITATOR_ADDRESS as `0x${string}` | undefined

// NadFun Lens (Monad Mainnet) – price oracle for $SOUL token
export const NADFUN_LENS_ADDRESS = '0x7e78A8DE94f21804F7a17F4E8BF9EC2c872187ea' as `0x${string}`

export const SOUL_NFT_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: true, name: 'creator', type: 'address' },
      { indexed: false, name: 'parentId', type: 'uint256' },
      { indexed: false, name: 'generation', type: 'uint256' },
    ],
    name: 'SoulCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'newTokenId', type: 'uint256' },
      { indexed: true, name: 'parentTokenId', type: 'uint256' },
      { indexed: true, name: 'forker', type: 'address' },
    ],
    name: 'SoulForked',
    type: 'event',
  },
  {
    inputs: [{ name: 'metadataUri', type: 'string' }, { name: 'initialSupply', type: 'uint256' }],
    name: 'createSoul',
    outputs: [{ name: 'tokenId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'parentTokenId', type: 'uint256' }, { name: 'metadataUri', type: 'string' }, { name: 'initialSupply', type: 'uint256' }],
    name: 'forkSoul',
    outputs: [{ name: 'newTokenId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }, { name: 'amount', type: 'uint256' }],
    name: 'mintMore',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getLineage',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'souls',
    outputs: [
      { name: 'creator', type: 'address' },
      { name: 'parentId', type: 'uint256' },
      { name: 'generation', type: 'uint256' },
      { name: 'forkCount', type: 'uint256' },
      { name: 'totalMinted', type: 'uint256' },
      { name: 'createdAt', type: 'uint256' },
      { name: 'metadataUri', type: 'string' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }, { name: 'id', type: 'uint256' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'id', type: 'uint256' }, { name: 'value', type: 'uint256' }, { name: 'data', type: 'bytes' }],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'operator', type: 'address' }, { name: 'approved', type: 'bool' }],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

export const SOUL_SALE_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'listingId', type: 'uint256' },
      { indexed: true, name: 'seller', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'pricePerUnit', type: 'uint256' },
    ],
    name: 'Listed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'listingId', type: 'uint256' },
      { indexed: true, name: 'buyer', type: 'address' },
      { indexed: true, name: 'recipient', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'totalPrice', type: 'uint256' },
    ],
    name: 'Sold',
    type: 'event',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }, { name: 'amount', type: 'uint256' }, { name: 'pricePerUnit', type: 'uint256' }],
    name: 'list',
    outputs: [{ name: 'listingId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'listingId', type: 'uint256' }, { name: 'amount', type: 'uint256' }, { name: 'to', type: 'address' }],
    name: 'buy',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'listingId', type: 'uint256' }, { name: 'amount', type: 'uint256' }, { name: 'to', type: 'address' }],
    name: 'buyWithAusd',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'listingId', type: 'uint256' }, { name: 'amount', type: 'uint256' }, { name: 'to', type: 'address' }],
    name: 'buyWithDiscountToken',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'price', type: 'uint256' }],
    name: 'getDiscountedPrice',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'listingId', type: 'uint256' }],
    name: 'cancelListing',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'listingId', type: 'uint256' }],
    name: 'listings',
    outputs: [
      { name: 'seller', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'pricePerUnit', type: 'uint256' },
      { name: 'active', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export const ERC20_ABI = [
  {
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// ERC-8004 Agent Registry
export const AGENT_REGISTRY_ABI = [
  {
    inputs: [{ name: 'agentUri', type: 'string' }, { name: 'wallet', type: 'address' }],
    name: 'register',
    outputs: [{ name: 'agentId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'agentUri', type: 'string' }],
    name: 'register',
    outputs: [{ name: 'agentId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'wallet', type: 'address' }],
    name: 'isRegisteredAgent',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'wallet', type: 'address' }],
    name: 'getAgentByWallet',
    outputs: [{ name: 'agentId', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'agentId', type: 'uint256' }],
    name: 'getAgentWallet',
    outputs: [{ name: 'wallet', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'agentId', type: 'uint256' }],
    name: 'getAgentUri',
    outputs: [{ name: 'uri', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'agentId', type: 'uint256' }],
    name: 'getAgent',
    outputs: [
      { name: 'agentUri', type: 'string' },
      { name: 'wallet', type: 'address' },
      { name: 'registeredAt', type: 'uint256' },
      { name: 'active', type: 'bool' },
      { name: 'owner', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// x402 Facilitator
export const X402_FACILITATOR_ABI = [
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
  {
    inputs: [{ name: 'agent', type: 'address' }, { name: 'nonce', type: 'uint256' }],
    name: 'isNonceUsed',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'paymentHash', type: 'bytes32' }],
    name: 'isSettled',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getDomainSeparator',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// NadFun Lens ABI – getAmountOut auto-detects bonding curve vs DEX
export const NADFUN_LENS_ABI = [
  {
    inputs: [{ name: 'token', type: 'address' }, { name: 'amountIn', type: 'uint256' }, { name: 'isBuy', type: 'bool' }],
    name: 'getAmountOut',
    outputs: [{ name: 'router', type: 'address' }, { name: 'amountOut', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const
