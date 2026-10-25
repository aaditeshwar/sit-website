import { relativeToRoute } from './relative-url'

function runningDev(): boolean {
  const env = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env
  return env?.DEV === true
}

/**
 * Site paths stay root-absolute in dev (`/about`). The production HTML uses paths
 * relative to each page, so the same files work at `/` and under a folder prefix.
 */
export function publicHref(fromPath: string, href: string, dev = runningDev()): string {
  if (!href || href.startsWith('#') || href.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(href)) return href
  if (dev || !href.startsWith('/')) return href
  return relativeToRoute(fromPath, href)
}

/**
 * Prefix the browser is actually using. The pre-rendered page stamps its route on
 * `<html data-sit-route>`. Anything before that route in the address is the folder.
 */
export function detectBasename(): string {
  if (runningDev() || typeof document === 'undefined') return '/'
  const route = document.documentElement.getAttribute('data-sit-route')
  if (!route) return '/'
  const here = route.startsWith('/') ? route : `/${route}`
  let path = window.location.pathname.replace(/\/index\.html$/, '')
  const directory = (value: string) => (value === '/' ? '/' : value.endsWith('/') ? value : `${value}/`)
  const current = directory(path || '/')
  const page = directory(here)
  if (current === page) return '/'
  if (!current.endsWith(page)) return '/'
  const prefix = current.slice(0, current.length - page.length).replace(/\/$/, '')
  return prefix || '/'
}

export function pagefindRoot(): string {
  const base = detectBasename()
  return base === '/' ? '/pagefind/' : `${base}/pagefind/`
}
