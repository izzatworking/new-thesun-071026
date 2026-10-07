import { useState, useEffect } from 'react'
import { X, Star, Download } from 'lucide-react'
import appIconSun from '@/assets/app-icon-sun.png'
import { appStoreUrl } from '@/lib/app'

const SHOW_DELAY_MS = 30000   // bar appears 30s after the page loads
const AUTO_HIDE_MS = 60000    // bar auto-disappears at the 1-minute mark
                               // (i.e. stays visible for 30s if not closed manually)

export default function AppDownloadBar({
  onVisibleChange,
}: {
  onVisibleChange?: (visible: boolean) => void
} = {}) {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const isShown = visible && !dismissed

  useEffect(() => {
    if (dismissed) return
    const showTimer = setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    const hideTimer = setTimeout(() => setVisible(false), AUTO_HIDE_MS)
    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [dismissed])

  // Tell the parent (SiteHeader) whenever this bar mounts/unmounts. The
  // header's own dark ticker row also pads itself for the safe-area inset —
  // it needs to, since it becomes the first thing on the page once this bar
  // is gone — but it must NOT do that at the same time this bar is showing,
  // or the inset gets applied twice in a row (this bar's own top padding,
  // then the ticker's), which shows up as a big empty gap above the ticker
  // text on notched phones. onVisibleChange is how the header knows which
  // state it's in.
  useEffect(() => {
    onVisibleChange?.(isShown)
  }, [isShown, onVisibleChange])

  function handleClose() {
    setVisible(false)
    setDismissed(true)
  }

  if (!isShown) return null

  return (
    // lg:hidden -> mobile + tablet only, never rendered (or laid out) on desktop.
    // IMPORTANT: this bar is intentionally NOT `fixed`. It must render as a
    // normal block at the very top of the page so that mounting it pushes
    // the sticky header / BreakingTicker / page content down by its own
    // height, and unmounting it (close button, or the auto-hide timer)
    // lets everything reflow back up. A fixed/overlay bar here would sit
    // on top of the header instead of displacing it, clipping the logo,
    // weather widget and nav icons underneath — that was the bug.
    <div className="lg:hidden relative z-[60]">
      {/* No shadow here on purpose: a drop-shadow would blur out past this
          bar's bottom edge and read as a visible seam/gap against the
          BreakingTicker sitting flush underneath it. */}
      <div className="bg-primary text-white" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {/* This inner wrapper is the positioning container for the close
            button. It must NOT carry the safe-area padding itself — an
            absolutely positioned child measures its offset from inside the
            padding box of its positioned ancestor, so if the padding lived
            here the close button would sit inside the notch/status-bar
            inset instead of below it. Padding stays on the outer div above;
            this div starts exactly where the visible red bar starts. */}
        <div className="relative">
          <button
            onClick={handleClose}
            aria-label="Close app download reminder"
            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full border border-white/50 flex items-center justify-center text-white/90 hover:bg-white/10 transition-colors z-10"
          >
            <X className="h-3 w-3" />
          </button>

          <div className="container mx-auto px-4 py-2.5 flex items-center gap-3">
            {/* App icon */}
            <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shadow-sm bg-white">
              <img src={appIconSun.src} alt="The Sun Malaysia app icon" className="w-full h-full object-cover" />
            </div>

            {/* Name, publisher, rating */}
            <div className="flex-1 min-w-0 pr-6">
              <p className="font-extrabold text-sm sm:text-lg leading-tight truncate">The Sun Malaysia</p>
              <p className="text-[10px] sm:text-xs text-white/85 leading-tight truncate">Sun Media Corporation Sdn Bhd</p>
              <div className="flex items-center gap-0.5 mt-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>

            {/* Download button */}
            <DownloadButton href={appStoreUrl()} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------- Download button ----------
// Same look & motion as the supplied design (neumorphic shadow, red gradient
// fill sweeping in over the border, text/icon swap to "Downloading…").
// Triggered on tap via state (not just :hover, which touch devices can't
// rely on) — :hover is kept too so it still works with a mouse/trackpad.
// Must match the `.sunDlBtn.is-downloading::before` transition duration below —
// the gradient needs to finish sweeping across the button before the link opens.
const FILL_ANIMATION_MS = 3000
// Small pause after the fill completes, so the "filled" state is visible for
// a beat before the button resets back to its default look.
const RESET_DELAY_MS = 500

function DownloadButton({ href }) {
  const [downloading, setDownloading] = useState(false)

  function handleClick() {
    if (downloading) return
    setDownloading(true)
    // Popup blockers only allow window.open when it's called synchronously
    // inside the click handler. Calling it later from a setTimeout (as
    // before) gets silently blocked on most mobile browsers — that's why
    // the download hung with no actual navigation happening. Fix: open a
    // blank tab right now (still directly inside the click, so it's
    // allowed), then point that tab at the real URL once the loading
    // animation finishes. Same visual delay, but the navigation goes through.
    const newTab = window.open('', '_blank')
    setTimeout(() => {
      if (newTab) {
        newTab.location.href = href
      } else {
        // Tab was blocked anyway (rare) — fall back to same-tab navigation
        // so the download still happens.
        window.location.href = href
      }
      setTimeout(() => setDownloading(false), RESET_DELAY_MS)
    }, FILL_ANIMATION_MS)
  }

  return (
    <>
      <style>{`
        .sunDlBtn {
          position: relative;
          overflow: hidden;
          border-radius: 10px;
          background: #ffffff;
          border: 1px solid #ff0000;
          box-shadow: 4px 4px 8px #AB0D0D, -4px -4px 8px #CF1717;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          font-weight: 600;
          font-size: 10px;
          letter-spacing: 0.2px;
          cursor: pointer;
          z-index: 1;
        }
        .sunDlBtn::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 0;
          height: 100%;
          border-radius: 10px;
          background-image: linear-gradient(to bottom, #ff0000 0%, #AB0D0D 100%);
          transition: width 0.5s ease;
          z-index: -1;
        }
        .sunDlBtn:hover::before,
        .sunDlBtn.is-downloading::before {
          width: 100%;
          transition: width 3s linear;
        }
        .sunDlBtn__state {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          white-space: nowrap;
          color: #ff0000;
          transition: color 0.3s ease;
        }
        .sunDlBtn__state svg {
          width: 11px;
          height: 11px;
          stroke: #ff0000;
          transition: stroke 0.3s ease;
          flex-shrink: 0;
        }
        .sunDlBtn__state--loading { display: none; }
        .sunDlBtn:hover .sunDlBtn__state--default,
        .sunDlBtn.is-downloading .sunDlBtn__state--default { display: none; }
        .sunDlBtn:hover .sunDlBtn__state--loading,
        .sunDlBtn.is-downloading .sunDlBtn__state--loading {
          display: inline-flex;
          color: #ffffff;
        }
        .sunDlBtn:hover .sunDlBtn__state--loading svg,
        .sunDlBtn.is-downloading .sunDlBtn__state--loading svg { stroke: #ffffff; }
        .sunDlBtn:focus-visible {
          outline: 2px solid #ff4444;
          outline-offset: 2px;
        }
      `}</style>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Download The Sun Malaysia app"
        className={`sunDlBtn shrink-0 w-[104px] sm:w-[122px] h-8 px-2 ${downloading ? 'is-downloading' : ''}`}
      >
        <span className="sunDlBtn__state sunDlBtn__state--default">
          <Download />
          Download Now
        </span>
        <span className="sunDlBtn__state sunDlBtn__state--loading">
          <Download />
          Downloading…
        </span>
      </button>
    </>
  )
}
