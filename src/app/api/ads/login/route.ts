import type { NextRequest } from 'next/server'
import { makeToken, safeEqual, AD_TOKEN_TTL } from '@/lib/server/ads'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

function adsJson(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS },
  })
}

export async function POST(request: NextRequest) {
  let body: any = {}
  try {
    body = await request.json()
  } catch {
    return adsJson({ error: 'bad_request' }, 400)
  }
  const okUser = safeEqual(String(body.user || ''), String(process.env.ADS_ADMIN_USER || ''))
  const okPass = safeEqual(String(body.pass || ''), String(process.env.ADS_ADMIN_PASS || ''))
  if (!okUser || !okPass) return adsJson({ error: 'invalid_credentials' }, 401)

  const secret = process.env.ADS_TOKEN_SECRET
  if (!secret) return adsJson({ error: 'not_configured' }, 503)
  const token = makeToken(secret)
  return adsJson({ token, expiresIn: AD_TOKEN_TTL })
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}
