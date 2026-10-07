import { Link } from '@/lib/router'
import { Button } from '@/components/ui/button'
import useSeo from '@/lib/useSeo'

export default function NotFoundPage() {
  useSeo({ title: '404 - Page not found', description: 'The page you are looking for could not be found.' })
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <p className="font-serif-headline text-7xl font-extrabold text-primary mb-4">404</p>
      <h1 className="font-serif-headline text-3xl font-bold mb-3">Page not found</h1>
      <p className="text-muted-foreground mb-6">The page you're looking for doesn't exist or has been moved.</p>
      <Button asChild>
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  )
}
