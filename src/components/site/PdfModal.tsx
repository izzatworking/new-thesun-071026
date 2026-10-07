import { useEffect } from 'react'
import { X, ExternalLink } from 'lucide-react'

/**
 * Full-screen PDF viewer modal.
 * - Renders the PDF in an <iframe> (native browser PDF viewer).
 * - Close button pinned to the top-right corner.
 * - "Open in new tab" fallback for mobile browsers that don't render
 *   PDFs inline inside an iframe.
 * - Closes on Escape key or backdrop click; locks body scroll while open.
 */
export default function PdfModal({ open, onClose, src, title }) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 flex items-stretch justify-center sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="relative bg-white w-full h-full sm:h-[92vh] sm:max-w-5xl sm:rounded-lg overflow-hidden flex flex-col shadow-2xl">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-white shrink-0">
          <p className="font-semibold text-sm sm:text-base truncate">{title}</p>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open in new tab
            </a>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 flex items-center justify-center rounded-full border border-border hover:bg-muted hover:border-primary hover:text-primary transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PDF viewer */}
        <div className="flex-1 bg-muted/40 min-h-0">
          <iframe src={src} title={title} className="w-full h-full border-0" />
        </div>

        {/* Mobile fallback link, in case inline iframe rendering isn't supported */}
        <div className="sm:hidden px-4 py-2 border-t border-border bg-white shrink-0">
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-sm text-primary font-medium py-1"
          >
            <ExternalLink className="h-4 w-4" />
            Open PDF in new tab
          </a>
        </div>
      </div>
    </div>
  )
}
