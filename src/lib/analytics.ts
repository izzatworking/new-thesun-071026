// Consent-gated GA4 loader + SPA page_view tracking.
// Nothing loads until the visitor grants the "performance" consent category.
import { hasConsent } from '@/lib/cookieConsent'

const MEASUREMENT_ID = 'G-SY4JJ4KEW8'
let loaded = false

export function ensureGA() {
  if (loaded || typeof window === 'undefined' || !hasConsent('performance')) return
  loaded = true

  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  document.head.appendChild(s)

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() { window.dataLayer.push(arguments) }
  window.gtag('js', new Date())
  window.gtag('config', MEASUREMENT_ID, { send_page_view: false })
}

export function trackPageView() {
  if (!loaded || typeof window.gtag !== 'function') return
  window.gtag('event', 'page_view', {
    page_location: window.location.href,
    page_path: window.location.pathname + window.location.search,
    page_title: document.title,
  })
}
