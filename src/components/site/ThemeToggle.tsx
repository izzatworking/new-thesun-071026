import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

const STORAGE_KEY = 'thesun-theme'

// Reads the initial theme once, before paint would otherwise flash the
// wrong colors: explicit saved choice wins, else fall back to the OS
// preference. Safe to call during render (no window access on the server).
function getInitialTheme() {
  if (typeof window === 'undefined') return 'light'
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'dark' || saved === 'light') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Small dark/light toggle — sized and styled to match the other icon-only
// buttons already sitting in the dark ticker bars (SiteHeader's search icon,
// BreakingTicker's social icons): same p-1.5, white/80 → white hover, and
// rounded hover chip, so it drops in without looking bolted on.
export default function ThemeToggle({ size = 'sm', className = '' }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'

  return (
    <button
      onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`p-1.5 rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors ${className}`}
    >
      {theme === 'dark'
        ? <Sun className={iconSize} />
        : <Moon className={iconSize} />}
    </button>
  )
}
