import { useQuery } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { MOCK_SOULS, MOCK_SOUL_STATS } from '@/lib/mockData'

export function useSouls() {
  return useQuery({
    queryKey: ['souls'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return MOCK_SOULS.filter((s) => s.generation === 0)
      }
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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
      const { data, error } = await supabase
        .from('soul_stats')
        .select('*')
        .order('total_volume', { ascending: false })
        .limit(20)
      if (error) throw error
      return data
    },
  })
}
