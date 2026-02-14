import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useAccount } from 'wagmi'
import {
  SOUL_NFT_ABI,
  SOUL_SALE_ABI,
  ERC20_ABI,
  SOUL_NFT_ADDRESS,
  SOUL_SALE_ADDRESS,
  PAYMENT_TOKEN_ADDRESS,
  AUSD_TOKEN_ADDRESS,
  DISCOUNT_TOKEN_ADDRESS,
} from '@/lib/contracts'

// ============ Buy Hooks ============

/** Buy with MON (default payment token) - full price */
export function useBuySoul() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const buy = async (listingId: number, amount: number) => {
    if (!SOUL_SALE_ADDRESS || !address) return
    writeContract({
      address: SOUL_SALE_ADDRESS,
      abi: SOUL_SALE_ABI,
      functionName: 'buy',
      args: [BigInt(listingId), BigInt(amount), address],
    })
  }

  return { buy, isLoading: isPending || isConfirming, hash, receipt }
}

/** Buy with AUSD stablecoin - full price */
export function useBuyWithAusd() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const buyWithAusd = async (listingId: number, amount: number) => {
    if (!SOUL_SALE_ADDRESS || !address) return
    writeContract({
      address: SOUL_SALE_ADDRESS,
      abi: SOUL_SALE_ABI,
      functionName: 'buyWithAusd',
      args: [BigInt(listingId), BigInt(amount), address],
    })
  }

  return { buyWithAusd, isLoading: isPending || isConfirming, hash, receipt }
}

/** Buy with project token (MST) - discounted price */
export function useBuyWithDiscountToken() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const buyWithDiscountToken = async (listingId: number, amount: number) => {
    if (!SOUL_SALE_ADDRESS || !address) return
    writeContract({
      address: SOUL_SALE_ADDRESS,
      abi: SOUL_SALE_ABI,
      functionName: 'buyWithDiscountToken',
      args: [BigInt(listingId), BigInt(amount), address],
    })
  }

  return { buyWithDiscountToken, isLoading: isPending || isConfirming, hash, receipt }
}

// ============ Approve Hooks ============

/** Approve MON token for SoulSale */
export function useApproveToken() {
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const approve = async (spender: `0x${string}`, amount: bigint) => {
    if (!PAYMENT_TOKEN_ADDRESS) return
    writeContract({
      address: PAYMENT_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, amount],
    })
  }

  return { approve, isLoading: isPending || isConfirming, hash, receipt }
}

/** Approve AUSD token for SoulSale */
export function useApproveAusd() {
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const approveAusd = async (spender: `0x${string}`, amount: bigint) => {
    if (!AUSD_TOKEN_ADDRESS) return
    writeContract({
      address: AUSD_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, amount],
    })
  }

  return { approveAusd, isLoading: isPending || isConfirming, hash, receipt }
}

/** Approve project discount token (MST) for SoulSale */
export function useApproveDiscountToken() {
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const approveDiscountToken = async (spender: `0x${string}`, amount: bigint) => {
    if (!DISCOUNT_TOKEN_ADDRESS) return
    writeContract({
      address: DISCOUNT_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, amount],
    })
  }

  return { approveDiscountToken, isLoading: isPending || isConfirming, hash, receipt }
}

// ============ Soul Management Hooks ============

export function useCreateSoul() {
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const create = async (metadataUri: string, initialSupply: number) => {
    if (!SOUL_NFT_ADDRESS) return
    writeContract({
      address: SOUL_NFT_ADDRESS,
      abi: SOUL_NFT_ABI,
      functionName: 'createSoul',
      args: [metadataUri, BigInt(initialSupply)],
    })
  }

  return { create, isLoading: isPending || isConfirming, hash, receipt }
}

export function useForkSoul() {
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const fork = async (parentTokenId: number, metadataUri: string, initialSupply: number) => {
    if (!SOUL_NFT_ADDRESS) return
    writeContract({
      address: SOUL_NFT_ADDRESS,
      abi: SOUL_NFT_ABI,
      functionName: 'forkSoul',
      args: [BigInt(parentTokenId), metadataUri, BigInt(initialSupply)],
    })
  }

  return { fork, isLoading: isPending || isConfirming, hash, receipt }
}

export function useListSoul() {
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const list = async (tokenId: number, amount: number, pricePerUnit: bigint) => {
    if (!SOUL_SALE_ADDRESS) return
    writeContract({
      address: SOUL_SALE_ADDRESS,
      abi: SOUL_SALE_ABI,
      functionName: 'list',
      args: [BigInt(tokenId), BigInt(amount), pricePerUnit],
    })
  }

  return { list, isLoading: isPending || isConfirming, hash, receipt }
}
