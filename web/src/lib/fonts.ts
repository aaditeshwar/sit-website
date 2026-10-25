import montserrat600 from '@fontsource/montserrat/files/montserrat-latin-600-normal.woff2?url'
import poppins400 from '@fontsource/poppins/files/poppins-latin-400-normal.woff2?url'

/** Fonts used for the first paint. Preloaded so the hero title is not late. */
export const preloadFonts = [
  { href: montserrat600, family: 'Montserrat' },
  { href: poppins400, family: 'Poppins' },
]

/**
 * These faces must be in the document head. The deferred stylesheet is too late
 * for the hero title, which is the largest paint.
 */
export const firstPaintFontCss = `@font-face{font-family:Montserrat;font-style:normal;font-display:swap;font-weight:600;src:url(${montserrat600}) format("woff2")}@font-face{font-family:Poppins;font-style:normal;font-display:swap;font-weight:400;src:url(${poppins400}) format("woff2")}`
