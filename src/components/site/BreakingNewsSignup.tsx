import { useState } from 'react'
import { Mail, ChevronRight } from 'lucide-react'
import robotMascot from '@/assets/robot-mascot.webp'

export default function BreakingNewsSignup() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  function submit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setDone(true)
    setEmail('')
    setTimeout(() => setDone(false), 4000)
  }

  return (
    <section className="relative bg-white rounded-[1.75rem] border border-primary/50 shadow-md overflow-hidden pb-6 px-6 text-center">

      {/* Scalloped red banner behind the robot — one broad valley, red high at the
          corners, dipping deep in the centre right where the robot's neck sits */}
      <div className="relative -mx-6 mb-1">
        <svg
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
          className="block w-full h-[104px] sm:h-[122px] text-primary"
        >
          <path
            fill="currentColor"
            d="M0,0 L100,0 L100,9 C88,9 80,22 74,28 C68,34 60,37 50,37 C40,37 32,34 26,28 C20,22 12,9 0,9 Z"
          />
        </svg>

        {/* Decorative dot pattern, top-left corner, inside the solid part of the red area */}
        <div
          className="absolute top-3 left-3 w-14 h-10 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1.5px)',
            backgroundSize: '7px 7px',
          }}
        />

        <img
          src={robotMascot.src}
          alt="The Sun Malaysia assistant robot"
          className="absolute left-1/2 -translate-x-1/2 top-1 w-28 sm:w-32 drop-shadow-sm"
        />
      </div>

      {/* "Sign up for The Sun Malaysia" pill badge, overlapping the banner/body seam */}
      <div className="relative z-10 inline-flex items-center bg-neutral-50 border border-border rounded-full px-4 py-1.5 -mt-2">
        <span className="text-sm text-neutral-600 font-serif-headline">
          Sign up for{' '}
          <span className="font-bold">
            <span className="text-secondary italic">the</span>
            <span className="text-primary">Sun</span>
          </span>
        </span>
      </div>

      <h3 className="text-2xl sm:text-[28px] font-extrabold text-foreground mt-3 tracking-tight">
        Breaking News Alert
      </h3>
      <span className="block w-10 h-1 bg-primary rounded-full mx-auto mt-2 mb-4" />

      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
        Get real-time breaking news alerts and stay up-to-date with the most important headlines from around the globe.
      </p>

      {done ? (
        <div className="mt-5 bg-muted rounded-lg p-3 text-sm font-medium text-foreground">
          Thanks! You're subscribed.
        </div>
      ) : (
        <form onSubmit={submit} className="mt-5 space-y-3">
          <div className="flex items-center gap-2.5 border border-primary/50 rounded-full pl-2 pr-4 py-2 focus-within:ring-2 focus-within:ring-primary/25 transition-shadow">
            <span className="shrink-0 w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="w-4 h-4 text-primary" strokeWidth={2} />
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail address"
              className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none py-1"
            />
          </div>
          <button
            type="submit"
            className="relative w-full rounded-full bg-gradient-to-r from-primary to-red-900 hover:from-red-600 hover:to-red-950 text-white font-bold py-3 text-sm transition-colors shadow-[0_12px_22px_-10px_rgba(180,20,25,0.6)]"
          >
            Subscribe
            <ChevronRight className="w-4 h-4 absolute right-5 top-1/2 -translate-y-1/2" />
          </button>
        </form>
      )}

      <p className="text-xs text-muted-foreground mt-4">
        By signing up, you agree to our{' '}
        <a href="/privacy-policy" className="underline font-semibold text-primary hover:text-primary/80">
          Privacy Policy
        </a>.
      </p>
    </section>
  )
}
