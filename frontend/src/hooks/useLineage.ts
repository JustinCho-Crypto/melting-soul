import { useQuery } from '@tanstack/react-query'
import { isSupabaseConfigured } from '@/lib/config'
import { MOCK_SOULS } from '@/lib/mockData'
import type { Soul } from '@/lib/types'

function findOrigin(soul: Soul, allSouls: Soul[]): Soul {
  if (!soul.parent_id) return soul
  const parent = allSouls.find((s) => s.id === soul.parent_id)
  if (!parent) return soul
  return findOrigin(parent, allSouls)
}

function getDescendants(originId: string, allSouls: Soul[]): Soul[] {
  const result: Soul[] = []
  const origin = allSouls.find((s) => s.id === originId)
  if (!origin) return result

  const queue = [origin]
  while (queue.length > 0) {
    const current = queue.shift()!
    result.push(current)
    const children = allSouls.filter((s) => s.parent_id === current.id)
    queue.push(...children)
  }
  return result
}

export function useLineage(tokenId: number) {
  return useQuery({
    queryKey: ['lineage', tokenId],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        const soul = MOCK_SOULS.find((s) => s.token_id === tokenId)
        if (!soul) return []
        const origin = findOrigin(soul, MOCK_SOULS)
        return getDescendants(origin.id, MOCK_SOULS)
      }

      const { getSupabase } = await import('@/lib/supabase')
      const supabase = getSupabase()
      const { data: soul } = await supabase
        .from('souls')
        .select('id, parent_id')
        .eq('token_id', tokenId)
        .single()
      if (!soul) return []

      let originId = soul.id
      if (soul.parent_id) {
        const { data: ancestors } = await supabase
          .rpc('get_ancestors', { leaf_id: soul.id })
        if (ancestors?.length) {
          originId = ancestors[ancestors.length - 1].id
        }
      }

      const { data: descendants } = await supabase
        .rpc('get_descendants', { root_id: originId })
      return descendants ?? []
    },
    enabled: !!tokenId,
  })
}
