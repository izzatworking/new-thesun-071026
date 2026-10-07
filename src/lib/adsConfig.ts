// Registry of every manageable ad "slot" on The Sun Malaysia.
// Add/remove entries here and the Ads Manager picks them up automatically.
// Each slot is rendered by <AdSlot id="…"> which shows the editor's saved
// code if present, otherwise the page's own default markup (children).

export const AD_SLOTS = [
  {
    id: 'header-top',
    label: 'Header Top Banner',
    location: 'SiteHeader — right of the logo (desktop)',
    size: '728 × 90',
    height: 90,
    maxWidth: 728,
    section: 'site',
  },
  {
    id: 'home-sidebar-ad',
    label: 'Homepage Sidebar Ad',
    location: 'HomePage sidebar (AdBanner spot)',
    size: '~3:1',
    height: 160,
    maxWidth: 480,
    section: 'site',
  },
  {
    id: 'home-app-promo',
    label: 'Homepage App Promo',
    location: 'HomePage sidebar (app download banner)',
    size: 'Responsive',
    height: 160,
    maxWidth: null,
    section: 'site',
  },
  {
    id: 'sidebar-bottom',
    label: 'Sidebar Bottom Ad',
    location: 'Sidebar — bottom "Ads Banner" placeholder',
    size: 'Responsive, min 250',
    height: 250,
    maxWidth: null,
    section: 'site',
  },
  {
    id: 'article-in-article',
    label: 'In-Article Ad',
    location: 'ArticlePage — end of article body',
    size: 'Responsive, ~250',
    height: 250,
    maxWidth: 728,
    section: 'article',
  },
  {
    id: 'merdeka-banner',
    label: 'Campaign Banner (Region block)',
    location: 'RegionNewsBlock — campaign/ad banner',
    size: '~300 × 300',
    height: 300,
    maxWidth: 300,
    section: 'site',
  },
  {
    id: 'ads-corner',
    label: 'Ads Corner Banner',
    location: 'RegionNewsBlock — "Ads Corner" column',
    size: 'Responsive',
    height: 250,
    maxWidth: null,
    section: 'site',
  },
]

export const SITE_AD_SLOTS = AD_SLOTS.filter((s) => (s.section || 'site') === 'site')
export const ARTICLE_AD_SLOTS = AD_SLOTS.filter((s) => s.section === 'article')
export const AD_SLOT_IDS = AD_SLOTS.map((s) => s.id)
