import useSWR from 'swr'
import { articlePath, categoryUrl } from '@/lib/urls'
import { Link } from '@/lib/router'
import { ChevronRight } from 'lucide-react'
import {
  getFeaturedImage, getImageAlt, decodeHtml, stripHtml, timeAgo, FALLBACK_IMAGE,
  postsKey, categoryBySlugKey, asArray,
} from '@/lib/wp'
import { useDedupe } from '@/lib/dedupe'

const ITEM_COUNT = 6 // 3x2 on desktop; only the first 4 show on mobile (2x2)

/* ---------- Card: image on top, red title/excerpt panel below ---------- */
function GoingViralCard({ post }) {
  if (!post) return null
  const img = getFeaturedImage(post) || FALLBACK_IMAGE
  return (
    <Link to={articlePath(post)} className="group block rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={img}
          alt={getImageAlt(post)}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="bg-primary px-4 pt-3 pb-4">
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <h3 className="font-extrabold text-white text-base sm:text-lg leading-snug line-clamp-2">
            {decodeHtml(post.title?.rendered || '')}
          </h3>
          <span className="shrink-0 text-amber-200 text-xs font-medium whitespace-nowrap pt-0.5">
            {timeAgo(post.date)}
          </span>
        </div>
        <p className="text-white/85 text-sm leading-snug line-clamp-3">
          {stripHtml(post.excerpt?.rendered || '', 130)}
        </p>
      </div>
    </Link>
  )
}

function GoingViralCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden shadow-sm">
      <div className="aspect-[4/3] skeleton-shimmer" />
      <div className="bg-primary/20 px-4 pt-3 pb-4 space-y-2">
        <div className="h-4 w-4/5 bg-white/30 rounded animate-pulse" />
        <div className="h-4 w-3/5 bg-white/30 rounded animate-pulse" />
        <div className="h-3 w-full bg-white/20 rounded animate-pulse mt-2" />
        <div className="h-3 w-2/3 bg-white/20 rounded animate-pulse" />
      </div>
    </div>
  )
}

export default function GoingViralBlock() {
  const { data: cats } = useSWR(categoryBySlugKey('going-viral'))
  const cat = cats?.[0]
  const { data: postsRaw } = useSWR(
    cat ? postsKey({ categories: cat.id, per_page: 30, _embed: 1 }) : null
  )
  const loading = !cat || !postsRaw
  const posts = useDedupe('going-viral', 31, asArray(postsRaw), ITEM_COUNT)

  return (
    <section>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <span className="bg-primary text-white font-extrabold italic uppercase tracking-wide text-base sm:text-lg px-4 py-1.5 rounded-sm shrink-0">
          Going Viral
        </span>
        <span className="flex-1 h-[2px] bg-primary" />
        <Link
          to={cat ? categoryUrl(cat) : '/going-viral/'}
          className="shrink-0 text-xs sm:text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
        >
          View All <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Static grid — 2x2 on mobile, 3x2 on desktop (5th & 6th cards hidden below lg) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        {loading
          ? [...Array(ITEM_COUNT)].map((_, i) => (
              <div key={i} className={i >= 4 ? 'hidden lg:block' : undefined}>
                <GoingViralCardSkeleton />
              </div>
            ))
          : posts.map((p, i) => (
              <div key={p.id} className={i >= 4 ? 'hidden lg:block' : undefined}>
                <GoingViralCard post={p} />
              </div>
            ))}
      </div>
    </section>
  )
}
