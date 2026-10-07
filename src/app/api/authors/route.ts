import type { NextRequest } from 'next/server'
import { WP, WP_HEADERS, CORS, corsPreflight } from '@/lib/server/wp'

// Author-name search via the PublishPress author taxonomy. Cached 1h; the
// "admin" fallback author is filtered out.
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
    new Response('[]', {
      status: 502,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store, max-age=0', ...CORS },
    })

  if (!q) return noResults()

  try {
    const res = await fetch(
      `${WP}/ppma_author?search=${encodeURIComponent(q)}&per_page=${PER_PAGE}&page=${page}&_fields=id,name,slug,link,count,description`,
      { headers: WP_HEADERS, next: { revalidate: 3600 } } as RequestInit
    )
    if (!res.ok) return failure()
    const total = parseInt(res.headers.get('x-wp-total') || '0', 10)
    const totalPages = parseInt(res.headers.get('x-wp-totalpages') || '0', 10)
    let items = await res.json()
    if (!Array.isArray(items)) items = []
    items = items.filter((a: any) => a && a.slug !== 'admin')
    return new Response(JSON.stringify(items), {
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
