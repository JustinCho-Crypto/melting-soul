import { useWriteContract, useWaitForTransactionReceipt, usePublicClient, useReadContract } from 'wagmi'
import { useAccount } from 'wagmi'
import { SOUL_NFT_ABI, SOUL_SALE_ABI, ERC20_ABI, SOUL_NFT_ADDRESS, SOUL_SALE_ADDRESS } from '@/lib/contracts'

// Buy with native MON (payable)
export function useBuyWithMon() {
  const { address } = useAccount()
  const { writeContractAsync, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const buy = async (listingId: number, amount: number, pricePerUnit: bigint) => {
    if (!SOUL_SALE_ADDRESS || !address) return
    const totalValue = pricePerUnit * BigInt(amount)
    return writeContractAsync({
      address: SOUL_SALE_ADDRESS,
      abi: SOUL_SALE_ABI,
      functionName: 'buy',
      args: [BigInt(listingId), BigInt(amount), address],
      value: totalValue,
    })
  }

  return { buy, isLoading: isPending || isConfirming, hash }
}

// Buy with aUSD (ERC20, full price)
export function useBuyWithAusd() {
  const { address } = useAccount()
  const { writeContractAsync, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const buy = async (listingId: number, amount: number) => {
    if (!SOUL_SALE_ADDRESS || !address) return
    return writeContractAsync({
      address: SOUL_SALE_ADDRESS,
      abi: SOUL_SALE_ABI,
      functionName: 'buyWithAusd',
      args: [BigInt(listingId), BigInt(amount), address],
    })
  }

  return { buy, isLoading: isPending || isConfirming, hash }
}

// Buy with $SOUL discount token (20% off)
export function useBuyWithSoul() {
  const { address } = useAccount()
  const { writeContractAsync, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const buy = async (listingId: number, amount: number) => {
    if (!SOUL_SALE_ADDRESS || !address) return
    return writeContractAsync({
      address: SOUL_SALE_ADDRESS,
      abi: SOUL_SALE_ABI,
      functionName: 'buyWithDiscountToken',
      args: [BigInt(listingId), BigInt(amount), address],
    })
  }

  return { buy, isLoading: isPending || isConfirming, hash }
}

// Approve any ERC20 token — returns tx hash, awaitable
export function useApproveToken() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract()
  const publicClient = usePublicClient()

  const approve = async (tokenAddress: `0x${string}`, spender: `0x${string}`, amount: bigint) => {
    const txHash = await writeContractAsync({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, amount],
    })
    // Wait for approve to be confirmed on-chain before returning
    if (publicClient) {
      await publicClient.waitForTransactionReceipt({ hash: txHash })
    }
    return txHash
  }

  return { approve, isLoading: isPending, hash }
}

// Read on-chain listing data (price, amount, etc.)
export function useOnChainListing(listingId: number | undefined) {
  const { data, isLoading } = useReadContract({
    address: SOUL_SALE_ADDRESS,
    abi: SOUL_SALE_ABI,
    functionName: 'listings',
    args: listingId != null ? [BigInt(listingId)] : undefined,
    query: { enabled: listingId != null && !!SOUL_SALE_ADDRESS },
  })

  if (!data) return { data: null, isLoading }

  const [seller, tokenId, amount, pricePerUnit, active] = data as [string, bigint, bigint, bigint, boolean]
  return {
    data: { seller, tokenId, amount, pricePerUnit, active },
    isLoading,
  }
}

// Legacy alias for backwards compatibility
export function useBuySoul() {
  return useBuyWithMon()
}

export function useCreateSoul() {
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const create = async (metadataUri: string, initialSupply: number) => {
    if (!SOUL_NFT_ADDRESS) return
    writeContract({
      address: SOUL_NFT_ADDRESS,
      abi: SOUL_NFT_ABI,
      functionName: 'createSoul',
      args: [metadataUri, BigInt(initialSupply)],
    })
  }

  return { create, isLoading: isPending || isConfirming, hash }
}

export function useForkSoul() {
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, data: receipt } = useWaitForTransactionReceipt({ hash })

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
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const list = async (tokenId: number, amount: number, pricePerUnit: bigint) => {
    if (!SOUL_SALE_ADDRESS) return
    writeContract({
      address: SOUL_SALE_ADDRESS,
      abi: SOUL_SALE_ABI,
      functionName: 'list',
      args: [BigInt(tokenId), BigInt(amount), pricePerUnit],
    })
  }

  return { list, isLoading: isPending || isConfirming, hash }
}
