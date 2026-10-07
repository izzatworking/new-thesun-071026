'use client'

import { SWRConfig } from 'swr'
import ServiceWorker from '@/components/site/ServiceWorker'

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  })

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        dedupingInterval: 60_000,
        errorRetryCount: 2,
      }}
    >
      <ServiceWorker />
      {children}
    </SWRConfig>
  )
}
