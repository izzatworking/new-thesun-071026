import { Link } from '@/lib/router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { HeroCard, FeatureCard, FeatureCardSkeleton } from '@/components/site/NewsCard'
import Sidebar from '@/components/site/Sidebar'
import { Button } from '@/components/ui/button'
import { archiveOffset, archivePerPage, archiveTotalPages, SITE_URL } from '@/lib/urls'
import { DedupeProvider, useDedupe } from '@/lib/dedupe'
import { useFeed } from '@/lib/feed'
import useSeo from '@/lib/useSeo'

export default function LatestPage(props) {
  return (
    <DedupeProvider>
      <LatestPageInner {...props} />
    </DedupeProvider>
  )
}

function LatestPageInner({ page: pageProp }) {
  const page = Math.max(1, parseInt(pageProp || '1', 10))
  const perPage = archivePerPage(page)
  const offset = archiveOffset(page)

  const { items, total, isLoading } = useFeed(
    `/api/feed?type=latest&limit=${perPage}&offset=${offset}`
  )
  // Stable page count from the true total (independent of per-page size).
  const totalPages = archiveTotalPages(total)
  const shown = useDedupe('latest-main', 1, items, items.length)

  useSeo({
    title: page > 1 ? `Latest News - Page ${page}` : 'Latest News',
    description: 'The latest news from The Sun Malaysia, updated continuously.',
    url: `${SITE_URL}/latest/${page > 1 ? `page/${page}/` : ''}`,
    robots: page > 1 ? 'noindex,follow' : 'index,follow',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Latest News',
      url: `${SITE_URL}/latest/`,
      isPartOf: { '@type': 'WebSite', name: 'The Sun Malaysia', url: SITE_URL },
    },
  })

  const base = '/latest'
  const prevHref = page <= 2 ? `${base}/` : `${base}/page/${page - 1}/`
  const nextHref = `${base}/page/${page + 1}/`
  const hasNext = totalPages ? page < totalPages : items.length >= perPage

  const lead = page === 1 ? shown[0] : null
  const rest = page === 1 ? shown.slice(1) : shown

  return (
    <div className="container mx-auto px-4 py-6">
      <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <Link to="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Latest News</span>
      </nav>

      <header className="border-b-2 border-primary pb-4 mb-8">
        <div className="flex items-baseline gap-3">
          <span className="w-1.5 h-9 bg-primary inline-block" />
          <h1 className="font-serif-headline text-4xl md:text-5xl font-bold">Latest News</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Newest first
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[...Array(12)].map((_, i) => <FeatureCardSkeleton key={i} />)}
            </div>
          )}
          {!isLoading && items.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No articles found.</div>
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
                <Link to={prevHref}><ChevronLeft className="h-4 w-4 mr-1" /> Previous</Link>
              </Button>
              <Button asChild variant="outline" className={!hasNext ? 'pointer-events-none opacity-50' : ''}>
                <Link to={nextHref}>Next <ChevronRight className="h-4 w-4 ml-1" /></Link>
              </Button>
            </div>
          )}
        </div>

        <Sidebar hideLatest />
      </div>
    </div>
  )
}
