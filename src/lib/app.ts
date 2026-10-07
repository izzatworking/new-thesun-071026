import { SITE } from '../../site.config.mjs'

// Device-based app-store routing for single "download the app" links.
// iOS → App Store, Huawei/HarmonyOS → AppGallery, other Android + default → Play.
export function appStoreUrl() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  if (/iPad|iPhone|iPod/i.test(ua)) return SITE.app.apple
  if (/Huawei|HarmonyOS|AppGallery/i.test(ua)) return SITE.app.appgallery
  return SITE.app.play
}
