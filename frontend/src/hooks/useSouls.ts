import { useQuery } from '@tanstack/react-query'
import { MOCK_SOULS, MOCK_SOUL_STATS } from '@/lib/mockData'

export function useSouls() {
  return useQuery({
    queryKey: ['souls'],
    queryFn: async () => {
      // TODO: Replace with Supabase query
      return MOCK_SOULS.filter((s) => s.generation === 0)
    },
  })
}

export function useSoulStats() {
  return useQuery({
    queryKey: ['soul-stats'],
    queryFn: async () => {
      // TODO: Replace with Supabase soul_stats view
      return MOCK_SOUL_STATS
    },
  })
}
