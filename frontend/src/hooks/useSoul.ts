import { useQuery } from '@tanstack/react-query'
import { MOCK_SOULS } from '@/lib/mockData'

export function useSoul(tokenId: number) {
  return useQuery({
    queryKey: ['soul', tokenId],
    queryFn: async () => {
      // TODO: Replace with Supabase query
      return MOCK_SOULS.find((s) => s.token_id === tokenId) ?? null
    },
    enabled: !!tokenId,
  })
}
