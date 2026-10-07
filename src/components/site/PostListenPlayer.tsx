import { useMemo } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { useNewsReader, formatClock } from '@/lib/newsReader'
import { htmlToText, decodeHtml } from '@/lib/wp'

// Article audio bar: play/pause, a seekable progress bar, elapsed/total time and
// a mute toggle. Uses the same Web Speech based reader as the header's Listen
// News (female broadcaster voice) but plays only the current article.
export default function PostListenPlayer({ post }) {
  const items = useMemo(() => {
    if (!post) return []
    const text = htmlToText(post.content?.rendered || post.excerpt?.rendered || '').slice(0, 50000)
    if (!text) return []
    return [{ id: post.id, slug: post.slug, title: decodeHtml(post.title?.rendered || ''), text }]
  }, [post])

  const { supported, playing, elapsed, duration, muted, toggle, toggleMute, seekFraction } = useNewsReader(items)

  if (!supported || !items.length) return null

  const fraction = duration > 0 ? Math.min(1, elapsed / duration) : 0

  return (
    <div className="w-full mb-5 rounded-xl border border-border bg-muted/40 px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Pause article audio' : 'Listen to this article'}
          className="shrink-0 grid place-items-center w-10 h-10 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-[1px]" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-foreground/70 truncate">
              {playing ? 'Now reading' : 'Listen to this article'}
            </span>
            <span className="ml-auto text-[11px] sm:text-xs font-semibold tabular-nums text-muted-foreground whitespace-nowrap">
              {formatClock(elapsed)} / {formatClock(duration)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1000"
            step="1"
            value={Math.round(fraction * 1000)}
            onChange={(e) => seekFraction(Number(e.target.value) / 1000)}
            aria-label="Seek"
            className="w-full h-1.5 cursor-pointer accent-primary"
          />
        </div>

        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? 'Unmute' : 'Mute'}
          className="shrink-0 grid place-items-center w-9 h-9 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
