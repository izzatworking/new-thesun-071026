import { Suspense } from 'react'
import SiteApp from '@/components/site/SiteApp'

// Rendered with a real 404 status for genuinely-missing multi-segment paths,
// while still showing the SPA's own "not found" view.
export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <Suspense fallback={null}>
      <SiteApp />
    </Suspense>
  )
}
