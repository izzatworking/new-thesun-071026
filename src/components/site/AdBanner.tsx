import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import tmbanner from '@/assets/tmbanner.png'

// Add more entries here as you get more ad creatives — the carousel
// arrows only render once there's more than one ad to cycle through.
const ADS = [
  {
    id: 1,
    image: tmbanner.src,
    alt: 'Ingoude Company advertisement',
    href: 'https://www.reallygreatsite.com',
  },
]

export default function AdBanner() {
  const [index, setIndex] = useState(0)
  const hasMultiple = ADS.length > 1
  const ad = ADS[index]

  function prev() {
    setIndex(i => (i - 1 + ADS.length) % ADS.length)
  }
  function next() {
    setIndex(i => (i + 1) % ADS.length)
  }

  return (
    <div className="relative mx-auto max-w-md sm:max-w-full rounded-md overflow-hidden border border-border bg-muted">
      <a
        href={ad.href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block"
      >
        <img
          src={ad.image}
          alt={ad.alt}
          className="w-full aspect-[3/1] object-cover"
        />
      </a>

      {hasMultiple && (
        <>
          <button
            onClick={prev}
            aria-label="Previous ad"
            className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-white/85 hover:bg-white text-foreground shadow transition-colors z-10"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={next}
            aria-label="Next ad"
            className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-white/85 hover:bg-white text-foreground shadow transition-colors z-10"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  )
}
