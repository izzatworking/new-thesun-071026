import type { Metadata, Viewport } from 'next'
import '../index.css'
import Providers from './providers'
import { SITE, siteGraph } from '../../site.config.mjs'

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: 'The Sun Malaysia - Daily News',
    template: '%s | The Sun Malaysia',
  },
  description: 'The Sun Malaysia - Daily News, Latest Headlines & Breaking Stories',
  applicationName: SITE.brand,
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  openGraph: {
    title: 'The Sun Malaysia - Daily News',
    description: 'Latest Malaysia news, breaking headlines, business, lifestyle and more.',
    type: 'website',
    siteName: SITE.brand,
    images: [SITE.ogImage],
  },
  twitter: {
    card: 'summary_large_image',
    site: SITE.twitter,
    creator: SITE.twitter,
  },
  appleWebApp: {
    capable: true,
    title: 'The Sun Malaysia',
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#000000',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-MY">
      <head>
        {/* Site-wide structured data (Organization + WebSite) built from site.config.mjs */}
        <script
          type="application/ld+json"
          data-global="1"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteGraph()) }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
