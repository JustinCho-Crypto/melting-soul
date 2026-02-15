import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http, defineChain, decodeEventLog } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { MOCK_SOULS } from '@/lib/mockData'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SOUL_NFT_ADDRESS = process.env.NEXT_PUBLIC_SOUL_NFT_ADDRESS as `0x${string}`
const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '143')
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545'
const OPERATOR_KEY = process.env.OPERATOR_PRIVATE_KEY as `0x${string}` | undefined

const SOUL_NFT_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: true, name: 'creator', type: 'address' },
      { indexed: false, name: 'parentId', type: 'uint256' },
      { indexed: false, name: 'generation', type: 'uint256' },
    ],
    name: 'SoulCreated',
    type: 'event',
  },
  {
    inputs: [
      { name: 'parentTokenId', type: 'uint256' },
      { name: 'metadataUri', type: 'string' },
      { name: 'initialSupply', type: 'uint256' },
    ],
    name: 'forkSoul',
    outputs: [{ name: 'newTokenId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

/**
 * POST /api/agent/fork
 * Agent forks an existing soul to create a new personality variant
 *
 * Body: {
 *   parent_token_id: number,
 *   name: string,
 *   description?: string,
 *   additional_prompt?: string,
 *   fork_note?: string,
 *   initial_supply?: number
 * }
 * Headers: X-Agent-Id: 0x<agent_wallet>
 */
export async function POST(request: NextRequest) {
  try {
    const agentId = request.headers.get('X-Agent-Id')
    if (!agentId) {
      return NextResponse.json({ error: 'Missing X-Agent-Id header' }, { status: 401 })
    }

    if (!OPERATOR_KEY) {
      return NextResponse.json(
        { error: 'Server not configured for forking (OPERATOR_PRIVATE_KEY missing)' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const {
      parent_token_id,
      name,
      description,
      additional_prompt,
      fork_note,
      initial_supply = 10,
    } = body

    if (!parent_token_id || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: parent_token_id, name' },
        { status: 400 }
      )
    }

    // Look up parent soul
    const parentSoul = await getParentSoul(parent_token_id)
    if (!parentSoul) {
      return NextResponse.json({ error: 'Parent soul not found' }, { status: 404 })
    }

    // Generate metadata URI
    const metadataUri = `ipfs://fork-${parent_token_id}-${Date.now()}`

    // Execute fork on-chain
    const account = privateKeyToAccount(OPERATOR_KEY)
    const chain = defineChain({
      id: CHAIN_ID,
      name: 'Monad',
      nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
      rpcUrls: { default: { http: [RPC_URL] } },
    })
    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(RPC_URL),
    })
    const publicClient = createPublicClient({ transport: http(RPC_URL) })

    const hash = await walletClient.writeContract({
      address: SOUL_NFT_ADDRESS,
      abi: SOUL_NFT_ABI,
      functionName: 'forkSoul',
      args: [BigInt(parent_token_id), metadataUri, BigInt(initial_supply)],
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    // Parse SoulCreated event to get new tokenId and generation
    let newTokenId: number | null = null
    let generation: number | null = null

    for (const log of receipt.logs) {
      try {
        const event = decodeEventLog({
          abi: SOUL_NFT_ABI,
          data: log.data,
          topics: log.topics,
        })
        if (event.eventName === 'SoulCreated') {
          newTokenId = Number(event.args.tokenId)
          generation = Number(event.args.generation)
          break
        }
      } catch {
        // Skip logs that don't match
      }
    }

    // Build forked soul metadata (inherit from parent, override with new values)
    const forkedSoul = {
      token_id: newTokenId,
      name,
      description: description || parentSoul.description,
      image_url: parentSoul.image_url,
      system_prompt: parentSoul.system_prompt,
      conversation_style: parentSoul.conversation_style,
      knowledge_domain: parentSoul.knowledge_domain,
      behavior_traits: parentSoul.behavior_traits,
      temperature: parentSoul.temperature,
      additional_prompt: additional_prompt || null,
      fork_note: fork_note || null,
      parent_id: parentSoul.id,
      generation: generation ?? (parentSoul.generation + 1),
      creator_address: agentId,
    }

    // Sync to Supabase
    if (SUPABASE_URL && SUPABASE_KEY) {
      await fetch(`${SUPABASE_URL}/rest/v1/souls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify(forkedSoul),
      })
    }

    return NextResponse.json({
      success: receipt.status === 'success',
      txHash: hash,
      soul: forkedSoul,
    })
  } catch (error) {
    console.error('Agent fork error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fork failed' },
      { status: 500 }
    )
  }
}

// Helper: look up parent soul from Supabase or mock
async function getParentSoul(tokenId: number) {
  if (SUPABASE_URL && SUPABASE_KEY) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/souls?token_id=eq.${tokenId}&select=*`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    )
    if (res.ok) {
      const rows = await res.json()
      if (rows.length > 0) return rows[0]
    }
    return null
  }

  // Mock fallback
  return MOCK_SOULS.find(s => s.token_id === tokenId) || null
}
