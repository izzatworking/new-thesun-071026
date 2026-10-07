import appBanner from '@/assets/app-promo-banner.webp'
import { appStoreUrl } from '@/lib/app'

export default function AppPromoBanner() {
  return (
    <a
      href={appStoreUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full rounded-2xl overflow-hidden shadow-md border border-border/60"
    >
      <img
        src={appBanner.src}
        alt="The Sun Malaysia app — News that matters. Now even better. Download the updated The Sun Malaysia app."
        className="w-full h-auto object-cover"
        loading="lazy"
      />
    </a>
  )
}
