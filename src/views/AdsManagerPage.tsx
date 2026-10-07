import { useEffect, useState } from 'react'
import { Save, RotateCcw, Trash2, CheckCircle2, Megaphone, LogOut } from 'lucide-react'
import { SITE_AD_SLOTS, ARTICLE_AD_SLOTS } from '@/lib/adsConfig'
import { useAds, saveSlot } from '@/lib/adsStore'
import { isLoggedIn, logout } from '@/lib/adsAuth'
import AdminLoginGate from '@/components/site/AdminLoginGate'
import useSeo from '@/lib/useSeo'

function Preview({ code, height }) {
  if (!code || !code.trim()) {
    return (
      <div className="flex items-center justify-center h-40 text-xs text-muted-foreground bg-muted/30 rounded">
        No custom code — default banner is showing.
      </div>
    )
  }
  return (
    <iframe
      title="ad-preview"
      srcDoc={code}
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      style={{ width: '100%', height: height || 250, border: 0, display: 'block', background: '#fff' }}
    />
  )
}

function SlotEditor({ slot, saved, onSaved }) {
  const [draft, setDraft] = useState(saved || '')
  const [status, setStatus] = useState(saved ? 'saved' : 'empty')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setDraft(saved || '')
    setStatus(saved ? 'saved' : 'empty')
  }, [saved])

  async function persist(value) {
    setBusy(true)
    const res = await saveSlot(slot.id, value)
    setBusy(false)
    if (res.ok) {
      setStatus(value.trim() ? 'saved' : 'empty')
      onSaved()
    } else if (res.error === 'unauthorized') {
      onSaved()
    } else {
      alert('Save failed: ' + (res.error || 'unknown error'))
    }
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 border-b border-border bg-muted/30">
        <div>
          <h3 className="font-extrabold uppercase tracking-wide text-sm text-foreground">{slot.label}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{slot.location} · {slot.size}</p>
        </div>
        <div className="text-xs font-semibold">
          {status === 'saved' && <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Live</span>}
          {status === 'dirty' && <span className="text-amber-600">Unsaved changes</span>}
          {status === 'empty' && <span className="text-muted-foreground font-medium">Using default banner</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="p-5 border-b lg:border-b-0 lg:border-r border-border space-y-3">
          <textarea
            value={draft}
            onChange={(e) => { setDraft(e.target.value); setStatus('dirty') }}
            placeholder="Paste your ad code here (HTML / CSS / JS)"
            spellCheck={false}
            rows={12}
            className="w-full font-mono text-xs border border-border rounded-md p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => persist(draft)}
              disabled={busy || status === 'saved'}
              className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-md"
            >
              <Save className="h-4 w-4" /> {busy ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => { setDraft(saved || ''); setStatus(saved ? 'saved' : 'empty') }}
              disabled={busy}
              className="inline-flex items-center gap-1.5 border border-border text-sm font-semibold px-4 py-2 rounded-md hover:bg-muted"
            >
              <RotateCcw className="h-4 w-4" /> Revert
            </button>
            <button
              onClick={() => { setDraft(''); persist('') }}
              disabled={busy}
              className="inline-flex items-center gap-1.5 border border-border text-sm font-semibold px-4 py-2 rounded-md hover:bg-muted text-red-600"
            >
              <Trash2 className="h-4 w-4" /> Clear
            </button>
          </div>
        </div>
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Live preview</p>
          <Preview code={draft} height={slot.height} />
        </div>
      </div>
    </div>
  )
}

function Dashboard() {
  const { ads, mutate } = useAds()
  const [loggedOut, setLoggedOut] = useState(false)
  if (loggedOut) return <AdminLoginGate heading="Ads manager sign in" onSuccess={() => setLoggedOut(false)} />

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Megaphone className="h-6 w-6 text-primary" /> Ads Manager</h1>
        <button
          onClick={() => { logout(); setLoggedOut(true) }}
          className="inline-flex items-center gap-1.5 border border-border text-sm font-semibold px-3 py-2 rounded-md hover:bg-muted"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Paste ad code per slot. Saved ads go live for all visitors within ~1 minute.
        Code runs in a sandboxed iframe.
      </p>

      <h2 className="font-extrabold uppercase tracking-wide text-sm text-muted-foreground mb-3">Site slots</h2>
      <div className="space-y-5 mb-10">
        {SITE_AD_SLOTS.map((s) => <SlotEditor key={s.id} slot={s} saved={ads?.[s.id]} onSaved={() => mutate()} />)}
      </div>

      <h2 className="font-extrabold uppercase tracking-wide text-sm text-muted-foreground mb-3">In-article slots</h2>
      <div className="space-y-5">
        {ARTICLE_AD_SLOTS.map((s) => <SlotEditor key={s.id} slot={s} saved={ads?.[s.id]} onSaved={() => mutate()} />)}
      </div>
    </div>
  )
}

export default function AdsManagerPage() {
  const [authed, setAuthed] = useState(() => isLoggedIn())
  useSeo({ title: 'Ads Manager', robots: 'noindex,nofollow' })
  if (!authed) return <AdminLoginGate heading="Ads manager sign in" onSuccess={() => setAuthed(true)} />
  return <Dashboard />
}
