import { createContext, useContext, useMemo, useState } from 'react'
import { articlePath } from '@/lib/urls'
import { Link } from '@/lib/router'
import useSWR from 'swr'
import {
  Headphones, X, Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Radio,
} from 'lucide-react'
import { postsKey, decodeHtml, stripHtml, asArray } from '@/lib/wp'
import { useNewsReader, formatClock, formatDuration, estimateSeconds } from '@/lib/newsReader'

const ListenNewsCtx = createContext(null)

// How many of the latest posts to load into the "All Headlines" queue.
const HEADLINE_COUNT = 8

export function ListenNewsProvider({ children }) {
  const [open, setOpen] = useState(false)
  const { data: postsRaw } = useSWR(postsKey({ per_page: HEADLINE_COUNT }))
  const posts = asArray(postsRaw)

  // stripHtml's default maxLen truncates for excerpt-style use — pass a very
  // high ceiling here since we want the article's *full* text to read aloud.
  const items = useMemo(() => posts.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: decodeHtml(p.title?.rendered || ''),
    text: stripHtml(p.content?.rendered || p.excerpt?.rendered || '', 50000),
  })), [posts])

  const reader = useNewsReader(items)
  const value = { open, setOpen, ...reader }

  return <ListenNewsCtx.Provider value={value}>{children}</ListenNewsCtx.Provider>
}

function useListenNews() {
  const ctx = useContext(ListenNewsCtx)
  if (!ctx) throw new Error('useListenNews must be used within a ListenNewsProvider')
  return ctx
}

// compact=true renders a small icon-only button for tight mobile rows;
// otherwise renders the red "LISTEN NEWS" pill seen next to the weather widget.
export function ListenNewsButton({ compact = false, pulse = true }) {
  const { setOpen } = useListenNews()

  if (compact) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Listen to news headlines"
        className="p-2 rounded-md border-2 border-border bg-muted/40 text-primary hover:bg-muted hover:border-primary/50 transition-colors"
      >
        <Headphones className="h-5 w-5" strokeWidth={2.75} />
      </button>
    )
  }

  return (
    <button
      onClick={() => setOpen(true)}
      className="relative flex flex-col items-center justify-center gap-0.5 bg-primary hover:bg-primary/90 text-white rounded-xl px-4 py-2 shadow-sm transition-colors shrink-0"
    >
      {/* Pulsing rings — purely decorative, sits behind the button content.
          `transform`-based (animate-ping/animate-pulse) content like this gets
          promoted to its own compositing layer by the browser. If an ancestor
          is mid max-height/overflow-hidden collapse (see SiteHeader's Row 2),
          that promoted layer can render outside the ancestor's shrinking clip
          region for a frame or two — a floating "ghost" of this button
          overlapping whatever is below it. Callers that animate this button's
          container should pass pulse={false} while collapsing/hiding it. */}
      {pulse && (
        <>
          <span className="absolute inset-0 rounded-xl bg-primary animate-ping opacity-75 pointer-events-none" aria-hidden="true" />
          <span className="absolute inset-0 rounded-xl bg-primary/60 animate-pulse pointer-events-none" aria-hidden="true" />
        </>
      )}

      <Headphones className="relative h-5 w-5" strokeWidth={2.25} />
      <span className="relative text-[10px] font-extrabold leading-none tracking-wide text-center">
        LISTEN<br /><span className="text-yellow-300">NEWS</span>
      </span>
    </button>
  )
}

function todayLabel() {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
}

export function ListenNewsPanel() {
  const {
    open, setOpen, supported, items, index, current, playing, elapsed, duration, muted,
    play, pause, toggle, next, prev, selectIndex, seekFraction, toggleMute, stop, hasPrev, hasNext,
  } = useListenNews()

  if (!open) return null

  const close = () => { stop(); setOpen(false) }
  const fraction = duration > 0 ? Math.min(1, elapsed / duration) : 0

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/40" onClick={close} />
      <div className="fixed top-0 right-0 z-[95] h-full w-full sm:w-[420px] bg-white shadow-2xl flex flex-col">

        {/* Player header */}
        <div
          className="bg-primary text-white p-5 shrink-0"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.25rem)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-white/80">{todayLabel()}</span>
            <button onClick={close} aria-label="Close" className="p-1 rounded hover:bg-white/10 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {!supported ? (
            <p className="text-sm text-white/90 leading-relaxed">
              Voice playback isn't supported in this browser. You can still open any headline below to read the full article.
            </p>
          ) : !current ? (
            <p className="text-sm text-white/90">Loading headlines…</p>
          ) : (
            <>
              <p className="text-sm font-semibold leading-snug line-clamp-2 mb-4 min-h-[2.6em]">{current.title}</p>
              <div className="flex items-center gap-3">
                <button onClick={prev} disabled={!hasPrev} aria-label="Previous headline" className="text-white/80 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors shrink-0">
                  <SkipBack className="h-5 w-5" />
                </button>
                <button
                  onClick={toggle}
                  aria-label={playing ? 'Pause' : 'Play'}
                  className="w-11 h-11 rounded-full bg-white text-primary flex items-center justify-center shrink-0 hover:scale-105 transition-transform"
                >
                  {playing ? <Pause className="h-5 w-5 fill-primary" /> : <Play className="h-5 w-5 fill-primary ml-0.5" />}
                </button>
                <button onClick={next} disabled={!hasNext} aria-label="Next headline" className="text-white/80 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors shrink-0">
                  <SkipForward className="h-5 w-5" />
                </button>

                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.001}
                  value={fraction}
                  onChange={(e) => seekFraction(Number(e.target.value))}
                  aria-label="Seek"
                  className="flex-1 accent-white h-1"
                />

                <button onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'} className="text-white/80 hover:text-white transition-colors shrink-0">
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex justify-between text-[11px] text-white/70 mt-1.5 font-mono">
                <span>{formatClock(elapsed)}</span>
                <span>{formatClock(duration)}</span>
              </div>
            </>
          )}
        </div>

        {/* Headline list */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5" /> All Headlines:
          </p>
          {items.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading headlines…</div>
          )}
          <div className="divide-y divide-border">
            {items.map((it, i) => {
              const isCurrent = i === index
              return (
                <div key={it.id} className="flex items-center gap-3 py-3">
                  <button
                    onClick={() => selectIndex(i)}
                    disabled={!supported}
                    aria-label={`Play ${it.title}`}
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      isCurrent ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                    } disabled:opacity-40 disabled:pointer-events-none`}
                  >
                    {isCurrent && playing
                      ? <Volume2 className="h-3.5 w-3.5" />
                      : <Play className="h-3 w-3 fill-current ml-0.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-snug line-clamp-2 ${isCurrent ? 'text-primary' : 'text-foreground'}`}>
                      {it.title}
                    </p>
                    <span className="text-[11px] text-muted-foreground">{formatDuration(estimateSeconds(it.text))}</span>
                  </div>
                  <Link
                    to={articlePath(it)}
                    onClick={close}
                    className="shrink-0 text-xs font-semibold border border-primary text-primary rounded px-2.5 py-1 hover:bg-primary hover:text-white transition-colors"
                  >
                    Read
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
