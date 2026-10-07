import useSWR from 'swr'
import { Link, useSearchParams } from '@/lib/router'
import { Search as SearchIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { FeatureCard, FeatureCardSkeleton } from '@/components/site/NewsCard'
import Sidebar from '@/components/site/Sidebar'
import { Button } from '@/components/ui/button'
import { buildUrl, decodeHtml } from '@/lib/wp'
import useSeo from '@/lib/useSeo'
import { SITE_URL } from '@/lib/urls'

const PER_PAGE = 13

function AuthorRow({ author }) {
  const initial = (author.name || '?').trim().charAt(0).toUpperCase()
  return (
    <Link
      to={`/author/${author.slug}/`}
      className="flex items-center gap-4 py-4 border-b border-border last:border-0 group"
    >
      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary grid place-items-center font-extrabold text-lg shrink-0">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-base group-hover:text-primary transition-colors truncate">
          {decodeHtml(author.name || '')}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {typeof author.count === 'number' ? `${author.count.toLocaleString()} articles` : 'Author'}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </Link>
  )
}

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const q = (searchParams.get('s') || searchParams.get('q') || '').trim()
  const mode = searchParams.get('type') === 'author' ? 'authors' : 'articles'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))

  // Articles: indexed edge search. Authors: PublishPress author taxonomy.
  const url = !q
    ? null
    : mode === 'authors'
      ? `/api/authors?q=${encodeURIComponent(q)}&page=${page}`
      : `/api/search?q=${encodeURIComponent(q)}&page=${page}`

  const { data, isLoading } = useSWR(url, async (u) => {
    const res = await fetch(u)
    if (res.ok) {
      const items = await res.json()
      return {
        items: Array.isArray(items) ? items : [],
        total: parseInt(res.headers.get('X-Total') || '0', 10),
        totalPages: parseInt(res.headers.get('X-Total-Pages') || '0', 10),
      }
    }
    // Articles fallback: core WP search (relevance), minimal fields.
    if (mode === 'articles') {
      const fb = buildUrl('/posts', { search: q, orderby: 'relevance', per_page: PER_PAGE, page, _fields: 'id,title,slug,link,date,excerpt' })
      const r2 = await fetch(fb)
      if (!r2.ok) throw new Error('Failed')
      const items = await r2.json()
      return {
        items: Array.isArray(items) ? items : [],
        total: parseInt(r2.headers.get('x-wp-total') || '0', 10),
        totalPages: parseInt(r2.headers.get('x-wp-totalpages') || '0', 10),
      }
    }
    throw new Error('Failed')
  })

  const items = data?.items || []
  const totalPages = data?.totalPages || 0

  const tabHref = (m) => {
    const base = `/search?s=${encodeURIComponent(q)}`
    return m === 'authors' ? `${base}&type=author` : base
  }
  const pageHref = (n) => {
    const suffix = mode === 'authors' ? '&type=author' : ''
    return `/search?s=${encodeURIComponent(q)}${suffix}&page=${n}`
  }

  useSeo({
    title: q ? (mode === 'authors' ? `Author search: ${q}` : `Search: ${q}`) : 'Search',
    description: q ? `Search results for "${q}" on The Sun Malaysia.` : 'Search the latest news on The Sun Malaysia.',
    url: `${SITE_URL}/?s=${encodeURIComponent(q)}${mode === 'authors' ? '&type=author' : ''}`,
    robots: 'noindex,follow',
  })

  return (
    <div className="container mx-auto px-4 py-6">
      <header className="border-b-2 border-primary pb-4 mb-6">
        <div className="flex items-center gap-3">
          <SearchIcon className="h-7 w-7 text-primary" />
          <h1 className="font-serif-headline text-3xl md:text-4xl font-bold">
            {q
              ? <>Results for <span className="text-primary">"{q}"</span></>
              : 'Search'}
          </h1>
        </div>
        {q && <p className="mt-2 text-sm text-muted-foreground">{(data?.total || 0).toLocaleString()} {mode === 'authors' ? 'authors' : 'articles'} found</p>}
      </header>

      {/* Articles | Authors toggle */}
      <div className="flex items-center gap-1.5 mb-8">
        {[['articles', 'Articles'], ['authors', 'Authors']].map(([key, label]) => (
          <Link
            key={key}
            to={tabHref(key)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
              mode === key
                ? 'bg-primary text-white border-primary'
                : 'border-border text-foreground hover:border-primary hover:text-primary'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          {!q && (
            <div className="text-center py-16 text-muted-foreground">
              <SearchIcon className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>Use the search bar above to look up news, topics, or authors.</p>
            </div>
          )}

          {q && isLoading && (
            mode === 'authors'
              ? <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="flex items-center gap-4 py-4"><div className="w-12 h-12 rounded-full skeleton-shimmer" /><div className="flex-1 space-y-2"><div className="h-4 w-1/3 skeleton-shimmer rounded" /><div className="h-3 w-1/4 skeleton-shimmer rounded" /></div></div>)}</div>
              : <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">{[...Array(12)].map((_, i) => <FeatureCardSkeleton key={i} />)}</div>
          )}

          {q && !isLoading && items.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              {mode === 'authors' ? 'No authors match your search.' : 'No articles match your search. Try different keywords.'}
            </div>
          )}

          {!isLoading && items.length > 0 && mode === 'authors' && (
            <div className="border-t border-border">
              {items.map((a) => <AuthorRow key={a.id || a.slug} author={a} />)}
            </div>
          )}

          {!isLoading && items.length > 0 && mode === 'articles' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {items.map((p) => <FeatureCard key={p.id} post={p} />)}
            </div>
          )}

          {q && items.length > 0 && (
            <div className="flex items-center justify-between pt-8 mt-6 border-t border-border">
              <Button asChild variant="outline" className={page <= 1 ? 'pointer-events-none opacity-50' : ''}>
                <Link to={pageHref(page - 1)}><ChevronLeft className="h-4 w-4 mr-1" /> Previous</Link>
              </Button>
              <Button asChild variant="outline" className={(totalPages && page >= totalPages) ? 'pointer-events-none opacity-50' : ''}>
                <Link to={pageHref(page + 1)}>Next <ChevronRight className="h-4 w-4 ml-1" /></Link>
              </Button>
            </div>
          )}
        </div>

        <Sidebar />
      </div>
    </div>
  )
}
