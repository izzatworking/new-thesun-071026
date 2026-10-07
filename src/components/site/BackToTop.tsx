import { useState, useEffect } from 'react'
import { ChevronUp } from 'lucide-react'

// Floating "back to top" button — mirrors the Prev/Next pagination buttons
// used in HomePage's "Latest News" card (border + rounded + primary hover),
// but rendered as a solid primary pill so it reads clearly over any section
// of the page, matching the site's other floating/sticky controls (SiteHeader,
// InstallPrompt).
export default function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`fixed bottom-6 right-5 z-40 w-11 h-11 flex items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 border border-white/15 hover:bg-primary/90 transition-all duration-300 ease-in-out ${
        visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ChevronUp className="h-5 w-5" strokeWidth={2.75} />
    </button>
  )
}
