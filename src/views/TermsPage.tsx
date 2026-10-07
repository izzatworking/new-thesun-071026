import StaticPage from '@/components/site/StaticPage'
import useSeo from '@/lib/useSeo'

export default function TermsPage() {
  useSeo({ title: 'Terms of Use', description: 'The Sun Malaysia terms of use.' })
  return (
    <StaticPage title="Terms of Use" subtitle="Please read these terms carefully.">
      <p className="text-muted-foreground">This page is coming soon.</p>
    </StaticPage>
  )
}
