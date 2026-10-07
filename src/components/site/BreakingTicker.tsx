import useSWR from 'swr'
import { articlePath } from '@/lib/urls'
import { Link } from '@/lib/router'
import { Zap } from 'lucide-react'
import { postsKey, decodeHtml, asArray } from '@/lib/wp'
import SocialIcons from './SocialIcons'

export default function BreakingTicker() {
  const { data: postsRaw } = useSWR(postsKey({ per_page: 8 }))
  const posts = asArray(postsRaw)
  if (!posts.length) {
    return (
      <div className="bg-black text-white border-b border-white/10">
        <div className="container mx-auto px-0 sm:px-4 flex items-stretch">
          <div className="flex items-center gap-1.5 bg-primary text-white px-3 py-2 text-xs font-bold uppercase tracking-wider shrink-0">
            <Zap className="h-3.5 w-3.5 fill-current" />
            <span className="hidden sm:inline">Breaking</span>
          </div>
          <div className="flex-1 px-4 py-2 text-xs text-white/60">Loading latest headlines…</div>
          <div className="hidden sm:flex items-center pl-3 pr-1 border-l border-white/10 shrink-0">
            <SocialIcons size="sm" />
          </div>
        </div>
      </div>
    )
  }
  const items = [...posts, ...posts]
  return (
    <div className="bg-black text-white border-b border-white/10">
      <div className="container mx-auto px-0 sm:px-4 flex items-stretch">
        <div className="flex items-center gap-1.5 bg-primary text-white px-3 py-2 text-xs font-bold uppercase tracking-wider shrink-0">
          <Zap className="h-3.5 w-3.5 fill-current" />
          <span className="hidden sm:inline">Breaking</span>
        </div>
        <div className="flex-1 overflow-hidden hover-ticker relative">
          <div className="ticker-track flex items-center whitespace-nowrap py-2" style={{ width: 'max-content' }}>
            {items.map((p, i) => (
              <Link key={`${p.id}-${i}`} to={articlePath(p)} className="text-sm px-6 hover:text-primary inline-flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                {decodeHtml(p.title?.rendered || '')}
              </Link>
            ))}
          </div>
        </div>
        <div className="hidden sm:flex items-center pl-3 pr-1 border-l border-white/10 shrink-0">
          <SocialIcons size="sm" />
        </div>
      </div>
    </div>
  )
}
