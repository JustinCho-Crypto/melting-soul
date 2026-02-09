import { useQuery } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { MOCK_LISTINGS } from '@/lib/mockData'

export function useListings() {
  return useQuery({
    queryKey: ['listings'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return MOCK_LISTINGS.filter((l) => l.is_active)
      }
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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
