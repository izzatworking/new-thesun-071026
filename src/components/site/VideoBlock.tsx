import { useState } from 'react'
import { Play, ArrowLeft, ArrowRight, Eye, ThumbsUp, Clock } from 'lucide-react'
import { useLatestVideos, formatViews } from '@/lib/youtube'

const BATCH = 5 // 1 featured + 4 secondary per page
const FETCH_COUNT = 13 // a few pages' worth so Prev/Next has room to move

function VideoThumbSurface({ video, playing, onPlay, aspect, children }) {
  if (playing) {
    return (
      <div className={`relative w-full ${aspect} bg-black rounded-xl overflow-hidden`}>
        <iframe
          className="w-full h-full"
          src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
          title={video.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }
  return (
    <button
      onClick={onPlay}
      className={`group relative block w-full ${aspect} bg-neutral-900 rounded-xl overflow-hidden`}
    >
      <img src={video.thumb} alt={video.title} loading="lazy" className="w-full h-full object-cover" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Play className="w-9 h-9 sm:w-11 sm:h-11 text-white/90 fill-white/90 drop-shadow-lg group-hover:scale-110 transition-transform" />
      </div>
      {children}
    </button>
  )
}

function StatBadge({ icon: Icon, children, className = '' }) {
  return (
    <span className={`flex items-center gap-1 bg-black/70 text-white text-[11px] font-semibold px-1.5 py-1 rounded ${className}`}>
      <Icon className="w-3 h-3" />
      {children}
    </span>
  )
}

function FeaturedVideoCard({ video, playing, onPlay }) {
  return (
    <div>
      <VideoThumbSurface video={video} playing={playing} onPlay={onPlay} aspect="aspect-video">
        <div className="absolute bottom-2 left-2 flex items-center gap-2">
          <StatBadge icon={Eye}>{formatViews(video.views)}</StatBadge>
          <StatBadge icon={ThumbsUp}>{formatViews(video.likes ?? 0)}</StatBadge>
        </div>
        <div className="absolute bottom-2 right-2">
          <StatBadge icon={Clock}>{video.duration}</StatBadge>
        </div>
      </VideoThumbSurface>
      <h2 className="text-neutral-900 text-xl sm:text-2xl lg:text-3xl font-bold leading-snug mt-4 mb-2">
        {video.title}
      </h2>
    </div>
  )
}

function FeaturedVideoSkeleton() {
  return (
    <div>
      <div className="w-full aspect-video rounded-lg bg-neutral-300 animate-pulse" />
      <div className="mt-4 space-y-2.5">
        <div className="h-5 w-4/5 bg-neutral-300 rounded animate-pulse" />
        <div className="h-3.5 w-full bg-neutral-300 rounded animate-pulse" />
        <div className="h-3.5 w-2/3 bg-neutral-300 rounded animate-pulse" />
      </div>
    </div>
  )
}

function SecondaryVideoCard({ video, playing, onPlay }) {
  return (
    <div>
      <VideoThumbSurface video={video} playing={playing} onPlay={onPlay} aspect="aspect-video">
        <div className="absolute top-2 left-2">
          <StatBadge icon={Eye}>{formatViews(video.views)}</StatBadge>
        </div>
        <div className="absolute top-2 right-2">
          <StatBadge icon={Clock}>{video.duration}</StatBadge>
        </div>
      </VideoThumbSurface>
      <h3 className="text-neutral-900 text-sm sm:text-base font-bold leading-snug mt-3 mb-1 line-clamp-2">
        {video.title}
      </h3>
    </div>
  )
}

function SecondaryVideoSkeleton() {
  return (
    <div>
      <div className="w-full aspect-video rounded-lg bg-neutral-300 animate-pulse" />
      <div className="mt-3 space-y-2">
        <div className="h-3.5 w-full bg-neutral-300 rounded animate-pulse" />
        <div className="h-3.5 w-3/4 bg-neutral-300 rounded animate-pulse" />
      </div>
    </div>
  )
}

export default function VideoBlock() {
  const { videos, isLoading, error } = useLatestVideos(FETCH_COUNT)
  const [startIndex, setStartIndex] = useState(0)
  const [playingId, setPlayingId] = useState(null)

  // Nothing to show and nothing wrong — just skip the section rather than showing an empty shell.
  if (!isLoading && !error && videos.length === 0) return null

  const maxStart = Math.max(0, videos.length - BATCH)
  const visible = videos.slice(startIndex, startIndex + BATCH)
  const featured = visible[0]
  const secondary = visible.slice(1, BATCH)

  function goPrev() {
    setStartIndex((i) => Math.max(0, i - BATCH))
  }
  function goNext() {
    setStartIndex((i) => Math.min(maxStart, i + BATCH))
  }

  return (
    <section className="w-full bg-[#DBDBDB] mt-16 mb-10 rounded-2xl overflow-hidden">
      {/* Header: red VIDEOS label, red rule, Prev/Next controls */}
      <div className="flex items-center gap-4 px-5 sm:px-8 pt-6 pb-6">
        <span className="bg-primary text-white font-extrabold uppercase tracking-wide text-lg sm:text-xl rounded-md px-5 py-2.5 shrink-0">
          Videos
        </span>
        <span className="flex-1 h-[2px] bg-primary" />
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={goPrev}
            disabled={startIndex === 0}
            className="flex items-center gap-1.5 border border-neutral-400 text-neutral-900 text-xs sm:text-sm font-semibold rounded-md px-3 py-2 hover:border-neutral-900 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Prev
          </button>
          <button
            onClick={goNext}
            disabled={startIndex >= maxStart}
            className="flex items-center gap-1.5 border border-neutral-400 text-neutral-900 text-xs sm:text-sm font-semibold rounded-md px-3 py-2 hover:border-neutral-900 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            Next
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {error ? (
        <div className="text-center py-16 text-neutral-600 text-sm">
          Unable to load videos right now.
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 px-5 sm:px-8 pb-8">
          {/* Featured video — full width on mobile, left column on desktop */}
          <div className="lg:w-[38%] shrink-0">
            {isLoading || !featured ? (
              <FeaturedVideoSkeleton />
            ) : (
              <FeaturedVideoCard
                video={featured}
                playing={playingId === featured.id}
                onPlay={() => setPlayingId(featured.id)}
              />
            )}
          </div>

          {/* Secondary videos — 2-column grid on mobile too (1-2-2 layout), right side on desktop */}
          <div className="flex-1 grid grid-cols-2 gap-3 sm:gap-6">
            {isLoading
              ? [...Array(4)].map((_, i) => <SecondaryVideoSkeleton key={i} />)
              : secondary.map((v) => (
                  <SecondaryVideoCard
                    key={v.id}
                    video={v}
                    playing={playingId === v.id}
                    onPlay={() => setPlayingId(v.id)}
                  />
                ))}
          </div>
        </div>
      )}
    </section>
  )
}
