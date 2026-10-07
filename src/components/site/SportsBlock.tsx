import useSWR from 'swr'
import { articlePath, categoryUrl } from '@/lib/urls'
import { Link } from '@/lib/router'
import { ChevronRight } from 'lucide-react'
import {
  postsKey, categoryBySlugKey,
  getFeaturedImage, getThumbnail, getImageAlt,
  decodeHtml, stripHtml, asArray, FALLBACK_IMAGE,
} from '@/lib/wp'
import { useDedupe } from '@/lib/dedupe'
import sportsBanner from '@/assets/sports-banner.png'

function ListRow({ post }) {
  return (
    <Link to={articlePath(post)} className="group flex gap-3 items-start py-2.5 first:pt-0">
      <div className="w-20 h-16 sm:w-24 sm:h-[4.5rem] shrink-0 overflow-hidden rounded-lg bg-muted">
        <img src={getThumbnail(post) || FALLBACK_IMAGE} alt={getImageAlt(post)} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      </div>
      <div className="min-w-0">
        <h4 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {decodeHtml(post.title?.rendered || '')}
        </h4>
      </div>
    </Link>
  )
}

function ListRowSkeleton() {
  return (
    <div className="flex gap-3 items-start py-2.5">
      <div className="w-20 h-16 sm:w-24 sm:h-[4.5rem] shrink-0 rounded-lg skeleton-shimmer" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3 w-full skeleton-shimmer rounded" />
        <div className="h-3 w-2/3 skeleton-shimmer rounded" />
      </div>
    </div>
  )
}

export default function SportsBlock({ slug = 'sports', name = 'Sports' }) {
  const { data: catsRaw } = useSWR(categoryBySlugKey(slug))
  const cats = asArray(catsRaw)
  const cat = cats[0]
  const { data: postsRaw } = useSWR(cat ? postsKey({ categories: cat.id, per_page: 40 }) : null)
  const posts = asArray(postsRaw)
  const loading = !cat || !postsRaw
  const shown = useDedupe('sports', 35, posts, 6)

  if (!loading && posts.length === 0) return null

  const feature = shown[0]
  const listItems = shown.slice(1, 6)

  return (
    <section>
      {/* Static "The Sun Malaysia Sports News" banner — fixed artwork, no longer pulls a post image or title */}
      <Link
        to={cat ? categoryUrl(cat) : '#'}
        className="group relative block w-full h-48 sm:h-56 lg:h-64 rounded-2xl overflow-hidden bg-neutral-900"
      >
        <img
          src={sportsBanner.src}
          alt="The Sun Malaysia Sports News — Latest Scores, Breaking News, Live Updates"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </Link>

      {/* Overlapping content card */}
      <div className="relative -mt-14 sm:-mt-16 mx-3 sm:mx-6 bg-white rounded-2xl shadow-xl border border-border/60 p-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left — big feature story */}
          <div>
            {loading || !feature ? (
              <div className="space-y-3">
                <div className="aspect-[4/3] rounded-xl skeleton-shimmer" />
                <div className="h-5 w-4/5 skeleton-shimmer rounded" />
                <div className="h-3 w-full skeleton-shimmer rounded" />
                <div className="h-3 w-2/3 skeleton-shimmer rounded" />
              </div>
            ) : (
              <Link to={articlePath(feature)} className="group block">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted mb-3">
                  <img
                    src={getFeaturedImage(feature) || FALLBACK_IMAGE}
                    alt={getImageAlt(feature)}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="font-serif-headline text-xl sm:text-2xl font-bold leading-tight group-hover:text-primary transition-colors line-clamp-3">
                  {decodeHtml(feature.title?.rendered || '')}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {stripHtml(feature.excerpt?.rendered, 160)}
                </p>
              </Link>
            )}
          </div>

          {/* Right — headline list */}
          <div className="divide-y divide-border md:border-l md:border-border md:pl-6">
            {loading
              ? [...Array(5)].map((_, i) => <ListRowSkeleton key={i} />)
              : listItems.map((p) => <ListRow key={p.id} post={p} />)}
          </div>
        </div>

        <div className="flex justify-end mt-4 pt-4 border-t border-border">
          <Link
            to={cat ? categoryUrl(cat) : '#'}
            className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            See full coverage <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
