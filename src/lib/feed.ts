import useSWR from 'swr'

// Reads one page of a cached edge feed (/api/feed) and exposes the items plus
// the total page count (from the X-Total-Pages header) so pages can paginate
// accurately. `keepPreviousData` avoids a flash when moving between pages.
export function useFeed(url) {
  const { data, error, isLoading } = useSWR(
    url,
    async (u) => {
      const res = await fetch(u)
      if (!res.ok) throw new Error('feed failed')
      const items = await res.json()
      return {
        items: Array.isArray(items) ? items : [],
        totalPages: parseInt(res.headers.get('X-Total-Pages') || '0', 10) || 0,
        total: parseInt(res.headers.get('X-Total') || '0', 10) || 0,
      }
    },
    { keepPreviousData: true }
  )

  return {
    items: data?.items || [],
    totalPages: data?.totalPages || 0,
    total: data?.total || 0,
    error,
    isLoading,
  }
}
