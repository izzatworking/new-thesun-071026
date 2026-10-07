import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Bell } from 'lucide-react'

// Subscription requests are routed to this mailbox — the pop-up opens the
// visitor's mail client with the entered address pre-filled in the body so
// the team can add it to the mailing list.
const NEWSLETTER_TARGET_EMAIL = 'suresh@thesundaily.com'

const ROBOT_IMG = 'https://thesunit.my/newsletter.png'
const LOGO_IMG = 'https://thesunit.my/logo.svg'

// Glossy "newsletter robot" subscription pop-up (converted from the
// newsletter.html mockup into a controlled React modal). Mount this once in
// each place that needs to trigger it and control visibility with
// `open` / `onClose` — e.g. the header's top-bar Subscribe button and the
// footer's "Newsletter" link both open their own instance.
//
// Rendered via a portal straight into <body>, so it always sits fixed to
// the real viewport — nested inside the header/footer it would otherwise
// inherit their stacking context and end up scrolling with the page
// instead of overlaying it.
export default function NewsletterPopup({ open, onClose, initialEmail = '' }) {
  const [email, setEmail] = useState(initialEmail)
  const [status, setStatus] = useState('idle') // idle | error | success

  // Lock background scroll while the pop-up is open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  if (!open) return null

  function handleClose() {
    setStatus('idle')
    setEmail('')
    onClose()
  }

  function handleSubmit(e) {
    e.preventDefault()
    const value = email.trim()
    if (!value || !value.includes('@')) {
      setStatus('error')
      return
    }
    const subject = encodeURIComponent('New Newsletter Subscription')
    const body = encodeURIComponent(`Please add this address to The Sun Malaysia newsletter:\n\n${value}`)
    window.location.href = `mailto:${NEWSLETTER_TARGET_EMAIL}?subject=${subject}&body=${body}`
    setStatus('success')
    setEmail('')
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] overflow-y-auto overscroll-contain bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Newsletter subscription"
      onClick={handleClose}
    >
      {/* min-h-full + flex centers the card when there's room, and lets the
          whole thing scroll within the overlay (instead of the page behind
          it) on short viewports where the robot + card don't both fit. */}
      <div className="min-h-full flex items-center justify-center px-4 py-10">
        {/* The robot sits in normal flow, centered above the card, then a
            negative bottom margin pulls the card up underneath it to create
            the overlap. Because it's in-flow (not absolutely positioned with
            a hand-tuned offset), it can never get clipped by the top of the
            viewport/scroll area — it always pushes the card down to make
            room for itself instead. */}
        <div className="relative w-full max-w-[340px]" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-center relative z-10">
            <img
              src={ROBOT_IMG}
              alt=""
              aria-hidden="true"
              className="w-[200px] -mb-[85px] pointer-events-none select-none"
            />
          </div>

          {/* Glossy card */}
          <div
            className="relative rounded-[30px] px-[30px] pt-[95px] pb-[30px] text-center border border-white/40"
            style={{
              background: 'linear-gradient(135deg, #fdfdfd 0%, #f0f0f0 100%)',
              boxShadow:
                '0 15px 35px rgba(0,0,0,0.1), inset 0 0 0 2px rgba(255,255,255,1), inset 0 0 20px rgba(255,255,255,0.8)',
            }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="absolute top-[15px] right-5 w-[30px] h-[30px] rounded-full bg-[#e6e6e6] border-2 border-white text-primary flex items-center justify-center hover:text-foreground transition-colors"
              style={{ boxShadow: 'inset 0 3px 5px rgba(0,0,0,0.08), 0 1px 2px rgba(255,255,255,1)' }}
            >
              <X className="h-4 w-4" strokeWidth={3} />
            </button>

            <img src={LOGO_IMG} alt="The Sun Malaysia" className="max-w-[140px] mx-auto mb-5" />

            <p className="text-sm text-[#666] leading-snug mb-6">
              Subscribe to our <span className="text-primary font-bold">Newsletter</span> and get news
              delivered to your mailbox.
            </p>

            {status === 'success' ? (
              <p className="text-sm font-semibold text-primary mb-2">
                Thanks for subscribing! We've opened your mail app so you can send the confirmation.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setStatus('idle') }}
                  placeholder="email address"
                  aria-label="Email address"
                  className="w-full text-center text-sm text-[#777] placeholder:text-[#aaa] bg-[#e6e6e6] rounded-full px-5 py-3.5 border-2 border-white outline-none"
                  style={{ boxShadow: 'inset 0 3px 5px rgba(0,0,0,0.08), 0 1px 2px rgba(255,255,255,1)' }}
                />

                {status === 'error' && (
                  <p className="text-xs text-primary -mt-2">Please enter a valid email address.</p>
                )}

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-xs font-bold uppercase tracking-[3px] text-white transition-all hover:-translate-y-px active:translate-y-px"
                  style={{
                    background: 'linear-gradient(180deg, #ff1a1a 0%, #d40000 100%)',
                    boxShadow: '0 4px 10px rgba(255,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.4)',
                  }}
                >
                  <Bell className="h-4 w-4 fill-current" />
                  Subscribe
                </button>
              </form>
            )}

            <p className="mt-8 text-[11px] tracking-[4px] text-[#a0a0a0]">www.thesun.my</p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
