/** Turn a site path into a URL relative to the current page directory. */
export function relativeToRoute(fromPath: string, target: string): string {
  const match = /^([^?#]*)(.*)$/.exec(target)
  const path = match?.[1] ?? target
  const suffix = match?.[2] ?? ''
  if (!path.startsWith('/')) return target

  const fromParts = fromPath.split('/').filter(Boolean)
  const toParts = path.split('/').filter(Boolean)
  const last = toParts[toParts.length - 1] ?? ''
  const isFile = last.includes('.')
  const toDir = isFile ? toParts.slice(0, -1) : toParts
  let shared = 0
  while (shared < fromParts.length && shared < toDir.length && fromParts[shared] === toDir[shared]) shared += 1
  const parts = [
    ...Array.from({ length: fromParts.length - shared }, () => '..'),
    ...toDir.slice(shared),
    ...(isFile ? [last] : []),
  ]
  let rel = parts.length === 0 ? './' : parts.join('/')
  if (!isFile && !rel.endsWith('/')) rel = `${rel}/`
  return `${rel}${suffix}`
}

const ASSET_ROOT = /^\/(?:assets|_img|images|pagefind|documents|og)\//

/** Vite's root `index.html` uses `./assets/...` on every copied page. Point those at the real file. */
export function rewriteAssetUrl(fromPath: string, url: string): string {
  if (!url || url.startsWith('#') || url.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(url)) return url
  const sitePath = url.startsWith('./') ? url.slice(1) : url
  if (!sitePath.startsWith('/') || !ASSET_ROOT.test(sitePath)) return url
  return relativeToRoute(fromPath, sitePath)
}

export function rewriteBuiltHtml(route: string, html: string): string {
  const from = !route || route === '/' ? '/' : route.startsWith('/') ? route : `/${route}`
  let next = html.replace(/\b(href|src)="([^"]*)"/g, (full, attr: string, value: string) => {
    const rewritten = rewriteAssetUrl(from, value)
    return rewritten === value ? full : `${attr}="${rewritten}"`
  })
  next = next.replace(/\bsrcset="([^"]*)"/g, (full, value: string) => {
    const rewritten = value
      .split(',')
      .map((part) => {
        const lead = /^\s*/.exec(part)?.[0] ?? ''
        const body = part.slice(lead.length)
        const match = /^(\S+)([\s\S]*)$/.exec(body)
        if (!match) return part
        return `${lead}${rewriteAssetUrl(from, match[1] ?? '')}${match[2] ?? ''}`
      })
      .join(',')
    return rewritten === value ? full : `srcset="${rewritten}"`
  })
  next = next.replace(/url\((['"]?)([^'")]+)\1\)/g, (full, quote: string, value: string) => {
    const trimmed = value.trim()
    const rewritten = rewriteAssetUrl(from, trimmed)
    return rewritten === trimmed ? full : `url(${quote}${rewritten}${quote})`
  })
  return next
}
