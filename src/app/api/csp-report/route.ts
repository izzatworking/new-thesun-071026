import type { NextRequest } from 'next/server'

// CSP violation report collector. Logs a compact line and always answers 204.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    if (body && body.length < 20000) {
      try {
        const j = JSON.parse(body)
        const r = j['csp-report'] || (Array.isArray(j) ? j[0]?.body : null) || j
        console.log(
          'CSP',
          JSON.stringify({
            d: r['document-uri'] || r.documentURL,
            v: r['violated-directive'] || r.effectiveDirective,
            b: r['blocked-uri'] || r.blockedURL,
          }).slice(0, 500)
        )
      } catch {
        /* ignore malformed */
      }
    }
  } catch {
    /* ignore */
  }
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
}
