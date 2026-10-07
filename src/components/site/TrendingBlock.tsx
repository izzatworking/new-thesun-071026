import { useState, useEffect, useRef } from 'react'
import { articlePath } from '@/lib/urls'
import useSWR from 'swr'
import { Link } from '@/lib/router'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import { asArray, decodeHtml, getFeaturedImage, getImageAlt, FALLBACK_IMAGE } from '@/lib/wp'
import { useDedupe } from '@/lib/dedupe'

const VISIBLE_COUNT = 4
const AUTO_ADVANCE_MS = 2000
const PRIORITY = 20

export default function TrendingBlock() {
  // Editorial feed: posts tagged pin / top stories / exclusive, newest first.
  const { data, error, isLoading } = useSWR('/api/feed?type=breaking&limit=20')
  const breaking = asArray(data)
  // Fall back to the plain latest feed only if the editorial feed is empty.
  const { data: fallbackData } = useSWR(
    (!isLoading && breaking.length === 0) ? '/api/feed?type=latest&limit=20' : null
  )
  const source = breaking.length ? breaking : asArray(fallbackData)

  const posts = useDedupe('breaking', PRIORITY, source, 10)

  const [offset, setOffset] = useState(0)
  const pausedRef = useRef(false)

  useEffect(() => {
    if (posts.length <= 1) return
    const timer = setInterval(() => {
      if (!pausedRef.current) setOffset(o => (o + 1) % posts.length)
    }, AUTO_ADVANCE_MS)
    return () => clearInterval(timer)
  }, [posts.length])

  if (error || posts.length === 0) return null

  const windowItems = Array.from(
    { length: Math.min(VISIBLE_COUNT, posts.length) },
    (_, i) => posts[(offset + i) % posts.length]
  )

  const goPrev = () => setOffset(o => (o - 1 + posts.length) % posts.length)
  const goNext = () => setOffset(o => (o + 1) % posts.length)

  return (
    <section
      className="py-6"
      onMouseEnter={() => { pausedRef.current = true }}
      onMouseLeave={() => { pausedRef.current = false }}
    >
      <div className="flex items-center gap-3 mb-5">
        <span className="shrink-0 bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-sm">
          Breaking News
        </span>
        <div className="flex-1 h-0.5 bg-red-600" />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous"
          className="hidden sm:flex shrink-0 w-9 h-9 items-center justify-center rounded-sm border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        <div className="flex-1 flex items-center gap-5 overflow-hidden">
          {windowItems.map((p, i) => (
            <TrendingItem
              key={`${p.id}-${offset}`}
              post={p}
              className={
                i === 0 ? '' :
                i === 1 ? 'hidden sm:flex' :
                i === 2 ? 'hidden md:flex' :
                'hidden lg:flex'
              }
            />
          ))}
        </div>

        <button
          type="button"
          onClick={goNext}
          aria-label="Next"
          className="hidden sm:flex shrink-0 w-9 h-9 items-center justify-center rounded-sm border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  )
}

function TrendingItem({ post, className = '' }) {
  const img = getFeaturedImage(post) || FALLBACK_IMAGE
  const title = decodeHtml(post.title?.rendered || '')

  return (
    <Link
      to={articlePath(post)}
      className={`group flex-1 min-w-0 items-center gap-3 ${className || 'flex'}`}
    >
      <div className="w-16 h-16 sm:w-20 sm:h-16 shrink-0 relative rounded overflow-hidden bg-muted">
        <img
          src={img}
          alt={getImageAlt(post)}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />
        {/* Red gradient overlay + badge, matching the site's other card styles */}
        <div className="absolute inset-0 bg-gradient-to-t from-red-700/60 via-red-700/0 to-transparent" />
        <span className="absolute bottom-1 left-1 bg-red-600 text-white text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-sm">
          Hot
        </span>
      </div>
      <p className="text-sm leading-snug line-clamp-3 text-foreground group-hover:text-red-700 transition-colors">
        {title}
      </p>
    </Link>
  )
}
