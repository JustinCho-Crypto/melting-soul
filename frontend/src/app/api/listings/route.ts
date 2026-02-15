import { NextRequest, NextResponse } from 'next/server'
import { MOCK_LISTINGS, MOCK_SOULS } from '@/lib/mockData'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * GET /api/listings
 * Get active listings with soul metadata joined
 *
 * Query params:
 *   ?active=true       - only active listings (default true)
 *   ?token_id=1        - filter by specific token
 *   ?sort=price_asc    - sort order (price_asc, price_desc)
 *   ?limit=50          - max results
 *   ?offset=0          - pagination offset
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const active = searchParams.get('active') !== 'false'
  const tokenId = searchParams.get('token_id')
  const sort = searchParams.get('sort') || 'price_asc'
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  // Use Supabase if configured
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      let query = `${SUPABASE_URL}/rest/v1/listings?select=*,souls(*)`

      if (active) {
        query += '&is_active=eq.true'
      }
      if (tokenId) {
        query += `&token_id=eq.${tokenId}`
      }

      const order = sort === 'price_desc' ? 'price.desc' : 'price.asc'
      query += `&order=${order}`

      const res = await fetch(query, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Range: `${offset}-${offset + limit - 1}`,
        },
      })

      if (!res.ok) {
        return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 502 })
      }

      const listings = await res.json()
      return NextResponse.json(listings)
    } catch {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
  }

  // Fallback to mock data with manual soul join
  let filtered = MOCK_LISTINGS.filter(l => !active || l.is_active)

  if (tokenId) {
    filtered = filtered.filter(l => l.token_id === parseInt(tokenId))
  }

  // Join soul data
  const joined = filtered.map(listing => {
    const soul = MOCK_SOULS.find(s => s.id === listing.soul_id || s.token_id === listing.token_id)
    return { ...listing, soul: soul || null }
  })

  // Sort
  if (sort === 'price_desc') {
    joined.sort((a, b) => Number(b.price) - Number(a.price))
  } else {
    joined.sort((a, b) => Number(a.price) - Number(b.price))
  }

  const paginated = joined.slice(offset, offset + limit)

  return NextResponse.json(paginated)
}
