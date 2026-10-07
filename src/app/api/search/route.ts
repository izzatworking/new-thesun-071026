import type { NextRequest } from 'next/server'
import { WP, WP_REST, WP_HEADERS, CORS, corsPreflight } from '@/lib/server/wp'

// Indexed search (MyISAM FULLTEXT via /thesun/v1/search) + a small hydrate step
// for card thumbnails. Successful, non-empty responses are cached for 1h.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PER_PAGE = 13
const EXPOSE = { 'Access-Control-Expose-Headers': 'X-Total, X-Total-Pages' }

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const q = (sp.get('q') || '').replace(/\s+/g, ' ').trim().slice(0, 120)
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10) || 1)

  const noResults = (total = 0, totalPages = 0) =>
    new Response('[]', {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
        'X-Total': String(total),
        'X-Total-Pages': String(totalPages),
        ...EXPOSE,
        ...CORS,
      },
    })
  const failure = () =>
    new Response(JSON.stringify({ error: 'search_unavailable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store, max-age=0', ...CORS },
    })

  if (!q) return noResults()

  const fetchWithTimeout = async (u: string) => {
    for (let attempt = 0; attempt < 2; attempt++) {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 8000)
      try {
        const r = await fetch(u, {
          headers: WP_HEADERS,
          signal: ctrl.signal,
          next: { revalidate: 3600 },
        } as RequestInit)
        clearTimeout(timer)
        return r
      } catch {
        clearTimeout(timer)
      }
    }
    return null
  }

  try {
    const sres = await fetchWithTimeout(
      `${WP_REST}/thesun/v1/search?q=${encodeURIComponent(q)}&page=${page}&per_page=${PER_PAGE}`
    )
    if (!sres || !sres.ok) return failure()
    const data = await sres.json()
    const ids = Array.isArray(data?.ids) ? data.ids : []
    const total = parseInt(data?.total || '0', 10)
    const totalPages = total > 0 ? Math.ceil(total / PER_PAGE) : 0
    if (!ids.length) return noResults(total, totalPages)

    const hydrateUrl = `${WP}/posts?include=${ids.join(',')}&orderby=include&per_page=${ids.length}&_embed=1&_fields=id,date,slug,link,title,excerpt,_links,_embedded`
    const hres = await fetchWithTimeout(hydrateUrl)
    if (!hres || !hres.ok) return failure()
    const body = await hres.arrayBuffer()
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'X-Total': String(total),
        'X-Total-Pages': String(totalPages),
        ...EXPOSE,
        ...CORS,
      },
    })
  } catch {
    return failure()
  }
}

export function OPTIONS() {
  return corsPreflight()
}
