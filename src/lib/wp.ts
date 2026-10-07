// WordPress REST API helpers for thesun.my (browser/SPA version)
export const WP_BASE = 'https://thesun.my/wp-json/wp/v2'

export function buildUrl(path, params = {}) {
  const url = new URL(`${WP_BASE}${path}`)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, String(v))
    }
  })
  return url.toString()
}

// Fetch and return both data + headers (used for pagination)
export async function wpFetch(path, params = {}) {
  const url = buildUrl(path, params)
  const res = await fetch(url)
  if (!res.ok) {
    return { data: [], total: 0, totalPages: 0 }
  }
  const data = await res.json()
  const total = parseInt(res.headers.get('x-wp-total') || '0', 10)
  const totalPages = parseInt(res.headers.get('x-wp-totalpages') || '0', 10)
  return { data, total, totalPages }
}

// SWR keys (so all hooks dedupe + cache correctly)
export const postsKey = (params = {}) => buildUrl('/posts', { _embed: 1, ...params })
export const postBySlugKey = (slug) => buildUrl('/posts', { slug, _embed: 1 })
export const categoryBySlugKey = (slug) => buildUrl('/categories', { slug })
export const categoriesKey = (params = {}) => buildUrl('/categories', params)
// Real trending hashtags: WP tags sorted by how many posts use them.
export const tagsKey = (params = {}) => buildUrl('/tags', { orderby: 'count', order: 'desc', hide_empty: 1, ...params })

// Guards against WP REST occasionally returning a non-array truthy payload
// (rate-limit / error JSON bodies, WAF challenge pages, etc.) instead of the
// expected list. Every component should read SWR `data` through this rather
// than trusting it directly — `data || []` does NOT catch this case, since a
// truthy non-array object still passes that check and blows up the first
// .map()/.filter()/.slice() call, taking the whole page blank with it.
export function asArray(data) {
  return Array.isArray(data) ? data : []
}

// ---------- Helpers to extract data from embedded API responses ----------
export function getFeaturedImage(post, size = 'medium_large') {
  if (!post) return null
  const media = post?._embedded?.['wp:featuredmedia']?.[0]
  if (!media || media.code === 'rest_forbidden') return null
  const sizes = media?.media_details?.sizes || {}
  const order = [size, 'medium_large', 'td_696x385', 'td_1068x580', 'td_485x360', 'medium', 'full']
  for (const s of order) {
    if (sizes[s]?.source_url) return sizes[s].source_url
  }
  return media.source_url || null
}

export function getThumbnail(post) {
  return getFeaturedImage(post, 'td_485x360') || getFeaturedImage(post, 'medium')
}

export function getLargeImage(post) {
  return getFeaturedImage(post, 'td_1068x580') || getFeaturedImage(post, 'full')
}

export function getImageAlt(post) {
  const media = post?._embedded?.['wp:featuredmedia']?.[0]
  return media?.alt_text || decodeHtml(post?.title?.rendered || '')
}

// The featured-image caption (the attachment's "caption" field). Available in
// the embedded media, so no extra request is needed.
export function getFeaturedImageCaption(post) {
  const media = post?._embedded?.['wp:featuredmedia']?.[0]
  const html = media?.caption?.rendered
  return html ? htmlToText(html) : ''
}

// Pick the best social/hero image for an article: prefer a wide (~1.91:1) crop
// at width >= 1000px, otherwise the largest available.
function pickWideImage(media) {
  const md = media?.media_details || {}
  const cands = []
  for (const v of Object.values(md.sizes || {}) as any[]) {
    if (v && v.source_url && v.width && v.height) cands.push({ url: v.source_url, width: v.width, height: v.height })
  }
  if (md.source_url && md.width && md.height) cands.push({ url: md.source_url, width: md.width, height: md.height })
  if (!cands.length) return media?.source_url ? { url: media.source_url, width: null, height: null } : null
  const wide = cands.filter((c) => c.width >= 1000)
  const pool = wide.length ? wide : cands
  const target = 1.91
  let best = pool[0]
  let bestScore = Infinity
  for (const c of pool) {
    const score = Math.abs(c.width / c.height - target)
    if (score < bestScore - 1e-9 || (Math.abs(score - bestScore) < 1e-9 && c.width > best.width)) {
      bestScore = score
      best = c
    }
  }
  return best
}

// Largest UNCROPPED rendition (aspect ratio ≈ the original). The theme also
// registers many hard-cropped sizes (td_*); we deliberately ignore those so the
// article hero shows the whole photo. Returns a responsive srcset of the
// uncropped sizes so phones don't download a 1280px file.
function pickFullImage(media) {
  const md = media?.media_details || {}
  const ow = md.width
  const oh = md.height
  const cands = []
  if (md.source_url && ow && oh) cands.push({ url: md.source_url, width: ow, height: oh })
  if (ow && oh) {
    const target = ow / oh
    for (const v of Object.values(md.sizes || {}) as any[]) {
      if (v && v.source_url && v.width && v.height) {
        if (Math.abs(v.width / v.height - target) / target < 0.02) {
          cands.push({ url: v.source_url, width: v.width, height: v.height })
        }
      }
    }
  }
  const uniq = []
  const seen = new Set()
  for (const c of cands.sort((a, b) => a.width - b.width)) {
    if (!seen.has(c.url)) { seen.add(c.url); uniq.push(c) }
  }
  if (!uniq.length) {
    return media?.source_url ? { url: media.source_url, width: null, height: null, srcset: '' } : null
  }
  const display = [...uniq].reverse().find((c) => c.width <= 1600) || uniq[uniq.length - 1]
  const srcset = uniq.map((c) => `${c.url} ${c.width}w`).join(', ')
  return { url: display.url, width: display.width, height: display.height, srcset }
}

// Full featured image info used by the article template (and schema): URL,
// intrinsic dimensions (to prevent layout shift), responsive srcset and caption.
export function getHeroImage(post) {
  const media = post?._embedded?.['wp:featuredmedia']?.[0]
  if (!media || media.code === 'rest_forbidden') return null
  const img = pickFullImage(media)
  if (!img || !img.url) return null
  return {
    url: img.url,
    width: img.width,
    height: img.height,
    srcset: img.srcset,
    alt: media.alt_text || decodeHtml(post?.title?.rendered || ''),
    caption: getFeaturedImageCaption(post),
  }
}

// Longer meta description: use the excerpt, and if it's short top it up with
// the article body, capped at `max`.
export function getMetaDescription(post, max = 300) {
  const excerpt = stripHtml(post?.excerpt?.rendered, max)
  if (excerpt && excerpt.replace(/…$/, '').length >= 120) return excerpt
  const body = htmlToText(post?.content?.rendered || '')
  const text = excerpt ? `${excerpt.replace(/…$/, '')} ${body}` : body
  const trimmed = text.replace(/\s+/g, ' ').trim()
  return trimmed.length > max ? trimmed.slice(0, max).trim() + '…' : trimmed
}

// Full plain-text article body for schema (generous safety cap).
export function getArticleBody(post, max = 50 * 1024) {
  const text = htmlToText(post?.content?.rendered || '')
  return text ? text.slice(0, max) : undefined
}

// Non-truncating HTML → text (used for schema articleBody / word count).
export function htmlToText(html = '') {
  return decodeHtml(String(html).replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()
}

export function getPrimaryCategory(post) {
  const terms = post?._embedded?.['wp:term']
  if (!Array.isArray(terms)) return null
  for (const group of terms) {
    if (!Array.isArray(group)) continue
    for (const t of group) {
      if (t.taxonomy === 'category' && t.slug !== 'uncategorized') {
        return { name: decodeHtml(t.name), slug: t.slug, id: t.id, link: t.link }
      }
    }
  }
  return null
}

export function getAllCategories(post) {
  const terms = post?._embedded?.['wp:term']
  const cats = []
  if (!Array.isArray(terms)) return cats
  for (const group of terms) {
    if (!Array.isArray(group)) continue
    for (const t of group) {
      if (t.taxonomy === 'category') cats.push({ name: decodeHtml(t.name), slug: t.slug, id: t.id, link: t.link })
    }
  }
  return cats
}

export function getTags(post) {
  const terms = post?._embedded?.['wp:term']
  const tags = []
  if (!Array.isArray(terms)) return tags
  for (const group of terms) {
    if (!Array.isArray(group)) continue
    for (const t of group) {
      if (t.taxonomy === 'post_tag') tags.push({ name: decodeHtml(t.name), slug: t.slug, id: t.id })
    }
  }
  return tags
}

// PublishPress Authors exposes authors as the `author` taxonomy (REST base
// `ppma_author`). The core `_embedded.author` (WP users) is forbidden for
// this site, so read authors from the embedded author terms instead.
export function getAuthors(post) {
  const terms = post?._embedded?.['wp:term']
  const out = []
  if (Array.isArray(terms)) {
    for (const group of terms) {
      if (!Array.isArray(group)) continue
      for (const t of group) {
        if (t.taxonomy === 'author' && t.slug) {
          out.push({ id: t.id, name: decodeHtml(t.name), slug: t.slug, link: t.link })
        }
      }
    }
  }
  return out
}

export function getAuthor(post) {
  const authors = getAuthors(post)
  if (authors.length) return authors[0]
  return { name: 'The Sun Malaysia', slug: 'thesun', link: 'https://thesun.my/author/thesun/' }
}

export function decodeHtml(html = '') {
  if (!html) return ''
  return String(html)
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '…')
}

export function stripHtml(html = '', maxLen = 200) {
  if (!html) return ''
  const text = String(html).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  const decoded = decodeHtml(text)
  if (decoded.length <= maxLen) return decoded
  return decoded.slice(0, maxLen).trim() + '…'
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch { return '' }
}

export function formatDateTime(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('en-MY', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

export function timeAgo(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return formatDate(dateStr)
}

export const NAV_CATEGORIES = [
  { slug: 'malaysia-news', name: 'Malaysia' },
  { slug: 'business', name: 'Business' },
  { slug: 'world', name: 'World' },
  { slug: 'sports', name: 'Sports' },
  { slug: 'lifestyle', name: 'Lifestyle' },
  { slug: 'entertainment', name: 'Entertainment' },
  { slug: 'education', name: 'Education' },
  { slug: 'opinion', name: 'Opinion' },
  { slug: 'going-viral', name: 'Viral' },
  { slug: 'berita', name: 'Berita' },
]

export const FEATURED_CATEGORY_SLUGS = [
  'malaysia-news', 'business', 'world', 'sports', 'lifestyle', 'entertainment', 'berita',
]

export const LOGO_URL = 'https://customer-assets.emergentagent.com/job_3108d35f-a45a-4c79-ae5b-d6401293d73f/artifacts/j5qi0lcz_350x180-no-outline.png'

export const FALLBACK_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9" width="800" height="450"><rect width="16" height="9" fill="%23e5e7eb"/><text x="50%25" y="55%25" text-anchor="middle" font-family="Arial" font-size="1" fill="%2399a">The Sun Malaysia</text></svg>'