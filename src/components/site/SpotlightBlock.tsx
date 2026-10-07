import { useState } from 'react'
import { articlePath } from '@/lib/urls'
import useSWR from 'swr'
import { Link } from '@/lib/router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  getFeaturedImage, getImageAlt, getPrimaryCategory, getAuthor,
  decodeHtml, timeAgo, FALLBACK_IMAGE, postsKey, categoryBySlugKey, asArray,
} from '@/lib/wp'
import { useDedupe } from '@/lib/dedupe'

const PER_PAGE = 5

/* ---------- Large image card, numbered "01" overlaid at bottom ---------- */
function SpotlightFeature({ post, rank }) {
  if (!post) return null
  const img = getFeaturedImage(post) || FALLBACK_IMAGE
  return (
    <Link
      to={articlePath(post)}
      className="group relative block aspect-[3/4] rounded-md overflow-hidden bg-muted"
    >
      <img
        src={img}
        alt={getImageAlt(post)}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <span className="font-serif-headline text-3xl font-extrabold text-white/70 leading-none select-none">
          {String(rank).padStart(2, '0')}
        </span>
        <h3 className="mt-1 font-serif-headline font-bold text-white text-base leading-snug line-clamp-3">
          {decodeHtml(post.title?.rendered || '')}
        </h3>
      </div>
    </Link>
  )
}

function SpotlightFeatureSkeleton() {
  return <div className="aspect-[3/4] rounded-md skeleton-shimmer" />
}

/* ---------- Small image card, same style as feature, numbered + title overlaid at bottom ---------- */
function SpotlightItem({ post, rank }) {
  if (!post) return null
  const img = getFeaturedImage(post) || FALLBACK_IMAGE
  return (
    <Link
      to={articlePath(post)}
      className="group relative block aspect-[3/4] rounded-md overflow-hidden bg-muted"
    >
      <img
        src={img}
        alt={getImageAlt(post)}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <span className="font-serif-headline text-3xl font-extrabold text-white/70 leading-none select-none">
          {String(rank).padStart(2, '0')}
        </span>
        <h3 className="mt-1 font-serif-headline font-bold text-white text-base leading-snug line-clamp-3">
          {decodeHtml(post.title?.rendered || '')}
        </h3>
      </div>
    </Link>
  )
}

function SpotlightItemSkeleton() {
  return <div className="aspect-[3/4] rounded-md skeleton-shimmer" />
}

export default function SpotlightBlock() {
  const { data: cats } = useSWR(categoryBySlugKey('spotlight'))
  const cat = cats?.[0]
  const [page, setPage] = useState(1)

  const { data: posts } = useSWR(
    cat ? postsKey({ categories: cat.id, per_page: 30, page, _embed: 1 }) : null
  )
  const loading = !posts || !Array.isArray(posts)
  const postsArr = asArray(posts)
  const shown = useDedupe('spotlight', 30, postsArr, PER_PAGE)
  const hasNext = !loading && postsArr.length >= PER_PAGE
  const hasPrev = page > 1

  return (
    <section>
      {/* Header — red SPOTLIGHT tab + progress bar + prev/next */}
      <div className="flex items-center gap-4 mb-5">
        <span className="shrink-0 inline-block bg-primary text-white font-extrabold italic uppercase tracking-wide text-base sm:text-lg px-4 py-1.5 rounded-sm">
          Spotlight
        </span>
        <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: hasNext ? '35%' : '100%' }}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={!hasPrev}
            aria-label="Previous"
            className="w-8 h-8 flex items-center justify-center border border-border rounded hover:border-primary hover:text-primary transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!hasNext}
            aria-label="Next"
            className="w-8 h-8 flex items-center justify-center border border-border rounded hover:border-primary hover:text-primary transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 1 large card + 3 small cards. 2-col on mobile (feature spans both), 4-col on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {loading ? (
          <>
            <div className="lg:col-span-1"><SpotlightFeatureSkeleton /></div>
            {[...Array(4)].map((_, i) => (
              <div key={i} className={i === 3 ? 'hidden' : undefined}>
                <SpotlightItemSkeleton />
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="lg:col-span-1">
              <SpotlightFeature post={shown[0]} rank={(page - 1) * PER_PAGE + 1} />
            </div>
            {shown.slice(1, 5).map((p, i) => (
              <div key={p.id} className={i === 3 ? 'hidden' : undefined}>
                <SpotlightItem post={p} rank={(page - 1) * PER_PAGE + i + 2} />
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  )
}
