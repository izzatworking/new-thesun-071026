// Light pink "Stay Current" banner promoting The Sun Malaysia's social channels.
// Dropped at the end of every article body.
import { SITE } from '../../../site.config.mjs'

const socialHref = (name) => SITE.socials.find((s) => s.name === name)?.href || '#'

function TikTokSvg(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.6 5.82c-.9-.98-1.4-2.26-1.4-3.6h-3.2v13.7c0 1.56-1.27 2.83-2.83 2.83a2.83 2.83 0 0 1 0-5.66c.26 0 .51.03.75.1V9.9a6.03 6.03 0 0 0-.75-.05A6.03 6.03 0 0 0 3.14 15.9 6.03 6.03 0 0 0 9.17 21.9a6.03 6.03 0 0 0 6.03-6.03V8.98a8.86 8.86 0 0 0 5.13 1.64V7.4a5.44 5.44 0 0 1-3.73-1.58z" />
    </svg>
  )
}

export default function StayCurrentBanner() {
  return (
    <div className="mt-8 rounded-lg bg-primary/5 border border-primary/10 px-5 py-5 sm:px-6 sm:py-6 text-center">
      <p className="font-serif-headline italic text-sm sm:text-base text-foreground mb-4">
        Stay Current - Follow <span className="text-primary font-bold not-italic">The Sun Malaysia</span> on TikTok, Facebook and Instagram
      </p>
      <div className="flex items-center justify-center flex-wrap gap-3">
        <a
          href={socialHref('TikTok')}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-black text-white pl-3 pr-4 py-2 text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <TikTokSvg className="h-4 w-4" />
          @thesundaily
        </a>
        <a
          href={socialHref('Facebook')}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[#1877F2] text-white pl-3 pr-4 py-2 text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94z" />
          </svg>
          @thesundaily
        </a>
        <a
          href={socialHref('Instagram')}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white pl-3 pr-4 py-2 text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
          @thesundaily
        </a>
      </div>
    </div>
  )
}
