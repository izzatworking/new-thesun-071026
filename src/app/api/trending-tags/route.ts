import type { NextRequest } from 'next/server'
import { WP, WP_REST, WP_HEADERS, CORS, corsPreflight } from '@/lib/server/wp'

// Returns the ordered trending posts, each with its tags and their GLOBAL post
// counts. Posts → tag IDs → tag details, all cached.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const limit = Math.min(25, Math.max(1, parseInt(sp.get('limit') || '20', 10) || 20))

  const corsJson = (body: string, ttl: number) =>
    new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': ttl ? `public, max-age=${ttl}` : 'no-store, max-age=0',
        ...CORS,
      },
    })
  const empty = () => corsJson('[]', 0)

  try {
    const idsRes = await fetch(
      `${WP_REST}/thesun/v1/feed-ids?type=trending-now&limit=${limit}&offset=0`,
      { headers: WP_HEADERS, next: { revalidate: 120 } } as RequestInit
    )
    if (!idsRes.ok) return empty()
    const rawIds = await idsRes.json()
    if (!Array.isArray(rawIds) || rawIds.length === 0) return corsJson('[]', 120)
    const ids = [...new Set(rawIds)]

    const postsRes = await fetch(
      `${WP}/posts?include=${ids.join(',')}&per_page=${ids.length}&orderby=include&_fields=id,tags`,
      { headers: WP_HEADERS, next: { revalidate: 120 } } as RequestInit
    )
    if (!postsRes.ok) return empty()
    const posts = await postsRes.json()
    if (!Array.isArray(posts)) return empty()

    const tagsById = new Map<number, number[]>()
    const uniqTagIds = new Set<number>()
    for (const p of posts) {
      const tids = Array.isArray(p.tags) ? p.tags : []
      tagsById.set(p.id, tids)
      for (const tid of tids) uniqTagIds.add(tid)
    }

    const allIds = [...uniqTagIds]
    const detail = new Map<number, { slug: string; name: string; count: number }>()
    for (let i = 0; i < allIds.length; i += 100) {
      const chunk = allIds.slice(i, i + 100)
      const tRes = await fetch(
        `${WP}/tags?include=${chunk.join(',')}&per_page=100&orderby=count&order=desc`,
        { headers: WP_HEADERS, next: { revalidate: 120 } } as RequestInit
      )
      if (!tRes.ok) continue
      const terms = await tRes.json()
      if (!Array.isArray(terms)) continue
      for (const t of terms) detail.set(t.id, { slug: t.slug, name: t.name, count: Number(t.count) || 0 })
    }

    const entries = ids.map((id: number) => {
      const tags = (tagsById.get(id) || [])
        .map((tid) => detail.get(tid))
        .filter(Boolean)
        .sort((a: any, b: any) => b.count - a.count)
      return { id, tags }
    })

    return corsJson(JSON.stringify(entries), 120)
  } catch {
    return empty()
  }
}

export function OPTIONS() {
  return corsPreflight()
}
