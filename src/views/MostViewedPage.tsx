import { Link, useLocation } from '@/lib/router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { HeroCard, FeatureCard, FeatureCardSkeleton } from '@/components/site/NewsCard'
import Sidebar from '@/components/site/Sidebar'
import { Button } from '@/components/ui/button'
import { archiveOffset, archivePerPage, archiveTotalPages, SITE_URL } from '@/lib/urls'
import { DedupeProvider, useDedupe } from '@/lib/dedupe'
import { useFeed } from '@/lib/feed'
import useSeo from '@/lib/useSeo'

const RANGES = [
  { key: '24h', label: '24 Hours' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
]

export default function MostViewedPage(props) {
  return (
    <DedupeProvider>
      <MostViewedPageInner {...props} />
    </DedupeProvider>
  )
}

function MostViewedPageInner({ page: pageProp }) {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const rawRange = params.get('range')
  const range = RANGES.some(r => r.key === rawRange) ? rawRange : '24h'
  const rangeLabel = (RANGES.find(r => r.key === range) || RANGES[0]).label

  const page = Math.max(1, parseInt(pageProp || '1', 10))
  const perPage = archivePerPage(page)
  const offset = archiveOffset(page)

  const { items, total, isLoading } = useFeed(
    `/api/feed?type=most-viewed&range=${range}&limit=${perPage}&offset=${offset}`
  )
  // Stable page count from the true total (independent of per-page size).
  const totalPages = archiveTotalPages(total)
  const shown = useDedupe('most-viewed-main', 1, items, items.length)

  useSeo({
    title: 'Most Viewed News',
    description: 'The most-read stories on The Sun Malaysia over the last 24 hours, 7 days and 30 days.',
    url: `${SITE_URL}/most-viewed/`,
    robots: 'noindex,follow',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Most Viewed News',
      url: `${SITE_URL}/most-viewed/`,
      isPartOf: { '@type': 'WebSite', name: 'The Sun Malaysia', url: SITE_URL },
    },
  })

  const q = range !== '24h' ? `?range=${range}` : ''
  const tabHref = (key) => (key === '24h' ? '/most-viewed/' : `/most-viewed/?range=${key}`)
  const href = (n) => (n <= 1 ? `/most-viewed/${q}` : `/most-viewed/page/${n}/${q}`)
  const hasNext = totalPages ? page < totalPages : items.length >= perPage

  const lead = page === 1 ? shown[0] : null
  const rest = page === 1 ? shown.slice(1) : shown

  return (
    <div className="container mx-auto px-4 py-6">
      <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <Link to="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Most Viewed</span>
      </nav>

      <header className="border-b-2 border-primary pb-4 mb-6">
        <div className="flex items-baseline gap-3">
          <span className="w-1.5 h-9 bg-primary inline-block" />
          <h1 className="font-serif-headline text-4xl md:text-5xl font-bold">Most Viewed</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Most-read stories · {rangeLabel}
        </p>
      </header>

      {/* Range tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {RANGES.map(r => (
          <Link
            key={r.key}
            to={tabHref(r.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
              r.key === range
                ? 'bg-primary text-white border-primary'
                : 'border-border text-foreground hover:border-primary hover:text-primary'
            }`}
          >
            {r.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[...Array(12)].map((_, i) => <FeatureCardSkeleton key={i} />)}
            </div>
          )}
          {!isLoading && items.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No data for this period yet.</div>
          )}
          {lead && <HeroCard post={lead} />}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {rest.map(p => <FeatureCard key={p.id} post={p} />)}
            </div>
          )}

          {items.length > 0 && (
            <div className="flex items-center justify-between pt-6 border-t border-border">
              <Button asChild variant="outline" className={page <= 1 ? 'pointer-events-none opacity-50' : ''}>
                <Link to={href(page - 1)}><ChevronLeft className="h-4 w-4 mr-1" /> Previous</Link>
              </Button>
              <Button asChild variant="outline" className={!hasNext ? 'pointer-events-none opacity-50' : ''}>
                <Link to={href(page + 1)}>Next <ChevronRight className="h-4 w-4 ml-1" /></Link>
              </Button>
            </div>
          )}
        </div>

        <Sidebar hideMostViewed />
      </div>
    </div>
  )
}
