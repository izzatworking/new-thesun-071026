import useSWR from 'swr'
import { Link } from '@/lib/router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { HeroCard, FeatureCard, FeatureCardSkeleton } from '@/components/site/NewsCard'
import Sidebar from '@/components/site/Sidebar'
import { Button } from '@/components/ui/button'
import { categoryBySlugKey, buildUrl, decodeHtml, stripHtml } from '@/lib/wp'
import { categoryUrl, SITE_URL, wpPath, archiveOffset, archivePerPage, archiveTotalPages } from '@/lib/urls'
import useSeo from '@/lib/useSeo'

function usePostsWithHeaders(url) {
  const { data, error, isLoading } = useSWR(url, async (u) => {
    const res = await fetch(u)
    if (!res.ok) throw new Error('Failed')
    const json = await res.json()
    return {
      posts: json,
      total: parseInt(res.headers.get('x-wp-total') || '0', 10),
      totalPages: parseInt(res.headers.get('x-wp-totalpages') || '0', 10),
    }
  })
  return { data, error, isLoading }
}

export default function CategoryPage({ slug, page: pageProp }) {
  const page = Math.max(1, parseInt(pageProp || '1', 10))
  const perPage = archivePerPage(page)
  const offset = archiveOffset(page)
  const baseUrl = categoryUrl(slug) // e.g. /news/malaysia-news/

  const { data: cats } = useSWR(categoryBySlugKey(slug))
  const cat = cats && cats[0]

  const postsUrl = cat ? buildUrl('/posts', { categories: cat.id, offset, per_page: perPage, _embed: 1 }) : null
  const { data: pageData, isLoading } = usePostsWithHeaders(postsUrl)
  const posts = pageData?.posts || []
  const totalPages = archiveTotalPages(pageData?.total)

  const canonicalPath = (cat && wpPath(cat.link)) || baseUrl

  useSeo({
    title: cat ? `${decodeHtml(cat.name)} News` : 'Category',
    description: cat ? stripHtml(cat.description || `Latest ${decodeHtml(cat.name)} news on The Sun Malaysia.`, 200) : '',
    url: `${SITE_URL}${canonicalPath}${page > 1 ? `page/${page}/` : ''}`,
    robots: page > 1 ? 'noindex,follow' : 'index,follow',
    lang: canonicalPath.startsWith('/berita') ? 'ms' : 'en-MY',
    locale: canonicalPath.startsWith('/berita') ? 'ms_MY' : 'en_MY',
    jsonLd: cat
      ? {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `${decodeHtml(cat.name)} News`,
          url: `${SITE_URL}${canonicalPath}`,
          isPartOf: { '@type': 'WebSite', name: 'The Sun Malaysia', url: SITE_URL },
        }
      : null,
  })

  if (!cat && cats !== undefined) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="font-serif-headline text-3xl font-bold mb-2">Category not found</h1>
        <Link to="/" className="text-primary font-semibold hover:underline">← Back to home</Link>
      </div>
    )
  }

  const lead = page === 1 ? posts[0] : null
  const rest = page === 1 ? posts.slice(1) : posts

  const prevHref = page <= 2 ? baseUrl : `${baseUrl}page/${page - 1}/`
  const nextHref = `${baseUrl}page/${page + 1}/`

  return (
    <div className="container mx-auto px-4 py-6">
      <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <Link to="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{cat ? decodeHtml(cat.name) : 'Loading...'}</span>
      </nav>

      <header className="border-b-2 border-primary pb-4 mb-8">
        <div className="flex items-baseline gap-3">
          <span className="w-1.5 h-9 bg-primary inline-block" />
          <h1 className="font-serif-headline text-4xl md:text-5xl font-bold">{cat ? decodeHtml(cat.name) : ' '}</h1>
        </div>
        {cat?.description && <p className="mt-3 text-muted-foreground max-w-3xl">{stripHtml(cat.description, 240)}</p>}
        {cat && <p className="text-xs text-muted-foreground mt-2">{cat.count?.toLocaleString()} articles</p>}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[...Array(12)].map((_, i) => <FeatureCardSkeleton key={i} />)}
            </div>
          )}
          {!isLoading && posts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No articles found.</div>
          )}
          {lead && <HeroCard post={lead} />}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {rest.map(p => <FeatureCard key={p.id} post={p} />)}
            </div>
          )}

          {posts.length > 0 && (
            <div className="flex items-center justify-between pt-6 border-t border-border">
              <Button asChild variant="outline" className={page <= 1 ? 'pointer-events-none opacity-50' : ''}>
                <Link to={prevHref}><ChevronLeft className="h-4 w-4 mr-1" /> Previous</Link>
              </Button>
              <Button asChild variant="outline" className={(totalPages && page >= totalPages) ? 'pointer-events-none opacity-50' : ''}>
                <Link to={nextHref}>Next <ChevronRight className="h-4 w-4 ml-1" /></Link>
              </Button>
            </div>
          )}
        </div>

        <Sidebar />
      </div>
    </div>
  )
}
