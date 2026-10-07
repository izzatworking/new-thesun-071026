// Single source of truth for the app's route paths.
//
// This file intentionally holds ONLY path strings, not components — App.jsx
// pairs each path with its page component locally and renders <Route>s from
// this array, so there's no way for a route to exist in App.jsx that isn't
// also reflected here (and vice versa). Keeping it component-free also
// avoids a circular import: SystemsDeskPage.jsx is itself one of the routed
// pages, and it needs to import this file to validate menu.js links against
// the registered paths.
//
// To add a route: add its path here AND its component to the
// `routeComponents` map in App.jsx. If you do one without the other,
// App.jsx will fail to render that route (undefined component) rather than
// silently drifting.
export const ROUTE_PATHS = [
  '/',
  '/article/:slug',
  '/category/:slug',
  '/tag/:slug',
  '/search',
  '/systems-desk',
  '/latest',
  '/most-viewed',
  '/videos',
  '/category/videos',
  '/privacy-policy',
  '/contact',
  '/about',
  '/disclaimer',
  '/advertise',
  '/terms',
  '/get-newspaper',
  '/branding',
  '*',
]

// Only concrete, param-free, non-wildcard paths are meaningful for
// validating a static menu.js `to` link — `/article/:slug` isn't something
// a nav item points at directly, and `*` matches everything, so including
// it would make every broken link look fine.
export const STATIC_ROUTE_PATHS = new Set(
  ROUTE_PATHS.filter((p) => p !== '*' && !p.includes(':'))
)
