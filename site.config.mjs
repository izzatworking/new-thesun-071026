// Single source of truth for site identity, used by the app (src/**), the
// Cloudflare Pages Function (functions/**) and the build-time HTML injection
// (vite.config.js). Keep this dependency-free so both bundles can import it.

export const SITE = {
  url: 'https://thesun.my',
  brand: 'The Sun Malaysia',
  legalName: 'Sun Media Corporation Sdn Bhd',
  alternateName: 'thesundaily',
  logo: 'https://thesun.my/wp-content/uploads/2025/09/theSun-logo-453x247-1.png',
  logoWidth: 453,
  logoHeight: 247,
  ogImage: 'https://thesun.my/wp-content/uploads/2025/09/theSun-logo-453x247-1.png',
  twitter: '@thesundaily',
  description:
    'The Sun Malaysia (The Sun Malaysia) — Malaysian daily news covering national, world, business, lifestyle and sports, published by Sun Media Corporation Sdn Bhd since 1993.',
  foundingDate: '1993',
  contactPoint: {
    telephone: '+603 7784 6688',
    contactType: 'customer support',
    areaServed: 'MY',
    availableLanguage: ['en', 'ms'],
  },
  address: {
    streetAddress: 'Level 4, Lot 6, Jalan 51/217, PJS 51',
    addressLocality: 'Petaling Jaya',
    addressRegion: 'Selangor',
    postalCode: '46050',
    addressCountry: 'MY',
  },
  policies: {
    publishingPrinciples: '/about-us/',
    ethicsPolicy: '/terms/',
    correctionsPolicy: '/disclaimer/',
    ownershipFundingInfo: '/about-us/',
    masthead: '/about-us/',
  },
  sameAs: [
    'https://www.facebook.com/thesundaily',
    'https://www.instagram.com/thesundaily',
    'https://t.me/thesuntelegram',
    'https://whatsapp.com/channel/0029Vb5YWVOAO7REL4UZuD06',
    'https://www.tiktok.com/@thesundaily',
    'https://x.com/thesundaily',
    'https://www.youtube.com/@theSunMedia',
  ],
  // Drives the on-site social icons. All entries open in a new tab.
  socials: [
    { name: 'Facebook', href: 'https://www.facebook.com/thesundaily' },
    { name: 'Instagram', href: 'https://www.instagram.com/thesundaily' },
    { name: 'Telegram', href: 'https://t.me/thesuntelegram' },
    { name: 'WhatsApp', href: 'https://whatsapp.com/channel/0029Vb5YWVOAO7REL4UZuD06' },
    { name: 'TikTok', href: 'https://www.tiktok.com/@thesundaily' },
    { name: 'X', href: 'https://x.com/thesundaily' },
    { name: 'YouTube', href: 'https://www.youtube.com/@theSunMedia' },
  ],
  // Mobile app store links (single source of truth).
  app: {
    apple: 'https://apps.apple.com/my/app/the-sun-malaysia/id1440139272',
    play: 'https://play.google.com/store/apps/details?id=my.thesundaily.android',
    appgallery: 'https://appgallery.huawei.com/#/app/C101189379',
  },
}

// site-wide JSON-LD graph (Organization + WebSite) built from the config.
export function siteGraph() {
  const abs = (p) => `${SITE.url}${p}`
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'NewsMediaOrganization',
        '@id': `${SITE.url}/#organization`,
        name: SITE.brand,
        legalName: SITE.legalName,
        alternateName: SITE.alternateName,
        url: `${SITE.url}/`,
        description: SITE.description,
        foundingDate: SITE.foundingDate,
        logo: { '@type': 'ImageObject', url: SITE.logo, width: SITE.logoWidth, height: SITE.logoHeight },
        sameAs: SITE.sameAs,
        contactPoint: { '@type': 'ContactPoint', ...SITE.contactPoint },
        address: { '@type': 'PostalAddress', ...SITE.address },
        publishingPrinciples: abs(SITE.policies.publishingPrinciples),
        ethicsPolicy: abs(SITE.policies.ethicsPolicy),
        correctionsPolicy: abs(SITE.policies.correctionsPolicy),
        ownershipFundingInfo: abs(SITE.policies.ownershipFundingInfo),
        masthead: abs(SITE.policies.masthead),
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE.url}/#website`,
        url: `${SITE.url}/`,
        name: SITE.brand,
        publisher: { '@id': `${SITE.url}/#organization` },
        inLanguage: 'en-MY',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE.url}/?s={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }
}
