import { Link } from '@/lib/router'
import { SITE_URL } from '@/lib/urls'
import { ChevronRight } from 'lucide-react'
import useSeo from '@/lib/useSeo'
import logoFull from '@/assets/branding/logo-full.png'
import constructionSketch from '@/assets/branding/construction-sketch.png'
import idCard from '@/assets/branding/mockup-id-card.png'
import paperBagPen from '@/assets/branding/paperbag-pen.png'
import apparelNeutral from '@/assets/branding/apparel-neutral.png'
import apparelTeam from '@/assets/branding/apparel-team.png'
import sunSketch from '@/assets/branding/sun-sketch.png'

function Eyebrow({ children }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">{children}</p>
  )
}

function SectionTitle({ children, reverse = false }) {
  return (
    <h2 className={`font-serif-headline text-3xl sm:text-4xl font-extrabold leading-tight mb-4 ${reverse ? 'text-white' : 'text-foreground'}`}>
      {children}
    </h2>
  )
}

function ColourBlock({ name, hex, base, tint, note }) {
  const steps = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10]
  return (
    <div className="rounded-md overflow-hidden border border-border">
      <div
        className="px-5 py-6 flex items-end justify-between text-white font-serif-headline text-xl"
        style={{ background: base }}
      >
        <span>{name}</span>
        <span className="font-sans text-sm opacity-85">{hex}</span>
      </div>
      <div className="flex h-7">
        {steps.map((s) => (
          <span key={s} className="flex-1" style={{ background: base, opacity: s / 100 }} title={`${s}%`} />
        ))}
      </div>
      <p className="text-sm leading-relaxed px-4 py-3.5" style={{ background: tint }}>{note}</p>
    </div>
  )
}

function Specimen({ label, weightClass = 'font-normal' }) {
  return (
    <div className="bg-white/5 border border-white/15 rounded-md px-6 py-7">
      <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2.5">{label}</p>
      <p className={`text-6xl sm:text-7xl leading-none mb-3 text-white ${weightClass}`}>Aa</p>
      <p className={`text-sm leading-relaxed text-white/85 ${weightClass}`}>ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
      <p className={`text-sm leading-relaxed text-white/85 ${weightClass}`}>abcdefghijklmnopqrstuvwxyz</p>
      <p className="text-xs leading-relaxed text-white/70 mt-2 font-mono">1234567890 !@#$%^&amp;*()_+</p>
    </div>
  )
}

function DeskCard({ img, alt, label }) {
  return (
    <figure>
      <div className="bg-white border border-border rounded-md aspect-[4/5] flex items-center justify-center p-4 overflow-hidden">
        <img src={img} alt={alt} loading="lazy" className="max-h-full w-auto object-contain" />
      </div>
      <figcaption className="mt-2.5 text-xs uppercase tracking-wide text-muted-foreground text-center">
        {label}
      </figcaption>
    </figure>
  )
}

export default function BrandingPage() {
  useSeo({
    title: 'Branding - The Sun Malaysia',
    description: 'The The Sun Malaysia brand book — logo, colour, typography and identity guidelines.',
    url: `${SITE_URL}/branding/`,
  })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">Branding</span>
      </div>

      {/* Page title */}
      <div className="flex items-center gap-3 mb-10">
        <span className="w-1.5 h-9 bg-primary rounded-sm shrink-0" />
        <h1 className="font-serif-headline text-3xl sm:text-4xl font-extrabold tracking-tight">Branding</h1>
      </div>

      {/* ---------- A. MASTHEAD ---------- */}
      <section id="mark" className="mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch rounded-xl overflow-hidden border border-border">
          <div
            className="p-8 sm:p-10 text-white flex flex-col justify-center"
            style={{ background: 'linear-gradient(115deg, #6B0000 0%, #F40606 65%, #F40606 100%)' }}
          >
            <h2 className="font-serif-headline text-4xl sm:text-5xl font-extrabold leading-[1.05] mb-4">
              Built on Balance,<br />Clarity &amp; Purpose.
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-white/90 max-w-md">
              Every curve and line in <strong>The Sun Malaysia</strong> wordmark is drawn to carry a newsroom's
              two oldest instincts — plain-spoken trust and a bit of fire. Lowercase "the" sits quiet
              in green; "Sun" stands up in red, bold enough to run across a front page at any size.
            </p>
          </div>
          <div className="bg-white flex items-center justify-center p-6 sm:p-8 overflow-hidden relative">
            <img
              src={logoFull.src}
              alt="The Sun Malaysia wordmark, green and red lettering"
              className="w-full max-w-md h-auto scale-125 drop-shadow-[0_18px_28px_rgba(0,0,0,0.0)]"
            />
          </div>
        </div>

        {/* Construction */}
        <div className="mt-10">
          <Eyebrow>How it was drawn</Eyebrow>
          <p className="text-sm text-muted-foreground max-w-2xl mb-5">
            The build runs in one direction only — sketch, then structure, then final ink — because
            that order is how any letterer would actually get here.
          </p>
          <div className="border border-border rounded-md bg-white p-5">
            <img
              src={constructionSketch.src}
              alt="Logo construction: sketch, structure, final"
              className="w-full h-auto rounded"
            />
            <div className="flex justify-around border-t border-border mt-5 pt-3.5 font-mono text-xs uppercase tracking-wide text-muted-foreground">
              <span><b className="text-primary mr-1.5">01</b>Sketch</span>
              <span><b className="text-primary mr-1.5">02</b>Structure</span>
              <span><b className="text-primary mr-1.5">03</b>Final</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- B. COLOUR ---------- */}
      <section id="color" className="mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-10 items-start">
          <div>
            <Eyebrow>Colour Philosophy</Eyebrow>
            <SectionTitle>Two colours,<br />one voice.</SectionTitle>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-sm">
              Strength, clarity and passion, held in tension. Red carries the paper's urgency;
              green carries the trust it has to earn back every single day.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ColourBlock
              name="Passion & Energy"
              hex="#F40606"
              base="#F40606"
              tint="#FFF0F0"
              note="A bold red that reflects our drive, courage and uncompromising voice."
            />
            <ColourBlock
              name="Trust & Growth"
              hex="#146C43"
              base="#146C43"
              tint="#DBEEE1"
              note="A grounded green that signifies balance, growth and our connection to the community."
            />
          </div>
        </div>
      </section>

      {/* ---------- C. TYPE ---------- */}
      <section id="type" className="mb-16 rounded-xl bg-[#17130F] px-6 sm:px-10 py-12 sm:py-14">
        <Eyebrow>Typography</Eyebrow>
        <SectionTitle reverse>Set to be read in a hurry.</SectionTitle>
        <p className="text-sm sm:text-base text-white/65 leading-relaxed max-w-xl mb-9">
          Two faces, two jobs. Helvetica World carries headlines and the wordmark's DNA; Canva Sans
          runs the body copy where long reading needs to stay effortless.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Specimen label="Primary — Helvetica World" weightClass="font-extrabold" />
          <Specimen label="Secondary — Canva Sans" weightClass="font-normal" />
        </div>
      </section>

      {/* ---------- D. IDENTITY ---------- */}
      <section id="wear" className="mb-16">
        <Eyebrow>Identity in Use</Eyebrow>
        <SectionTitle>Worn consistently, trusted instantly.</SectionTitle>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mb-8">
          A consistent identity across every touchpoint — from the newsroom floor to the printed
          front page — builds recognition, trust and lasting impact.
        </p>

        <figure className="border border-border rounded-md bg-white overflow-hidden mb-3">
          <img src={apparelNeutral.src} alt="Black, white and heather grey polo shirts with The Sun Malaysia logo" className="w-full h-auto" />
          <figcaption className="px-4 py-3 border-t border-border font-mono text-xs uppercase tracking-wide text-muted-foreground">
            Neutral rotation — black, white, heather grey
          </figcaption>
        </figure>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-10">
          <DeskCard img={apparelTeam} alt="Navy and red colourblock polo shirt with The Sun Malaysia logo" label="Editorial team colourway — navy & red" />
          <DeskCard img={idCard} alt="The Sun Malaysia ID card and lanyard" label="ID Card" />
          <DeskCard img={paperBagPen} alt="The Sun Malaysia branded paper bag and pen" label="Paper Bag & Pen" />
        </div>
      </section>

      {/* ---------- PRINCIPLES ---------- */}
      <section className="rounded-xl overflow-hidden relative" style={{ background: '#0D4A2D' }}>
        <img
          src={sunSketch.src}
          alt=""
          aria-hidden="true"
          className="hidden sm:block absolute right-[-3%] bottom-[-10%] w-[46%] max-w-lg opacity-90 pointer-events-none select-none"
        />
        <div className="relative z-10 flex flex-col gap-8 px-6 sm:px-10 py-12 sm:py-14 sm:max-w-[56%]">
          <blockquote className="font-serif-headline text-4xl sm:text-6xl font-extrabold leading-tight text-white m-0">
            &ldquo;Truth. Clarity. Impact.&rdquo;
          </blockquote>
          <ul className="grid gap-4 text-base sm:text-lg leading-relaxed text-white/85 list-disc pl-5 m-0">
            <li><b className="text-white">Trusted voice</b> — committed to truthful, accurate, independent journalism.</li>
            <li><b className="text-white">Clear perspective</b> — cutting through the noise to deliver news that matters.</li>
            <li><b className="text-white">Community focused</b> — connecting, informing and empowering the communities we serve.</li>
            <li><b className="text-white">Bold &amp; fearless</b> — speaking with courage and standing up for what's right.</li>
          </ul>
        </div>
      </section>
    </div>
  )
}
