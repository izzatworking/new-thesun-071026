import { useEffect } from 'react'
import { useLocation } from '@/lib/router'
import { ensureGA, trackPageView } from '@/lib/analytics'

// Loads GA4 only after "performance" consent, and sends a page_view on every
// SPA route change (so GA4 keeps receiving data after the front end replaces WordPress).
export default function Analytics() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    ensureGA()
    const onChange = () => ensureGA()
    window.addEventListener('cookieconsentchange', onChange)
    return () => window.removeEventListener('cookieconsentchange', onChange)
  }, [])

  useEffect(() => {
    ensureGA()
    // Don't track admin screens.
    if (!window.location.pathname.startsWith('/admin')) trackPageView()
  }, [pathname, search])

  return null
}
