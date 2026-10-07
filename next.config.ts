import type { NextConfig } from 'next'

// Content-Security-Policy, REPORT-ONLY: it observes real violations without
// breaking the ad stack (Google Ad Manager + the sandboxed ad iframe + JSON-LD
// + React inline styles). Enforce later once reports are clean.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self' https://formspree.io",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://www.youtube.com https://s.ytimg.com https://securepubads.g.doubleclick.net https://pagead2.googlesyndication.com https://tpc.googlesyndication.com https://www.googletagservices.com https://*.doubleclick.net https://*.googlesyndication.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://thesun.my https://www.thesun.my https://cms.thesun.my https://*.r2.dev https://customer-assets.emergentagent.com https://i.ytimg.com https://*.gstatic.com https://www.google-analytics.com https://www.googletagmanager.com https://*.doubleclick.net https://*.googlesyndication.com",
  "connect-src 'self' https://thesun.my https://www.thesun.my https://cms.thesun.my https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://*.doubleclick.net https://*.googlesyndication.com https://*.google.com https://api.open-meteo.com https://dummyjson.com https://formspree.io https://www.googleapis.com",
  "frame-src 'self' blob: https://www.youtube.com https://www.youtube-nocookie.com https://www.googletagmanager.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://*.doubleclick.net https://*.googlesyndication.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  'report-uri /api/csp-report',
  'report-to csp',
].join('; ')

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // WordPress-style permalinks: every document URL ends with a trailing slash.
  trailingSlash: true,
  // Let our proxy (middleware) own trailing-slash enforcement so the redirect
  // map (301/410) is evaluated first, without an extra 308 hop.
  skipTrailingSlashRedirect: true,
  // Remote WordPress/YouTube assets are served through plain <img>/CSS; skip
  // the built-in image optimizer so nothing needs an allow-list.
  images: { unoptimized: true },
  // Keep the monorepo/home lockfiles from being picked up as the workspace root.
  turbopack: { root: __dirname },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=15552000' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), interest-cohort=()',
          },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          { key: 'Content-Security-Policy-Report-Only', value: CSP_REPORT_ONLY },
          { key: 'Reporting-Endpoints', value: 'csp="/api/csp-report"' },
        ],
      },
    ]
  },
}

export default nextConfig
