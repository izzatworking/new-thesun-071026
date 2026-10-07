'use client'

// Drop-in replacement for the small slice of `react-router-dom` the app used.
// It maps the Vite SPA's routing primitives onto Next.js `next/navigation`, so
// page/component code keeps the same imports and prop names (`to`, etc.).
import NextLink from 'next/link'
import {
  usePathname,
  useRouter as useNextRouter,
  useSearchParams as useNextSearchParams,
  useParams as useNextParams,
} from 'next/navigation'
import type { ComponentProps, ReactNode } from 'react'

type LinkProps = {
  to?: string | { pathname?: string; search?: string; hash?: string }
  href?: string
} & Omit<ComponentProps<typeof NextLink>, 'href'>

function toHref(to: LinkProps['to']): string {
  if (!to) return '#'
  if (typeof to === 'string') return to
  const { pathname = '', search = '', hash = '' } = to
  return `${pathname}${search}${hash}` || '#'
}

export function Link({ to, href, ...rest }: LinkProps) {
  return <NextLink href={(href ?? toHref(to)) as any} {...rest} />
}

export function useLocation() {
  const pathname = usePathname() || '/'
  const sp = useNextSearchParams()
  const qs = sp ? sp.toString() : ''
  return { pathname, search: qs ? `?${qs}` : '', hash: '' }
}

export function useNavigate() {
  const router = useNextRouter()
  return (to: string, opts?: { replace?: boolean; state?: unknown }) => {
    if (opts?.replace) router.replace(to)
    else router.push(to)
  }
}

export function useParams<T = Record<string, string | string[]>>(): T {
  const p = useNextParams() as any
  if (p && typeof p.slug === 'string') return p as T
  const pathname = (typeof window !== 'undefined' ? window.location.pathname : '/') || '/'
  const segs = pathname.split('/').filter(Boolean)
  return { slug: segs[segs.length - 1] } as unknown as T
}

export function useSearchParams() {
  const sp = useNextSearchParams()
  return [sp, () => {}] as const
}

export function BrowserRouter({ children }: { children: ReactNode }) {
  return <>{children}</>
}
