import useSWR from 'swr'
import AdSlot from './AdSlot'
import { articlePath, categoryUrl } from '@/lib/urls'
import { Link } from '@/lib/router'
import {
  postsKey, categoryBySlugKey,
  getThumbnail, getLargeImage, getImageAlt, decodeHtml, stripHtml, timeAgo, asArray, FALLBACK_IMAGE,
} from '@/lib/wp'
import { useDedupe } from '@/lib/dedupe'
import merdekaAdBanner from '@/assets/merdeka-ad-banner.png'
import adsCornerBanner from '@/assets/ads-corner-banner.gif'

const REGIONS = [
  { slug: 'malaysia-news', label: 'Malaysia' },
  { slug: 'asia', label: 'Asia' },
  { slug: 'world-news', label: 'World' },
]

const LIST_COUNT = 4 // items shown below the hero item

function HeroItem({ post }) {
  return (
    <Link to={articlePath(post)} className="block group">
      <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted mb-3">
        <img
          src={getLargeImage(post) || getThumbnail(post) || FALLBACK_IMAGE}
          alt={getImageAlt(post)}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="flex items-start justify-between gap-3 mb-1">
        <h4 className="font-bold text-base leading-snug text-foreground group-hover:text-primary transition-colors">
          {decodeHtml(post.title?.rendered || '')}
        </h4>
        <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap pt-0.5">
          {timeAgo(post.date)}
        </span>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2">
        {stripHtml(post.excerpt?.rendered || '', 140)}
      </p>
    </Link>
  )
}

function HeroItemSkeleton() {
  return (
    <div>
      <div className="aspect-[4/3] rounded-lg skeleton-shimmer mb-3" />
      <div className="h-4 w-4/5 skeleton-shimmer rounded mb-2" />
      <div className="h-3 w-full skeleton-shimmer rounded mb-1.5" />
      <div className="h-3 w-2/3 skeleton-shimmer rounded" />
    </div>
  )
}

function ListItem({ post }) {
  return (
    <Link to={articlePath(post)} className="group flex gap-3">
      <div className="w-20 h-16 sm:w-24 sm:h-[4.5rem] shrink-0 rounded-md overflow-hidden bg-muted">
        <img
          src={getThumbnail(post) || FALLBACK_IMAGE}
          alt={getImageAlt(post)}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="min-w-0 flex-1">
        <h5 className="font-bold text-sm leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {decodeHtml(post.title?.rendered || '')}
        </h5>
        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
          {stripHtml(post.excerpt?.rendered || '', 90)}
        </p>
        <span className="block text-[11px] text-muted-foreground text-right mt-1">
          {timeAgo(post.date)}
        </span>
      </div>
    </Link>
  )
}

function ListItemSkeleton() {
  return (
    <div className="flex gap-3">
      <div className="w-20 h-16 sm:w-24 sm:h-[4.5rem] shrink-0 rounded-md skeleton-shimmer" />
      <div className="min-w-0 flex-1 space-y-1.5 pt-1">
        <div className="h-3 w-full skeleton-shimmer rounded" />
        <div className="h-3 w-2/3 skeleton-shimmer rounded" />
        <div className="h-2.5 w-10 ml-auto skeleton-shimmer rounded" />
      </div>
    </div>
  )
}

function RegionColumn({ region, priority }) {
  const { slug, label } = region
  const { data: catsRaw } = useSWR(categoryBySlugKey(slug))
  const cats = asArray(catsRaw)
  const cat = cats[0]
  const { data: postsRaw } = useSWR(cat ? postsKey({ categories: cat.id, per_page: 30 }) : null)
  const posts = asArray(postsRaw)
  const shown = useDedupe('region-' + slug, priority, posts, 1 + LIST_COUNT)
  const loading = !cat || !postsRaw

  const hero = shown[0]
  const list = shown.slice(1, 1 + LIST_COUNT)

  return (
    <div className="rounded-2xl overflow-hidden border-2 border-primary bg-white flex flex-col">
      <div className="flex items-center justify-between bg-primary px-5 py-3.5 shrink-0">
        <h3 className="text-white font-extrabold text-lg sm:text-xl">{label}</h3>
        <Link
          to={categoryUrl(slug)}
          className="shrink-0 border border-white text-white text-xs font-bold uppercase tracking-wide rounded-md px-3 py-1.5 hover:bg-white hover:text-primary transition-colors"
        >
          view all
        </Link>
      </div>

      <div className="p-4 sm:p-5 flex-1">
        {loading ? <HeroItemSkeleton /> : hero ? <HeroItem post={hero} /> : null}

        <div className="h-px bg-border my-4" />

        <div className="space-y-4">
          {loading
            ? [...Array(LIST_COUNT)].map((_, i) => <ListItemSkeleton key={i} />)
            : list.map((p) => <ListItem key={p.id} post={p} />)}
        </div>
      </div>
    </div>
  )
}

function AdsColumn() {
  return (
    <div className="flex flex-col gap-5 h-full">
      <AdSlot id="merdeka-banner" height={300} className="flex-1">
        <a
          href="https://www.thesun.my"
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block rounded-2xl overflow-hidden border border-border bg-white flex-1"
        >
          <img
            src={merdekaAdBanner.src}
            alt="Selamat Hari Merdeka — The Sun Malaysia"
            className="w-full h-full object-cover"
          />
        </a>
      </AdSlot>
      <AdSlot id="ads-corner">
        <a
          href="https://www.thesun.my/advertise"
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block rounded-2xl overflow-hidden border border-border bg-white"
        >
          <img
            src={adsCornerBanner.src}
            alt="Digital advertisement — Ads Corner"
            className="w-full h-auto object-cover"
          />
        </a>
      </AdSlot>
    </div>
  )
}

export default function RegionNewsBlock() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-4 gap-5 sm:gap-6 items-stretch">
      {REGIONS.map((region, i) => (
        <RegionColumn key={region.slug} region={region} priority={39 + i} />
      ))}
      <AdsColumn />
    </section>
  )
}
