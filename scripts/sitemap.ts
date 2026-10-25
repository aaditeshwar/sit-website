import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { repoRoot } from './lib/root.ts'

type WithRoute = { route: string; sourcePath?: string }

function readJson<T>(name: string): T {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, 'web/src/generated', name), 'utf8')) as T
}

function lastmod(relative: string): string {
  const file = path.join(repoRoot, relative)
  try {
    const committed = execFileSync('git', ['log', '-1', '--format=%cs', '--', relative], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    if (committed) return committed
  } catch {
    // The file may be untracked. The filesystem date is the next best stamp.
  }
  if (!fs.existsSync(file)) return new Date().toISOString().slice(0, 10)
  return fs.statSync(file).mtime.toISOString().slice(0, 10)
}

function sourceFor(route: string): string {
  const pages = readJson<WithRoute[]>('pages.json')
  const impact = readJson<WithRoute[]>('impact.json')
  const areas = readJson<WithRoute[]>('areas.json')
  const match = [...pages, ...impact, ...areas].find((item) => item.route === route && item.sourcePath)
  if (match?.sourcePath) return match.sourcePath
  if (route.startsWith('/research/projects/')) return 'data/projects.csv'
  if (route.startsWith('/news/')) return 'data/news.csv'
  if (route === '/search') return 'web/src/pages/SearchPage.tsx'
  return 'web/src/routes.tsx'
}

function loc(siteUrl: string, route: string): string {
  if (route === '/') return `${siteUrl}/`
  return `${siteUrl}${route}/`
}

const site = readJson<{ url: string }>('site.json')
const routes = readJson<{ paths: string[] }>('routes.json')
const urls = routes.paths
  .filter((route) => route !== '/404')
  .sort((a, b) => a.localeCompare(b))
  .map((route) => {
    const stamp = lastmod(sourceFor(route))
    return `  <url><loc>${loc(site.url, route)}</loc><lastmod>${stamp}</lastmod></url>`
  })

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`

fs.writeFileSync(path.join(repoRoot, 'web/public/sitemap.xml'), xml)
const distDir = path.join(repoRoot, 'web/dist')
if (fs.existsSync(distDir)) fs.writeFileSync(path.join(distDir, 'sitemap.xml'), xml)

console.log(`Wrote sitemap.xml with ${urls.length} URLs.`)
