import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useReadContracts } from 'wagmi'
import { isSupabaseConfigured } from '@/lib/config'
import { MOCK_SOULS, MOCK_SOUL_STATS } from '@/lib/mockData'
import { SOUL_NFT_ADDRESS, SOUL_NFT_ABI } from '@/lib/contracts'
import type { Soul } from '@/lib/types'

export function useSouls() {
  return useQuery({
    queryKey: ['souls'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return MOCK_SOULS.filter((s) => s.generation === 0)
      }
      const { getSupabase } = await import('@/lib/supabase')
      const { data, error } = await getSupabase()
        .from('souls')
        .select('id, token_id, name, description, image_url, conversation_style, knowledge_domain, generation, creator_address, created_at')
        .eq('generation', 0)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useAllSouls() {
  return useQuery({
    queryKey: ['souls-all'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return MOCK_SOULS
      }
      const { getSupabase } = await import('@/lib/supabase')
      const { data, error } = await getSupabase()
        .from('souls')
        .select('id, token_id, name, description, image_url, conversation_style, knowledge_domain, behavior_traits, temperature, parent_id, generation, fork_note, creator_address, created_at')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useSoulStats() {
  return useQuery({
    queryKey: ['soul-stats'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return MOCK_SOUL_STATS
      }
      const { getSupabase } = await import('@/lib/supabase')
      const { data, error } = await getSupabase()
        .from('soul_stats')
        .select('*')
        .order('total_volume', { ascending: false })
        .limit(20)
      if (error) throw error
      return data
    },
  })
}

/** Check on-chain balanceOf for every soul and return only those the user owns */
export function useOwnedSouls(souls: Soul[] | undefined, address: string | undefined) {
  const contracts = useMemo(() => {
    if (!souls || !address || !SOUL_NFT_ADDRESS) return []
    return souls.map((s) => ({
      address: SOUL_NFT_ADDRESS,
      abi: SOUL_NFT_ABI,
      functionName: 'balanceOf' as const,
      args: [address as `0x${string}`, BigInt(s.token_id)],
    }))
  }, [souls, address])

  const { data: balances, isLoading } = useReadContracts({
    contracts,
    query: { enabled: contracts.length > 0 },
  })

  const owned = useMemo(() => {
    if (!souls || !balances) return []
    return souls.filter((_, i) => {
      const result = balances[i]
      return result?.status === 'success' && (result.result as bigint) > BigInt(0)
    })
  }, [souls, balances])

  return { data: owned, isLoading }
}
