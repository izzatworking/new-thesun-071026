// Ads Manager auth — talks only to our own Cloudflare Function (/api/ads/*).
// The admin username/password live in Cloudflare secrets; the browser only
// ever holds a short-lived token (sessionStorage), never the credentials.
const TOKEN_KEY = 'thesun_ads_token'

export function getToken() {
  try { return sessionStorage.getItem(TOKEN_KEY) } catch { return null }
}
export function setToken(t) {
  try { t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY) } catch { /* noop */ }
}
export function isLoggedIn() {
  return Boolean(getToken())
}

export async function login(user, pass) {
  try {
    const res = await fetch('/api/ads/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, pass }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.token) {
      return { success: false, error: data.error === 'invalid_credentials' ? 'Invalid username or password.' : 'Login failed. Try again.' }
    }
    setToken(data.token)
    return { success: true, error: null }
  } catch {
    return { success: false, error: 'Network error. Try again.' }
  }
}

export function logout() {
  setToken(null)
  fetch('/api/ads/logout', { method: 'POST' }).catch(() => {})
}

// Save (or clear) a slot. Returns { ok, error }.
export async function saveSlot(slot, code) {
  const token = getToken()
  try {
    const res = await fetch('/api/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ slot, code }),
    })
    if (res.status === 401) { setToken(null); return { ok: false, error: 'unauthorized' } }
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok && data.ok, error: data.error }
  } catch {
    return { ok: false, error: 'network_error' }
  }
}
