import { Facebook, Instagram, Youtube } from 'lucide-react'
import { SITE } from '../../../site.config.mjs'

// Monochrome social icons — white icons, no brand color backgrounds.

function TikTokSvg(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.79a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.22z" />
    </svg>
  )
}

function XSvg(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function WhatsAppSvg(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

function TelegramSvg(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M21.5 2.5L2.5 10.2c-.9.3-.9 1.4 0 1.7l4.9 1.5 1.9 5.9c.2.7 1.1.9 1.6.3l2.5-2.8 4.6 3.4c.7.5 1.7.1 1.8-.7l2.6-15.4c.2-1-.7-1.8-1.6-1.4zM10 14.8l-.5 4 1.4-3.6 7.4-7-8.3 6.6z" />
    </svg>
  )
}

// Icons + on-hover brand colors live here; the URLs come from the single
// source of truth (site.config.mjs), so the icons can't drift from the schema.
const ICONS = { Facebook, Instagram, Telegram: TelegramSvg, WhatsApp: WhatsAppSvg, TikTok: TikTokSvg, X: XSvg, YouTube: Youtube }
const BRANDS = { Facebook: '#1877F2', Instagram: '#E1306C', Telegram: '#29A9EB', WhatsApp: '#25D366', TikTok: '#25F4EE', X: '#1D9BF0', YouTube: '#FF0000' }

export const SOCIAL = SITE.socials
  .map((s) => ({ name: s.name, href: s.href, icon: ICONS[s.name], brand: BRANDS[s.name] }))
  .filter((s) => s.icon)

export default function SocialIcons({ size = 'md', className = '', dark = false }) {
  const iconSize  = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
  const wrapSize  = size === 'sm' ? 'w-6 h-6'     : 'w-7 h-7'
  const colorCls  = dark ? 'text-primary/70' : 'text-white/70'

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {SOCIAL.map(({ name, href, icon: Icon, brand }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={name}
          style={{ ['--brand' as any]: brand }}
          className={`${wrapSize} flex items-center justify-center rounded ${colorCls} hover:text-[var(--brand)] hover:drop-shadow-[0_0_5px_var(--brand)] hover:scale-110 transition-all duration-300 shrink-0`}
        >
          <Icon className={iconSize} />
        </a>
      ))}
    </div>
  )
}
