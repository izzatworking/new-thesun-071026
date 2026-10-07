// Server-only Ad Manager store. The Cloudflare KV used by the original edge
// function is replaced with a small JSON file store so the API keeps working
// self-hosted. Swap for a database/KV in production.
import fs from 'node:fs'
import path from 'node:path'
import { createHmac, timingSafeEqual as cryptoTimingSafeEqual } from 'node:crypto'

const FILE = path.join(process.cwd(), '.data', 'ads.json')
const TOKEN_TTL = 60 * 60 * 12 // 12h

let cache: Record<string, string> | null = null

export function readAds(): Record<string, string> {
  if (cache) return cache
  try {
    cache = JSON.parse(fs.readFileSync(FILE, 'utf8'))
  } catch {
    cache = {}
  }
  return cache as Record<string, string>
}

export function writeAds(map: Record<string, string>) {
  cache = map
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true })
    fs.writeFileSync(FILE, JSON.stringify(map))
  } catch {
    /* best-effort persistence */
  }
}

function b64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function makeToken(secret: string) {
  const payload = b64url(JSON.stringify({ sub: 'ads', exp: Math.floor(Date.now() / 1000) + TOKEN_TTL }))
  const sig = b64url(createHmac('sha256', secret).update(payload).digest())
  return `${payload}.${sig}`
}

export function verifyToken(secret: string | undefined, token: string | undefined) {
  if (!secret || !token || token.indexOf('.') < 0) return false
  const [payload, sig] = token.split('.')
  const expected = b64url(createHmac('sha256', secret).update(payload).digest())
  if (expected.length !== sig.length) return false
  if (!cryptoTimingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false
  try {
    const data = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'))
    return data.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

export function safeEqual(a = '', b = '') {
  const ba = Buffer.from(String(a))
  const bb = Buffer.from(String(b))
  if (ba.length !== bb.length) return false
  return cryptoTimingSafeEqual(ba, bb)
}

export const AD_SLOTS = [
  'header-top', 'home-sidebar-ad', 'home-app-promo',
  'sidebar-bottom', 'article-in-article', 'merdeka-banner', 'ads-corner',
]
export const AD_TOKEN_TTL = TOKEN_TTL
export const AD_MAX_CODE = 100 * 1024
