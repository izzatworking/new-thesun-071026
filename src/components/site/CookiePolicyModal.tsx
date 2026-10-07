import { useState, useEffect, useCallback } from 'react'
import { Cookie, ChevronDown, X } from 'lucide-react'
import Logo from './Logo'
import { getStoredConsent } from '@/lib/cookieConsent'

const CATEGORIES = [
  {
    key: 'necessary',
    title: 'Strictly Necessary Cookies',
    alwaysActive: true,
    description:
      'These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in or filling in forms. You can set your browser to block or alert you about these cookies, but some parts of the site will not then work. These cookies do not store any personally identifiable information.',
  },
  {
    key: 'functional',
    title: 'Functional Cookies',
    description:
      'These cookies enable the website to provide enhanced functionality and personalisation. They may be set by us or by third party providers whose services we have added to our pages. If you do not allow these cookies then some or all of these services may not function properly.',
  },
  {
    key: 'performance',
    title: 'Performance Cookies',
    description:
      'These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site. All information these cookies collect is aggregated and therefore anonymous. If you do not allow these cookies we will not know when you have visited our site, and will not be able to monitor its performance.',
  },
  {
    key: 'targeting',
    title: 'Targeting Cookies',
    description:
      'These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites. They do not store directly personal information, but are based on uniquely identifying your browser and internet device. If you do not allow these cookies, you will experience less targeted advertising.',
  },
]

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-secondary ${
        checked ? 'bg-secondary' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

function AccordionRow({ category, expanded, onToggleExpand, enabled, onToggleEnabled }) {
  const panelId = `cookie-panel-${category.key}`
  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-4 sm:px-6">
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${category.title} details`}
          className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shrink-0"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            strokeWidth={2.5}
          />
        </button>
        <span className="flex-1 font-bold text-foreground">{category.title}</span>
        {category.alwaysActive ? (
          <span className="text-primary font-bold text-xs sm:text-sm uppercase tracking-wide shrink-0">
            Always Active
          </span>
        ) : (
          <Toggle checked={enabled} onChange={onToggleEnabled} label={category.title} />
        )}
      </div>
      <div
        id={panelId}
        className={`grid transition-all duration-200 ease-in-out ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <p className="px-4 pb-4 sm:px-6 sm:pl-16 text-sm text-muted-foreground leading-relaxed">
            {category.description}
          </p>
        </div>
      </div>
    </div>
  )
}

// onClose: dismiss without saving (X). onSave(categories): persist choices and close.
export default function CookiePolicyModal({ onClose, onSave }) {
  const stored = getStoredConsent()
  const [expandedKey, setExpandedKey] = useState('necessary')
  const [choices, setChoices] = useState({
    functional: stored ? !!stored.functional : true,
    performance: stored ? !!stored.performance : true,
    targeting: stored ? !!stored.targeting : true,
  })

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const toggleExpanded = useCallback((key) => {
    setExpandedKey((prev) => (prev === key ? null : key))
  }, [])

  const setChoice = useCallback((key, value) => {
    setChoices((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleRejectAll = () => onSave({ functional: false, performance: false, targeting: false })
  const handleConfirm = () => onSave(choices)

  return (
    // Backdrop — full screen on mobile (no dimming needed, card fills it), a
    // dimmed centered dialog on desktop (sm+) so the preference center reads
    // as a "half popup box" over the page rather than a full-page takeover.
    <div
      className="fixed inset-0 z-[110] flex items-stretch sm:items-center justify-center bg-black/0 sm:bg-black/50 sm:backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Cookie preference center"
        className="relative flex flex-col w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-2xl bg-white sm:rounded-2xl overflow-hidden sm:shadow-2xl"
      >
        {/* Top bar: logo + decorative cookie badge + close */}
        <div
          className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border shrink-0"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
        >
          <Logo size="md" />
          <div className="flex items-center gap-2 shrink-0">
            <span
              aria-hidden="true"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white"
            >
              <Cookie className="h-4.5 w-4.5" />
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close cookie preferences"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-foreground hover:bg-border transition-colors"
            >
              <X className="h-4.5 w-4.5" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Red preference panel */}
        <div className="bg-primary text-white px-4 sm:px-8 py-6 sm:py-8 overflow-y-auto">
          <h2 className="text-base sm:text-lg font-black uppercase tracking-widest mb-4">
            Privacy Preference Center
          </h2>
          <p className="text-sm sm:text-[15px] leading-relaxed text-white/90">
            When you visit any website, it may store or retrieve information on your browser, mostly in the
            form of cookies. This information might be about you, your preferences, or your device, and is
            mostly used to make the site work as you expect. The information does not usually identify you
            directly, but it can give you a more personalized web experience. Because we respect your right
            to privacy, you can choose not to allow some types of cookies. Click on the different category
            headings to learn more and change our default settings. Blocking some types of cookies may
            impact your experience of the site and the services we are able to offer.{' '}
            <a href="/privacy-policy" className="font-bold underline hover:no-underline">
              Privacy Policy
            </a>
          </p>

          <h3 className="text-base sm:text-lg font-black uppercase tracking-widest mt-8 mb-4">
            Manage Consent Preferences
          </h3>

          <div className="rounded-lg overflow-hidden bg-white text-foreground divide-y divide-border">
            {CATEGORIES.map((category) => (
              <AccordionRow
                key={category.key}
                category={category}
                expanded={expandedKey === category.key}
                onToggleExpand={() => toggleExpanded(category.key)}
                enabled={category.alwaysActive ? true : choices[category.key]}
                onToggleEnabled={(value) => setChoice(category.key, value)}
              />
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              type="button"
              onClick={handleRejectAll}
              className="px-8 py-3 rounded-md bg-white/90 hover:bg-white text-primary text-sm font-bold uppercase tracking-wide transition-colors"
            >
              Reject All
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-8 py-3 rounded-md bg-white/90 hover:bg-white text-primary text-sm font-bold uppercase tracking-wide transition-colors"
            >
              Confirm my Choices
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
