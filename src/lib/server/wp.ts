// Server-only WordPress REST helpers used by the /api/* route handlers.
import { SITE } from '../../../site.config.mjs'

export const WP = 'https://thesun.my/wp-json/wp/v2'
export const WP_REST = 'https://thesun.my/wp-json'
export const SITE_URL = SITE.url

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

export function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS, ...extra },
  })
}

export function corsPreflight() {
  return new Response(null, { status: 204, headers: CORS })
}

export const WP_HEADERS = { 'User-Agent': 'thesun-edge/1.0' }

// Fetch WordPress JSON with a hard timeout. Returns null on any failure so
// callers can degrade gracefully instead of caching a transient error.
export async function wpJson(url: string, timeoutMs = 8000): Promise<any> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: WP_HEADERS, next: { revalidate: 60 } } as RequestInit)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}
