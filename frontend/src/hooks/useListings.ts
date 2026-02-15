import { useQuery } from '@tanstack/react-query'
import { isSupabaseConfigured } from '@/lib/config'
import { MOCK_LISTINGS } from '@/lib/mockData'

export function useListings() {
  return useQuery({
    queryKey: ['listings'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return MOCK_LISTINGS.filter((l) => l.is_active)
      }
      const { getSupabase } = await import('@/lib/supabase')
      const { data, error } = await getSupabase()
        .from('listings')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useListingBySoul(soulId: string | undefined) {
  return useQuery({
    queryKey: ['listing', soulId],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return MOCK_LISTINGS.find((l) => l.soul_id === soulId && l.is_active) ?? null
      }
      const { getSupabase } = await import('@/lib/supabase')
      const { data, error } = await getSupabase()
        .from('listings')
        .select('*')
        .eq('soul_id', soulId!)
        .eq('is_active', true)
        .order('price', { ascending: true })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!soulId,
  })
}
