import { NextResponse, type NextRequest } from 'next/server'
import { REDIRECTS } from './data/redirects'

// Ported from the old Cloudflare Pages `_middleware.js`: a WordPress Rank Math
// redirect map (301/302/307/308 + real 410 Gone responses) plus the www→apex
// canonical-host redirect. Runs before routing for every document request.

const HOME_REDIRECT_PREFIXES = ['/top-stories']

const PROD_APEX = 'thesun.my'
const PROD_WWW = 'www.thesun.my'
const PROD_HOSTS = new Set([PROD_APEX, PROD_WWW])

// Continue to the app; noindex any non-production host (staging/preview).
function pass(url: URL) {
  const res = NextResponse.next()
  if (!PROD_HOSTS.has(url.hostname)) res.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return res
}

function normalize(p: string) {
  let s = p
  if (!s.startsWith('/')) s = '/' + s
  if (s.length > 1) s = s.replace(/\/+$/, '')
  return s
}

function matchRedirect(path: string): { to: string; code: number } | null {
  if (path === '/' || path.startsWith('/api/')) return null
  const norm = normalize(path)

  for (const prefix of HOME_REDIRECT_PREFIXES) {
    if (norm === prefix || norm.startsWith(prefix + '/')) return { to: '/', code: 301 }
  }

  const exact = REDIRECTS.exact[norm]
  if (exact) return { to: exact[0], code: exact[1] }

  for (const [pat, to, code] of REDIRECTS.start) {
    if (norm === normalize(pat) || norm.startsWith(normalize(pat) + '/')) return { to, code }
  }
  return null
}

// WordPress-style trailing slash for document routes (no file extension).
function needsTrailingSlash(path: string) {
  if (path === '/' || path.endsWith('/')) return false
  if (path.startsWith('/api/')) return false
  if (/\.[a-z0-9]{2,5}$/i.test(path)) return false
  return true
}

export default function proxy(request: NextRequest) {
  const url = request.nextUrl

  // Canonical host: www → apex.
  if (url.hostname === PROD_WWW) {
    const to = new URL(url)
    to.hostname = PROD_APEX
    return NextResponse.redirect(to, 301)
  }

  if (url.pathname.startsWith('/api/')) return pass(url)

  const hit = matchRedirect(url.pathname)
  if (hit) {
    if (hit.code === 410) {
      return new NextResponse('Gone\n', {
        status: 410,
        headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
      })
    }
    const dest = /^https?:\/\//.test(hit.to) ? hit.to : new URL(hit.to, url.origin).toString()
    return NextResponse.redirect(dest, hit.code || 301)
  }

  // No redirect match → enforce the WordPress trailing slash.
  if (needsTrailingSlash(url.pathname)) {
    const to = new URL(url)
    to.pathname = normalize(url.pathname) + '/'
    return NextResponse.redirect(to, 301)
  }

  return pass(url)
}

export const config = {
  // Run on document routes only: skip API, Next internals, sitemaps/feeds and
  // anything that looks like a static file (has an extension).
  matcher: ['/((?!api/|_next/|.*\\..*).*)'],
}
