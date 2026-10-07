// URL helpers that mirror the live WordPress permalink structure
// (/%category%/%postname%/, no /category/ base, trailing slash).
//
// The most reliable source of truth is WordPress itself: every post/category
// object returned by the REST API includes a `link` holding its exact live
// path. We prefer that, and fall back to the static category map for
// slug-only call sites (menus, footers, "view more" links).

import { categoryPathBySlug, categoryPathById } from '@/lib/categories'
import { SITE } from '../../site.config.mjs'

export const SITE_URL = SITE.url

// Normalise any WP `link` to a rooted path with a trailing slash.
export function wpPath(link) {
  if (!link) return null
  try {
    const u = new URL(link)
    let p = u.pathname
    if (!p.startsWith('/')) p = '/' + p
    if (!p.endsWith('/')) p += '/'
    return p
  } catch {
    return null
  }
}

// Article URL: /<full-category-path>/<slug>/
export function articlePath(post) {
  if (!post) return '#'
  const fromLink = wpPath(post.link)
  if (fromLink) return fromLink
  const slug = typeof post === 'string' ? post : post.slug
  return `/article/${slug}`
}

// Category URL: /<full-category-path>/
// Accepts a category object (prefers its live `link`), a slug string, or a
// numeric category id.
export function categoryUrl(catOrSlug) {
  if (!catOrSlug) return '#'
  if (typeof catOrSlug === 'object') {
    const fromLink = wpPath(catOrSlug.link)
    if (fromLink) return fromLink
    if (catOrSlug.id) {
      const p = categoryPathById(catOrSlug.id)
      if (p) return `/${p}/`
    }
    if (catOrSlug.slug) return categoryUrl(catOrSlug.slug)
    return '#'
  }
  if (typeof catOrSlug === 'number') {
    const p = categoryPathById(catOrSlug)
    return p ? `/${p}/` : '#'
  }
  const p = categoryPathBySlug(catOrSlug)
  return p ? `/${p}/` : `/${catOrSlug}/`
}

// Tag URL: /tag/<slug>/
export function tagUrl(slug) {
  return `/tag/${slug}/`
}

// Rewrite an existing same-site path built with the old scheme
// (/article/… , /category/…) or a bare query into the live-style path.
// Used as a safety net so nothing emits legacy URLs.
export function toCanonicalPath(to, categoriesBySlug = {}) {
  if (!to || typeof to !== 'string') return to
  if (/^https?:\/\//.test(to) || to.startsWith('#')) return to
  const [pathPart, query = ''] = to.split('?')
  const clean = pathPart.replace(/\/+$/, '')
  const mArticle = clean.match(/^\/article\/(.+)$/)
  if (mArticle) return `/article/${mArticle[1]}/` // no category info here
  const mCat = clean.match(/^\/category\/(.+)$/)
  if (mCat) return categoryUrl(categoriesBySlug[mCat[1]] || mCat[1])
  return query ? `${clean}/?${query}` : `${clean}/`
}

// Pagination URL for an archive: /<path>/page/<n>/
export function pageUrl(basePath, n) {
  const base = (basePath || '/').replace(/\/+$/, '')
  if (!n || n <= 1) return `${base}/`
  return `${base}/page/${n}/`
}

// Archive pagination: page 1 shows 13 (1 hero + 12 cards); later pages show 12.
// Uses offset-based paging so no post is skipped when the page size changes.
export const ARCHIVE_FIRST_PAGE = 13
export const ARCHIVE_PER_PAGE = 12
export function archiveOffset(page) {
  return page <= 1 ? 0 : ARCHIVE_FIRST_PAGE + (page - 2) * ARCHIVE_PER_PAGE
}
export function archivePerPage(page) {
  return page <= 1 ? ARCHIVE_FIRST_PAGE : ARCHIVE_PER_PAGE
}
export function archiveTotalPages(total) {
  const t = Number(total) || 0
  if (t <= ARCHIVE_FIRST_PAGE) return t > 0 ? 1 : 0
  return 1 + Math.ceil((t - ARCHIVE_FIRST_PAGE) / ARCHIVE_PER_PAGE)
}

// Parse the current location into { path, segments, page }.
export function parseLocation(pathname, search = '') {
  let path = pathname.split('?')[0]
  if (!path.startsWith('/')) path = '/' + path
  const pageMatch = path.replace(/\/+$/, '').match(/^(.*)\/page\/(\d+)$/)
  let page = 1
  if (pageMatch) {
    page = parseInt(pageMatch[2], 10) || 1
    path = pageMatch[1] || '/'
  }
  path = path.replace(/\/+$/, '') || '/'
  const segments = path.split('/').filter(Boolean)
  return { path, segments, page, search }
}
