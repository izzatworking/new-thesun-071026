// Ambient globals used across the app (mainly third-party scripts and the
// legacy iOS PWA flag), so the converted TypeScript files type-check cleanly.
export {}

declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
    fbq?: (...args: any[]) => void
    __NEXT_DATA__?: any
  }

  interface Navigator {
    // Legacy iOS Safari standalone flag used by the install prompt.
    standalone?: boolean
  }

  interface HTMLElementEventMap {
    beforeinstallprompt: any
  }
}
