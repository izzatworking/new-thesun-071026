import { useState, useEffect } from 'react'
import { articlePath, categoryUrl } from '@/lib/urls'
import useSWR from 'swr'
import { Link } from '@/lib/router'

import { postsKey, categoryBySlugKey, getLargeImage, getFeaturedImage, getImageAlt, decodeHtml, asArray, FALLBACK_IMAGE } from '@/lib/wp'
import { useDedupe } from '@/lib/dedupe'

// Full-width "Lifestyle" section — big featured card on the left,
// 2x2 grid of smaller cards on the right. Fetches up to 20 posts total,
// scrolls 5 at a time (1 featured + 4 grid cards).
const VISIBLE_COUNT = 5
const MAX_ITEMS = 40

// Relative time like "1d ago", "3h ago", "2mo ago" — matches the reference design.
function formatRelativeTime(dateStr) {
  if (!dateStr) return ''
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)
  const diffMonth = Math.floor(diffDay / 30)
  const diffYear = Math.floor(diffDay / 365)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 30) return `${diffDay}d ago`
  if (diffMonth < 12) return `${diffMonth}mo ago`
  return `${diffYear}y ago`
}

export default function LifestyleBlock({ slug = 'lifestyle', name = 'Lifestyle' }) {
  const { data: catsRaw } = useSWR(categoryBySlugKey(slug))
  const cats = asArray(catsRaw)
  const cat = cats[0]
  const { data: postsRaw } = useSWR(
    cat ? postsKey({ categories: cat.id, per_page: MAX_ITEMS, _embed: 1 }) : null
  )

  const [index, setIndex] = useState(0)

  const loading = !postsRaw || !Array.isArray(postsRaw)
  const posts = useDedupe('lifestyle', 34, asArray(postsRaw), MAX_ITEMS)
  const maxIndex = Math.max(0, posts.length - VISIBLE_COUNT)

  // Auto-advance to the next 5 cards every 5 seconds, looping back to the start.
  // This must stay above any early return so hook order never changes between renders.
  useEffect(() => {
    if (posts.length <= VISIBLE_COUNT) return
    const timer = setInterval(() => {
      setIndex(i => (i + VISIBLE_COUNT > maxIndex ? 0 : i + VISIBLE_COUNT))
    }, 5000)
    return () => clearInterval(timer)
  }, [maxIndex, posts.length])

  if (!cat) return null
  const displayName = decodeHtml(name || cat.name)
  const visiblePosts = posts.slice(index, index + VISIBLE_COUNT)
  const [featured, ...rest] = visiblePosts

  return (
    <section className="py-6">
      <div className="flex items-center justify-between border-b-2 border-primary pb-2 mb-5">
        <h2 className="font-serif-headline text-2xl font-bold flex items-center gap-2">
          <span className="w-1 h-7 bg-primary inline-block" />
          {displayName}
        </h2>

        <div className="flex items-center gap-3">
          {/* View all */}
          <Link
            to={categoryUrl(cat)}
            className="inline-flex items-center border border-red-600 text-red-600 text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-sm hover:bg-red-600 hover:text-white transition-colors"
          >
            View All
          </Link>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="h-80 sm:flex-[2] rounded-2xl overflow-hidden bg-white border border-border skeleton-shimmer" />
          <div className="sm:flex-[3] grid grid-cols-2 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-36 sm:h-40 rounded-2xl overflow-hidden bg-white border border-border skeleton-shimmer" />
            ))}
          </div>
        </div>
      )}

      {!loading && posts.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch gap-5">
          {/* Featured card — height matches the 2x2 grid on the right */}
          {featured && (
            <div className="sm:flex-[2]">
              <FeaturedCard post={featured} categoryName={displayName} />
            </div>
          )}

          {/* 2x2 grid of smaller cards */}
          <div className="sm:flex-[3] grid grid-cols-2 gap-5">
            {rest.map(p => (
              <SmallCard key={p.id} post={p} categoryName={displayName} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function FeaturedCard({ post, categoryName }) {
  const img = getLargeImage(post) || getFeaturedImage(post) || FALLBACK_IMAGE

  return (
    <Link
      to={articlePath(post)}
      className="group relative flex flex-col h-64 sm:h-full min-h-[21rem] rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-shadow duration-300"
    >
      <img
        src={img}
        alt={getImageAlt(post)}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      {/* Bottom gradient so the title stays legible */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Category badge */}
      <span className="relative m-4 self-start inline-flex items-center text-white text-[11px] font-bold uppercase tracking-wide bg-red-600 px-3 py-1 rounded-full">
        {categoryName}
      </span>

      {/* Title, bottom-aligned */}
      <h3 className="relative mt-auto p-4 pt-0 font-serif-headline text-lg sm:text-xl font-bold leading-snug text-white line-clamp-3">
        {decodeHtml(post.title?.rendered || '')}
      </h3>
    </Link>
  )
}

// Styled to match FeaturedCard: dark bottom gradient, white overlaid text,
// category badge sitting on the image instead of the light bottom-fade treatment.
function SmallCard({ post, categoryName }) {
  const img = getLargeImage(post) || getFeaturedImage(post) || FALLBACK_IMAGE

  return (
    <Link
      to={articlePath(post)}
      className="group relative flex flex-col h-36 sm:h-40 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-shadow duration-300"
    >
      <img
        src={img}
        alt={getImageAlt(post)}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      {/* Bottom gradient so the title stays legible, matching the featured card */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Category badge */}
      <span className="relative m-3 self-start inline-flex items-center text-white text-[10px] font-bold uppercase tracking-wide bg-red-600 px-2.5 py-1 rounded-full">
        {categoryName}
      </span>

      {/* Title + time, bottom-aligned */}
      <div className="relative mt-auto p-3 pt-0">
        <h3 className="font-serif-headline text-sm font-bold leading-snug text-white line-clamp-2">
          {decodeHtml(post.title?.rendered || '')}
        </h3>
        <span className="mt-1 block text-[10px] text-white/70">
          {formatRelativeTime(post.date)}
        </span>
      </div>
    </Link>
  )
}
