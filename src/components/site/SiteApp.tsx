'use client'

// Faithful port of the old react-router `Router` in App.jsx. Routing is decided
// entirely on the client from the current pathname/search, which keeps every
// WordPress permalink (articles, nested categories, tags, pagination, pages)
// working exactly as before under the Next.js catch-all route.
import { useEffect } from 'react'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import HomePage from '@/views/HomePage'
import ArticlePage from '@/views/ArticlePage'
import CategoryPage from '@/views/CategoryPage'
import TagPage from '@/views/TagPage'
import SearchPage from '@/views/SearchPage'
import SystemsDeskPage from '@/views/SystemsDeskPage'
import LatestPage from '@/views/LatestPage'
import MostViewedPage from '@/views/MostViewedPage'
import VideoPage from '@/views/VideoPage'
import NotFoundPage from '@/views/NotFoundPage'
import PrintDigitalPage from '@/views/PrintDigitalPage'
import BrandingPage from '@/views/BrandingPage'
import PrivacyPolicyPage from '@/views/PrivacyPolicyPage'
import ContactPage from '@/views/ContactPage'
import AboutPage from '@/views/AboutPage'
import DisclaimerPage from '@/views/DisclaimerPage'
import AdvertisePage from '@/views/AdvertisePage'
import TermsPage from '@/views/TermsPage'
import WpPage from '@/views/WpPage'
import AuthorPage from '@/views/AuthorPage'
import AdsManagerPage from '@/views/AdsManagerPage'
import InstallPrompt from '@/components/site/InstallPrompt'
import BackToTop from '@/components/site/BackToTop'
import CookieConsentBar from '@/components/site/CookieConsentBar'
import Analytics from '@/components/site/Analytics'
import { CATEGORY_PATH_SET } from '@/lib/categories'
import { parseLocation } from '@/lib/urls'
import { useLocation } from '@/lib/router'

function ScrollToTop() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname, search])
  return null
}

// Known app pages → component. Paths are the live WordPress slugs (plus a few
// legacy aliases kept so old links don't break).
const STATIC_PAGES: Record<string, React.ComponentType<any>> = {
  '/privacy-policy': PrivacyPolicyPage,
  '/terms': TermsPage,
  '/disclaimer': DisclaimerPage,
  '/branding': BrandingPage,
  '/about-us': AboutPage,
  '/about': AboutPage,
  '/contact-us': ContactPage,
  '/contact': ContactPage,
  '/advertise-with-us': AdvertisePage,
  '/advertise': AdvertisePage,
  '/subscribe-now': PrintDigitalPage,
  '/get-newspaper': PrintDigitalPage,
  '/systems-desk': SystemsDeskPage,
  '/latest': LatestPage,
  '/most-viewed': MostViewedPage,
  '/videos': VideoPage,
  '/category/videos': VideoPage,
  '/admin/ads-manager': AdsManagerPage,
}

function AuthorPageRoute({ slug, page }: { slug?: string; page?: number }) {
  if (!slug) return <NotFoundPage />
  return <AuthorPage slug={slug} page={page} />
}

function Router() {
  const location = useLocation()
  const { path, segments, page } = parseLocation(location.pathname, location.search)
  const params = new URLSearchParams(location.search)

  // Search (live uses /?s=)
  if (params.has('s')) return <SearchPage />

  if (path === '/') return <HomePage />
  if (path === '/search') return <SearchPage />

  if (path.startsWith('/tag/')) {
    const slug = segments[1]
    if (slug) return <TagPage slug={slug} page={page} />
    return <NotFoundPage />
  }

  if (path.startsWith('/author/')) return <AuthorPageRoute slug={segments[1]} page={page} />

  const Static = STATIC_PAGES[path]
  if (Static) return <Static page={page} />

  // Category archive: exact match against the live category path set.
  const catKey = path.replace(/^\//, '')
  if (CATEGORY_PATH_SET.has(catKey)) {
    const slug = segments[segments.length - 1]
    return <CategoryPage slug={slug} page={page} />
  }

  // Single-segment path → a WordPress page (e.g. /ipaper/)
  if (segments.length === 1) {
    return <WpPage slug={segments[0]} />
  }

  // Otherwise → article: /<category-path>/<slug>/
  const slug = segments[segments.length - 1]
  if (slug) return <ArticlePage slug={slug} />

  return <NotFoundPage />
}

export default function SiteApp() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <ScrollToTop />
      <Analytics />
      <SiteHeader />
      <main className="flex-1">
        <Router />
      </main>
      <SiteFooter />
      <InstallPrompt />
      <BackToTop />
      <CookieConsentBar />
    </div>
  )
}
