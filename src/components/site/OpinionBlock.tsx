import useSWR from 'swr'
import { articlePath, categoryUrl } from '@/lib/urls'
import { Link } from '@/lib/router'
import { ChevronRight, Quote } from 'lucide-react'
import {
  getThumbnail, getImageAlt, decodeHtml, stripHtml,
  postsKey, categoryBySlugKey, asArray, FALLBACK_IMAGE,
} from '@/lib/wp'
import { useDedupe } from '@/lib/dedupe'

const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000 // refresh once a day
const OPINION_CATEGORY_SLUG = 'opinion'
const ITEM_COUNT = 20
const SCROLL_DURATION_S = 80 // increase = slower, decrease = faster

function OpinionItem({ post }) {
  if (!post) return null
  const img = getThumbnail(post) || FALLBACK_IMAGE
  return (
    <Link
      to={articlePath(post)}
      className="group flex items-center gap-4 py-5 px-4 border-b border-border last:border-0 hover:bg-muted/60 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <h4 className="font-serif-headline font-bold text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {decodeHtml(post.title?.rendered || '')}
        </h4>
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {stripHtml(post.excerpt?.rendered, 90)}
        </p>
      </div>
      <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 overflow-hidden rounded-full bg-muted">
        <img
          src={img}
          alt={getImageAlt(post)}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>
    </Link>
  )
}

function OpinionItemSkeleton() {
  return (
    <div className="flex items-center gap-4 py-5 px-4 border-b border-border last:border-0">
      <div className="flex-1 space-y-2">
        <div className="h-4 w-full skeleton-shimmer rounded" />
        <div className="h-3 w-2/3 skeleton-shimmer rounded" />
      </div>
      <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-full skeleton-shimmer" />
    </div>
  )
}

export default function OpinionBlock() {
  const { data: cats } = useSWR(categoryBySlugKey(OPINION_CATEGORY_SLUG), {
    refreshInterval: REFRESH_INTERVAL_MS,
  })
  const cat = cats?.[0]
  const { data: postsRaw } = useSWR(
    cat ? postsKey({ categories: cat.id, per_page: 40, _embed: 1 }) : null,
    { refreshInterval: REFRESH_INTERVAL_MS }
  )
  const loading = !postsRaw || !Array.isArray(postsRaw)
  const posts = useDedupe('opinion', 33, asArray(postsRaw), ITEM_COUNT)
  // Duplicate the list so the vertical scroll loops seamlessly.
  const loopPosts = posts.length > 0 ? [...posts, ...posts] : []
  const canScroll = posts.length > 3

  return (
    <section className="border-2 border-primary rounded-md overflow-hidden">
      <div className="flex items-center justify-between bg-white px-4 py-3 border-b-2 border-primary">
        <h2 className="font-serif-headline font-bold flex items-center gap-2 text-lg sm:text-xl text-foreground">
          <Quote className="h-5 w-5 text-primary shrink-0" />
          Opinion
        </h2>
        <Link
          to={cat ? categoryUrl(cat) : categoryUrl(OPINION_CATEGORY_SLUG)}
          className="text-xs sm:text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
        >
          View all <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="hover-vertical-ticker h-[560px] overflow-hidden relative">
        {canScroll && (
          <style>{`
            .opinion-ticker-track {
              animation-duration: ${SCROLL_DURATION_S}s !important;
            }
          `}</style>
        )}
        {loading && (
          <div>
            {[...Array(4)].map((_, i) => <OpinionItemSkeleton key={i} />)}
          </div>
        )}
        {!loading && posts.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground px-4">No opinion pieces yet.</div>
        )}
        {!loading && posts.length > 0 && (
          <div className={canScroll ? 'vertical-ticker-track opinion-ticker-track' : ''}>
            {(canScroll ? loopPosts : posts).map((p, i) => (
              <OpinionItem key={`${p.id}-${i}`} post={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
