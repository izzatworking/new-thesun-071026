// Generic static-content page wrapper for consistent typography
import { Link } from '@/lib/router'
import { ChevronRight } from 'lucide-react'

export default function StaticPage({
  title,
  subtitle,
  breadcrumb,
  children,
}: {
  title?: string
  subtitle?: string
  breadcrumb?: string
  children?: React.ReactNode
}) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <Link to="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{breadcrumb || title}</span>
      </nav>
      <header className="border-b-2 border-primary pb-4 mb-8">
        <div className="flex items-baseline gap-3">
          <span className="w-1.5 h-9 bg-primary inline-block" />
          <h1 className="font-serif-headline text-3xl md:text-4xl font-bold">{title}</h1>
        </div>
        {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
      </header>
      <div className="prose prose-slate max-w-none article-content">
        {children}
      </div>
    </div>
  )
}
