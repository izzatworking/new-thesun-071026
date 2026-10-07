import useSWR from 'swr'
import { buildUrl, asArray } from '@/lib/wp'

// The REST `_embed` post_tag terms on this site can be stale/wrong, so tags are
// fetched authoritatively by their IDs (post.tags) — this is the reliable path.
export function useTagsById(ids = []) {
  const unique = [...new Set((ids || []).filter(Boolean))]
  const key = unique.length
    ? buildUrl('/tags', { include: unique.join(','), per_page: 100, _fields: 'id,name,slug,link' })
    : null
  const { data } = useSWR(key)
  return asArray(data)
}

export function tagMapFrom(tags = []) {
  const map = {}
  for (const t of tags) map[t.id] = t
  return map
}
