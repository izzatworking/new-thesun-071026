import { useEffect, useState } from 'react'
import { categoryUrl } from '@/lib/urls'
import { Link } from '@/lib/router'
import { Apple, PlayCircle, Smartphone } from 'lucide-react'
import SocialIcons from './SocialIcons'
import NewsletterPopup from './NewsletterPopup'
import IpaperPopup from './IpaperPopup'
import { SITE } from '../../../site.config.mjs'

// Footer background follows the KL skyline artwork. There are TWO versions
// of that art — a mobile crop (skyline-mobile.png) and a wider desktop crop
// (skyline-desktop.png) — swapped at the same `md` breakpoint used elsewhere
// below. Each art file's silhouette bleeds into a solid black panel at a
// very slightly different near-black tone, so each has its own seam color
// to guarantee a perfectly seamless join into the footer body regardless of
// which asset is showing.
const FOOTER_BG = '#030307'
const FOOTER_BG_SEAM_DESKTOP = '#000000'
const FOOTER_BG_SEAM_MOBILE = '#000000'

// Three store badges rendered as individual bordered buttons (was one
// combined store-badges.png image before). Icons are generic lucide glyphs
// standing in for each store, not the stores' own brand marks.
const APP_STORES = [
  { eyebrow: 'Download it from', store: 'App Store', href: SITE.app.apple, icon: Apple, glowClass: 'store-glow-blue' },
  { eyebrow: 'Get it on', store: 'Play Store', href: SITE.app.play, icon: PlayCircle, glowClass: 'store-glow-lime' },
  { eyebrow: 'Explore it', store: 'AppGallery', href: SITE.app.appgallery, icon: Smartphone, glowClass: 'store-glow-pink' },
]

// 4 link columns, each with its own "Links" heading + red underline, matching
// the new mockup. Same underlying destinations as before, just grouped under
// explicit column headings instead of two plain nav lists + Company + Advertise.
const LINK_COLUMNS = [
  {
    heading: 'News',
    items: [
      { label: 'Malaysia', slug: 'malaysia-news' },
      { label: 'Asia', slug: 'asia' },
      { label: 'World', slug: 'world-news' },
      { label: 'Going Viral', slug: 'going-viral' },
      { label: 'Business', slug: 'business' },
      { label: 'Opinion', slug: 'opinion' },
       { label: 'Berita', slug: 'berita' },
    ],
  },
  {
    heading: 'More',
    items: [
      { label: 'Lifestyle', slug: 'lifestyle' },
      { label: 'Spotlight', slug: 'spotlight' },
      { label: 'Sports', slug: 'sports' },
      { label: 'Education', slug: 'education' },
      { label: 'Property', slug: 'property' },
      { label: 'Motoring', slug: 'motoring' },
         { label: 'Videos', to: '/videos' },
    ],
  },
  {
    heading: 'About Us',
    items: [
      { label: 'Company', to: '/about' },
      { label: 'Contact', to: '/contact' },
      { label: 'Privacy Policy', to: '/privacy-policy' },
        { label: 'RSS Feed', to: 'https://thesun.my/feed/' },
    ],
  },
  {
    heading: 'Subscriptions',
    items: [
      { label: 'Newspaper', href: '/get-newspaper' },
      { label: 'iPaper', action: 'ipaper' },
      { label: 'Newsletter', action: 'newsletter' },
    ],
    // Sub-section rendered inside this SAME column, under its own smaller
    // heading — not a separate grid column, so it always stays stacked
    // under "Subscriptions" no matter how the columns wrap on smaller screens.
    subsection: {
      heading: 'Advertise',
      items: [
        { label: 'Print & Digital', to: '/advertise' },
        { label: 'Classifieds', href: 'https://www.sunmedia.my' }, // TODO: confirm real classifieds URL
      ],
    },
  },
]

// Awards section — single pre-composed graphic (mpi/Petronas, PRCA Malaysia,
// Putra Aria Brand Awards, CSR Malaysia, The SOPA Awards) replacing the old
// 6 individually-boxed partner logos. Muted/monochrome art, no borders,
// under an "Awards" heading — same treatment on mobile and desktop since
// it's one flat image that just scales with the column width.
// Hovering the graphic crossfades from the muted grayscale version to a
// full-color one (hoverSrc) — same 5 logos, same layout, just in brand color.
const AWARDS_IMAGE = {
  src: '/footer/awards.svg',
  hoverSrc: '/footer/awards-hover.svg',
  alt: 'Awards: Malaysian Press Institute (MPI) x Petronas, PRCA Malaysia, Putra Aria Brand Awards, CSR Malaysia, The SOPA Awards',
}

// Sunbot mascot + speech bubble that floats above the copyright bar.
// The bubble is now a plain bordered box with big red curly quote marks
// (no more box-bubble.png tail graphic) — matches the new mockup. The
// message types itself out, and "Welcome aboard!" always renders in the
// brand's orange/accent color once it appears.
const SUNBOT_MESSAGE_MAIN =
  "It's amazing that the amount of news that happens in the world every day always just exactly fits the newspaper.\n\nYour support makes independent reporting possible. "
const SUNBOT_MESSAGE_HIGHLIGHT = 'Welcome aboard!'
const SUNBOT_MESSAGE_FULL = SUNBOT_MESSAGE_MAIN + SUNBOT_MESSAGE_HIGHLIGHT

function SunbotMascot() {
  const [typed, setTyped] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let i = 0
    const timer = setInterval(() => {
      i += 1
      setTyped(SUNBOT_MESSAGE_FULL.slice(0, i))
      if (i >= SUNBOT_MESSAGE_FULL.length) {
        clearInterval(timer)
        setDone(true)
      }
    }, 25)
    return () => clearInterval(timer)
  }, [])

  // Split what's been typed so far into the plain part and the highlighted
  // "Welcome aboard!" part, which only starts appearing once typing reaches it.
  const typedMain = typed.slice(0, SUNBOT_MESSAGE_MAIN.length)
  const typedHighlight = typed.slice(SUNBOT_MESSAGE_MAIN.length)

  return (
    <div className="flex justify-center lg:justify-end">
      {/* Keyframes for the gentle float + typewriter cursor blink. */}
      <style>{`
        @keyframes sunbot-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
        @keyframes sunbot-blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .sunbot-float { animation: sunbot-float 4.5s ease-in-out infinite; }
        .sunbot-cursor { animation: sunbot-blink 0.9s steps(1) infinite; }
      `}</style>

      <div className="sunbot-float flex items-end">
        {/* Speech box — bordered rectangle with oversized red quote marks,
            replacing the old box-bubble.png artwork. Sits behind the mascot
            (z-0) so the enlarged mobile mascot can overlap its right edge,
            matching the mockup. */}
        <div className="relative z-0 max-w-[360px] sm:max-w-[440px] rounded-md border border-white/25 px-6 py-5">
          <span
            className="absolute -top-3 left-3 text-3xl sm:text-4xl font-serif leading-none text-primary select-none"
            aria-hidden="true"
          >
            &ldquo;
          </span>
          <span
            className="absolute -bottom-5 right-3 text-3xl sm:text-4xl font-serif leading-none text-primary select-none"
            aria-hidden="true"
          >
            &rdquo;
          </span>
          <p className="text-xs leading-relaxed text-white/80 whitespace-pre-line">
            {typedMain}
            <span className="text-primary font-bold">{typedHighlight}</span>
            {!done && (
              <span className="sunbot-cursor inline-block w-[2px] h-[1em] -mb-[2px] bg-white/70 ml-0.5" aria-hidden="true" />
            )}
          </p>
        </div>
        <img
  src="/footer/Sunbt.svg"
  alt="The Sun Malaysia mascot"
  className="relative z-10 w-32 sm:w-48 h-auto -ml-10 sm:-ml-3 select-none pointer-events-none"
/>
      </div>
    </div>
  )
}

function LinkColumn({ heading, items, subsection, onNewsletterClick, onIpaperClick }) {
  return (
    <div className="text-center sm:text-left">
      <h3 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wide inline-block">
        {heading}
      </h3>
      <ul className="mt-3 space-y-2 sm:space-y-2.5 text-[11px] sm:text-sm leading-snug text-[#898989]">
        {items.map((item) => (
          <li key={item.label}>
            {item.action === 'newsletter' ? (
              <button
                type="button"
                onClick={onNewsletterClick}
                className="hover:text-white transition-colors"
              >
                {item.label}
              </button>
            ) : item.action === 'ipaper' ? (
              <button
                type="button"
                onClick={onIpaperClick}
                className="hover:text-white transition-colors"
              >
                {item.label}
              </button>
            ) : item.href ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                {item.label}
              </a>
            ) : item.slug ? (
              <Link to={categoryUrl(item)} className="hover:text-white transition-colors">
                {item.label}
              </Link>
            ) : (
              <Link to={item.to} className="hover:text-white transition-colors">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>

      {subsection && (
        <>
          <h3 className="mt-5 text-sm sm:text-base font-extrabold text-white uppercase tracking-wide inline-block">
            {subsection.heading}
          </h3>
          <ul className="mt-3 space-y-2 sm:space-y-2.5 text-[11px] sm:text-sm leading-snug text-[#898989]">
            {subsection.items.map((item) => (
              <li key={item.label}>
                {item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    {item.label}
                  </a>
                ) : item.slug ? (
                  <Link to={categoryUrl(item)} className="hover:text-white transition-colors">
                    {item.label}
                  </Link>
                ) : (
                  <Link to={item.to} className="hover:text-white transition-colors">
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export default function SiteFooter() {
  const [newsletterOpen, setNewsletterOpen] = useState(false)
  const [ipaperOpen, setIpaperOpen] = useState(false)

  return (
    <footer className="text-white mt-16 overflow-hidden" style={{ backgroundColor: FOOTER_BG }}>
      {/* Newsletter subscription pop-up — opened from the "Newsletter" link
          in the Subscriptions column below */}
      <NewsletterPopup open={newsletterOpen} onClose={() => setNewsletterOpen(false)} />
      {/* iPaper subscription pop-up — opened from the "iPaper" link in the
          Subscriptions column below */}
      <IpaperPopup open={ipaperOpen} onClose={() => setIpaperOpen(false)} />
      {/* KL skyline artwork — white sky on top, solid black city silhouette on
          the bottom that fills edge-to-edge into the footer body below.
          Desktop gets the wider crop, mobile/tablet gets the taller crop
          made for narrower viewports; swapped via <picture> so only the
          needed asset is downloaded. */}
      <div className="relative leading-[0]">
        <picture>
          <source media="(min-width: 768px)" srcSet="/footer/skyline-desktop.svg" />
          <img
            src="/footer/skyline-mobile.svg"
            alt=""
            aria-hidden="true"
            className="w-full h-auto block select-none pointer-events-none"
          />
        </picture>
        <div
          className="absolute bottom-0 left-0 right-0 h-2 hidden md:block"
          style={{ backgroundColor: FOOTER_BG_SEAM_DESKTOP }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-2 block md:hidden"
          style={{ backgroundColor: FOOTER_BG_SEAM_MOBILE }}
        />
      </div>

      <div className="container mx-auto px-4 pt-10 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-10 lg:gap-x-8 items-start">

          {/* Logo + tagline + app promo + Follow Us + partner logos —
              centered on mobile, left-aligned on desktop. */}
          <div className="lg:col-span-5 flex flex-col items-center text-center lg:items-start lg:text-left">
            <Link to="/" aria-label="The Sun Malaysia - Home" className="inline-block">
              <img src="/logo.svg" alt="The Sun Malaysia" className="h-14 sm:h-16 w-auto" />
            </Link>

            <p className="mt-3 text-sm sm:text-base text-white/80 font-semibold">
              Independent Malaysian Journalism.
            </p>

            <div className="mt-6">
              <h3 className="text-base sm:text-lg font-extrabold uppercase tracking-wide">
                Download Our App Now.
              </h3>
              <p className="mt-1 text-sm text-white/60">
                Your trusted source for news that matters.
              </p>
            </div>

            {/* Glow colors per store, same hover-glow treatment as SocialIcons:
                App Store -> light blue, Play Store -> lime, AppGallery -> dark pink. */}
            <style>{`
              .store-glow-blue:hover { border-color: #7dd3fc; background-color: rgba(125, 211, 252, 0.08); box-shadow: 0 0 16px rgba(125, 211, 252, 0.55); }
              .store-glow-blue:hover svg { color: #7dd3fc; filter: drop-shadow(0 0 6px rgba(125, 211, 252, 0.8)); }
              .store-glow-blue:hover span { color: #7dd3fc; text-shadow: 0 0 8px rgba(125, 211, 252, 0.7); }
              .store-glow-lime:hover { border-color: #a3e635; background-color: rgba(163, 230, 53, 0.08); box-shadow: 0 0 16px rgba(163, 230, 53, 0.55); }
              .store-glow-lime:hover svg { color: #a3e635; filter: drop-shadow(0 0 6px rgba(163, 230, 53, 0.8)); }
              .store-glow-lime:hover span { color: #a3e635; text-shadow: 0 0 8px rgba(163, 230, 53, 0.7); }
              .store-glow-pink:hover { border-color: #be185d; background-color: rgba(190, 24, 93, 0.08); box-shadow: 0 0 16px rgba(190, 24, 93, 0.55); }
              .store-glow-pink:hover svg { color: #be185d; filter: drop-shadow(0 0 6px rgba(190, 24, 93, 0.8)); }
              .store-glow-pink:hover span { color: #be185d; text-shadow: 0 0 8px rgba(190, 24, 93, 0.7); }
            `}</style>

            <div className="mt-3 flex flex-wrap justify-center lg:justify-start gap-2">
              {APP_STORES.map(({ eyebrow, store, href, icon: Icon, glowClass }) => (
                <a
                  key={store}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${eyebrow} ${store}`}
                  className={`flex items-center gap-2 rounded-md border border-white/25 px-3 py-2 transition-all duration-200 ${glowClass}`}
                >
                  <Icon className="h-5 w-5 shrink-0 transition-colors duration-200" />
                  <span className="leading-tight text-left">
                    <span className="block text-[9px] text-white/60 transition-colors duration-200">{eyebrow}</span>
                    <span className="block text-xs font-bold transition-colors duration-200">{store}</span>
                  </span>
                </a>
              ))}
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-2.5">Follow Us</p>
              <SocialIcons size="md" />
            </div>

            {/* Awards — heading + single flat graphic, no boxes/borders.
                Same markup for mobile and desktop; the image just scales
                with the column width at every breakpoint. */}
            <div className="mt-6 w-full max-w-[480px] lg:max-w-none">
              <p className="text-xs sm:text-sm font-extrabold text-white/50 uppercase tracking-widest mb-3 text-center lg:text-left">
                Awards
              </p>
              <div className="group relative">
                {/* Base grayscale graphic — sets the box size (h-auto) and
                    fades out on hover. */}
                <img
                  src={AWARDS_IMAGE.src}
                  alt={AWARDS_IMAGE.alt}
                  className="w-full h-auto select-none pointer-events-none transition-opacity duration-300 ease-out group-hover:opacity-0"
                />
                {/* Full-color graphic — stacked exactly on top of the
                    grayscale one, fades in on hover. Decorative/aria-hidden
                    since the base <img> above already carries the alt text. */}
                <img
                  src={AWARDS_IMAGE.hoverSrc}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
                />
              </div>
            </div>
          </div>

          {/* Link columns — 4 across, each with its own heading. */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6">
              {LINK_COLUMNS.map((col) => (
                <LinkColumn
                  key={col.heading}
                  heading={col.heading}
                  items={col.items}
                  subsection={col.subsection}
                  onNewsletterClick={() => setNewsletterOpen(true)}
                  onIpaperClick={() => setIpaperOpen(true)}
                />
              ))}
            </div>

            {/* Sunbot mascot — floats gently, speech bubble types itself out.
                Sits under the link columns, filling the space left below them
                now that this column no longer stretches to match the taller
                logo/partner-logos column. */}
            <div className="mt-8">
              <SunbotMascot />
            </div>
          </div>
        </div>

        {/* Copyright — separated by a top border, stacked/centered on mobile,
            split left/right on desktop. */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-white/50 text-center sm:text-left">
          <p>© 1993-2026 All Rights Reserved.</p>
          <p>The Sun Malaysia is proudly owned by Sun Media Corporation Sdn Bhd. (221220-K)</p>
        </div>
      </div>
    </footer>
  )
}
