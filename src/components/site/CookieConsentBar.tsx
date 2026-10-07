import { useState, useEffect, useCallback } from 'react'
import { Cookie } from 'lucide-react'
import Logo from './Logo'
import CookiePolicyModal from './CookiePolicyModal'
import { getStoredConsent, saveConsent, OPEN_EVENT } from '@/lib/cookieConsent'

export default function CookieConsentBar() {
  const [visible, setVisible] = useState(false)
  const [policyOpen, setPolicyOpen] = useState(false)

  // Show the bar only if the visitor hasn't decided yet.
  useEffect(() => {
    if (!getStoredConsent()) setVisible(true)
  }, [])

  // Lets any part of the app (e.g. a footer "Cookie Settings" link) reopen
  // the preference center without needing a ref to this component.
  useEffect(() => {
    const openHandler = () => setPolicyOpen(true)
    window.addEventListener(OPEN_EVENT, openHandler)
    return () => window.removeEventListener(OPEN_EVENT, openHandler)
  }, [])

  const handleAllowAll = useCallback(() => {
    saveConsent({ functional: true, performance: true, targeting: true })
    setVisible(false)
  }, [])

  const handleModalSave = useCallback((categories) => {
    saveConsent(categories)
    setPolicyOpen(false)
    setVisible(false)
  }, [])

  const handleModalClose = useCallback(() => {
    setPolicyOpen(false)
  }, [])

  return (
    <>
      {visible && !policyOpen && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="Cookie consent"
          className="fixed z-[100] bottom-4 left-4 right-4 sm:right-auto sm:w-[400px] rounded-xl border border-border bg-white shadow-2xl shadow-black/20 p-5"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <Logo size="sm" />
            <span className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-white shrink-0">
              <Cookie className="h-4 w-4" />
            </span>
          </div>
          <p className="text-sm leading-relaxed text-foreground/85">
            We use cookies to improve your browsing experience. By clicking <em>"Allow All"</em>, you agree
            to our use of cookies. Read our{' '}
            <button
              type="button"
              onClick={() => setPolicyOpen(true)}
              className="font-bold text-primary hover:underline"
            >
              Cookie Policy
            </button>{' '}
            to learn more.
          </p>
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={handleAllowAll}
              className="px-6 py-2.5 rounded-md bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-colors"
            >
              Allow All
            </button>
          </div>
        </div>
      )}

      {policyOpen && <CookiePolicyModal onClose={handleModalClose} onSave={handleModalSave} />}
    </>
  )
}
