import { NextRequest, NextResponse } from 'next/server'
import { MOCK_SOULS } from '@/lib/mockData'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * GET /api/souls
 * List all souls with optional filters
 *
 * Query params:
 *   ?generation=0      - filter by generation
 *   ?domain=philosophy  - filter by knowledge domain
 *   ?style=sarcastic    - filter by conversation style
 *   ?limit=50           - max results (default 50)
 *   ?offset=0           - pagination offset
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const generation = searchParams.get('generation')
  const domain = searchParams.get('domain')
  const style = searchParams.get('style')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  // Use Supabase if configured
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      let query = `${SUPABASE_URL}/rest/v1/souls?select=*&order=created_at.desc`

      if (generation !== null) {
        query += `&generation=eq.${generation}`
      }
      if (domain) {
        query += `&knowledge_domain=cs.{${domain}}`
      }
      if (style) {
        query += `&conversation_style=eq.${style}`
      }

      const res = await fetch(query, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Range: `${offset}-${offset + limit - 1}`,
        },
      })

      if (!res.ok) {
        return NextResponse.json({ error: 'Failed to fetch souls' }, { status: 502 })
      }

      const souls = await res.json()
      return NextResponse.json(souls)
    } catch {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
  }

  // Fallback to mock data
  let filtered = [...MOCK_SOULS]

  if (generation !== null) {
    filtered = filtered.filter(s => s.generation === parseInt(generation))
  }
  if (domain) {
    filtered = filtered.filter(s =>
      s.knowledge_domain?.some(d => d.toLowerCase().includes(domain.toLowerCase()))
    )
  }
  if (style) {
    filtered = filtered.filter(s =>
      s.conversation_style?.toLowerCase() === style.toLowerCase()
    )
  }

  const paginated = filtered.slice(offset, offset + limit)

  return NextResponse.json(paginated)
}
