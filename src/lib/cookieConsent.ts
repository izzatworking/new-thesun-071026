// Cookie consent storage + helpers.
// Consent is persisted in localStorage so it survives reloads/tabs, and a
// 'cookieconsentchange' window event is dispatched on every save so any part
// of the app (GA init, ad tags, embeds) can react without importing React.
//
// Usage elsewhere in the app, e.g. before loading Google Analytics:
//   import { hasConsent } from '@/lib/cookieConsent'
//   if (hasConsent('performance')) { /* load GA */ }
//
// To open the preference center from anywhere (e.g. a footer "Cookie
// Settings" link), without needing a ref to <CookieConsentBar />:
//   import { openCookiePreferences } from '@/lib/cookieConsent'
//   <button onClick={openCookiePreferences}>Cookie Settings</button>

import { useEffect, useState, useCallback } from 'react'

const STORAGE_KEY = 'thesun-cookie-consent'
const CONSENT_VERSION = 1
const OPEN_EVENT = 'open-cookie-preferences'
const CHANGE_EVENT = 'cookieconsentchange'

const DEFAULT_CHOICES = { functional: true, performance: true, targeting: true }

export function getStoredConsent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.version !== CONSENT_VERSION) return null
    return parsed
  } catch (e) {
    return null
  }
}

// categories: { functional, performance, targeting } — necessary is implicit/always true.
export function saveConsent(
  categories: { functional?: boolean; performance?: boolean; targeting?: boolean } = {}
) {
  const record = {
    version: CONSENT_VERSION,
    necessary: true,
    functional: !!categories.functional,
    performance: !!categories.performance,
    targeting: !!categories.targeting,
    decidedAt: new Date().toISOString(),
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  } catch (e) {
    // private browsing / storage disabled — consent just won't persist across reloads
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: record }))
  }
  return record
}

export function hasConsent(category) {
  if (category === 'necessary') return true
  const stored = getStoredConsent()
  return stored ? !!stored[category] : false
}

export function openCookiePreferences() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_EVENT))
  }
}

// React hook for components that need live consent state (e.g. to
// conditionally mount a YouTube embed or an ad slot).
export function useCookieConsent() {
  const [consent, setConsent] = useState(() => getStoredConsent())

  useEffect(() => {
    const onChange = (e) => setConsent(e.detail)
    window.addEventListener(CHANGE_EVENT, onChange)
    return () => window.removeEventListener(CHANGE_EVENT, onChange)
  }, [])

  const update = useCallback((categories) => saveConsent(categories), [])

  return { consent, hasDecided: !!consent, saveConsent: update }
}

export { STORAGE_KEY, DEFAULT_CHOICES, OPEN_EVENT, CHANGE_EVENT }
