import { useState } from 'react'
import { SITE_URL } from '@/lib/urls'
import AdSlot from '@/components/site/AdSlot'
import useSWR from 'swr'
import { Link } from '@/lib/router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { HeroCard, FeatureCard, HorizontalCard, TimelineCard, TimelineCardSkeleton, FeatureCardSkeleton, HorizontalCardSkeleton } from '@/components/site/NewsCard'
import TrendingHashtagBar from '@/components/site/TrendingHashtagBar'
import CategoryBlock from '@/components/site/CategoryBlock'
import LifestyleBlock from '@/components/site/LifestyleBlock'
import TrendingBlock from '@/components/site/TrendingBlock'
import GoingViralBlock from '@/components/site/GoingViralBlock'
import SpotlightBlock from '@/components/site/SpotlightBlock'
import MostViewedBlock from '@/components/site/MostViewedBlock'
import OpinionBlock from '@/components/site/OpinionBlock'
import VideoBlock from '@/components/site/VideoBlock'
import SportsBlock from '@/components/site/SportsBlock'
import BreakingNewsSignup from '@/components/site/BreakingNewsSignup'
import CategoriesGlassBlock from '@/components/site/CategoriesGlassBlock'
import CategoryTripleBlock from '@/components/site/CategoryTripleBlock'
import AppPromoBanner from '@/components/site/AppPromoBanner'
import RegionNewsBlock from '@/components/site/RegionNewsBlock'
import NewsBeritaBlock from '@/components/site/NewsBeritaBlock'
import AdBanner from '@/components/site/AdBanner'
import ipaperBanner from '@/assets/ipaper-banner.webp'
import instagramBanner from '@/assets/instagram-banner.png'
import { asArray } from '@/lib/wp'
import { DedupeProvider, useDedupe } from '@/lib/dedupe'
import useSeo from '@/lib/useSeo'

// 'sports' and 'malaysia-news' are rendered up top via <SportsBlock /> and
// <RegionNewsBlock /> now, so they're excluded here to avoid duplicates.
// 'education', 'motoring', and 'people-issues' render earlier in the
// dedicated 3-column row right before RegionNewsBlock.

export default function HomePage() {
  return (
    <DedupeProvider>
      <HomePageInner />
    </DedupeProvider>
  )
}

function HomePageInner() {
  useSeo({
    title: 'The Sun Malaysia - Daily News, Latest Headlines & Breaking Stories',
    description: 'Your trusted source for Malaysia news, business, lifestyle, sports, entertainment, world news and breaking stories.',
    url: `${SITE_URL}/`,
  })

  const PER_PAGE = 5
  const [topPage, setTopPage] = useState(1)

  // Hero + 4 cards: the 6 newest posts (cached edge feed).
  const { data: latest } = useSWR('/api/feed?type=latest&limit=6')
  // "Latest News" box: true newest, no overlap — the first 5 newest posts are
  // the hero + cards, so page 1 starts at offset 5 (#6–#10), page 2 at #11–#15…
  const latestOffset = PER_PAGE + (topPage - 1) * PER_PAGE
  const { data: topData, isLoading: topLoading } = useSWR(
    `/api/feed?type=latest&limit=${PER_PAGE}&offset=${latestOffset}`
  )

  const latestArr = asArray(latest)
  const top = useDedupe('home-hero', 1, latestArr, 1)[0]
  const heroBelowGrid = useDedupe('home-cards', 2, latestArr.slice(1), 4)
  const topStories = useDedupe('home-latest', 3, asArray(topData), PER_PAGE)

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="sr-only">The Sun Malaysia — Latest News, Breaking Headlines, Business, Lifestyle and Sports</h1>
      {/* Main column (hero, 4-cards, Spotlight, Going Viral, Business) and the
          sidebar (Latest News, ipaper, Opinion, Ad, Instagram, Most Viewed)
          each flow independently top-to-bottom in ONE shared grid — items-start
          stops either column from stretching to match the other, so the
          sidebar never waits on the (usually taller) main column. */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 items-start">
        <div className="lg:col-span-2 space-y-6">
          <TrendingHashtagBar />

          {top ? <HeroCard post={top} /> : <div className="aspect-[16/9] rounded-lg skeleton-shimmer" />}

          {/* Small news cards under the hero */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {heroBelowGrid.length === 0
              ? [...Array(4)].map((_, i) => <FeatureCardSkeleton key={i} />)
              : heroBelowGrid.map(p => <FeatureCard key={p.id} post={p} />)}
          </div>

          {/* Spotlight — now directly under the 4 cards, not gated on the sidebar's height */}
          <SpotlightBlock />

          {/* Going Viral — full width of the main column */}
          <GoingViralBlock />

          {/* Business — continues the main column's independent flow */}
          <CategoryBlock slug="business" />
        </div>

        <div className="space-y-6">
          <section className="border border-border rounded-md overflow-hidden h-fit">
            <div className="bg-primary text-white font-extrabold italic uppercase tracking-wide text-xl sm:text-2xl px-5 py-4">
              Latest News
            </div>
            <div className="px-5 pt-5 overflow-hidden min-h-[380px]">
              {topLoading
                ? [...Array(PER_PAGE)].map((_, i) => <TimelineCardSkeleton key={i} />)
                : topStories.map((p, i) => (
                    <TimelineCard key={p.id} post={p} isLast={i === topStories.length - 1} />
                  ))}
            </div>
            {/* Prev / Next buttons */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
              <button
                onClick={() => setTopPage(p => Math.max(1, p - 1))}
                disabled={topPage === 1}
                aria-label="Previous"
                className="w-8 h-8 flex items-center justify-center border border-border rounded hover:border-primary hover:text-primary transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setTopPage(p => p + 1)}
                disabled={topStories.length < PER_PAGE}
                aria-label="Next"
                className="w-8 h-8 flex items-center justify-center border border-border rounded hover:border-primary hover:text-primary transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>

          {/* The Sun Malaysia i-paper promo banner — moved up to sit directly under Latest News,
              right after the Page 1 pagination, so it no longer leaves a gap below. */}
          <a
            href="https://thesun-ipaper.cld.bz/"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-md overflow-hidden border border-border bg-white"
          >
            <img
              src={ipaperBanner.src}
              alt="The Sun Malaysia i-paper — Your Paper. Your Way. Anywhere, Anytime."
              className="w-full h-auto object-contain"
            />
          </a>

          {/* Opinion — follows immediately after the banner in the same sidebar flow */}
          <OpinionBlock />

          {/* Ad banner */}
          <AdSlot id="home-sidebar-ad" height={160} maxWidth={480}><AdBanner /></AdSlot>

          {/* Instagram promo banner */}
          <a
            href="https://www.instagram.com/thesundaily/"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-md overflow-hidden border border-border bg-white"
          >
            <img
              src={instagramBanner.src}
              alt="Follow The Sun Malaysia on Instagram @thesundaily"
              className="w-full h-auto object-contain"
            />
          </a>

          {/* Most Viewed Stories — continues the sidebar's independent flow */}
          <MostViewedBlock />
        </div>
      </section>

      {/* Lifestyle — full-width section, placed right after Business, spanning both columns */}
      <LifestyleBlock />

      {/* Weekly Trending / Breaking News — full-width, auto-advancing, placed after Lifestyle */}
      <TrendingBlock />

      {/* The Sun Malaysia Videos — full-width dark video hub card, pulling the channel's latest
          uploads from the same YouTube Data API v3 source as the standalone Videos page */}
      <VideoBlock />

      {/* Sports spotlight (2/3, with the app promo banner directly beneath it so the
          banner only spans the sports column's width) + Breaking News signup and
          glassmorphic Categories (1/3), placed right below the video block, matching
          the reference layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-20">
        <div className="lg:col-span-2 space-y-6">
          <SportsBlock />
          <AdSlot id="home-app-promo" height={160}><AppPromoBanner /></AdSlot>
        </div>
        <div className="space-y-6">
          <BreakingNewsSignup />
          <CategoriesGlassBlock />
        </div>
      </div>

      {/* Education / Motoring / Property — 3-column row of mini category blocks,
          placed right after the Sports/Categories section and before the
          Malaysia / Asia / World region grid */}
      <div className="mt-10">
        <CategoryTripleBlock
          columns={[
            { slug: 'education', label: 'Education' },
            { slug: 'motoring', label: 'Motoring' },
            { slug: 'people-issues', label: 'People & Issues' },
          ]}
        />
      </div>

      {/* Malaysia / Asia / World — 3-column responsive glass grid */}
      <div className="mt-10">
        <RegionNewsBlock />
      </div>

      {/* News + Berita — two 4-card rows sharing one header, side by side labels */}
      <div className="mt-10">
        <NewsBeritaBlock />
      </div>
    </div>
  )
}
