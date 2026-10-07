import useSWR from 'swr'
import { Link } from '@/lib/router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { HeroCard, FeatureCard, FeatureCardSkeleton } from '@/components/site/NewsCard'
import Sidebar from '@/components/site/Sidebar'
import { Button } from '@/components/ui/button'
import { buildUrl, decodeHtml, stripHtml } from '@/lib/wp'
import { SITE_URL, archiveOffset, archivePerPage, archiveTotalPages } from '@/lib/urls'
import useSeo from '@/lib/useSeo'

function usePostsWithHeaders(url) {
  const { data, isLoading } = useSWR(url, async (u) => {
    const res = await fetch(u)
    if (!res.ok) throw new Error('Failed')
    const json = await res.json()
    return {
      posts: json,
      total: parseInt(res.headers.get('x-wp-total') || '0', 10),
      totalPages: parseInt(res.headers.get('x-wp-totalpages') || '0', 10),
    }
  })
  return { data, isLoading }
}

// Author archive: /author/<slug>/ with /author/<slug>/page/N/ pagination.
// Styled like the category archive. Authors are noindex (same as the live site).
export default function AuthorPage({ slug, page: pageProp }) {
  const page = Math.max(1, parseInt(pageProp || '1', 10))
  const perPage = archivePerPage(page)
  const offset = archiveOffset(page)
  const baseUrl = `/author/${slug}/`

  const { data: authorData, isLoading: authorLoading } = useSWR(buildUrl('/ppma_author', { slug }))
  const author = Array.isArray(authorData) ? authorData[0] : null

  const postsUrl = author
    ? buildUrl('/posts', { ppma_author: author.id, offset, per_page: perPage, _embed: 1 })
    : null
  const { data: pageData, isLoading: postsLoading } = usePostsWithHeaders(postsUrl)
  const posts = pageData?.posts || []
  const totalPages = archiveTotalPages(pageData?.total)
  const isLoading = authorLoading || postsLoading

  useSeo({
    title: author ? `${decodeHtml(author.name)} - Articles` : 'Author',
    description: author ? `Articles by ${decodeHtml(author.name)} on The Sun Malaysia.` : 'Author articles on The Sun Malaysia.',
    url: `${SITE_URL}${baseUrl}${page > 1 ? `page/${page}/` : ''}`,
    robots: 'noindex,follow',
    jsonLd: author
      ? {
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          mainEntity: { '@type': 'Person', name: decodeHtml(author.name), url: `${SITE_URL}${baseUrl}` },
        }
      : null,
  })

  if (!author && authorData !== undefined) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="font-serif-headline text-3xl font-bold mb-2">Author not found</h1>
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
        <span className="text-foreground">{author ? decodeHtml(author.name) : 'Loading...'}</span>
      </nav>

      <header className="border-b-2 border-primary pb-4 mb-8">
        <div className="flex items-baseline gap-3">
          <span className="w-1.5 h-9 bg-primary inline-block" />
          <h1 className="font-serif-headline text-4xl md:text-5xl font-bold">{author ? decodeHtml(author.name) : ' '}</h1>
        </div>
        {author && <p className="mt-2 text-xs text-muted-foreground">{author.count?.toLocaleString()} articles</p>}
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
