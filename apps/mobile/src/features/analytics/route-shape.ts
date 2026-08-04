/*
 * Turns a resolved router path into a stable screen name.
 *
 * `usePathname` gives the path with dynamic segments already substituted, so
 * `/invitation/9f2c…` arrives as a literal. Reporting that verbatim makes every
 * invitation its own screen name, and the screen report becomes thousands of
 * rows with one view each — useless for answering "how many people opened an
 * invitation". Identifier-looking segments collapse to `:id` so the shape of
 * the route is what gets measured.
 */
export function routeShape(pathname: string) {
  if (!pathname || pathname === '/') return 'home';
  return pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => (/^[0-9a-f-]{16,}$/i.test(segment) || /^\d+$/.test(segment) ? ':id' : segment))
    .join('/');
}
