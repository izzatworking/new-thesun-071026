import { useEffect, useState, useRef } from 'react'
import { X, Share, PlusSquare, Download } from 'lucide-react'

const SHOW_AFTER_MS = 7000          // pop up ~7s after landing, inside the requested 5-10s window
const DISMISS_COOLDOWN_DAYS = 14    // don't nag again for a while after "Not now"
const STORAGE_KEY = 'thesun-a2hs-dismissed-at'

function isIos() {
  const ua = window.navigator.userAgent
  const iOSDevice = /iphone|ipad|ipod/i.test(ua)
  // iPadOS 13+ reports as Mac but has touch support
  const iPadOS13 = /Macintosh/.test(ua) && 'ontouchend' in document
  return iOSDevice || iPadOS13
}

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true // legacy iOS Safari flag
  )
}

function recentlyDismissed() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const dismissedAt = parseInt(raw, 10)
    if (Number.isNaN(dismissedAt)) return false
    const days = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24)
    return days < DISMISS_COOLDOWN_DAYS
  } catch {
    return false
  }
}

function markDismissed() {
  try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch { /* noop */ }
}

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false)
  const [platform, setPlatform] = useState(null) // 'native' | 'ios'
  const deferredPromptRef = useRef(null)

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return

    let timer = null

    function onBeforeInstallPrompt(e) {
      e.preventDefault()
      deferredPromptRef.current = e
      timer = setTimeout(() => {
        setPlatform('native')
        setVisible(true)
      }, SHOW_AFTER_MS)
    }

    function onAppInstalled() {
      setVisible(false)
      deferredPromptRef.current = null
      markDismissed()
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

    // iOS Safari never fires beforeinstallprompt — fall back to manual instructions.
    if (isIos()) {
      timer = setTimeout(() => {
        setPlatform('ios')
        setVisible(true)
      }, SHOW_AFTER_MS)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
      if (timer) clearTimeout(timer)
    }
  }, [])

  function dismiss() {
    setVisible(false)
    markDismissed()
  }

  async function handleInstall() {
    const deferred = deferredPromptRef.current
    if (!deferred) { setVisible(false); return }
    deferred.prompt()
    try {
      await deferred.userChoice
    } finally {
      deferredPromptRef.current = null
      setVisible(false)
      markDismissed()
    }
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Install The Sun Malaysia app"
      className="fixed inset-x-0 bottom-0 z-[200] sm:bottom-4 sm:right-4 sm:left-auto sm:max-w-sm px-3 pb-3 sm:px-0 sm:pb-0 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-border overflow-hidden">
        <div className="flex items-start gap-3 p-4">
          <div className="shrink-0 w-11 h-11 rounded-lg overflow-hidden border border-border">
            <img src="/icons/icon-192.png" alt="" aria-hidden="true" className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-snug">Install The Sun Malaysia App</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              {platform === 'ios'
                ? 'Add The Sun Malaysia to your Home Screen for one-tap access and a faster, full-screen experience.'
                : 'Get one-tap access, offline reading, and a faster, full-screen experience.'}
            </p>
          </div>

          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="shrink-0 p-1 -mr-1 -mt-1 text-muted-foreground hover:text-foreground rounded-md"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {platform === 'ios' ? (
          <div className="px-4 pb-4 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 bg-muted rounded-md px-2 py-1">
              Tap <Share className="h-3.5 w-3.5" />
            </span>
            <span>then</span>
            <span className="inline-flex items-center gap-1 bg-muted rounded-md px-2 py-1">
              <PlusSquare className="h-3.5 w-3.5" /> Add to Home Screen
            </span>
          </div>
        ) : (
          <div className="px-4 pb-4 flex items-center gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg px-3 py-2 transition-colors"
            >
              <Download className="h-4 w-4" /> Install
            </button>
            <button
              onClick={dismiss}
              className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2"
            >
              Not now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
