import type { NextRequest } from 'next/server'

// Server-side proxy for the YouTube Data API v3. The API key lives only in the
// server environment (YOUTUBE_API_KEY) and is never shipped to the browser.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const YT_BASE = 'https://www.googleapis.com/youtube/v3'
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS },
  })
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> }
) {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) {
    return json({ error: { message: 'YouTube key not configured' } }, 503)
  }

  const { path } = await ctx.params
  const endpoint = (path || []).join('/')
  const target = new URL(`${YT_BASE}/${endpoint}`)
  request.nextUrl.searchParams.forEach((value, k) => {
    if (k !== 'key') target.searchParams.set(k, value)
  })
  target.searchParams.set('key', key)

  try {
    const res = await fetch(target.toString(), {
      headers: { Referer: 'https://thesun.my/', Origin: 'https://thesun.my' },
      next: { revalidate: 1800 },
    })
    const body = await res.arrayBuffer()
    return new Response(body, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=1800',
        ...CORS,
      },
    })
  } catch (e) {
    return json({ error: { message: String(e) } }, 502)
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}
