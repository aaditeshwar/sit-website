import fs from 'node:fs'
import path from 'node:path'
import { repoRoot } from './lib/root.ts'

type RouteManifest = { paths: string[] }

const manifest = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'web/src/generated/routes.json'), 'utf8'),
) as RouteManifest

const dist = path.join(repoRoot, 'web/dist')
const missing: string[] = []

for (const route of manifest.paths) {
  const relative = route === '/' ? 'index.html' : `${route.slice(1)}/index.html`
  if (!fs.existsSync(path.join(dist, relative))) missing.push(`${route} -> ${relative}`)
}

if (missing.length > 0) {
  console.error(`Missing ${missing.length} pre-rendered pages:\n${missing.join('\n')}`)
  process.exit(1)
}

const textExtensions = new Set(['.html', '.js', '.css', '.svg', '.json', '.txt', '.map', '.xml'])
const markers = ['TODO', 'VERIFY']
const hits: string[] = []

function scan(dir: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) scan(full)
    else if (textExtensions.has(path.extname(entry.name).toLowerCase())) {
      const text = fs.readFileSync(full, 'utf8')
      for (const marker of markers) {
        const at = text.indexOf(marker)
        if (at >= 0) {
          const snippet = text.slice(Math.max(0, at - 48), at + marker.length + 48).replace(/\s+/g, ' ')
          hits.push(`${path.relative(dist, full)}: ${snippet}`)
        }
      }
    }
  }
}

scan(dist)
if (hits.length > 0) {
  console.error(`Editorial markers in the production build:\n${hits.slice(0, 20).join('\n')}`)
  process.exit(1)
}

console.log(`Pre-rendered ${manifest.paths.length} routes. No editorial markers in dist text.`)
