import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * GET /api/souls/[tokenId]?format=txt
 * Returns soul data as soul.txt (plain text) or JSON
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  const { tokenId } = await params
  const format = _request.nextUrl.searchParams.get('format')

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  // Fetch soul from Supabase
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/souls?token_id=eq.${tokenId}&select=*`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch soul' }, { status: 502 })
  }

  const rows = await res.json()
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Soul not found' }, { status: 404 })
  }

  const soul = rows[0]

  // JSON format (default)
  if (format !== 'txt') {
    return NextResponse.json(soul)
  }

  // soul.txt format
  const lines: string[] = [
    `# ${soul.name}`,
    `# Token ID: ${soul.token_id} | Generation: ${soul.generation}`,
    `# Creator: ${soul.creator_address}`,
    '',
    '## System Prompt',
    soul.system_prompt || '(none)',
    '',
    '## Conversation Style',
    soul.conversation_style || '(none)',
    '',
    '## Knowledge Domain',
    (soul.knowledge_domain || []).join(', ') || '(none)',
    '',
    '## Behavior Traits',
    (soul.behavior_traits || []).join(', ') || '(none)',
    '',
    '## Temperature',
    String(soul.temperature ?? 0.7),
  ]

  if (soul.additional_prompt) {
    lines.push('', '## Additional Prompt', soul.additional_prompt)
  }
  if (soul.added_traits?.length) {
    lines.push('', '## Added Traits', soul.added_traits.join(', '))
  }
  if (soul.fork_note) {
    lines.push('', '## Fork Note', soul.fork_note)
  }

  const filename = `soul-${soul.token_id}-${soul.name.toLowerCase().replace(/\s+/g, '-')}.txt`

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
