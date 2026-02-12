import { useQuery } from '@tanstack/react-query'
import { isSupabaseConfigured } from '@/lib/config'
import { MOCK_SOULS } from '@/lib/mockData'

export function useSoul(tokenId: number) {
  return useQuery({
    queryKey: ['soul', tokenId],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return MOCK_SOULS.find((s) => s.token_id === tokenId) ?? null
      }
      const { getSupabase } = await import('@/lib/supabase')
      const { data, error } = await getSupabase()
        .from('souls')
        .select('*')
        .eq('token_id', tokenId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!tokenId,
  })
}
