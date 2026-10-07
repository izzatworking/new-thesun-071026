import useSWR from 'swr'
import { categoryUrl } from '@/lib/urls'
import { Link } from '@/lib/router'
import { ChevronRight } from 'lucide-react'
import { FeatureCard, HorizontalCard, FeatureCardSkeleton, HorizontalCardSkeleton } from './NewsCard'
import { postsKey, categoryBySlugKey, decodeHtml, asArray } from '@/lib/wp'
import { useDedupe } from '@/lib/dedupe'

export default function CategoryBlock({ slug, name }: { slug: string; name?: string }) {
  const { data: catsRaw } = useSWR(categoryBySlugKey(slug))
  const cats = asArray(catsRaw)
  const cat = cats[0]
  const { data: postsRaw } = useSWR(
    cat ? postsKey({ categories: cat.id, per_page: 40 }) : null
  )

  const loading = !postsRaw || !Array.isArray(postsRaw)
  const posts = asArray(postsRaw)
  const shown = useDedupe('cat-' + slug, 32, posts, 5)

  if (!cat) return null
  const displayName = decodeHtml(name || cat.name)

  return (
    <section className="py-6">
      <div className="flex items-center justify-between border-b-2 border-primary pb-2 mb-5">
        <h2 className="font-serif-headline text-2xl font-bold flex items-center gap-2">
          <span className="w-1 h-7 bg-primary inline-block" />
          {displayName}
        </h2>
        <Link to={categoryUrl(cat)} className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1">
          View all <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FeatureCardSkeleton />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => <HorizontalCardSkeleton key={i} />)}
          </div>
        </div>
      )}
      {!loading && shown.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FeatureCard post={shown[0]} large />
          <div className="space-y-4">
            {shown.slice(1).map(p => <HorizontalCard key={p.id} post={p} />)}
          </div>
        </div>
      )}
    </section>
  )
}
