import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useAccount } from 'wagmi'
import { SOUL_NFT_ABI, SOUL_SALE_ABI, ERC20_ABI, SOUL_NFT_ADDRESS, SOUL_SALE_ADDRESS, PAYMENT_TOKEN_ADDRESS } from '@/lib/contracts'

export function useBuySoul() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const buy = async (listingId: number, amount: number) => {
    if (!SOUL_SALE_ADDRESS || !address) return
    writeContract({
      address: SOUL_SALE_ADDRESS,
      abi: SOUL_SALE_ABI,
      functionName: 'buy',
      args: [BigInt(listingId), BigInt(amount), address],
    })
  }

  return { buy, isLoading: isPending || isConfirming, hash }
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
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const fork = async (parentTokenId: number, metadataUri: string, initialSupply: number) => {
    if (!SOUL_NFT_ADDRESS) return
    writeContract({
      address: SOUL_NFT_ADDRESS,
      abi: SOUL_NFT_ABI,
      functionName: 'forkSoul',
      args: [BigInt(parentTokenId), metadataUri, BigInt(initialSupply)],
    })
  }

  return { fork, isLoading: isPending || isConfirming, hash }
}

export function useApproveToken() {
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const approve = async (spender: `0x${string}`, amount: bigint) => {
    if (!PAYMENT_TOKEN_ADDRESS) return
    writeContract({
      address: PAYMENT_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, amount],
    })
  }

  return { approve, isLoading: isPending || isConfirming, hash }
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
