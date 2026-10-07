import { SITE_URL, CORS, corsPreflight } from '@/lib/server/wp'

// Cached trending tags feed (shields WordPress from repeated scans).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const empty = () =>
    new Response('[]', {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS },
    })
  try {
    const res = await fetch(`${SITE_URL}/wp-json/thesun/v1/trending-tags?limit=12`, {
      headers: { 'User-Agent': 'thesun-edge/1.0' },
      next: { revalidate: 120 },
    } as RequestInit)
    if (!res.ok) return empty()
    const body = await res.arrayBuffer()
    return new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=120', ...CORS },
    })
  } catch {
    return empty()
  }
}

export function OPTIONS() {
  return corsPreflight()
}
