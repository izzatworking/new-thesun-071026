import useSWR from 'swr'
import { categoryUrl } from '@/lib/urls'
import { Link } from '@/lib/router'
import {
  Flag, Newspaper, Globe, MapPin, Footprints, Briefcase, Building2, Users,
  Heart, Flame, MessageCircle, CircleDot, Shield, Car, GraduationCap,
  Clapperboard, Smartphone, Home, Plane, Tag,
} from 'lucide-react'
import { categoriesKey, decodeHtml, asArray } from '@/lib/wp'

// slug -> icon, matched first; falls back to a keyword scan, then a generic tag icon
const ICON_BY_SLUG = {
  'malaysia-news': Flag,
  malaysia: Flag,
  news: Newspaper,
  world: Globe,
  tempatan: MapPin,
  sports: Footprints,
  business: Briefcase,
  berita: Newspaper,
  'corporate-news': Building2,
  'people-issues': Users,
  lifestyle: Heart,
  'going-viral': Flame,
  opinion: MessageCircle,
  football: CircleDot,
  crime: Shield,
  local: MapPin,
  motoring: Car,
  education: GraduationCap,
  entertainment: Clapperboard,
  'technology-social-media': Smartphone,
  technology: Smartphone,
  property: Home,
  travel: Plane,
}

const KEYWORD_ICONS: [RegExp, any][] = [
  [/malaysia|flag/i, Flag],
  [/world|global/i, Globe],
  [/sport|football|soccer/i, Footprints],
  [/business|corporate|econom/i, Briefcase],
  [/people|issue|community/i, Users],
  [/lifestyle|health|family/i, Heart],
  [/viral|trend/i, Flame],
  [/opinion|voice|column/i, MessageCircle],
  [/crime|court|law/i, Shield],
  [/motor|auto|car/i, Car],
  [/educat|school|campus/i, GraduationCap],
  [/entertain|movie|show/i, Clapperboard],
  [/tech|digital|social/i, Smartphone],
  [/propert|home|living/i, Home],
  [/travel|leisure/i, Plane],
  [/news|berita/i, Newspaper],
  [/local|tempatan|region/i, MapPin],
]

function resolveIcon(cat) {
  if (ICON_BY_SLUG[cat.slug]) return ICON_BY_SLUG[cat.slug]
  const haystack = `${cat.slug} ${cat.name || ''}`
  for (const [pattern, Icon] of KEYWORD_ICONS) {
    if (pattern.test(haystack)) return Icon
  }
  return Tag
}

export default function CategoriesGlassBlock({ limit = 12 }) {
  const { data: catsRaw } = useSWR(categoriesKey({ per_page: limit, orderby: 'count', order: 'desc' }))
  const cats = asArray(catsRaw).filter((c) => c.slug !== 'uncategorized')

  return (
    <section className="relative rounded-[2rem] p-5 sm:p-6 overflow-hidden bg-gradient-to-br from-white via-rose-50 to-red-50 border border-red-100/80 shadow-[0_25px_55px_-22px_rgba(220,38,38,0.4)]">
      {/* Soft red glow blobs — light glass background with colour, not a texture image */}
      <div className="pointer-events-none absolute -top-12 -right-8 w-56 h-56 rounded-full bg-primary/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 w-48 h-48 rounded-full bg-primary/15 blur-3xl" />

      <h3 className="relative flex items-center gap-2 text-primary font-extrabold text-sm sm:text-base uppercase tracking-wide mb-4">
        <span className="grid grid-cols-2 gap-[3px] shrink-0">
          <span className="w-2 h-2 rounded-[2px] bg-primary" />
          <span className="w-2 h-2 rounded-[2px] bg-primary" />
          <span className="w-2 h-2 rounded-[2px] bg-primary" />
          <span className="w-2 h-2 rounded-[2px] bg-primary" />
        </span>
        Browse Categories
      </h3>

      <div className="relative grid grid-cols-2 gap-2.5">
        {cats.length === 0
          ? [...Array(limit)].map((_, i) => (
              <div key={i} className="h-11 rounded-xl bg-white/60 border border-red-100 animate-pulse" />
            ))
          : cats.map((c) => {
              const Icon = resolveIcon(c)
              return (
                <Link
                  key={c.id}
                  to={categoryUrl(c)}
                  className="group flex items-center gap-2 h-11 px-2.5 rounded-xl
                             bg-white/55 backdrop-blur-md border border-white/80
                             shadow-[0_4px_14px_-8px_rgba(220,38,38,0.3)]
                             hover:bg-white/80 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_-8px_rgba(220,38,38,0.35)]
                             transition-all duration-200"
                >
                  <span className="shrink-0 w-7 h-7 rounded-full bg-white/80 border border-red-100 flex items-center justify-center group-hover:bg-white transition-colors">
                    <Icon className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
                  </span>
                  <span className="min-w-0 text-left truncate">
                    <span className="font-bold text-primary text-xs sm:text-[13px]">
                      {decodeHtml(c.name)}
                    </span>{' '}
                    <span className="text-primary/55 text-xs font-semibold">
                      ({c.count})
                    </span>
                  </span>
                </Link>
              )
            })}
      </div>
    </section>
  )
}
