import { useEffect, useState } from 'react'

// Same channel + API key + endpoint used on the Videos page (VideoPage.jsx).
// Keeping these here means both places call the exact same source of truth.
export const YT_CHANNEL_ID = 'UCJNLiW1NkgyHeoijxH-a_Wg' // The Sun Malaysia (@theSunMedia)
// Routed through the same-origin Pages Function (public/_worker.js), which
// attaches the API key and an allowed Referer server-side.
const API_BASE = '/api/youtube'

async function ytFetch(endpoint: string, params: Record<string, string | number>) {
  const url = new URL(`${API_BASE}/${endpoint}`, window.location.origin)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  const res = await fetch(url.toString())
  const data = await res.json()
  if (!res.ok) {
    const msg = data && data.error ? data.error.message : 'Request failed'
    throw new Error(msg)
  }
  return data
}

function parseISODuration(iso) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  const h = parseInt(m[1] || 0), mi = parseInt(m[2] || 0), s = parseInt(m[3] || 0)
  return h * 3600 + mi * 60 + s
}

export function formatDuration(sec) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

export function formatViews(n) {
  n = Number(n) || 0
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(n)
}

export function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  const units: [number, string][] = [[31536000, 'yr'], [2592000, 'mo'], [604800, 'wk'], [86400, 'day'], [3600, 'hr'], [60, 'min']]
  for (const [s, label] of units) {
    if (diff >= s) { const v = Math.floor(diff / s); return `${v} ${label}${v > 1 ? 's' : ''} ago` }
  }
  return 'just now'
}

/**
 * Fetches the channel's latest uploaded videos using the exact same YouTube Data API v3
 * calls as the Videos page: resolve the uploads playlist once, then pull
 * playlistItems -> videos(contentDetails,statistics,snippet) for those ids.
 *
 * @param {number} count how many videos to return (regular, non-Short, preferred)
 */
export function useLatestVideos(count = 5) {
  const [videos, setVideos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setIsLoading(true)
        setError(null)

        const chData = await ytFetch('channels', { part: 'contentDetails', id: YT_CHANNEL_ID })
        if (cancelled) return
        if (!chData.items || !chData.items.length) throw new Error('Channel not found')
        const uploadsPlaylistId = chData.items[0].contentDetails.relatedPlaylists.uploads

        // Pull a slightly bigger batch than requested so we can filter out Shorts
        // and still land on `count` regular videos for the homepage block.
        const plData = await ytFetch('playlistItems', {
          part: 'snippet',
          playlistId: uploadsPlaylistId,
          maxResults: String(Math.max(count * 3, 15)),
        })
        if (cancelled) return
        const ids = plData.items.map((it) => it.snippet.resourceId.videoId).filter(Boolean)
        if (!ids.length) { setVideos([]); return }

        const details = await ytFetch('videos', { part: 'contentDetails,statistics,snippet', id: ids.join(',') })
        if (cancelled) return

        const parsed = details.items.map((v) => {
          const seconds = parseISODuration(v.contentDetails.duration)
          return {
            id: v.id,
            title: v.snippet.title,
            description: v.snippet.description,
            thumb: (v.snippet.thumbnails.maxres || v.snippet.thumbnails.high || v.snippet.thumbnails.medium || v.snippet.thumbnails.default).url,
            seconds,
            duration: formatDuration(seconds),
            views: v.statistics.viewCount || 0,
            likes: v.statistics.likeCount || 0,
            publishedAt: v.snippet.publishedAt,
            isShort: seconds > 0 && seconds <= 61,
          }
        })

        const regular = parsed.filter((v) => !v.isShort)
        const ordered = regular.length ? regular : parsed
        setVideos(ordered.slice(0, count))
      } catch (e) {
        if (!cancelled) setError(e)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [count])

  return { videos, isLoading, error }
}
