import { useState } from 'react'
import { Link } from '@/lib/router'
import { Star, MousePointerClick, TrendingUp } from 'lucide-react'
import useSeo from '@/lib/useSeo'
import PdfModal from '@/components/site/PdfModal'
import digitalMascot from '@/assets/advertise/advertise-digital-mascot.png'
import printMascot from '@/assets/advertise/advertise-print-mascot.png'
import flyingMascot from '@/assets/advertise/advertise-flying-mascot.png'

const PRINT_RATE_CARD_PDF = '/rate-cards/theSun-RateCard-PRINT.pdf'
const DIGITAL_RATE_CARD_PDF = '/rate-cards/theSun-Rate-Card-DIGITAL.pdf'

// Simple flat "person at a desk" pictogram, styled to match the stat banner.
function DeskIcon({ className }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="currentColor" aria-hidden="true">
      <circle cx="34" cy="24" r="14" />
      <path d="M34 42c-14 0-24 10-24 24v10h48V66c0-14-10-24-24-24z" />
      <rect x="6" y="76" width="56" height="6" rx="2" />
      <rect x="14" y="82" width="6" height="30" rx="1.5" />
      <rect x="48" y="82" width="6" height="30" rx="1.5" />
      <rect x="58" y="46" width="52" height="34" rx="3" />
      <rect x="63" y="51" width="42" height="24" rx="1.5" fill="white" />
      <rect x="80" y="80" width="8" height="8" />
      <rect x="70" y="88" width="28" height="5" rx="2" />
    </svg>
  )
}

function RateCardRow({
  mascot,
  mascotAlt,
  accent,
  label,
  sublabel,
  onClick,
  reverse,
}: {
  mascot?: any
  mascotAlt?: string
  accent?: string
  label?: any
  sublabel?: any
  onClick?: () => void
  reverse?: boolean
}) {
  const accentClasses = {
    red: { ring: 'border-primary', text: 'text-primary' },
    green: { ring: 'border-secondary', text: 'text-secondary' },
  }[accent]

  return (
    <div
      className={`flex flex-col ${reverse ? 'sm:flex-row-reverse' : 'sm:flex-row'} items-center justify-between gap-8 p-6 sm:p-10`}
    >
      <img
        src={mascot}
        alt={mascotAlt}
        className="w-full max-w-[240px] sm:max-w-[280px] md:max-w-[320px] h-auto shrink-0"
      />

      <button
        onClick={onClick}
        className="group flex flex-col items-center gap-3 text-center focus:outline-none"
      >
        <span
          className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-dashed ${accentClasses.ring} flex items-center justify-center transition-transform group-hover:scale-105`}
        >
          <span className={`font-serif-headline font-bold uppercase leading-tight text-sm sm:text-base ${accentClasses.text}`}>
            Click
            <br />
            Here!
          </span>
          <MousePointerClick className={`absolute -bottom-2 -right-2 h-6 w-6 ${accentClasses.text}`} />
        </span>
        <span className="leading-tight">
          <span className={`block font-serif-headline font-extrabold text-2xl sm:text-3xl uppercase ${label.color}`}>
            {label.text}
          </span>
          <span className={`block font-extrabold text-base sm:text-lg uppercase ${sublabel.color}`}>
            {sublabel.text}
          </span>
        </span>
      </button>
    </div>
  )
}

export default function AdvertisePage() {
  useSeo({ title: 'Advertise', description: 'Advertise with The Sun Malaysia — reach millions of readers across print and digital.' })

  const [openPdf, setOpenPdf] = useState(null) // 'print' | 'digital' | null

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-5xl">
      {/* Breadcrumb */}
      <p className="text-sm text-muted-foreground mb-4">
        <Link to="/" className="hover:text-primary">Home</Link>
        <span className="mx-1.5">/</span>
        <span>Advertise</span>
      </p>

      {/* Title */}
      <div className="flex items-start gap-3 mb-2">
        <span className="w-1.5 self-stretch bg-primary rounded-full" />
        <div>
          <h1 className="font-serif-headline font-extrabold text-3xl sm:text-4xl">Advertise</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Reach millions of readers across Malaysia and beyond.
          </p>
        </div>
      </div>
      <div className="w-full mb-8 sm:mb-10 border-t-2 border-primary" />

      {/* Why choose us */}
      <h2 className="font-serif-headline font-bold text-primary text-xl sm:text-2xl mb-4">
        Why Choose The Sun Malaysia Website for Your Advertising?
      </h2>
      <p className="flex items-center gap-2 font-semibold text-base sm:text-lg mb-6">
        <Star className="h-5 w-5 text-primary fill-primary shrink-0" />
        Put Your Brand in Front of Millions
      </p>

      {/* Stat banner */}
      <div className="relative bg-muted rounded-2xl p-6 sm:p-10 mb-10 sm:mb-14 overflow-hidden">
        <TrendingUp className="absolute top-6 right-6 sm:top-8 sm:right-10 h-14 w-14 sm:h-20 sm:w-20 text-border" strokeWidth={1.5} />
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          <DeskIcon className="h-24 w-24 sm:h-32 sm:w-32 text-foreground/70 shrink-0" />
          <div className="text-center sm:text-left">
            <p className="leading-none">
              <span className="font-serif-headline font-extrabold text-primary text-5xl sm:text-7xl">2.1</span>{' '}
              <span className="font-serif-headline italic font-bold text-3xl sm:text-5xl">million</span>
            </p>
            <p className="font-serif-headline font-extrabold text-2xl sm:text-4xl mt-1">monthly page views</p>
          </div>
        </div>
        <p className="text-right text-xs sm:text-sm italic text-muted-foreground mt-4">*Source: Google Analytics 360</p>
      </div>

      {/* Rate card panel */}
      <div className="border border-border rounded-2xl divide-y divide-border overflow-hidden mb-10 sm:mb-14">
        <RateCardRow
          mascot={digitalMascot}
          mascotAlt="The Sun Malaysia mascot promoting digital advertising"
          accent="red"
          label={{ text: 'Rate-Card', color: 'text-secondary' }}
          sublabel={{ text: '(Digital Advertising)', color: 'text-primary' }}
          onClick={() => setOpenPdf('digital')}
        />
        <RateCardRow
          mascot={printMascot}
          mascotAlt="The Sun Malaysia mascot promoting print advertising"
          accent="green"
          label={{ text: 'Rate-Card', color: 'text-primary' }}
          sublabel={{ text: '(Print Advertising)', color: 'text-secondary' }}
          onClick={() => setOpenPdf('print')}
          reverse
        />
      </div>

      {/* Contact */}
      <h2 className="font-bold text-lg sm:text-xl mb-4">
        Contact our Advertising &amp; Marketing Team for Print and Online
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-end gap-2">
        <div className="bg-primary text-white rounded-2xl p-6 sm:p-8">
          <p className="font-bold text-lg sm:text-xl leading-snug">
            SUN MEDIA CORPORATION SDN BHD (221220-K)
            <br />
            HEAD OFFICE
          </p>
          <div className="mt-4 space-y-1.5 text-sm sm:text-base">
            <p>Lot 6, Jalan 51/217, 46050 Petaling Jaya,</p>
            <p>Selangor Darul Ehsan, Malaysia</p>
            <p>Tel: +603-77848888 / +603-77846688</p>
            <p>Fax: +603-77852625</p>
            <p>
              Email:{' '}
              <a href="mailto:advertise@thesundaily.com" className="text-yellow-300 hover:underline">
                advertise@thesundaily.com
              </a>
            </p>
          </div>
        </div>
        <img
          src={flyingMascot.src}
          alt="The Sun Malaysia mascot"
          className="hidden md:block w-40 lg:w-52 h-auto -mb-4 -ml-8 shrink-0"
        />
      </div>

      <PdfModal
        open={openPdf === 'print'}
        onClose={() => setOpenPdf(null)}
        src={PRINT_RATE_CARD_PDF}
        title="The Sun Malaysia Rate Card — Print Advertising"
      />
      <PdfModal
        open={openPdf === 'digital'}
        onClose={() => setOpenPdf(null)}
        src={DIGITAL_RATE_CARD_PDF}
        title="The Sun Malaysia Rate Card — Digital Advertising"
      />
    </div>
  )
}
