import useSWR from 'swr'
import { Link } from '@/lib/router'
import StaticPage from '@/components/site/StaticPage'
import useSeo from '@/lib/useSeo'
import { buildUrl, decodeHtml, getFeaturedImage, stripHtml } from '@/lib/wp'
import { wpPath, SITE_URL } from '@/lib/urls'

// Renders an arbitrary WordPress "page" by slug, matching the live site's
// /<slug>/ URLs (e.g. /ipaper/). Used by the router for single-segment paths
// that are neither a category nor one of the known app pages.
export default function WpPage({ slug }) {
  const { data, isLoading } = useSWR(buildUrl('/pages', { slug, _embed: 1 }))
  const page = Array.isArray(data) ? data[0] : null

  const title = decodeHtml(page?.title?.rendered || '')
  const description = stripHtml(page?.excerpt?.rendered, 200)
  const image = page ? getFeaturedImage(page, 'full') : null
  const canonicalPath = page ? wpPath(page.link) : `/${slug}/`

  useSeo({
    title: title || 'Page',
    description,
    image,
    url: `${SITE_URL}${canonicalPath}`,
    type: 'article',
    robots: 'index,follow',
  })

  if (isLoading) {
    return <StaticPage title="Loading…"><div className="h-40 skeleton-shimmer rounded" /></StaticPage>
  }

  if (!page) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="font-serif-headline text-3xl font-bold mb-2">Page not found</h1>
        <Link to="/" className="text-primary font-semibold hover:underline">← Back to home</Link>
      </div>
    )
  }

  return (
    <StaticPage title={title}>
      <div className="article-content" dangerouslySetInnerHTML={{ __html: page.content?.rendered || '' }} />
    </StaticPage>
  )
}
