import { useQuery } from '@tanstack/react-query'
import { MOCK_LISTINGS } from '@/lib/mockData'

export function useListings() {
  return useQuery({
    queryKey: ['listings'],
    queryFn: async () => {
      // TODO: Replace with Supabase query
      return MOCK_LISTINGS.filter((l) => l.is_active)
    },
  })
}

export function useListingBySoul(soulId: string | undefined) {
  return useQuery({
    queryKey: ['listing', soulId],
    queryFn: async () => {
      // TODO: Replace with Supabase query
      return MOCK_LISTINGS.find((l) => l.soul_id === soulId && l.is_active) ?? null
    },
    enabled: !!soulId,
  })
}
