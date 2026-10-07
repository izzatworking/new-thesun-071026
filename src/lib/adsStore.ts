import useSWR from 'swr'
import { saveSlot } from '@/lib/adsAuth'

// Reads the site-wide ad map from our edge function (/api/ads, KV-backed,
// cached ~60 s). Shared across every <AdSlot> via SWR so it's one request.
export function useAds() {
  const { data, isLoading, mutate } = useSWR('/api/ads')
  return { ads: data || {}, isLoading, mutate }
}

export { saveSlot }
