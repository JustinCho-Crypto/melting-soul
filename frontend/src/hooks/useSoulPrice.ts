import { useReadContract } from 'wagmi'
import { formatEther } from 'viem'
import { NADFUN_LENS_ADDRESS, NADFUN_LENS_ABI, DISCOUNT_TOKEN_ADDRESS } from '@/lib/contracts'

const ONE_TOKEN = BigInt('1000000000000000000') // 1e18

/**
 * Fetches $SOUL token price from NadFun Lens contract (on-chain).
 * Returns price in MON and estimated USD.
 */
export function useSoulTokenPrice() {
  const { data, isLoading } = useReadContract({
    address: NADFUN_LENS_ADDRESS,
    abi: NADFUN_LENS_ABI,
    functionName: 'getAmountOut',
    args: DISCOUNT_TOKEN_ADDRESS
      ? [DISCOUNT_TOKEN_ADDRESS, ONE_TOKEN, false]
      : undefined,
    query: {
      enabled: !!DISCOUNT_TOKEN_ADDRESS,
      refetchInterval: 30_000, // refresh every 30s
    },
  })

  if (!data || isLoading) return null

  const [, amountOut] = data as [string, bigint]
  const priceInMon = Number(formatEther(amountOut))

  return { priceInMon }
}
