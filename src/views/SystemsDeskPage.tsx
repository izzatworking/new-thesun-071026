import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw, Radio, Rss } from 'lucide-react'
import { WP_BASE, buildUrl, LOGO_URL, FALLBACK_IMAGE } from '@/lib/wp'
import { YT_CHANNEL_ID } from '@/lib/youtube'
import { MAIN_MENU, itemHref } from '@/lib/menu'
import { STATIC_ROUTE_PATHS } from '@/lib/routes'
import useSeo from '@/lib/useSeo'

// ---------------------------------------------------------------------------
// The Sun Malaysia — Systems Desk (/systems-desk)
// Renders inside the normal site chrome (SiteHeader/SiteFooter via App.jsx),
// styled with the same tokens as the rest of the app rather than a separate
// dark "ops tool" look.
//
// Every check here runs as a real request from the visitor's browser — there
// is no backend for this page. Checks against domains that don't send
// permissive CORS headers (thesun.my's REST API, Instagram, YouTube's web
// page) can only be confirmed as "reachable", not have their status code
// read — those show as `warn` ("Unverified") rather than `down`, since a
// CORS block isn't evidence of an outage. Each of those rows carries an
// "Open" link so a human can confirm by eye.
// ---------------------------------------------------------------------------

const SITE_ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'https://thesun.my'
const YT_API_BASE = 'https://www.googleapis.com/youtube/v3'

const STATUS_LABEL = { ok: 'Operational', warn: 'Unverified', down: 'Down', info: 'Info', pending: 'Checking' }

const DOT = {
  ok: 'bg-secondary',
  warn: 'bg-amber-500',
  down: 'bg-destructive',
  info: 'bg-primary/60',
  pending: 'bg-muted-foreground/40 animate-pulse',
}
const BADGE = {
  ok: 'text-secondary bg-secondary/10',
  warn: 'text-amber-600 bg-amber-50',
  down: 'text-destructive bg-destructive/10',
  info: 'text-primary bg-primary/10',
  pending: 'text-muted-foreground bg-muted',
}

function timedFetch(url, opts = {}, timeoutMs = 8000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  const started = performance.now()
  return fetch(url, { ...opts, signal: ctrl.signal })
    .then((res) => ({ res, ms: Math.round(performance.now() - started) }))
    .finally(() => clearTimeout(timer))
}

function loadImage(url, timeoutMs = 8000) {
  return new Promise<{ ok: boolean; ms: number; w?: number; h?: number; reason?: string }>((resolve) => {
    const started = performance.now()
    const img = new Image()
    const timer = setTimeout(() => resolve({ ok: false, ms: Math.round(performance.now() - started), reason: 'timeout' }), timeoutMs)
    img.onload = () => { clearTimeout(timer); resolve({ ok: true, ms: Math.round(performance.now() - started), w: img.naturalWidth, h: img.naturalHeight }) }
    img.onerror = () => { clearTimeout(timer); resolve({ ok: false, ms: Math.round(performance.now() - started), reason: 'error' }) }
    img.src = url
  })
}

// ---------- reusable row bits ----------

function Row({ name, check }) {
  const status = check?.status || 'pending'
  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 min-h-[50px] px-1 border-t border-border first:border-t-0">
      <span className={`w-2.5 h-2.5 rounded-full flex-none ${DOT[status]}`} aria-hidden="true" />
      <div className="min-w-0">
        <div className="text-sm font-semibold truncate">{name}</div>
        <div className="text-xs text-muted-foreground truncate mt-0.5">{check?.detail || 'queued…'}</div>
      </div>
      <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap hidden sm:inline">{check?.ms || ''}</span>
      {check?.link ? (
        <a href={check.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline whitespace-nowrap">
          Open ↗
        </a>
      ) : <span />}
      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap text-center min-w-[76px] ${BADGE[status]}`}>
        {STATUS_LABEL[status]}
      </span>
    </div>
  )
}

function Card({ title, subtitle, children }) {
  return (
    <section className="border border-border rounded-md overflow-hidden bg-card h-fit">
      <div className="bg-primary text-white font-extrabold italic uppercase tracking-wide text-base sm:text-lg px-5 py-3 flex items-baseline justify-between gap-3">
        <span>{title}</span>
        {subtitle && <span className="text-[11px] font-medium not-italic uppercase tracking-normal text-white/70 truncate">{subtitle}</span>}
      </div>
      <div className="px-5">{children}</div>
    </section>
  )
}

function Kv({ k, v }) {
  return (
    <div className="flex justify-between gap-3 text-sm py-2.5 border-t border-border first:border-t-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-semibold">{v}</span>
    </div>
  )
}

// ---------- page ----------

export default function SystemsDeskPage() {
  useSeo({
    title: 'Systems Desk',
    description: 'Live operational status for The Sun Malaysia web properties: WordPress REST API, YouTube API, images, links, search, and SEO.',
    url: SITE_ORIGIN + '/systems-desk',
  })

  const [checks, setChecks] = useState({})
  const [loading, setLoading] = useState(false)
  const [lastChecked, setLastChecked] = useState(null)
  const wireRef = useRef([])
  const [wire, setWire] = useState([])

  const setCheck = useCallback((id, name, result) => {
    setChecks((prev) => ({ ...prev, [id]: { name, ...result } }))
    wireRef.current = [...wireRef.current, { status: result.status, text: `${name}: ${STATUS_LABEL[result.status]}${result.detail ? ' — ' + result.detail : ''}` }]
  }, [])

  const checkGetEndpoint = useCallback(async (id, name, url) => {
    try {
      const { res, ms } = await timedFetch(url, { mode: 'cors' })
      if (res.ok) {
        const total = res.headers.get('x-wp-total')
        setCheck(id, name, { status: 'ok', detail: total ? `x-wp-total: ${total}` : `HTTP ${res.status}`, ms: `${ms} ms`, link: url })
      } else {
        setCheck(id, name, { status: 'down', detail: `HTTP ${res.status}`, ms: `${ms} ms`, link: url })
      }
    } catch (err) {
      setCheck(id, name, { status: 'warn', detail: err.name === 'AbortError' ? 'timed out (8s)' : 'blocked by CORS / network', ms: '—', link: url })
    }
  }, [setCheck])

  const checkNoCorsReachable = useCallback(async (id, name, url) => {
    try {
      const { ms } = await timedFetch(url, { mode: 'no-cors' })
      setCheck(id, name, { status: 'warn', detail: 'reachable, status opaque (no-cors)', ms: `${ms} ms`, link: url })
    } catch (err) {
      setCheck(id, name, { status: 'down', detail: err.name === 'AbortError' ? 'timed out (8s)' : 'unreachable', ms: '—', link: url })
    }
  }, [setCheck])

  const checkImage = useCallback(async (id, name, url) => {
    const result = await loadImage(url)
    setCheck(id, name, {
      status: result.ok ? 'ok' : 'down',
      detail: result.ok ? (result.w ? `${result.w}×${result.h}px` : 'loaded') : result.reason,
      ms: `${result.ms} ms`,
      link: url.startsWith('data:') ? undefined : url,
    })
  }, [setCheck])

  const markInfo = useCallback((id, name, detail) => {
    setCheck(id, name, { status: 'info', detail, ms: '' })
  }, [setCheck])

  const runAllChecks = useCallback(async () => {
    setLoading(true)
    setChecks({})
    wireRef.current = []

    const jobs = []

    // WordPress REST API
    jobs.push(checkGetEndpoint('wp-posts', 'Posts endpoint', buildUrl('/posts', { per_page: 1 })))
    // 'wp-cats' row is set below by categorySlugsPromise, which needs the
    // actual slug list (not just endpoint status) to validate nav links.
    jobs.push(checkGetEndpoint('wp-tags', 'Tags endpoint (hashtags)', buildUrl('/tags', { orderby: 'count', order: 'desc', hide_empty: 1 })))
    jobs.push(checkGetEndpoint('wp-embed', 'Embedded media (_embed)', buildUrl('/posts', { _embed: 1, per_page: 1 })))

    // YouTube — no API key available in a static page; a 400/403 still proves
    // the endpoint itself is reachable.
    jobs.push((async () => {
      const url = `${YT_API_BASE}/channels?part=contentDetails&id=${YT_CHANNEL_ID}`
      try {
        const { res, ms } = await timedFetch(url, { mode: 'cors' })
        if (res.status === 400 || res.status === 403) {
          setCheck('yt-channel', 'Channels endpoint', { status: 'ok', detail: `endpoint reachable (HTTP ${res.status}, key required)`, ms: `${ms} ms`, link: url })
        } else if (res.ok) {
          setCheck('yt-channel', 'Channels endpoint', { status: 'ok', detail: `HTTP ${res.status}`, ms: `${ms} ms`, link: url })
        } else {
          setCheck('yt-channel', 'Channels endpoint', { status: 'down', detail: `HTTP ${res.status}`, ms: `${ms} ms`, link: url })
        }
      } catch (err) {
        setCheck('yt-channel', 'Channels endpoint', { status: 'warn', detail: err.name === 'AbortError' ? 'timed out' : 'blocked by CORS / network', ms: '—', link: url })
      }
    })())
    jobs.push((async () => markInfo('yt-key', 'API key (YOUTUBE_API_KEY)', 'not readable from a static page — verify it is set in the deploy environment'))())

    // Pages
    jobs.push(checkNoCorsReachable('pg-home', 'Homepage', SITE_ORIGIN + '/'))
    jobs.push(checkGetEndpoint('pg-search', 'Search function', buildUrl('/posts', { search: 'malaysia', per_page: 1 })))
    jobs.push((async () => {
      const w = window.innerWidth
      const bp = w < 480 ? 'mobile (<480px)' : w < 1024 ? 'tablet' : 'desktop'
      markInfo('pg-mobile', 'Mobile / responsive view', `viewport ${w}px → ${bp} layout active`)
    })())

    // Images
    jobs.push(checkImage('img-logo', 'Site logo', LOGO_URL))
    jobs.push(checkImage('img-fallback', 'Fallback placeholder (inline SVG)', FALLBACK_IMAGE))

    // Nav links (from MAIN_MENU) — real detection, not a placeholder.
    //
    // A /category/:slug link only actually works if that slug exists as a
    // WP category; otherwise it's a "soft 404" (no HTTP error, empty page),
    // which a plain reachability check would never catch. So: fetch the WP
    // category list once, then check each slug-based item against it. A
    // static `to` link is checked against the routes actually registered in
    // App.jsx. An item with neither is a menu.js misconfiguration.
    const flatLinks = []
    MAIN_MENU.forEach((item) => {
      if (item.children) item.children.forEach((c) => flatLinks.push(c))
      else flatLinks.push(item)
    })

    const categoriesUrl = buildUrl('/categories', { per_page: 100, hide_empty: 0 })
    const categorySlugsPromise = (async () => {
      try {
        const { res, ms } = await timedFetch(categoriesUrl, { mode: 'cors' })
        if (res.ok) {
          const data = await res.json()
          const slugs = new Set((Array.isArray(data) ? data : []).map((c) => c.slug))
          setCheck('wp-cats', 'Categories endpoint', { status: 'ok', detail: `${slugs.size} categories loaded`, ms: `${ms} ms`, link: categoriesUrl })
          return slugs
        }
        setCheck('wp-cats', 'Categories endpoint', { status: 'down', detail: `HTTP ${res.status}`, ms: `${ms} ms`, link: categoriesUrl })
        return null
      } catch (err) {
        setCheck('wp-cats', 'Categories endpoint', { status: 'warn', detail: err.name === 'AbortError' ? 'timed out (8s)' : 'blocked by CORS / network', ms: '—', link: categoriesUrl })
        return null
      }
    })()
    jobs.push(categorySlugsPromise)

    flatLinks.forEach((item, i) => {
      const href = itemHref(item)
      const isExternal = /^https?:\/\//.test(href)

      if (isExternal) {
        jobs.push(checkNoCorsReachable(`link-${i}`, item.label, href))
        return
      }

      if (item.to) {
        // Static route — checked against the same ROUTE_PATHS App.jsx
        // renders its <Route>s from (lib/routes.js), so this can't drift.
        if (STATIC_ROUTE_PATHS.has(item.to)) {
          setCheck(`link-${i}`, item.label, { status: 'ok', detail: `registered route (${item.to})`, ms: '', link: SITE_ORIGIN + item.to })
        } else {
          setCheck(`link-${i}`, item.label, { status: 'down', detail: `"${item.to}" not in lib/routes.js — route will 404`, ms: '', link: SITE_ORIGIN + item.to })
        }
        return
      }

      if (item.slug) {
        // Category route — checked against live WP category slugs.
        jobs.push((async () => {
          const slugs = await categorySlugsPromise
          const catHref = `/category/${item.slug}`
          if (slugs === null) {
            setCheck(`link-${i}`, item.label, { status: 'warn', detail: 'category list unavailable — could not verify slug', ms: '—', link: SITE_ORIGIN + catHref })
          } else if (slugs.has(item.slug)) {
            setCheck(`link-${i}`, item.label, { status: 'ok', detail: `WP category "${item.slug}" exists`, ms: '', link: SITE_ORIGIN + catHref })
          } else {
            setCheck(`link-${i}`, item.label, { status: 'down', detail: `no matching WP category "${item.slug}" — page will render empty`, ms: '', link: SITE_ORIGIN + catHref })
          }
        })())
        return
      }

      // Neither `to` nor `slug` set — menu.js entry is misconfigured, no
      // request needed to know it's broken.
      setCheck(`link-${i}`, item.label, { status: 'down', detail: 'menu.js entry has no slug and no to — misconfigured', ms: '' })
    })

    // Social
    jobs.push(checkNoCorsReachable('soc-ig', 'Instagram — @thesundaily', 'https://www.instagram.com/thesundaily/'))
    jobs.push(checkNoCorsReachable('soc-yt', 'YouTube channel page', `https://www.youtube.com/channel/${YT_CHANNEL_ID}`))

    // Search & tags function
    jobs.push(checkGetEndpoint('fn-search', 'Search query ("malaysia")', buildUrl('/posts', { search: 'malaysia', per_page: 3 })))
    jobs.push(checkGetEndpoint('fn-tags', 'Trending hashtag sort', buildUrl('/tags', { orderby: 'count', order: 'desc', hide_empty: 1, per_page: 5 })))

    // SEO — static contract rows, confirmed against useSeo.js
    jobs.push((async () => markInfo('seo-title', 'Document title suffix rule', 'confirmed in useSeo.js: appends "| The Sun Malaysia" unless already present'))())
    jobs.push((async () => markInfo('seo-og', 'Open Graph tags', 'confirmed in useSeo.js: writes og:title/description/type/image/url + twitter card'))())
    jobs.push((async () => markInfo('seo-canonical', 'Canonical link handling', 'confirmed in useSeo.js: created/updated, removed on unmount'))())
    jobs.push((async () => markInfo('seo-jsonld', 'JSON-LD structured data', 'confirmed in useSeo.js: injected only when jsonLd is passed'))())
    jobs.push((async () => {
      const url = SITE_ORIGIN + '/'
      try {
        const { res, ms } = await timedFetch(url, { mode: 'cors' })
        if (res.ok) {
          const html = await res.text()
          const m = html.match(/<title>([^<]*)<\/title>/i)
          setCheck('seo-live', 'Live homepage <head> fetch', { status: 'ok', detail: m ? `title: "${m[1].slice(0, 40)}"` : `HTTP ${res.status}`, ms: `${ms} ms`, link: url })
        } else {
          setCheck('seo-live', 'Live homepage <head> fetch', { status: 'down', detail: `HTTP ${res.status}`, ms: `${ms} ms`, link: url })
        }
      } catch {
        setCheck('seo-live', 'Live homepage <head> fetch', { status: 'warn', detail: 'blocked by CORS — open the link to inspect manually', ms: '—', link: url })
      }
    })())

    await Promise.allSettled(jobs)

    setWire(wireRef.current)
    setLastChecked(new Date())
    setLoading(false)
  }, [checkGetEndpoint, checkNoCorsReachable, checkImage, markInfo, setCheck])

  useEffect(() => { runAllChecks() }, [runAllChecks])

  const values = Object.values(checks)
  const counts = values.reduce((acc: any, c: any) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc }, {} as Record<string, number>)
  const wireDouble = wire.length ? [...wire, ...wire] : []

  return (
    <div className="container mx-auto px-4 py-6">

      {/* Header — matches SearchPage's masthead treatment */}
      <header className="border-b-2 border-primary pb-4 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Radio className="h-7 w-7 text-primary" />
            <h1 className="font-serif-headline text-3xl md:text-4xl font-bold">Systems Desk</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground text-right leading-relaxed hidden sm:block">
              Last checked <b className="text-foreground">{lastChecked ? lastChecked.toLocaleTimeString() : '—'}</b>
            </span>
            <button
              onClick={runAllChecks}
              disabled={loading}
              className="inline-flex items-center gap-1.5 border border-border hover:border-primary hover:text-primary disabled:opacity-50 disabled:pointer-events-none text-xs font-bold uppercase tracking-wide px-3.5 py-2 rounded transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Recheck all
            </button>
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Live operational status for The Sun Malaysia's WordPress API, YouTube API, images, links, search and SEO.</p>

        <div className="flex gap-2 flex-wrap mt-3">
          {[['ok', 'Operational'], ['warn', 'Unverified'], ['down', 'Down'], ['info', 'Info']].map(([key, label]) => (
            <span key={key} className="flex items-center gap-1.5 border border-border rounded-full pl-2.5 pr-3 py-1 text-xs font-semibold text-muted-foreground bg-muted/40">
              <span className={`w-2 h-2 rounded-full ${DOT[key]}`} />
              <b className="text-foreground font-extrabold">{counts[key] || 0}</b>{label}
            </span>
          ))}
        </div>
      </header>

      {/* Live wire ticker — reuses the site's own ticker-track / hover-ticker utilities */}
      <div className="bg-[#2d2d2d] text-white rounded-md mb-6 overflow-hidden">
        <div className="flex items-stretch h-10 px-4 gap-3">
          <div className="flex items-center gap-1.5 shrink-0 pr-3 mr-1 border-r border-white/10">
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">LIVE<br />WIRE</span>
          </div>
          <div className="flex-1 overflow-hidden hover-ticker relative flex items-center">
            {wireDouble.length === 0 ? (
              <span className="text-xs text-white/60 px-2">Running checks…</span>
            ) : (
              <div
                className="ticker-track flex items-center whitespace-nowrap"
                style={{ width: 'max-content', animationDuration: '180s' }}
              >
                {wireDouble.map((w, i) => (
                  <span
                    key={i}
                    className={`text-xs px-5 inline-flex items-center gap-1.5 ${
                      w.status === 'ok' ? 'text-emerald-400' : w.status === 'warn' ? 'text-amber-300' : w.status === 'down' ? 'text-red-400' : 'text-white/70'
                    }`}
                  >
                    {w.text}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground border border-dashed border-border rounded-md px-4 py-3 mb-6 leading-relaxed">
        <b className="text-foreground">How to read this:</b> checks against external domains (WordPress REST API, YouTube,
        Instagram) run as live browser requests. If a target doesn't send permissive CORS headers, the browser can confirm
        it's <i>reachable</i> but can't read the response — those show as <b className="text-foreground">Unverified</b>, not{' '}
        <b className="text-foreground">Down</b>. Every unverified row has an <b className="text-foreground">Open ↗</b> link
        so you can confirm by eye. The build-environment card is read from repo config, since a browser page can't inspect
        your build server directly.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">

        <Card title="WordPress REST API" subtitle="wp-json/wp/v2">
          <Row name="Posts endpoint" check={checks['wp-posts']} />
          <Row name="Categories endpoint" check={checks['wp-cats']} />
          <Row name="Tags endpoint (hashtags)" check={checks['wp-tags']} />
          <Row name="Embedded media (_embed)" check={checks['wp-embed']} />
        </Card>

        <Card title="YouTube Data API v3" subtitle={`Channel ${YT_CHANNEL_ID.slice(0, 10)}…`}>
          <Row name="Channels endpoint" check={checks['yt-channel']} />
          <Row name="API key (YOUTUBE_API_KEY)" check={checks['yt-key']} />
        </Card>

        <Card title="Site Pages" subtitle="Homepage · Search · Mobile">
          <Row name="Homepage" check={checks['pg-home']} />
          <Row name="Search function" check={checks['pg-search']} />
          <Row name="Mobile / responsive view" check={checks['pg-mobile']} />
        </Card>

        <Card title="Image Loading" subtitle="Brand assets">
          <Row name="Site logo" check={checks['img-logo']} />
          <Row name="Fallback placeholder (inline SVG)" check={checks['img-fallback']} />
        </Card>

        <Card title="Navigation Links" subtitle="MAIN_MENU">
          {(() => {
            const flat = []
            MAIN_MENU.forEach((item) => (item.children ? item.children.forEach((c) => flat.push(c)) : flat.push(item)))
            return flat.map((item, i) => <Row key={i} name={item.label} check={checks[`link-${i}`]} />)
          })()}
        </Card>

        <Card title="Social Channels" subtitle="Browser reachability">
          <Row name="Instagram — @thesundaily" check={checks['soc-ig']} />
          <Row name="YouTube channel page" check={checks['soc-yt']} />
        </Card>

        <Card title="Search & Tag Functions" subtitle="Live WP query">
          <Row name='Search query ("malaysia")' check={checks['fn-search']} />
          <Row name="Trending hashtag sort" check={checks['fn-tags']} />
        </Card>

        <Card title="SEO Snapshot" subtitle="useSeo.js contract">
          <Row name="Document title suffix rule" check={checks['seo-title']} />
          <Row name="Open Graph tags" check={checks['seo-og']} />
          <Row name="Canonical link handling" check={checks['seo-canonical']} />
          <Row name="JSON-LD structured data" check={checks['seo-jsonld']} />
          <Row name="Live homepage <head> fetch" check={checks['seo-live']} />
        </Card>

        <Card title="Build Environment" subtitle="Declared in repo">
          <Kv k="Node engine (Vite 6)" v="≥ 18.x required" />
          <Kv k="Package manager" v="yarn 1.22.22" />
          <Kv k="React" v="18.3.1" />
          <Kv k="React Router" v="7.1.5" />
          <Kv k="Vite" v="6.0.7" />
          <Kv k="Tailwind CSS" v="3.4.1" />
          <Kv k="SWR" v="2.3.8" />
          <Kv k="Dev server" v="0.0.0.0:3000" />
        </Card>

      </div>

      <footer className="text-center text-xs text-muted-foreground mt-8 leading-relaxed flex items-center justify-center gap-1.5">
        <Rss className="h-3 w-3" /> Info rows are read from repo config, not live-probed. "Unverified" means CORS blocked the read — not an outage.
      </footer>
    </div>
  )
}