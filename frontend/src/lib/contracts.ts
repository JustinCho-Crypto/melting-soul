export const SOUL_NFT_ADDRESS = process.env.NEXT_PUBLIC_SOUL_NFT_ADDRESS as `0x${string}` | undefined
export const SOUL_SALE_ADDRESS = process.env.NEXT_PUBLIC_SOUL_SALE_ADDRESS as `0x${string}` | undefined
export const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}` | undefined
export const PAYMENT_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_PAYMENT_TOKEN_ADDRESS as `0x${string}` | undefined

export const SOUL_NFT_ABI = [
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
    inputs: [{ name: 'tokenId', type: 'uint256' }, { name: 'amount', type: 'uint256' }, { name: 'pricePerUnit', type: 'uint256' }],
    name: 'list',
    outputs: [{ name: 'listingId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'listingId', type: 'uint256' }, { name: 'amount', type: 'uint256' }],
    name: 'buy',
    outputs: [],
    stateMutability: 'nonpayable',
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
