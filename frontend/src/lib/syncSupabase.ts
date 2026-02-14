import { parseEventLogs, type Log } from 'viem'
import { SOUL_NFT_ABI } from './contracts'

export interface SoulSyncMeta {
  name: string
  description?: string
  image_url?: string
  conversation_style?: string
  knowledge_domain?: string[]
  behavior_traits?: string[]
  temperature?: number
  parent_id?: string | null
  fork_note?: string
  additional_prompt?: string
}

export async function syncSoulFromReceipt(
  logs: Log[],
  metadata: SoulSyncMeta,
  creatorAddress: string,
) {
  const parsed = parseEventLogs({
    abi: SOUL_NFT_ABI,
    logs,
    eventName: 'SoulCreated',
  })

  if (parsed.length === 0) return null

  const { tokenId, generation } = parsed[0].args

  const soulData = {
    token_id: Number(tokenId),
    name: metadata.name,
    description: metadata.description || '',
    image_url: metadata.image_url || '/images/default.png',
    conversation_style: metadata.conversation_style || 'default',
    knowledge_domain: metadata.knowledge_domain || [],
    behavior_traits: metadata.behavior_traits || [],
    temperature: metadata.temperature ?? 0.7,
    parent_id: metadata.parent_id || null,
    generation: Number(generation),
    fork_note: metadata.fork_note || null,
    additional_prompt: metadata.additional_prompt || null,
    creator_address: creatorAddress,
  }

  const res = await fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table: 'souls', data: soulData }),
  })

  return res.json()
}
