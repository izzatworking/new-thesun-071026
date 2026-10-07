import { useEffect } from 'react'
import { SITE_URL } from '@/lib/urls'
import { SITE } from '../../site.config.mjs'

// Default social share image (site-wide) used when a page has no specific one.
const DEFAULT_OG_IMAGE = SITE.ogImage

export type SeoOptions = {
  title?: string
  description?: string
  image?: string
  imageWidth?: number
  imageHeight?: number
  imageAlt?: string
  type?: string
  url?: string
  jsonLd?: any
  robots?: string
  lang?: string
  locale?: string
  publishedTime?: string
  modifiedTime?: string
  section?: string
  tags?: any
  authorUrl?: string
  twitterCreator?: string
}

// DOM-based SEO hook for an SPA. Updates title + meta tags on mount and resets
// them on unmount. Canonicals always point at the production host (SITE_URL).
export default function useSeo({
  title,
  description,
  image,
  imageWidth,
  imageHeight,
  imageAlt,
  type = 'website',
  url,
  jsonLd,
  robots,
  lang,
  locale,
  publishedTime,
  modifiedTime,
  section,
  tags,
  authorUrl,
  twitterCreator,
}: SeoOptions = {}) {
  useEffect(() => {
    document.documentElement.lang = lang || 'en-MY'

    const prevTitle = document.title
    if (title) document.title = title.includes(SITE.brand) ? title : `${title} | ${SITE.brand}`

    const tagsCreated = []

    function setMeta(attr, name, content) {
      if (content === undefined || content === null || content === '') return
      let el = document.querySelector(`meta[${attr}="${name}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, name)
        document.head.appendChild(el)
        tagsCreated.push(el)
      }
      el.setAttribute('content', content)
    }

    const canonicalUrl = url || `${SITE_URL}${window.location.pathname}`
    const ogImage = image || DEFAULT_OG_IMAGE
    const ogWidth = imageWidth || (image ? undefined : SITE.logoWidth)
    const ogHeight = imageHeight || (image ? undefined : SITE.logoHeight)

    setMeta('name', 'description', description)
    setMeta('name', 'robots', robots)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:type', type)
    setMeta('property', 'og:image', ogImage)
    setMeta('property', 'og:image:width', ogWidth)
    setMeta('property', 'og:image:height', ogHeight)
    setMeta('property', 'og:image:alt', imageAlt || title)
    setMeta('property', 'og:url', canonicalUrl)
    setMeta('property', 'og:site_name', SITE.brand)
    setMeta('property', 'og:locale', locale || 'en_MY')
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', ogImage)
    setMeta('name', 'twitter:site', SITE.twitter)
    setMeta('name', 'twitter:creator', twitterCreator || SITE.twitter)

    if (type === 'article') {
      setMeta('property', 'article:published_time', publishedTime)
      setMeta('property', 'article:modified_time', modifiedTime)
      setMeta('property', 'article:section', section)
      setMeta('property', 'article:author', authorUrl)
      // One meta per tag (setMeta would collapse duplicates).
      if (Array.isArray(tags)) {
        tags.forEach((t) => {
          const name = typeof t === 'string' ? t : t?.name
          if (!name) return
          const el = document.createElement('meta')
          el.setAttribute('property', 'article:tag')
          el.setAttribute('content', name)
          document.head.appendChild(el)
          tagsCreated.push(el)
        })
      }
    }

    // canonical link
    let canonical = document.querySelector('link[rel="canonical"]')
    let canonicalCreated = false
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
      canonicalCreated = true
    }
    canonical.setAttribute('href', canonicalUrl)

    // JSON-LD structured data. Remove any per-page schema (including the one the
    // edge injects) so we never end up with two NewsArticle blocks after JS.
    document.querySelectorAll('script[type="application/ld+json"][data-seo="1"]').forEach((el) => el.remove())
    let ldScript = null
    if (jsonLd) {
      ldScript = document.createElement('script')
      ldScript.setAttribute('type', 'application/ld+json')
      ldScript.setAttribute('data-seo', '1')
      ldScript.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(ldScript)
    }

    return () => {
      document.title = prevTitle
      tagsCreated.forEach(el => el.remove())
      if (canonicalCreated && canonical) canonical.remove()
      if (ldScript) ldScript.remove()
    }
  }, [title, description, image, imageWidth, imageHeight, imageAlt, type, url, robots, lang, locale, publishedTime, modifiedTime, section, JSON.stringify(tags), JSON.stringify(jsonLd)])
}
