import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import SiteApp from '@/components/site/SiteApp'
import { getMeta } from '@/lib/server/meta'
import { SITE } from '../../../site.config.mjs'

// Every WordPress permalink falls through this catch-all. The app is rendered
// on the server (SSR) and hydrated on the client; real routes like /api/* take
// precedence.
export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>
type Props = {
  params: Promise<{ slug?: string[] }>
  searchParams: Promise<SearchParams>
}

function toSearchString(sp: SearchParams) {
  const usp = new URLSearchParams()
  for (const [k, v] of Object.entries(sp || {})) {
    if (Array.isArray(v)) v.forEach((x) => usp.append(k, x))
    else if (v != null) usp.set(k, v)
  }
  return usp.toString()
}

async function loadMeta({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = await searchParams
  const path = '/' + (slug || []).join('/')
  return getMeta(path, toSearchString(sp))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const m = await loadMeta(props)

  const title =
    m.title && m.title.includes(SITE.brand) ? { absolute: m.title } : m.title

  const images = m.image
    ? [
        {
          url: m.image,
          width: m.imageWidth || undefined,
          height: m.imageHeight || undefined,
          alt: m.imageAlt || m.title,
        },
      ]
    : undefined

  const metadata: Metadata = {
    title,
    description: m.description,
    alternates: { canonical: m.canonical },
    robots: m.robots,
    openGraph: {
      type: (m.type || 'website') as any,
      title: m.title,
      description: m.description,
      url: m.canonical,
      siteName: SITE.brand,
      locale: m.locale || 'en_MY',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: m.title,
      description: m.description,
      images: m.image ? [m.image] : undefined,
      site: SITE.twitter,
      creator: SITE.twitter,
    },
  }

  if (m.type === 'article') {
    ;(metadata.openGraph as any).publishedTime = m.publishedTime
    ;(metadata.openGraph as any).modifiedTime = m.modifiedTime
    ;(metadata.openGraph as any).section = m.section
    ;(metadata.openGraph as any).tags = m.tagNames
    if (m.authorUrl) (metadata.openGraph as any).authors = [m.authorUrl]
  }

  return metadata
}

export default async function CatchAllPage(props: Props) {
  const m = await loadMeta(props)
  if (m.notFound) notFound()

  return (
    <>
      {m.jsonLd && (
        <script
          type="application/ld+json"
          data-seo="1"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(m.jsonLd).replace(/</g, '\\u003c') }}
        />
      )}
      <Suspense fallback={null}>
        <SiteApp />
      </Suspense>
    </>
  )
}
