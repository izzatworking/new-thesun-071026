import { Link } from '@/lib/router'

// The Sun Malaysia logo — SVG asset. Place `logo.svg` in your project's `public/`
// folder so it's served at this path (e.g. public/logo.svg). This single
// Logo component is shared by the header (desktop + mobile row), the
// desktop nav bar (scrolled state), and the mobile full-page menu sidebar,
// so updating this one file updates the logo everywhere it appears.
const LOGO_URL = '/logo.svg'

export default function Logo({ className = '', size = 'md', to = '/' }) {
  const sizes = {
    sm: 'h-9',
    md: 'h-14',
    lg: 'h-16',
    xl: 'h-24',
  }
  return (
    <Link to={to} className={`inline-flex items-center ${className}`} aria-label="The Sun Malaysia - Home">
      <img src={LOGO_URL} alt="The Sun Malaysia" className={`${sizes[size]} w-auto object-contain`} />
    </Link>
  )
}
