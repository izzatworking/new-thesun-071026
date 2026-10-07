import type { NextRequest } from 'next/server'
import { WP, WP_REST, WP_HEADERS, CORS, corsPreflight } from '@/lib/server/wp'

// Editorial/readership feeds (latest, breaking, most-viewed, trending-now).
// Composed server-side so the browser makes a single same-origin request.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function jsonHeaders(ttl: number, total: number, totalPages: number) {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': `public, max-age=${ttl}`,
    'X-Total': String(total || 0),
    'X-Total-Pages': String(totalPages || 0),
    'Access-Control-Expose-Headers': 'X-Total, X-Total-Pages',
    ...CORS,
  }
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const type = (sp.get('type') || 'latest').toLowerCase()
  const range = (sp.get('range') || '24h').toLowerCase()
  const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') || '10', 10) || 10))
  const offset = Math.max(0, parseInt(sp.get('offset') || '0', 10) || 0)

  let ttl = 60
  if (type === 'most-viewed') ttl = range === '30d' ? 1800 : range === '7d' ? 300 : 120

  const json = (body: string | ArrayBuffer, total: number, totalPages: number) =>
    new Response(body, { status: 200, headers: jsonHeaders(ttl, total, totalPages) })
  const empty = (total = 0, totalPages = 0) => json('[]', total, totalPages)
  const failure = () =>
    new Response('[]', {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Expose-Headers': 'X-Total, X-Total-Pages',
        ...CORS,
      },
    })

  const fields = 'id,date,slug,link,title,excerpt,_links,_embedded'
  const fetchOpts = { headers: WP_HEADERS, next: { revalidate: ttl } } as RequestInit

  try {
    if (type === 'latest') {
      const postsUrl = `${WP}/posts?per_page=${limit}&offset=${offset}&orderby=date&order=desc&_embed=1&_fields=${fields}`
      const res = await fetch(postsUrl, fetchOpts)
      if (!res.ok) return failure()
      const total = parseInt(res.headers.get('x-wp-total') || '0', 10)
      const totalPages = parseInt(res.headers.get('x-wp-totalpages') || '0', 10)
      return json(await res.arrayBuffer(), total, totalPages)
    }

    const idsRes = await fetch(
      `${WP_REST}/thesun/v1/feed-ids?type=${encodeURIComponent(type)}&range=${encodeURIComponent(range)}&limit=${limit}&offset=${offset}`,
      fetchOpts
    )
    if (!idsRes.ok) return failure()
    const total = parseInt(idsRes.headers.get('X-Total') || '0', 10)
    const totalPages = total > 0 ? Math.ceil(total / limit) : 0
    const ids = await idsRes.json()
    if (!Array.isArray(ids) || ids.length === 0) return empty(total, totalPages)

    const postsUrl = `${WP}/posts?include=${ids.join(',')}&orderby=include&per_page=${ids.length}&_embed=1&_fields=${fields}`
    const res = await fetch(postsUrl, fetchOpts)
    if (!res.ok) return failure()
    return json(await res.arrayBuffer(), total, totalPages)
  } catch {
    return failure()
  }
}

export function OPTIONS() {
  return corsPreflight()
}
