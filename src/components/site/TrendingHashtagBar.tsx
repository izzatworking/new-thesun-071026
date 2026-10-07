import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@/lib/router'
import useSWR from 'swr'
import { TrendingUp } from 'lucide-react'
import { decodeHtml, asArray } from '@/lib/wp'

// Trending tags come from the edge endpoint /api/trending-tags, which returns
// the ordered trending posts each with their tags and GLOBAL post counts (already
// sorted high→low). We pick ONE tag per post (the most-used not yet chosen); to
// stop one story (several near-identical posts) flooding the strip, a post is
// skipped if it shares two or more of its tags with a post we've already used.
// Falls back to the GA4 tag endpoint when needed.
const EXCLUDE_SLUGS = new Set(['pin', 'top-stories', 'exclusive'])
const MAX_TAGS = 10
const TAGS_LIMIT = 20
const STORY_SHARED_TAGS = 2 // ≥ this many shared tags ⇒ same story ⇒ skip

const MARQUEE_SPEED = 30 // px / second
const RESUME_MS = 4000
// Re-check the trending list while the reader stays on the page. 3 min > the
// edge cache (120s), so each poll is genuinely fresh; SWR pauses polling while
// the tab is hidden.
const REFRESH_MS = 180_000

function deriveTags(posts, trendingFallback) {
  const chosen = []
  const seen = new Set()
  const usedSets = [] // tag sets of the posts we've picked from

  for (const post of posts) {
    const tags = (post?.tags || []).filter((t) => t && t.slug && !EXCLUDE_SLUGS.has(t.slug))
    if (tags.length === 0) continue

    // Story de-dup: near-identical tag sets across posts = the same story.
    const sameStory = usedSets.some((used) => {
      let shared = 0
      for (const t of tags) if (used.has(t.slug)) shared++
      return shared >= STORY_SHARED_TAGS && shared >= Math.ceil(tags.length / 2)
    })
    if (sameStory) continue

    // Tags arrive sorted by global count desc; take the best not yet chosen.
    const pick = tags.find((t) => !seen.has(t.slug))
    if (!pick) continue
    chosen.push({ name: pick.name || pick.slug, slug: pick.slug })
    seen.add(pick.slug)
    usedSets.push(new Set(tags.map((t) => t.slug)))
    if (chosen.length >= MAX_TAGS) break
  }

  if (chosen.length < MAX_TAGS) {
    for (const t of trendingFallback) {
      if (!t?.slug || EXCLUDE_SLUGS.has(t.slug) || seen.has(t.slug)) continue
      chosen.push({ name: decodeHtml(t.name || t.slug), slug: t.slug })
      seen.add(t.slug)
      if (chosen.length >= MAX_TAGS) break
    }
  }
  return chosen
}

export default function TrendingHashtagBar() {
  const { data: trendingTags, isLoading: tagsLoading } = useSWR(`/api/trending-tags?limit=${TAGS_LIMIT}`, {
    refreshInterval: REFRESH_MS,
    revalidateOnFocus: true,
    keepPreviousData: true,
  })
  const { data: trendingRaw, isLoading: trendingLoading } = useSWR('/api/trending', {
    refreshInterval: REFRESH_MS,
    revalidateOnFocus: true,
    keepPreviousData: true,
  })

  const tags = useMemo(
    () => deriveTags(asArray(trendingTags), asArray(trendingRaw)),
    [trendingTags, trendingRaw]
  )
  const isLoading = tagsLoading || (tags.length === 0 && trendingLoading)

  const scrollerRef = useRef(null)
  const pausedRef = useRef(false)
  const resumeTimerRef = useRef(null)
  const dragRef = useRef({ active: false, startX: 0, startLeft: 0, moved: false })

  // Number of copies of the tag set needed so the strip always overflows
  // (guarantees a seamless, endless loop at any viewport width).
  const copiesRef = useRef(2)
  const [copies, setCopies] = useState(2)

  useEffect(() => {
    const measure = () => {
      const el = scrollerRef.current
      if (!el) return
      const per = el.scrollWidth / copiesRef.current
      if (per > 0) {
        const need = Math.max(2, Math.ceil(el.clientWidth / per) + 1)
        if (need !== copiesRef.current) {
          copiesRef.current = need
          setCopies(need)
        }
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [tags])

  // Always-on slow marquee (rAF-driven so it can also be swipe/drag scrolled).
  // No reduced-motion guard: it must keep moving and looping.
  useEffect(() => {
    const el = scrollerRef.current
    if (!el || tags.length === 0) return

    let raf
    let lastTs = 0
    const step = (ts) => {
      if (lastTs) {
        const dt = Math.min(64, ts - lastTs) / 1000
        if (!pausedRef.current) {
          const per = el.scrollWidth / copiesRef.current
          let next = el.scrollLeft + MARQUEE_SPEED * dt
          if (per > 0 && next >= per) next -= per
          el.scrollLeft = next
        }
      }
      lastTs = ts
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [tags])

  const pause = () => {
    pausedRef.current = true
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
  }
  const scheduleResume = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    resumeTimerRef.current = setTimeout(() => { pausedRef.current = false }, RESUME_MS)
  }
  useEffect(() => () => { if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current) }, [])

  // Mouse click-drag to scroll (touch swipe is native via overflow-x).
  // NOTE: we deliberately do NOT use setPointerCapture — it retargets the
  // subsequent pointerup/click to this wrapper, so tag links would never fire.
  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse') return
    const el = scrollerRef.current
    if (!el) return
    dragRef.current = { active: true, startX: e.clientX, startLeft: el.scrollLeft, moved: false }
    pause()

    const move = (ev) => {
      const d = dragRef.current
      if (!d.active) return
      const delta = ev.clientX - d.startX
      if (Math.abs(delta) > 3) d.moved = true
      el.scrollLeft = d.startLeft - delta
    }
    const up = () => {
      dragRef.current.active = false
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      scheduleResume()
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }
  // Only swallow the click when the user actually dragged the strip.
  const onClickCapture = (e) => {
    if (dragRef.current.moved) {
      e.preventDefault()
      e.stopPropagation()
      dragRef.current.moved = false
    }
  }

  if (!isLoading && tags.length === 0) return null

  const loop = tags.length
    ? Array.from({ length: copies }, () => tags).flat()
    : []

  return (
    <div className="mb-6 select-none flex items-center gap-1 sm:gap-1.5">
      {/* Red "Trending" capsule (graph icon blinks white ↔ yellow like LIVE) */}
      <div className="flex items-center h-6 sm:h-7 gap-1 sm:gap-1.5 bg-red-600 text-white rounded-full pl-2 pr-2.5 sm:pl-2.5 sm:pr-3 shrink-0 shadow-sm">
        <TrendingUp className="trending-icon-blink h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" strokeWidth={3} />
        <span className="font-serif-headline text-xs sm:text-sm font-extrabold uppercase italic tracking-wide whitespace-nowrap">
          Trending
        </span>
      </div>

      {/* Glass strip with the continuous hashtag marquee */}
      <div className="relative flex-1 min-w-0 h-9 rounded-full overflow-hidden shadow-sm border border-white/60 bg-white/40 backdrop-blur-md">
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
          <div className="trending-shine" />
        </div>

        <div
          ref={scrollerRef}
          className="marquee-scroll relative z-10 flex items-center h-full overflow-x-auto cursor-grab active:cursor-grabbing"
          onTouchStart={pause}
          onTouchEnd={scheduleResume}
          onPointerDown={onPointerDown}
          onClickCapture={onClickCapture}
        >
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3" style={{ width: 'max-content' }}>
            {loop.map((tag, i) => (
              <Link
                key={`${tag.slug}-${i}`}
                to={`/tag/${tag.slug}/`}
                className="inline-flex items-center h-6 sm:h-7 shrink-0 rounded-md bg-white/70 hover:bg-primary border border-slate-400/70 hover:border-primary shadow-sm px-2 sm:px-3 text-[9px] sm:text-xs font-bold uppercase tracking-wide text-slate-800 hover:text-white transition-colors whitespace-nowrap"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .marquee-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .marquee-scroll::-webkit-scrollbar { display: none; }

        @keyframes trendingIconBlink {
          0%, 45% { color: #ffffff; }
          50%, 95% { color: #facc15; }
          100% { color: #ffffff; }
        }
        .trending-icon-blink {
          color: #ffffff;
          animation: trendingIconBlink 1s steps(1, end) infinite;
        }

        .trending-shine {
          position: absolute;
          top: 0;
          left: -60%;
          width: 35%;
          height: 100%;
          background: linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%);
          transform: skewX(-20deg);
          animation: trendingShineMove 2.4s ease-in-out infinite;
        }
        @keyframes trendingShineMove {
          0% { left: -60%; }
          45% { left: 130%; }
          100% { left: 130%; }
        }
      `}</style>
    </div>
  )
}
