import { articlePath } from '@/lib/urls'
import useSWR from 'swr'
import { Link } from '@/lib/router'
import { ChevronRight } from 'lucide-react'
import { getFeaturedImage, getImageAlt, getPrimaryCategory, decodeHtml, FALLBACK_IMAGE, asArray } from '@/lib/wp'
import { useDedupe } from '@/lib/dedupe'

const DISPLAY = 5
const PRIORITY = 21

function MostViewedItem({ post, rank }) {
  if (!post) return null
  const img = getFeaturedImage(post) || FALLBACK_IMAGE
  const cat = getPrimaryCategory(post)
  return (
    <Link to={articlePath(post)} className="group flex items-center gap-4 py-4 border-b border-border last:border-0">
      <div className="w-20 h-16 sm:w-24 sm:h-20 shrink-0 overflow-hidden rounded bg-muted">
        <img
          src={img}
          alt={getImageAlt(post)}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm sm:text-[15px] leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {decodeHtml(post.title?.rendered || '')}
        </h4>
        {cat && (
          <span className="mt-1.5 inline-block text-xs font-bold uppercase tracking-wider text-primary">
            | {cat.name} |
          </span>
        )}
      </div>
      <span className="font-serif-headline text-3xl sm:text-4xl font-extrabold text-muted-foreground/25 shrink-0 leading-none select-none">
        {rank}
      </span>
    </Link>
  )
}

function MostViewedItemSkeleton() {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-border last:border-0">
      <div className="w-20 h-16 sm:w-24 sm:h-20 shrink-0 rounded skeleton-shimmer" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-full skeleton-shimmer rounded" />
        <div className="h-4 w-2/3 skeleton-shimmer rounded" />
        <div className="h-3 w-16 skeleton-shimmer rounded" />
      </div>
    </div>
  )
}

export default function MostViewedBlock() {
  // Real readership: most-viewed in the last 24h (GA4), via the cached edge feed.
  const { data: posts } = useSWR('/api/feed?type=most-viewed&limit=24')
  const loading = !posts || !Array.isArray(posts)
  const shown = useDedupe('most-viewed', PRIORITY, asArray(posts), DISPLAY)

  return (
    <section className="border border-border rounded-md overflow-hidden h-fit">
      <div className="bg-primary text-white px-5 py-4 flex items-center justify-between gap-3">
        <span className="font-extrabold italic uppercase tracking-wide text-xl sm:text-2xl">Most Viewed Stories</span>
        <Link to="/most-viewed" className="shrink-0 text-xs font-semibold text-white/90 hover:text-white inline-flex items-center gap-0.5">
          View All <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="px-5">
        {loading
          ? [...Array(DISPLAY)].map((_, i) => <MostViewedItemSkeleton key={i} />)
          : shown.map((p, i) => (
              <MostViewedItem key={p.id} post={p} rank={i + 1} />
            ))}
      </div>
    </section>
  )
}
