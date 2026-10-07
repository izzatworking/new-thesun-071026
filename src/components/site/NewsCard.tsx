import { Link } from '@/lib/router'
import { articlePath } from '@/lib/urls'
import { getFeaturedImage, getLargeImage, getThumbnail, getImageAlt, getPrimaryCategory, decodeHtml, stripHtml, timeAgo, FALLBACK_IMAGE } from '@/lib/wp'

export function HeroCard({ post }) {
  if (!post) return null
  const img = getLargeImage(post) || FALLBACK_IMAGE
  const cat = getPrimaryCategory(post)
  return (
    <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 border-2 border-border overflow-hidden">
      {/* Image column */}
      <Link
        to={articlePath(post)}
        className="group relative block overflow-hidden bg-black w-full md:w-[58%] shrink-0 aspect-[16/10] md:aspect-auto"
      >
        <img
          src={img}
          alt={getImageAlt(post)}
          loading="eager"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </Link>

      {/* Text column — lives inside the same card as the image, no gap/border between them */}
      <div className="flex-1 min-w-0 p-5 sm:p-6 flex flex-col justify-center">
        {cat && (
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2">
            <span className="text-primary">{cat.name}</span>
            <span className="text-muted-foreground font-medium normal-case tracking-normal">{timeAgo(post.date)}</span>
          </div>
        )}
        <Link to={articlePath(post)} className="group block">
          <h2 className="font-serif-headline text-2xl sm:text-3xl font-bold leading-tight group-hover:text-primary transition-colors line-clamp-4">
            {decodeHtml(post.title?.rendered || '')}
          </h2>
        </Link>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-6">
          {stripHtml(post.excerpt?.rendered, 260)}
        </p>
        <Link to={articlePath(post)} className="inline-block mt-3 text-sm font-semibold text-primary hover:underline">
          read more...
        </Link>
      </div>
    </div>
  )
}

export function FeatureCard({ post, large = false }) {
  if (!post) return null
  const img = (large ? getLargeImage(post) : getFeaturedImage(post)) || FALLBACK_IMAGE
  const cat = getPrimaryCategory(post)
  return (
    <Link
      to={articlePath(post)}
      className="group flex flex-col h-full bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 border border-border/60 overflow-hidden"
    >
      <div className={`overflow-hidden bg-muted ${large ? 'h-40 sm:h-48 lg:h-56' : 'aspect-[16/10]'}`}>
        <img src={img} alt={getImageAlt(post)} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      </div>
      <div className="flex-1 flex flex-col p-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
          {cat && <span className="text-primary">{cat.name}</span>}
          <span className="text-muted-foreground font-medium normal-case tracking-normal">{timeAgo(post.date)}</span>
        </div>
        <h3 className={`font-serif-headline font-bold leading-tight mt-1.5 group-hover:text-primary transition-colors line-clamp-3 ${large ? 'text-xl sm:text-2xl' : 'text-lg'}`}>
          {decodeHtml(post.title?.rendered || '')}
        </h3>
        {large && (
          <>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {stripHtml(post.excerpt?.rendered, 160)}
            </p>
            <span className="inline-block mt-2 text-sm font-semibold text-primary group-hover:underline">
              read more...
            </span>
          </>
        )}
      </div>
    </Link>
  )
}

export function HorizontalCard({ post }) {
  if (!post) return null
  const img = getThumbnail(post) || FALLBACK_IMAGE
  const cat = getPrimaryCategory(post)
  return (
    <Link to={articlePath(post)} className="group flex gap-3 items-start">
      <div className="w-28 h-20 sm:w-32 sm:h-24 shrink-0 overflow-hidden rounded bg-muted">
        <img src={img} alt={getImageAlt(post)} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
      </div>
      <div className="flex-1 min-w-0">
        {cat && <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{cat.name}</span>}
        <h4 className="font-semibold text-sm sm:text-[15px] leading-snug line-clamp-3 group-hover:text-primary transition-colors">
          {decodeHtml(post.title?.rendered || '')}
        </h4>
        <div className="mt-1 text-xs text-muted-foreground">{timeAgo(post.date)}</div>
      </div>
    </Link>
  )
}

export function ListItem({ post, index }) {
  if (!post) return null
  return (
    <Link to={articlePath(post)} className="group flex gap-3 items-start py-3 border-b border-border last:border-0">
      {typeof index === 'number' && (
        <span className="font-serif-headline text-3xl font-extrabold text-primary/40 leading-none w-8 shrink-0">{index + 1}</span>
      )}
      <div className="flex-1">
        <h4 className="font-semibold text-sm leading-snug line-clamp-3 group-hover:text-primary transition-colors">
          {decodeHtml(post.title?.rendered || '')}
        </h4>
        <div className="mt-1 text-xs text-muted-foreground">{timeAgo(post.date)}</div>
      </div>
    </Link>
  )
}


export function TimelineCard({ post, isLast = false }) {
  if (!post) return null
  const cat = getPrimaryCategory(post)
  return (
    <Link to={articlePath(post)} className="group flex gap-0 items-start">
      {/* Time column */}
      <div className="w-16 shrink-0 text-right pr-3 pt-1">
        <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(post.date)}</span>
      </div>
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center shrink-0">
        <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-white mt-1 z-10" />
        {/* No connector line after the last item — there's nothing below it to link to */}
        {!isLast && (
          <div className="w-px flex-1 bg-muted-foreground/20 mt-1" style={{ minHeight: '60px' }} />
        )}
      </div>
      {/* Content */}
      <div className="flex-1 pl-3 pb-5">
        {cat && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-1">
            {cat.name}
          </span>
        )}
        <h4 className="font-semibold text-sm sm:text-[15px] leading-snug line-clamp-3 group-hover:text-primary transition-colors">
          {decodeHtml(post.title?.rendered || '')}
        </h4>
      </div>
    </Link>
  )
}

export function TimelineCardSkeleton() {
  return (
    <div className="flex gap-0 items-start">
      <div className="w-16 shrink-0 pr-3 pt-1">
        <div className="h-3 w-10 skeleton-shimmer rounded ml-auto" />
      </div>
      <div className="flex flex-col items-center shrink-0">
        <div className="w-3 h-3 rounded-full skeleton-shimmer mt-1" />
        <div className="w-px flex-1 bg-muted mt-1" style={{ minHeight: '60px' }} />
      </div>
      <div className="flex-1 pl-3 pb-5 space-y-2">
        <div className="h-2.5 w-16 skeleton-shimmer rounded" />
        <div className="h-4 w-full skeleton-shimmer rounded" />
        <div className="h-4 w-3/4 skeleton-shimmer rounded" />
      </div>
    </div>
  )
}

export function FeatureCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-border/60 overflow-hidden">
      <div className="aspect-[16/10] skeleton-shimmer" />
      <div className="p-4 space-y-2">
        <div className="h-3 w-20 skeleton-shimmer rounded" />
        <div className="h-5 w-3/4 skeleton-shimmer rounded" />
        <div className="h-3 w-1/2 skeleton-shimmer rounded" />
      </div>
    </div>
  )
}

export function HorizontalCardSkeleton() {
  return (
    <div className="flex gap-3">
      <div className="w-28 h-20 sm:w-32 sm:h-24 shrink-0 rounded skeleton-shimmer" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-16 skeleton-shimmer rounded" />
        <div className="h-4 w-full skeleton-shimmer rounded" />
        <div className="h-4 w-2/3 skeleton-shimmer rounded" />
      </div>
    </div>
  )
}
