import type { NextRequest } from 'next/server'
import { AD_SLOTS, AD_MAX_CODE, readAds, writeAds, verifyToken } from '@/lib/server/ads'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

function adsJson(data: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS, ...extra },
  })
}

export async function GET(request: NextRequest) {
  const map = readAds()
  return adsJson(map, 200, { 'Cache-Control': 'public, max-age=60' })
}

export async function POST(request: NextRequest) {
  const auth = request.headers.get('Authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!verifyToken(process.env.ADS_TOKEN_SECRET, token)) return adsJson({ error: 'unauthorized' }, 401)

  let body: any = {}
  try {
    body = await request.json()
  } catch {
    return adsJson({ error: 'bad_request' }, 400)
  }
  const slot = String(body.slot || '')
  const code = String(body.code || '')
  if (!AD_SLOTS.includes(slot)) return adsJson({ error: 'unknown_slot' }, 400)
  if (code.length > AD_MAX_CODE) return adsJson({ error: 'too_large' }, 413)

  const map = readAds()
  if (code.trim()) map[slot] = code
  else delete map[slot]
  writeAds(map)
  return adsJson({ ok: true, slot, saved: Boolean(code.trim()) })
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: { ...CORS, 'Access-Control-Allow-Headers': 'Authorization, Content-Type' },
  })
}
