import { useQuery } from '@tanstack/react-query'
import { MOCK_SOULS } from '@/lib/mockData'
import type { Soul } from '@/lib/supabase'

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
      // TODO: Replace with Supabase RPC (get_ancestors + get_descendants)
      const soul = MOCK_SOULS.find((s) => s.token_id === tokenId)
      if (!soul) return []

      const origin = findOrigin(soul, MOCK_SOULS)
      return getDescendants(origin.id, MOCK_SOULS)
    },
    enabled: !!tokenId,
  })
}
