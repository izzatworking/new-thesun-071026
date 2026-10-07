import { useState } from 'react'
import { SITE_URL } from '@/lib/urls'
import { Link } from '@/lib/router'
import { ChevronRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import useSeo from '@/lib/useSeo'
import subsBanner from '@/assets/mainbanner.webp'
import bestValueBadge from '@/assets/best-value.webp'
import maybankLogo from '@/assets/maybank-logo.webp'

// ────────────────────────────────────────────────────────────────────────
// WHERE SUBMISSIONS GO
// This form posts to Formspree, a free form-backend service — it emails
// every submission to whatever address owns the form, no server code
// required on our side.
//
// SETUP (one-time, ~2 minutes):
//   1. Go to https://formspree.io and sign up using suresh@thesundaily.com
//   2. Click "New Form", name it e.g. "Print & Digital Subscription"
//   3. Formspree gives you a URL like https://formspree.io/f/abcdwxyz
//   4. Paste that URL below, replacing the placeholder
//   5. Every submission will land as an email in formspree@thesundaily.com's inbox
// ────────────────────────────────────────────────────────────────────────
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xkjwnpog'

const PLAN_OPTIONS = [
  {
    value: 'plan-1yr-special',
    label: '1-year subscription at normal price RM361* (361 issues) + RM70 administration fee to get 2nd year free',
    note: '*Special offer',
  },
  {
    value: 'plan-1yr',
    label: '1-year subscription (361 issues) for only RM300*',
    note: '(Normal price RM361)',
  },
  {
    value: 'plan-6mo',
    label: '6-month subscription (180 issues) for only RM160*',
    note: '(Normal price RM180)',
  },
]

const RACE_OPTIONS = ['Malay', 'Chinese', 'India', 'Others']
const ADDRESS_TYPE_OPTIONS = ['Residence', 'Office']

const initialFormState = {
  plan: '',
  name: '',
  nric: '',
  race: '',
  profession: '',
  commencementDate: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  addressType: '',
  tel: '',
  mobile: '',
  email: '',
  vendorName: '',
  vendorContact: '',
}

// ---------- Small shared building blocks ----------

function FieldLabel({ children, required }: { children?: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-bold text-foreground mb-1.5">
      {children}
      {required && <span className="text-primary ml-0.5">*</span>}
    </label>
  )
}

function TextInput({
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
}: {
  id?: string
  name?: string
  type?: string
  value?: any
  onChange?: any
  placeholder?: string
  required?: boolean
}) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full rounded-md border border-border bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
    />
  )
}

function RadioRow({ name, value, checked, onChange, label }) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer select-none">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 accent-primary shrink-0"
      />
      <span className="text-sm text-foreground leading-snug">{label}</span>
    </label>
  )
}

function SectionHeading({ children }) {
  return (
    <h2 className="text-sm font-extrabold uppercase tracking-wide text-foreground border-b-2 border-primary pb-2 mb-5">
      {children}
    </h2>
  )
}
export default function PrintDigitalPage() {
  useSeo({
    title: 'Newspaper Subscription - The Sun Malaysia',
    description: 'Subscribe to The Sun Malaysia newspaper — choose a 1-year or 6-month print subscription and get delivery straight to your door.',
    url: `${SITE_URL}/get-newspaper/`,
  })

  const [form, setForm] = useState(initialFormState)
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('')

  function update(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  function validate() {
    if (!form.plan) return 'Please choose a subscription plan.'
    if (!form.name.trim()) return 'Please enter your name.'
    if (!form.nric.trim()) return 'Please enter your NRIC.'
    if (!form.commencementDate) return 'Please choose a commencement date.'
    if (!form.addressLine1.trim() || !form.city.trim() || !form.postalCode.trim()) {
      return 'Please complete your delivery address.'
    }
    if (!form.mobile.trim()) return 'Please enter your mobile number.'
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
      return 'Please enter a valid email address.'
    }
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setStatus('error')
      setErrorMsg(validationError)
      return
    }

    setStatus('submitting')
    setErrorMsg('')

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: 'New Print & Digital Subscription — The Sun Malaysia',
          Plan: PLAN_OPTIONS.find((p) => p.value === form.plan)?.label || form.plan,
          Name: form.name,
          NRIC: form.nric,
          Race: form.race,
          Profession: form.profession,
          'Commencement Date': form.commencementDate,
          'Address Line 1': form.addressLine1,
          'Address Line 2': form.addressLine2,
          City: form.city,
          'State / Province / Region': form.state,
          'Postal / Zip Code': form.postalCode,
          'Address Type': form.addressType,
          Tel: form.tel,
          'Mobile No': form.mobile,
          Email: form.email,
          'Current Vendor Name': form.vendorName,
          'Current Vendor Contact': form.vendorContact,
        }),
      })

      if (!res.ok) throw new Error(`Request failed (${res.status})`)

      setStatus('success')
      setForm(initialFormState)
    } catch (err) {
      setStatus('error')
      setErrorMsg('Something went wrong sending your subscription. Please try again, or email subscribe@thesundaily.com directly.')
    }
  }

  if (status === 'success') {
    return (
      <div className="container mx-auto px-4 py-24 max-w-2xl text-center">
        <CheckCircle2 className="h-16 w-16 text-secondary mx-auto mb-5" />
        <h1 className="font-serif-headline text-3xl font-bold mb-3">Thank you for subscribing!</h1>
        <p className="text-muted-foreground mb-8">
          We've received your subscription request. Please email your payment receipt to{' '}
          <span className="font-semibold text-foreground">subscribe@thesundaily.com</span> to complete your order.
        </p>
        <Button asChild>
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <Link to="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Newspaper Subscription</span>
      </nav>

      {/* Header */}
      <header className="border-b-2 border-primary pb-4 mb-8">
        <div className="flex items-baseline gap-3">
          <span className="w-1.5 h-9 bg-primary inline-block" />
          <h1 className="font-serif-headline text-3xl md:text-4xl font-bold">Newspaper Subscription</h1>
        </div>
        <p className="mt-3 text-muted-foreground">Subscribe now for a copy of The Sun Malaysia newspaper.</p>
      </header>

      {/* Promo banner */}
      <img
        src={subsBanner.src}
        alt="Subscribe now to The Sun Malaysia — stay informed 7 days a week, starting from 1st April 2025, only RM1 per copy"
        className="w-full h-auto rounded-lg mb-10"
      />

      <form onSubmit={handleSubmit} noValidate className="space-y-10">
        {/* Plan selection */}
        <section>
          <FieldLabel required>Subscribe now for a copy of The Sun Malaysia newspaper</FieldLabel>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start mt-3">
            <div className="space-y-4">
              {PLAN_OPTIONS.map((opt) => (
                <RadioRow
                  key={opt.value}
                  name="plan"
                  value={opt.value}
                  checked={form.plan === opt.value}
                  onChange={update}
                  label={
                    <>
                      {opt.label} <span className="italic">{opt.note}</span>
                    </>
                  }
                />
              ))}
            </div>
            <img
              src={bestValueBadge.src}
              alt="Best value — not inclusive of vendor service charge"
              className="w-40 md:w-48 h-auto mx-auto md:mx-0"
            />
          </div>
        </section>

        {/* Personal particulars */}
        <section>
          <SectionHeading>Personal Particulars</SectionHeading>
          <div className="space-y-5">
            <div>
              <FieldLabel required>Name</FieldLabel>
              <TextInput id="name" name="name" value={form.name} onChange={update} required />
            </div>

            <div>
              <FieldLabel required>NRIC</FieldLabel>
              <TextInput id="nric" name="nric" value={form.nric} onChange={update} required />
            </div>

            <div>
              <FieldLabel>Race</FieldLabel>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-1">
                {RACE_OPTIONS.map((r) => (
                  <RadioRow key={r} name="race" value={r} checked={form.race === r} onChange={update} label={r} />
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Profession</FieldLabel>
              <TextInput id="profession" name="profession" value={form.profession} onChange={update} />
            </div>

            <div>
              <FieldLabel required>Commencement date</FieldLabel>
              <TextInput id="commencementDate" name="commencementDate" type="date" value={form.commencementDate} onChange={update} required />
            </div>

            <div>
              <FieldLabel required>Delivery Address</FieldLabel>
              <div className="space-y-3">
                <TextInput name="addressLine1" value={form.addressLine1} onChange={update} placeholder="Address Line 1" required />
                <TextInput name="addressLine2" value={form.addressLine2} onChange={update} placeholder="Address Line 2" />
                <TextInput name="city" value={form.city} onChange={update} placeholder="City" required />
                <TextInput name="state" value={form.state} onChange={update} placeholder="State / Province / Region" />
                <TextInput name="postalCode" value={form.postalCode} onChange={update} placeholder="Postal / Zip Code" required />
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3">
                {ADDRESS_TYPE_OPTIONS.map((t) => (
                  <RadioRow key={t} name="addressType" value={t} checked={form.addressType === t} onChange={update} label={t} />
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Tel</FieldLabel>
              <TextInput id="tel" name="tel" type="tel" value={form.tel} onChange={update} />
            </div>

            <div>
              <FieldLabel required>Mobile No</FieldLabel>
              <TextInput id="mobile" name="mobile" type="tel" value={form.mobile} onChange={update} required />
            </div>

            <div>
              <FieldLabel required>Email</FieldLabel>
              <TextInput id="email" name="email" type="email" value={form.email} onChange={update} required />
            </div>
          </div>
        </section>

        {/* Current vendor */}
        <section>
          <SectionHeading>Detail of Current Vendor (if any)</SectionHeading>
          <div className="space-y-5">
            <div>
              <FieldLabel>Vendor name</FieldLabel>
              <TextInput id="vendorName" name="vendorName" value={form.vendorName} onChange={update} />
            </div>
            <div>
              <FieldLabel>Contact no</FieldLabel>
              <TextInput id="vendorContact" name="vendorContact" type="tel" value={form.vendorContact} onChange={update} />
            </div>
          </div>
        </section>

        {/* Terms */}
        <section className="text-sm">
          <p className="italic">*Terms &amp; Conditions apply</p>
          <p className="mt-1">
            <span className="font-bold">Important note:</span> SMCSB reserves the right to revise the price at any time without prior notice.
          </p>
        </section>

        {/* Payment method */}
        <section>
          <div className="inline-block border-2 border-primary p-1.5 mb-6">
            <div className="border-2 border-primary px-4 py-1.5">
              <h2 className="text-lg font-black uppercase tracking-wide text-foreground">
                Payment Method
              </h2>
            </div>
          </div>

          <img src={maybankLogo.src} alt="Maybank" className="h-10 w-auto mb-4" />

          <div className="space-y-4 text-sm">
            <div>
              <p className="uppercase text-foreground">Current account no</p>
              <p className="font-bold text-base">508177700420</p>
            </div>
            <div>
              <p className="uppercase text-foreground">Account name</p>
              <p className="font-bold text-base">SUN MEDIA CORPORATION SDN BHD</p>
            </div>
            <p>
              Send the payment receipt to email address:{' '}
              <span className="font-bold bg-yellow-300 px-1">subscribe@thesundaily.com</span>
            </p>
          </div>
        </section>

        {/* Error message */}
        {status === 'error' && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 text-destructive px-4 py-3 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit */}
        <Button type="submit" disabled={status === 'submitting'} className="min-w-[140px]">
          {status === 'submitting' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…
            </>
          ) : (
            'Subscribe'
          )}
        </Button>
      </form>
    </div>
  )
}
