import useSWR from 'swr'
import AdSlot from './AdSlot'
import { categoryUrl } from '@/lib/urls'
import { Link } from '@/lib/router'
import { TrendingUp, Newspaper, Tag, BarChart2, ChevronRight } from 'lucide-react'
import { ListItem, HorizontalCard, HorizontalCardSkeleton } from './NewsCard'
import NewsletterForm from './NewsletterForm'
import { categoriesKey, decodeHtml, asArray } from '@/lib/wp'
import { useDedupe } from '@/lib/dedupe'

export default function Sidebar({
  excludeId,
  hideLatest,
  hideMostViewed,
}: {
  excludeId?: number | string
  hideLatest?: boolean
  hideMostViewed?: boolean
} = {}) {
  // Latest News — newest first (cached edge feed)
  const { data: latestRaw } = useSWR('/api/feed?type=latest&limit=24')

  // Most Viewed — real 24h readership (GA4), cached edge feed
  const { data: mostViewedRaw } = useSWR('/api/feed?type=most-viewed&limit=24')

  // Trending — realtime readership (GA4), cached edge feed
  const { data: trendingRaw } = useSWR('/api/feed?type=trending-now&limit=24')

  const { data: catsRaw } = useSWR(categoriesKey({ per_page: 15, orderby: 'count', order: 'desc' }))

  const drop = (p) => p.id !== excludeId
  const latest = asArray(latestRaw).filter(drop)
  const mostViewed = asArray(mostViewedRaw).filter(drop)
  const trending = asArray(trendingRaw).filter(drop)
  const cats = asArray(catsRaw)

  const latestFiltered = useDedupe('sb-latest', 23, latest, 5)
  const mostViewedFiltered = useDedupe('sb-most-viewed', 21, mostViewed, 5)
  const trendingFiltered = useDedupe('sb-trending', 22, trending, 5)

  return (
    <aside className="space-y-8">

      {/* Latest News */}
      {!hideLatest && (
      <section>
        <div className="flex items-center justify-between border-b-2 border-primary pb-2 mb-3">
          <h3 className="flex items-center gap-2 text-base font-bold uppercase tracking-wider">
            <Newspaper className="h-4 w-4 text-primary" /> Latest News
          </h3>
          <Link to="/latest" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-0.5">
            View All <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="space-y-3">
          {latestFiltered.length === 0
            ? [...Array(4)].map((_, i) => <HorizontalCardSkeleton key={i} />)
            : latestFiltered.map(p => <HorizontalCard key={p.id} post={p} />)}
        </div>
      </section>
      )}

      {/* Most Viewed */}
      {!hideMostViewed && (
      <section>
        <div className="flex items-center justify-between border-b-2 border-primary pb-2 mb-3">
          <h3 className="flex items-center gap-2 text-base font-bold uppercase tracking-wider">
            <BarChart2 className="h-4 w-4 text-primary" /> Most Viewed
          </h3>
          <Link to="/most-viewed" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-0.5">
            View All <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {mostViewedFiltered.length === 0
            ? [...Array(5)].map((_, i) => (
                <div key={i} className="py-3 space-y-1.5">
                  <div className="h-3 w-full skeleton-shimmer rounded" />
                  <div className="h-3 w-2/3 skeleton-shimmer rounded" />
                </div>
              ))
            : mostViewedFiltered.map((p, i) => <ListItem key={p.id} post={p} index={i} />)}
        </div>
      </section>
      )}

      {/* Trending Stories */}
      <section>
        <div className="flex items-center justify-between border-b-2 border-primary pb-2 mb-3">
          <h3 className="flex items-center gap-2 text-base font-bold uppercase tracking-wider">
            <TrendingUp className="h-4 w-4 text-primary" /> Trending Stories
          </h3>
          <Link to="/most-viewed" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-0.5">
            View All <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {trendingFiltered.length === 0
            ? [...Array(5)].map((_, i) => (
                <div key={i} className="py-3 space-y-1.5">
                  <div className="h-3 w-full skeleton-shimmer rounded" />
                  <div className="h-3 w-2/3 skeleton-shimmer rounded" />
                </div>
              ))
            : trendingFiltered.map((p, i) => <ListItem key={p.id} post={p} index={i} />)}
        </div>
      </section>

      {/* Categories */}
      <section>
        <h3 className="flex items-center gap-2 text-base font-bold uppercase tracking-wider border-b-2 border-primary pb-2 mb-3">
          <Tag className="h-4 w-4 text-primary" /> Categories
        </h3>
        <div className="flex flex-wrap gap-2">
          {cats.slice(0, 15).map(c => (
            <Link key={c.id} to={categoryUrl(c)} className="text-xs font-medium px-3 py-1.5 rounded-full border border-border hover:bg-primary hover:text-white hover:border-primary transition-colors">
              {decodeHtml(c.name)} <span className="text-muted-foreground">({c.count})</span>
            </Link>
          ))}
        </div>
      </section>

      <NewsletterForm />

      {/* Sidebar Ads Banner */}
      <AdSlot id="sidebar-bottom" height={250}>
        <div
          className="w-full min-h-[250px] bg-[#d0d0d0] flex items-center justify-center rounded text-sm font-bold text-[#777] uppercase tracking-wide select-none"
          aria-label="Advertisement"
        >
          Ads Banner
        </div>
      </AdSlot>

    </aside>
  )
}