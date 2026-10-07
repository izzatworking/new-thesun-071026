import useSWR from 'swr'
import { Link } from '@/lib/router'
import { ChevronLeft, ChevronRight, Hash } from 'lucide-react'
import { HeroCard, FeatureCard, FeatureCardSkeleton } from '@/components/site/NewsCard'
import Sidebar from '@/components/site/Sidebar'
import { Button } from '@/components/ui/button'
import { buildUrl, tagsKey, asArray, decodeHtml } from '@/lib/wp'
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

// Tag archive: /tag/<slug>/ with /tag/<slug>/page/N/ pagination.
// Uses the same layout as the category and author archives. Tags are noindex
// (matching the live site).
export default function TagPage({ slug, page: pageProp }) {
  const page = Math.max(1, parseInt(pageProp || '1', 10))
  const perPage = archivePerPage(page)
  const offset = archiveOffset(page)
  const baseUrl = `/tag/${slug}/`

  const { data: tagData, isLoading: tagLoading } = useSWR(tagsKey({ slug }))
  const tag = asArray(tagData)[0] || null
  const tagName = tag ? decodeHtml(tag.name) : slug

  const postsUrl = tag
    ? buildUrl('/posts', { tags: tag.id, offset, per_page: perPage, _embed: 1 })
    : null
  const { data: pageData, isLoading: postsLoading } = usePostsWithHeaders(postsUrl)
  const posts = pageData?.posts || []
  const totalPages = archiveTotalPages(pageData?.total)
  const isLoading = tagLoading || postsLoading

  useSeo({
    title: tag ? `#${tagName}` : `#${slug}`,
    description: tag ? `Latest stories tagged #${tagName}.` : `Latest stories tagged #${slug}.`,
    url: `${SITE_URL}${baseUrl}${page > 1 ? `page/${page}/` : ''}`,
    robots: 'noindex,follow',
    jsonLd: tag
      ? {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `#${tagName}`,
          url: `${SITE_URL}${baseUrl}`,
          isPartOf: { '@type': 'WebSite', name: 'The Sun Malaysia', url: SITE_URL },
        }
      : null,
  })

  if (!tag && tagData !== undefined) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="font-serif-headline text-3xl font-bold mb-3">Tag not found</h1>
        <p className="text-muted-foreground mb-6">There's nothing tagged #{slug} right now.</p>
        <Link to="/" className="text-primary font-semibold hover:underline">Back to home</Link>
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
        <span className="text-foreground">{tag ? `#${tagName}` : 'Loading...'}</span>
      </nav>

      <header className="border-b-2 border-primary pb-4 mb-8">
        <div className="flex items-baseline gap-3">
          <Hash className="h-7 w-7 sm:h-8 sm:w-8 text-primary shrink-0 self-center" strokeWidth={3} />
          <h1 className="font-serif-headline text-4xl md:text-5xl font-bold">{tag ? tagName : ' '}</h1>
        </div>
        {tag && <p className="mt-2 text-xs text-muted-foreground">{tag.count?.toLocaleString()} articles</p>}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[...Array(12)].map((_, i) => <FeatureCardSkeleton key={i} />)}
            </div>
          )}
          {!isLoading && posts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No stories found for this tag.</div>
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
