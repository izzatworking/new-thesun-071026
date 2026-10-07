// Server-side per-URL SEO builder. Ported from the old Cloudflare
// `_middleware.js` `resolveMeta()` so every WordPress permalink gets correct
// server-rendered <title>/description/canonical/OG/Twitter + JSON-LD.
import { cache } from 'react'
import { SITE } from '../../../site.config.mjs'
import { WP, wpJson } from './wp'

const SITE_URL = SITE.url
const DEFAULT_OG = SITE.ogImage

export type MetaResult = {
  title: string
  description: string
  image: string
  imageWidth?: number | null
  imageHeight?: number | null
  imageAlt?: string
  type: 'website' | 'article'
  canonical: string
  robots: string
  lang?: string
  locale?: string
  publishedTime?: string
  modifiedTime?: string
  section?: string
  tagNames?: string[]
  authorUrl?: string
  jsonLd?: any
  notFound?: boolean
}

/* ------------------------------ helpers ------------------------------ */
function normalize(p: string) {
  let s = p
  if (!s.startsWith('/')) s = '/' + s
  if (s.length > 1) s = s.replace(/\/+$/, '')
  return s
}

function pageFromPath(norm: string) {
  const m = norm.match(/\/page\/(\d+)$/)
  return m ? parseInt(m[1], 10) || 1 : 1
}

function decodeHtml(s = '') {
  return String(s)
    .replace(/&#8217;|&#8216;/g, "'").replace(/&#8220;|&#8221;/g, '"')
    .replace(/&#8211;/g, '–').replace(/&#8212;/g, '—').replace(/&#038;|&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ').replace(/&hellip;/g, '…')
}

function stripHtml(html = '', max = 200) {
  const text = decodeHtml(String(html).replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim()
  return text.length > max ? text.slice(0, max).trim() + '…' : text
}

function htmlToText(html = '') {
  return decodeHtml(String(html).replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()
}

function pickWideImage(media: any) {
  const md = media?.media_details || {}
  const cands: { url: string; width: number; height: number }[] = []
  for (const v of Object.values(md.sizes || {}) as any[]) {
    if (v && v.source_url && v.width && v.height) cands.push({ url: v.source_url, width: v.width, height: v.height })
  }
  if (md.source_url && md.width && md.height) cands.push({ url: md.source_url, width: md.width, height: md.height })
  if (!cands.length) return media?.source_url ? { url: media.source_url, width: null, height: null } : null
  const wide = cands.filter((c) => c.width >= 1000)
  const pool = wide.length ? wide : cands
  let best = pool[0]
  let bestScore = Infinity
  for (const c of pool) {
    const score = Math.abs(c.width / c.height - 1.91)
    if (score < bestScore - 1e-9 || (Math.abs(score - bestScore) < 1e-9 && c.width > best.width)) { bestScore = score; best = c }
  }
  return best
}

function featuredImageInfo(post: any) {
  const media = post?._embedded?.['wp:featuredmedia']?.[0]
  if (!media || media.code) return null
  const img = pickWideImage(media)
  if (!img || !img.url) return null
  const caption = media?.caption?.rendered ? htmlToText(media.caption.rendered) : ''
  return { url: img.url, width: img.width, height: img.height, caption, alt: media.alt_text || caption || '' }
}

function metaDescription(post: any, max = 300) {
  const excerpt = stripHtml(post?.excerpt?.rendered, max)
  if (excerpt && excerpt.replace(/…$/, '').length >= 120) return excerpt
  const body = htmlToText(post?.content?.rendered || '')
  const text = (excerpt ? excerpt.replace(/…$/, '') + ' ' + body : body).replace(/\s+/g, ' ').trim()
  return text.length > max ? text.slice(0, max).trim() + '…' : text
}

function stripTrail(link: string) {
  try {
    const p = new URL(link).pathname
    return normalize(p)
  } catch {
    return null
  }
}

/* ------------------------------ resolver ------------------------------ */
export const getMeta = cache(async (path: string, search: string): Promise<MetaResult> => {
  const searchParams = new URLSearchParams(search)
  const norm = normalize(path)
  const segs = norm.split('/').filter(Boolean)
  const last = segs[segs.length - 1]
  let postsEmpty = false

  const sParam = searchParams.get('s')
  if (sParam && sParam.trim()) {
    const q = sParam.trim().slice(0, 100)
    const author = searchParams.get('type') === 'author'
    return {
      title: `${author ? 'Author search' : 'Search'}: ${q} | The Sun Malaysia`,
      description: `Search results for "${q}" on The Sun Malaysia.`,
      image: DEFAULT_OG, type: 'website',
      canonical: `${SITE_URL}/?s=${encodeURIComponent(q)}${author ? '&type=author' : ''}`,
      robots: 'noindex,follow',
    }
  }

  if (norm === '/branding' || norm === '/systems-desk') {
    const label = norm === '/branding' ? 'Branding' : 'System Status'
    return {
      title: `${label} | The Sun Malaysia`,
      description: 'Internal page.',
      image: DEFAULT_OG, type: 'website',
      canonical: `${SITE_URL}${norm}/`,
      robots: 'noindex,follow',
    }
  }

  if (!last) {
    return {
      title: 'The Sun Malaysia | Latest Trending News: National, World and Viral',
      description: 'Latest Malaysia news, breaking headlines, business, lifestyle, sports and world news from The Sun Malaysia.',
      image: DEFAULT_OG,
      type: 'website',
      canonical: `${SITE_URL}/`,
      robots: 'index,follow',
    }
  }

  if (norm === '/latest' || norm.startsWith('/latest/')) {
    const p = pageFromPath(norm)
    return {
      title: p > 1 ? `Latest News - Page ${p} | The Sun Malaysia` : 'Latest News | The Sun Malaysia',
      description: 'The latest news from The Sun Malaysia, updated continuously.',
      image: DEFAULT_OG, type: 'website',
      canonical: p > 1 ? `${SITE_URL}/latest/page/${p}/` : `${SITE_URL}/latest/`,
      robots: p > 1 ? 'noindex,follow' : 'index,follow',
      jsonLd: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Latest News', url: `${SITE_URL}/latest/`, isPartOf: { '@type': 'WebSite', name: 'The Sun Malaysia', url: SITE_URL } },
    }
  }
  if (norm === '/most-viewed' || norm.startsWith('/most-viewed/')) {
    const p = pageFromPath(norm)
    return {
      title: 'Most Viewed News | The Sun Malaysia',
      description: 'The most-read stories on The Sun Malaysia over the last 24 hours, 7 days and 30 days.',
      image: DEFAULT_OG, type: 'website',
      canonical: p > 1 ? `${SITE_URL}/most-viewed/page/${p}/` : `${SITE_URL}/most-viewed/`,
      robots: 'noindex,follow',
      jsonLd: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Most Viewed News', url: `${SITE_URL}/most-viewed/`, isPartOf: { '@type': 'WebSite', name: 'The Sun Malaysia', url: SITE_URL } },
    }
  }

  if (segs[0] === 'tag' && segs[1]) {
    const tags = await wpJson(`${WP}/tags?slug=${encodeURIComponent(segs[1])}&_fields=name,link`)
    const tag = Array.isArray(tags) && tags[0]
    return {
      title: tag ? `#${decodeHtml(tag.name)}` : `#${segs[1]}`,
      description: tag ? `Latest stories tagged #${decodeHtml(tag.name)}.` : `Latest stories tagged #${segs[1]}.`,
      image: DEFAULT_OG, type: 'website', canonical: `${SITE_URL}${norm}/`, robots: 'noindex,follow',
    }
  }

  if (segs[0] === 'author' && segs[1]) {
    const a = await wpJson(`${WP}/ppma_author?slug=${encodeURIComponent(segs[1])}&_fields=name,slug,link`)
    const au = Array.isArray(a) ? a[0] : null
    return {
      title: au ? `${decodeHtml(au.name)} - Articles` : 'Author',
      description: au ? `Articles by ${decodeHtml(au.name)} on The Sun Malaysia.` : 'Author articles on The Sun Malaysia.',
      image: DEFAULT_OG, type: 'website', canonical: `${SITE_URL}${norm}/`, robots: 'noindex,follow',
    }
  }

  const posts = await wpJson(`${WP}/posts?slug=${encodeURIComponent(last)}&_embed=1&_fields=title,excerpt,content,link,date,modified,tags,categories,_links,_embedded`)
  postsEmpty = Array.isArray(posts) && posts.length === 0
  const post = Array.isArray(posts) ? posts.find((p: any) => stripTrail(p.link) === norm) || posts[0] : null
  if (post && stripTrail(post.link) === norm) {
    const title = decodeHtml(post.title?.rendered || '')
    const description = metaDescription(post)
    const hero = featuredImageInfo(post)
    const image = hero?.url || DEFAULT_OG
    const canonical = `${SITE_URL}${norm}/`
    const malay = norm.startsWith('/berita')
    const lang = malay ? 'ms' : 'en-MY'
    const webpageId = `${canonical}#webpage`
    const breadcrumbId = `${canonical}#breadcrumb`

    const termGroups = post?._embedded?.['wp:term'] || []
    const authors: any[] = []
    let catName = ''
    let catLink = ''
    for (const g of termGroups) {
      if (!Array.isArray(g)) continue
      for (const t of g) {
        if (t.taxonomy === 'author') authors.push({ '@type': 'Person', name: decodeHtml(t.name), url: t.link })
        if (t.taxonomy === 'category' && !catName) { catName = decodeHtml(t.name); catLink = t.link }
      }
    }

    const authorUrl = authors[0]?.url

    let tagNames: string[] = []
    const tagIds = Array.isArray(post.tags) ? post.tags : []
    if (tagIds.length) {
      const terms = await wpJson(`${WP}/tags?include=${tagIds.join(',')}&per_page=100&_fields=name`)
      if (Array.isArray(terms)) tagNames = terms.map((t: any) => decodeHtml(t.name))
    }

    const bodyText = htmlToText(post.content?.rendered || '')
    const articleBody = bodyText ? bodyText.slice(0, 50 * 1024) : undefined
    const wordCount = bodyText ? bodyText.split(/\s+/).filter(Boolean).length : undefined

    const jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'NewsArticle',
          '@id': `${canonical}#article`,
          headline: title,
          description,
          image: hero?.url ? [{ '@type': 'ImageObject', url: hero.url, width: hero.width || undefined, height: hero.height || undefined, caption: hero.caption || undefined }] : [],
          datePublished: `${post.date}+08:00`,
          dateModified: `${post.modified || post.date}+08:00`,
          author: authors.length ? authors : [{ '@type': 'Person', name: 'The Sun Malaysia' }],
          publisher: { '@id': `${SITE_URL}/#organization` },
          mainEntityOfPage: { '@id': webpageId },
          articleSection: catName || undefined,
          keywords: tagNames.join(', ') || undefined,
          inLanguage: lang,
          isPartOf: { '@id': webpageId },
          isAccessibleForFree: true,
          copyrightHolder: { '@id': `${SITE_URL}/#organization` },
          copyrightYear: post.date ? new Date(post.date).getFullYear() : undefined,
          articleBody,
          wordCount,
          ...(malay ? {} : {
            accessibilityFeature: ['textToSpeech', 'alternativeText'],
            accessibilityControl: ['fullAudioControl', 'fullKeyboardControl', 'fullMouseControl', 'fullTouchControl'],
            accessibilitySummary: 'Includes an in-page text-to-speech “Listen” player.',
          }),
        },
        {
          '@type': 'WebPage',
          '@id': webpageId,
          url: canonical,
          name: title,
          isPartOf: { '@id': `${SITE_URL}/#website` },
          primaryImageOfPage: hero?.url ? { '@type': 'ImageObject', url: hero.url } : undefined,
          breadcrumb: { '@id': breadcrumbId },
          inLanguage: lang,
        },
        {
          '@type': 'BreadcrumbList',
          '@id': breadcrumbId,
          itemListElement: [
            { '@type': 'ListItem', position: 1, item: { '@id': SITE_URL, name: 'Home' } },
            ...(catName ? [{ '@type': 'ListItem', position: 2, item: catLink ? { '@id': catLink, name: catName } : { name: catName } }] : []),
            { '@type': 'ListItem', position: catName ? 3 : 2, item: { '@id': canonical }, name: title },
          ],
        },
      ],
    }

    return {
      title, description, image,
      imageWidth: hero?.width, imageHeight: hero?.height, imageAlt: hero?.alt || title,
      type: 'article', canonical, lang, locale: malay ? 'ms_MY' : 'en_MY',
      robots: 'index, follow, max-snippet:-1, max-video-preview:-1, max-image-preview:large',
      publishedTime: `${post.date}+08:00`, modifiedTime: `${post.modified || post.date}+08:00`,
      section: catName, tagNames, authorUrl, jsonLd,
    }
  }

  const cats = await wpJson(`${WP}/categories?slug=${encodeURIComponent(last)}&_fields=name,description,link,count`)
  const cat = Array.isArray(cats) ? cats.find((c: any) => stripTrail(c.link) === norm) || (segs.length === 1 ? cats[0] : null) : null
  if (cat) {
    const name = decodeHtml(cat.name)
    return {
      title: `${name} News`,
      description: stripHtml(cat.description || `Latest ${name} news on The Sun Malaysia.`, 200),
      image: DEFAULT_OG, type: 'website', canonical: `${SITE_URL}${norm}/`, robots: 'index,follow',
      jsonLd: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${name} News`, url: `${SITE_URL}${norm}/` },
    }
  }

  if (segs.length === 1) {
    const pages = await wpJson(`${WP}/pages?slug=${encodeURIComponent(last)}&_fields=title,excerpt,link`)
    const page = Array.isArray(pages) && pages[0]
    if (page) {
      return {
        title: decodeHtml(page.title?.rendered || 'Page'),
        description: stripHtml(page.excerpt?.rendered, 200),
        image: DEFAULT_OG, type: 'article', canonical: `${SITE_URL}${norm}/`, robots: 'index,follow',
      }
    }
  }

  const notFound = postsEmpty && segs.length >= 2 && !norm.startsWith('/admin')
  return {
    title: notFound ? 'Page not found' : 'The Sun Malaysia | Latest Trending News',
    description: 'Latest Malaysia news, breaking headlines, business, lifestyle and more.',
    image: DEFAULT_OG, type: 'website', canonical: `${SITE_URL}${norm}/`,
    robots: notFound ? 'noindex,follow' : 'index,follow',
    notFound,
  }
})
