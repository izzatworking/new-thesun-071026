import useSWR from 'swr'
import { articlePath, categoryUrl } from '@/lib/urls'
import { Link } from '@/lib/router'
import {
  postsKey, categoryBySlugKey,
  getThumbnail, getImageAlt, getPrimaryCategory, decodeHtml, asArray, FALLBACK_IMAGE,
} from '@/lib/wp'
import { useDedupe } from '@/lib/dedupe'

// Post time shown as a plain 24h clock (e.g. "14:20"), matching the reference —
// not a relative "Xh ago" stamp like the other blocks use.
function formatTimeHM(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch {
    return ''
  }
}

function MiniItem({ post }) {
  const cat = getPrimaryCategory(post)
  return (
    <Link
      to={articlePath(post)}
      className="group flex gap-4 py-4 border-b border-border/70 last:border-b-0"
    >
      <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-md overflow-hidden bg-muted">
        <img
          src={getThumbnail(post) || FALLBACK_IMAGE}
          alt={getImageAlt(post)}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-primary font-bold text-xs sm:text-sm uppercase tracking-wide truncate">
            {cat ? decodeHtml(cat.name) : 'Most Viewed'}
          </span>
          <span className="text-muted-foreground text-xs sm:text-sm shrink-0">
            {formatTimeHM(post.date)}
          </span>
        </div>
        <h4 className="font-serif-headline font-bold text-base sm:text-lg leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-3">
          {decodeHtml(post.title?.rendered || '')}
        </h4>
      </div>
    </Link>
  )
}

function MiniItemSkeleton() {
  return (
    <div className="flex gap-4 py-4 border-b border-border/70 last:border-b-0">
      <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-md skeleton-shimmer" />
      <div className="min-w-0 flex-1 space-y-2.5 pt-1">
        <div className="h-3 w-20 skeleton-shimmer rounded" />
        <div className="h-4 w-full skeleton-shimmer rounded" />
        <div className="h-4 w-2/3 skeleton-shimmer rounded" />
      </div>
    </div>
  )
}

function CategoryColumn({ slug, label, priority }) {
  const { data: catsRaw } = useSWR(categoryBySlugKey(slug))
  const cats = asArray(catsRaw)
  const cat = cats[0]
  const { data: postsRaw } = useSWR(cat ? postsKey({ categories: cat.id, per_page: 30 }) : null)
  const posts = asArray(postsRaw)
  const shown = useDedupe('cat-' + slug, priority, posts, 3)
  const loading = !cat || !postsRaw

  return (
    <div>
      {/* Header: rounded red label block, red rule filling the gap, outlined "view all" button */}
      <div className="flex items-center gap-3 mb-1">
        <span className="bg-primary text-white font-extrabold uppercase tracking-wide text-base sm:text-lg rounded-lg px-5 py-2.5 shrink-0">
          {label}
        </span>
        <span className="flex-1 h-[2px] bg-primary" />
        <Link
          to={categoryUrl(slug)}
          className="shrink-0 border border-primary text-primary font-bold text-xs sm:text-sm uppercase tracking-wide rounded-md px-3 py-1.5 hover:bg-primary hover:text-white transition-colors"
        >
          view all
        </Link>
      </div>

      <div>
        {loading
          ? [...Array(3)].map((_, i) => <MiniItemSkeleton key={i} />)
          : shown.map((p) => <MiniItem key={p.id} post={p} />)}
      </div>
    </div>
  )
}

/**
 * Three-column row of mini category blocks (e.g. Education / Motoring / Property).
 * Each column fetches its own category id + latest posts independently, so
 * columns load and render on their own timeline rather than waiting on each other.
 *
 * Usage:
 *   <CategoryTripleBlock columns={[
 *     { slug: 'education', label: 'Education' },
 *     { slug: 'motoring', label: 'Motoring' },
 *     { slug: 'property', label: 'Property' },
 *   ]} />
 */
export default function CategoryTripleBlock({ columns }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-10">
      {columns.map((c, i) => (
        <CategoryColumn key={c.slug} slug={c.slug} label={c.label} priority={c.priority ?? (36 + i)} />
      ))}
    </div>
  )
}
