import { useState } from 'react'
import { User, Lock } from 'lucide-react'
import { login } from '@/lib/adsAuth'

// Shared login for the /admin/* screens. Credentials go to our edge function
// (Cloudflare secrets) and are never stored in the browser — only a token is.
export default function AdminLoginGate({ onSuccess, heading = 'Admin sign in' }) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const { success, error: err } = await login(user.trim(), pass)
    setLoading(false)
    if (success) onSuccess()
    else setError(err || 'Invalid username or password')
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        {heading && (
          <h1 className="text-center font-extrabold italic uppercase tracking-wide text-xl text-foreground">
            {heading}
          </h1>
        )}
        <div className="relative">
          <input
            type="text"
            value={user}
            onChange={(e) => { setUser(e.target.value); setError('') }}
            placeholder="Username"
            autoComplete="username"
            className="w-full bg-muted/50 border border-border rounded-md px-4 py-3.5 pr-11 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <User className="h-5 w-5 text-muted-foreground absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <div className="relative">
          <input
            type="password"
            value={pass}
            onChange={(e) => { setPass(e.target.value); setError('') }}
            placeholder="Password"
            autoComplete="current-password"
            className="w-full bg-muted/50 border border-border rounded-md px-4 py-3.5 pr-11 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <Lock className="h-5 w-5 text-muted-foreground absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        {error && <p className="text-sm font-medium text-red-600 text-center">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:pointer-events-none text-white font-extrabold uppercase tracking-wide text-base py-3.5 rounded-md transition-colors"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  )
}
