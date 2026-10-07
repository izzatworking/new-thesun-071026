import { useState } from 'react'
import StaticPage from '@/components/site/StaticPage'
import useSeo from '@/lib/useSeo'
import {
  Phone, Printer, MapPin, Mail, Building2, Share2,
  Briefcase, Popcorn, Trophy, Car, PenLine, Megaphone,
  Package, MessageCircle, Users, BarChart3,
  Facebook, Instagram, Send, Music2, Twitter, Youtube,
} from 'lucide-react'
import sunbot from '@/assets/sunbot-contact-us.png'
import sunbott from '@/assets/sunbott.png'

// ---------------------------------------------------------------------------
// Departments shown in the form's dropdown. All submissions go to a single
// inbox (CONTACT_EMAIL below) — the department chosen here is just included
// in the message so the team can route it internally.
// ---------------------------------------------------------------------------
const DEPTS = [
  'News Desk (General)',
  'Business Desk',
  'Lifestyle & Entertainment Desk',
  'Sports Desk',
  'Motoring Desk',
  'Letters to the Editor',
  'Advertising & Marketing',
  'Distribution & Subscriptions',
  'General Feedback',
  'Human Resources',
  'Finance',
]

// Single mailbox all contact-form submissions are sent to, regardless of
// which department the visitor picks.
const CONTACT_EMAIL = 'contact@thesundaily.com'

// Direct-email directory shown further down the page — each department
// still has its own public inbox for people who'd rather just email in.
const DIRECTORY = [
  { name: 'News Desk (General)', email: 'newsdesk@thesundaily.com', icon: Mail },
  { name: 'Business Desk', email: 'sunbiz@thesundaily.com', icon: Briefcase },
  { name: 'Lifestyle & Entertainment Desk', email: 'lifestyle@thesundaily.com', icon: Popcorn },
  { name: 'Sports Desk', email: 'sunsport@thesundaily.com', icon: Trophy },
  { name: 'Motoring Desk', email: 'gearup@thesundaily.com', icon: Car },
  { name: 'Letters to the Editor', email: 'letters@thesundaily.com', icon: PenLine },
  { name: 'Advertising & Marketing', email: 'advertise@thesundaily.com', icon: Megaphone },
  { name: 'Distribution & Subscriptions', email: 'subscribe@thesundaily.com', icon: Package },
  { name: 'General Feedback', email: 'feedback@thesundaily.com', icon: MessageCircle },
  { name: 'Human Resources', email: 'hr@thesundaily.com', icon: Users },
  { name: 'Finance', email: 'finance@thesundaily.com', icon: BarChart3 },
]

const SOCIAL_PLATFORMS = [
  { name: 'Facebook', handle: '@thesundaily', icon: Facebook, bg: '#1877f2' },
  { name: 'Instagram', handle: '@thesundaily', icon: Instagram, bg: 'linear-gradient(135deg, #fdf497 0%, #fd5949 45%, #d6249f 60%, #285AEB 90%)' },
  { name: 'Telegram', handle: 'thesuntelegram', icon: Send, bg: '#229ED9' },
  { name: 'TikTok', handle: '@thesundaily', icon: Music2, bg: '#000000' },
  { name: 'X (Twitter)', handle: '@thesundaily', icon: Twitter, bg: '#000000' },
  { name: 'WhatsApp', handle: '@thesunmalaysia', icon: MessageCircle, bg: '#25D366' },
  { name: 'YouTube', handle: '@thesunmedia', icon: Youtube, bg: '#FF0000' },
]

// Formspree endpoint for this form. Create a form at formspree.io and
// paste its URL here. The recipient inbox is configured inside your
// Formspree dashboard, not in this code — every submission goes wherever
// that form is set to send.
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/myegwznk'

const MAX_FILE_BYTES = 3 * 1024 * 1024 // 3MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

const EMPTY_FORM = {
  department: '',
  attention: '',
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
}

export default function ContactPage() {
  useSeo({ title: 'Contact Us', description: 'Get in touch with The Sun Malaysia.' })

  const [form, setForm] = useState(EMPTY_FORM)
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('')
  const [sentDeptName, setSentDeptName] = useState('')

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    setFileError('')
    if (!f) { setFile(null); return }
    if (!ALLOWED_FILE_TYPES.includes(f.type)) {
      setFileError('Only JPG, JPEG, PNG and WebP files are allowed.')
      e.target.value = ''
      setFile(null)
      return
    }
    if (f.size > MAX_FILE_BYTES) {
      setFileError('Maximum file size is 3MB.')
      e.target.value = ''
      setFile(null)
      return
    }
    setFile(f)
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setFile(null)
    setFileError('')
    setStatus('idle')
    setErrorMsg('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.department || !form.name || !form.email || !form.subject || !form.message) {
      setStatus('error')
      setErrorMsg('Please fill in all required fields.')
      return
    }

    setStatus('sending')
    setErrorMsg('')

    try {
      const body = new FormData()
      body.append('department', form.department)
      body.append('attention', form.attention)
      body.append('name', form.name)
      body.append('email', form.email) // Formspree uses this as the reply-to address
      body.append('phone', form.phone)
      body.append('subject', `[${form.department}] ${form.subject}`)
      body.append('message', form.message)
      if (file) body.append('document', file)

      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body,
        headers: { Accept: 'application/json' },
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.errors?.[0]?.message || 'Failed to send message.')
      }

      setSentDeptName(form.department)
      setStatus('sent')
      setForm(EMPTY_FORM)
      setFile(null)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message || 'Something went wrong sending your message. Please try again.')
    }
  }

  return (
    <StaticPage
      title="Contact Us"
      subtitle="We welcome your feedback, inquiries, and contributions. Whether you're a reader, an advertiser, or have a general query, we're here to help."
    >
      {/* Contact form + floating mascot */}
      <div className="relative not-prose">
        <div className="grid md:grid-cols-[1fr_320px] gap-8 items-start">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <FormField label="Complaints/Feedback" required>
              <select
                required
                value={form.department}
                onChange={e => update('department', e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Please select</option>
                {DEPTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Attention">
              <input
                type="text"
                value={form.attention}
                onChange={e => update('attention', e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </FormField>

            <FormField label="Your Name" required>
              <input
                type="text"
                required
                placeholder="Please enter your name"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </FormField>

            <FormField label="Your Email" required>
              <input
                type="email"
                required
                placeholder="e.g. your@email.com"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </FormField>

            <FormField label="Phone Number">
              <input
                type="tel"
                placeholder="012XXXXXXX"
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </FormField>

            <FormField label="Subject" required>
              <input
                type="text"
                required
                placeholder="Please enter the title of your feedback"
                value={form.subject}
                onChange={e => update('subject', e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </FormField>

            <FormField label="Message" required>
              <textarea
                required
                rows={5}
                placeholder="Please enter your message/How are you affected?"
                value={form.message}
                onChange={e => update('message', e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
              />
            </FormField>

            <FormField label="Supporting Documents">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileChange}
                className="w-full text-sm file:mr-3 file:rounded file:border file:border-border file:bg-muted/60 file:px-3 file:py-1.5 file:text-sm file:cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Only JPG, JPEG, PNG and WebP files are allowed. Maximum file size is 3MB.
              </p>
              {fileError && <p className="text-xs text-red-600 mt-1">{fileError}</p>}
            </FormField>

            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">*</span> is a mandatory field. Please do not leave empty.
            </p>

            {status === 'error' && (
              <p className="text-sm text-red-600">{errorMsg}</p>
            )}
            {status === 'sent' && (
              <p className="text-sm text-green-700">
                Thanks — your message has been sent to our team. We'll route it to {sentDeptName} and get back to you soon.
              </p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={status === 'sending'}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-md text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
              >
                {status === 'sending' ? 'Sending…' : 'Submit'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 rounded-md text-sm font-semibold border border-border hover:bg-muted/60 transition"
              >
                Reset
              </button>
            </div>
          </form>

          {/* Floating sunbot mascot */}
          <div className="hidden md:flex justify-center pt-4 sticky top-24">
            <img
              src={sunbot.src}
              alt="The Sun Malaysia contact assistant mascot"
              className="w-full max-w-[320px] animate-float drop-shadow-xl select-none pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Headquarters + Social media cards */}
      <div className="grid md:grid-cols-2 gap-6 mt-12 not-prose">
        <HeadquartersCard />
        <SocialMediaCard />
      </div>

      {/* Email-by-department directory */}
      <div className="relative not-prose mt-16 rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
        {/* Faint grid pattern background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(19,28,43,0.035) 1px, transparent 1px), linear-gradient(rgba(19,28,43,0.035) 1px, transparent 1px)',
            backgroundSize: '46px 46px',
          }}
        />
        {/* Decorative envelope graphic, top-right */}
        <Mail className="hidden md:block absolute -top-8 -right-8 w-48 h-48 md:w-56 md:h-56 text-primary/10 rotate-6 pointer-events-none" strokeWidth={1} />

        <div className="relative z-10 px-6 py-14 md:px-14 md:py-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-serif-headline text-3xl md:text-5xl font-extrabold m-0 tracking-tight">
              Email Us <span className="text-primary">by Department</span>
            </h2>
            <p className="text-muted-foreground mt-4 text-base md:text-lg leading-relaxed">
              Find the right department and reach out to us directly.<br className="hidden sm:block" />
              We&rsquo;re here to help!
            </p>
            <span className="inline-block w-16 h-1 bg-primary rounded-full mt-5" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {DIRECTORY.map(({ name, email, icon: Icon }) => (
              <a
                key={email}
                href={`mailto:${email}`}
                style={{ textDecoration: 'none' }}
                className="group flex items-center gap-4 md:gap-5 min-h-[7.5rem] p-5 md:p-6 rounded-2xl border border-border bg-gradient-to-br from-white to-muted/20 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 transition-all duration-200 no-underline"
              >
                <span className="w-16 h-16 md:w-[70px] md:h-[70px] rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-7 w-7 text-primary" strokeWidth={2} />
                </span>
                <span className="w-0.5 self-stretch min-h-16 bg-primary/70 rounded-full shrink-0" />
                <div className="min-w-0">
                  <div className="font-serif-headline font-bold text-sm md:text-base leading-tight text-foreground">{name}</div>
                  <div className="text-primary text-sm md:text-[15px] font-medium mt-1 break-all">{email}</div>
                </div>
              </a>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 mt-10 text-[11px] uppercase tracking-widest text-muted-foreground/70">
            <span className="w-6 h-px bg-primary/40" />
            <span>Tap a desk to open your email client</span>
            <span className="w-6 h-px bg-primary/40" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sunbot-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        .animate-float {
          animation: sunbot-float 4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-float { animation: none; }
        }
      `}</style>
    </StaticPage>
  )
}

function FormField({
  label,
  required,
  children,
}: {
  label?: string
  required?: boolean
  children?: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {children}
    </div>
  )
}

function HeadquartersCard() {
  const rows = [
    {
      icon: MapPin,
      label: 'Sun Media Corporation Sdn Bhd (221220-K)',
      detail: (
        <>Level 4, Lot 6, Jalan 51/217<br />46050 Petaling Jaya, Selangor, Malaysia</>
      ),
      align: 'items-start',
    },
    { icon: Phone, label: 'General', detail: '+603-7784 6688' },
    { icon: Megaphone, label: 'Advertising', detail: '+603-7784 8888' },
    { icon: Printer, label: 'Fax', detail: '+603-7785 2625' },
  ]

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      {/* Left curved wave decoration */}
      <svg
        className="absolute left-0 top-0 h-full w-14 md:w-[70px] fill-primary"
        viewBox="0 0 100 800"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0,0 L100,0 C20,200 20,600 100,800 L0,800 Z" />
      </svg>

      {/* Building watermark, bottom right */}
      <svg
        className="absolute bottom-4 right-4 h-32 w-32 md:h-44 md:w-44 opacity-[0.12] pointer-events-none"
        viewBox="0 0 200 200"
        aria-hidden="true"
      >
        <g stroke="#999" strokeWidth="0.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 120 180 L 120 120 L 180 120 L 180 180" />
          <path d="M 120 120 L 140 100 L 200 100 L 200 160 L 180 180" />
          <path d="M 180 120 L 200 100" />
          <path d="M 130 120 L 130 180 M 140 120 L 140 180 M 150 120 L 150 180 M 160 120 L 160 180 M 170 120 L 170 180" />
          <path d="M 120 130 L 180 130 M 120 140 L 180 140 M 120 150 L 180 150 M 120 160 L 180 160 M 120 170 L 180 170" />
          <path d="M 180 130 L 200 110 M 180 140 L 200 120 M 180 150 L 200 130 M 180 160 L 200 140 M 180 170 L 200 150" />
          <path d="M 185 175 L 185 115 M 190 170 L 190 110 M 195 165 L 195 105" />
          <path d="M 80 180 L 80 140 L 130 140 L 130 180" />
          <path d="M 80 140 L 95 125 L 145 125 L 145 165 L 130 180" />
          <path d="M 130 140 L 145 125" />
          <path d="M 90 140 L 90 180 M 100 140 L 100 180 M 110 140 L 110 180 M 120 140 L 120 180" />
          <path d="M 80 150 L 130 150 M 80 160 L 130 160 M 80 170 L 130 170" />
        </g>
      </svg>

      <div className="relative z-10 px-6 py-8 pl-14 md:pl-[100px] md:pr-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <span className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/25">
            <Building2 className="h-8 w-8 md:h-9 md:w-9 text-white" />
          </span>
          <div>
            <h2 className="font-serif-headline text-2xl md:text-[32px] font-extrabold leading-none tracking-tight m-0">
              <span className="text-primary">HEAD</span>QUARTERS
            </h2>
            <span className="block w-10 h-1 bg-primary rounded-full mt-2.5" />
          </div>
        </div>

        {/* Contact rows */}
        <ul className="text-sm">
          {rows.map(({ icon: Icon, label, detail, align }, i) => (
            <li
              key={label}
              className={`flex ${align || 'items-center'} gap-4 py-5 ${i < rows.length - 1 ? 'border-b border-dashed border-border' : ''}`}
            >
              <span className="w-[52px] h-[52px] rounded-full bg-white border border-border shadow-sm flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </span>
              <span className={align ? 'pt-1' : ''}>
                <strong className="block mb-0.5">{label}</strong>
                <span className="text-muted-foreground leading-relaxed">{detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function SocialMediaCard() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-white shadow-sm p-6 md:p-8">
      {/* Subtle dot-pattern background */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '20px 20px', color: 'var(--border)' }}
      />
      {/* Sharp corner wedge, bottom right */}
      <div className="absolute bottom-0 right-0 w-36 h-40 md:w-52 md:h-56 overflow-hidden pointer-events-none">
        <div
          className="absolute bottom-0 right-0 w-full h-full bg-primary"
          style={{ clipPath: 'polygon(100% 100%, 100% 0%, 40% 100%)' }}
        />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-5">
          <span className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-primary to-red-800 flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
            <Share2 className="h-8 w-8 md:h-9 md:w-9 text-white" />
          </span>
          <div>
            <h2 className="font-serif-headline text-2xl md:text-[32px] font-extrabold leading-none tracking-tight m-0">
              <span className="text-primary">SOCIAL</span> MEDIA
            </h2>
            <span className="block w-10 h-1 bg-primary rounded-full mt-2.5" />
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-sm text-muted-foreground mb-5 max-w-md">
          Follow us on our social media channels for the latest news, updates, and behind-the-scenes content.
        </p>

        {/* Platform cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SOCIAL_PLATFORMS.map(({ name, handle, icon: Icon, bg }) => (
            <div
              key={name}
              className="flex items-center gap-4 rounded-2xl border border-border/60 bg-white px-4 py-3 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
            >
              <span
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-white shadow"
                style={{ background: bg }}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <strong className="block text-sm leading-tight truncate">{name}</strong>
                <span className="block text-xs text-muted-foreground truncate">{handle}</span>
              </span>
            </div>
          ))}

          {/* Sunbot mascot, sitting in the empty cell beside YouTube */}
          <div className="hidden sm:flex items-end justify-end -mb-6 md:-mb-8 -mr-2">
            <img
              src={sunbott.src}
              alt="The Sun Malaysia mascot"
              className="w-24 md:w-32 drop-shadow-xl select-none pointer-events-none"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
