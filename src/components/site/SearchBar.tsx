import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from '@/lib/router'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { buildUrl, decodeHtml } from '@/lib/wp'
import { articlePath } from '@/lib/urls'

const MODES = [
  { key: 'articles', label: 'Articles' },
  { key: 'authors', label: 'Authors' },
]

export default function SearchBar({ onSubmit }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState('articles')
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  useEffect(() => {
    if (q.trim().length < 3) { setResults([]); return }
    let cancelled = false
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const url = mode === 'authors'
          ? `/api/authors?q=${encodeURIComponent(q.trim())}&page=1`
          : buildUrl('/posts', { per_page: 6, search: q, _fields: 'id,slug,title,date,link' })
        const res = await fetch(url)
        if (res.ok && !cancelled) {
          const data = await res.json()
          setResults(Array.isArray(data) ? data : [])
          setOpen(true)
        }
      } catch (e) { /* noop */ }
      finally { if (!cancelled) setLoading(false) }
    }, 350)
    return () => { cancelled = true; clearTimeout(t) }
  }, [q, mode])

  function pickMode(next) {
    setMode(next)
    setResults([])
    if (q.trim().length >= 3) setOpen(true)
  }

  function submit(e) {
    e.preventDefault()
    if (!q.trim()) return
    const base = `/?s=${encodeURIComponent(q.trim())}`
    navigate(mode === 'authors' ? `${base}&type=author` : base)
    setOpen(false)
    if (onSubmit) onSubmit()
  }

  return (
    <div ref={ref} className="relative">
      {/* Articles | Authors toggle */}
      <div className="flex items-center gap-1.5 mb-1.5">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => pickMode(m.key)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border transition-colors ${
              mode === m.key
                ? 'bg-primary text-white border-primary'
                : 'border-border text-muted-foreground hover:text-primary hover:border-primary'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder={mode === 'authors' ? 'Search authors...' : 'Search news, topics...'}
          className="pl-9 pr-10 h-10 bg-muted/50 border-border focus:bg-white text-foreground caret-foreground"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
      </form>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white text-foreground rounded-md border border-border shadow-lg overflow-hidden z-50 max-h-[60vh] overflow-y-auto">
          {mode === 'authors'
            ? results.map((a) => (
                <Link
                  key={a.id || a.slug}
                  to={`/author/${a.slug}/`}
                  onClick={() => { setOpen(false); setQ(''); if (onSubmit) onSubmit() }}
                  className="block px-3 py-2.5 hover:bg-muted border-b border-border last:border-0"
                >
                  <div className="text-sm font-medium line-clamp-1">{decodeHtml(a.name || '')}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {typeof a.count === 'number' ? `${a.count.toLocaleString()} articles` : 'Author'}
                  </div>
                </Link>
              ))
            : results.map((r) => (
                <Link
                  key={r.id}
                  to={articlePath(r)}
                  onClick={() => { setOpen(false); setQ(''); if (onSubmit) onSubmit() }}
                  className="block px-3 py-2.5 hover:bg-muted border-b border-border last:border-0"
                >
                  <div className="text-sm font-medium line-clamp-2">{decodeHtml(r.title?.rendered || '')}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{new Date(r.date).toLocaleDateString('en-MY')}</div>
                </Link>
              ))}
          <Link
            to={mode === 'authors' ? `/?s=${encodeURIComponent(q)}&type=author` : `/?s=${encodeURIComponent(q)}`}
            onClick={() => { setOpen(false); if (onSubmit) onSubmit() }}
            className="block px-3 py-2.5 text-center text-sm font-semibold text-primary hover:bg-muted"
          >
            See all {mode === 'authors' ? 'authors' : 'results'} for "{q}" →
          </Link>
        </div>
      )}
    </div>
  )
}
