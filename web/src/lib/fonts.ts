import montserrat600 from '@fontsource/montserrat/files/montserrat-latin-600-normal.woff2?url'
import poppins400 from '@fontsource/poppins/files/poppins-latin-400-normal.woff2?url'
import { publicHref } from './url'

/** Fonts used for the first paint. Preloaded so the hero title is not late. */
export const preloadFonts = [
  { href: montserrat600, family: 'Montserrat' },
  { href: poppins400, family: 'Poppins' },
]

/** A `?url` import is resolved from the script. In the document head it must follow the page. */
export function fontHref(pathname: string, href: string): string {
  const env = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env
  if (env?.DEV) return href
  const sitePath = href.startsWith('/') ? href : assetPath(href)
  if (!sitePath.startsWith('/')) return href
  return publicHref(pathname, sitePath)
}

function assetPath(href: string): string {
  const clean = href.split(/[?#]/)[0] ?? href
  const index = clean.lastIndexOf('assets/')
  if (index < 0) return href
  return `/${clean.slice(index)}`
}

/**
 * These faces must be in the document head. The deferred stylesheet is too late
 * for the hero title, which is the largest paint.
 */
export function fontFaceCss(pathname: string): string {
  const montserrat = fontHref(pathname, montserrat600)
  const poppins = fontHref(pathname, poppins400)
  return `@font-face{font-family:Montserrat;font-style:normal;font-display:swap;font-weight:600;src:url("${montserrat}") format("woff2")}@font-face{font-family:Poppins;font-style:normal;font-display:swap;font-weight:400;src:url("${poppins}") format("woff2")}`
}
