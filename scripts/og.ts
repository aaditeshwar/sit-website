import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import Papa from 'papaparse'
import sharp from 'sharp'
import { repoRoot } from './lib/root.ts'

type Page = { route: string; hero_image?: string }
type Story = { route: string; hero_image?: string }
type Area = { route: string; hero_image?: string }
type RecordImage = { id: string; image?: string }

function readJson<T>(name: string): T {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, 'web/src/generated', name), 'utf8')) as T
}

function placeholders(): Set<string> {
  const text = fs.readFileSync(path.join(repoRoot, 'assets/images/PLACEHOLDERS.csv'), 'utf8')
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true })
  const paths = new Set<string>()
  for (const row of parsed.data) {
    const file = (row.path ?? '').trim().replace(/\\/g, '/')
    if (file && (row.status ?? '').trim() === 'placeholder') paths.add(file)
  }
  return paths
}

function assetFile(src: string | undefined, blocked: Set<string>): string | undefined {
  if (!src) return undefined
  const relative = src.replace(/^\//, '')
  if (blocked.has(relative)) return undefined
  const file = path.join(repoRoot, 'assets', relative)
  return fs.existsSync(file) ? file : undefined
}

const site = readJson<{ url: string; og_image: string }>('site.json')
const routes = readJson<{ paths: string[] }>('routes.json')
const pages = readJson<Page[]>('pages.json')
const impact = readJson<Story[]>('impact.json')
const areas = readJson<Area[]>('areas.json')
const projects = readJson<RecordImage[]>('projects.json')
const news = readJson<RecordImage[]>('news.json')
const blocked = placeholders()
const fallback = assetFile(site.og_image, new Set()) ?? assetFile(site.og_image, blocked)
if (!fallback) throw new Error(`Missing OG fallback image ${site.og_image}`)

function imageFor(route: string): string {
  const page = pages.find((item) => item.route === route)
  const story = impact.find((item) => item.route === route)
  const area = areas.find((item) => item.route === route)
  const projectId = route.startsWith('/research/projects/') ? route.slice('/research/projects/'.length) : ''
  const project = projectId ? projects.find((item) => item.id === projectId) : undefined
  const newsId = route.startsWith('/news/') ? route.slice('/news/'.length) : ''
  const item = newsId ? news.find((entry) => entry.id === newsId) : undefined
  return (
    assetFile(page?.hero_image, blocked) ??
    assetFile(story?.hero_image, blocked) ??
    assetFile(area?.hero_image, blocked) ??
    assetFile(project?.image, blocked) ??
    assetFile(item?.image, blocked) ??
    fallback
  )
}

const outDir = path.join(repoRoot, 'web/public/og')
fs.mkdirSync(outDir, { recursive: true })
const map: Record<string, string> = {}
const written = new Map<string, string>()

for (const route of routes.paths) {
  if (route === '/404') continue
  const source = imageFor(route)
  let href = written.get(source)
  if (!href) {
    const name = `${createHash('sha1').update(path.relative(repoRoot, source).replace(/\\/g, '/')).digest('hex').slice(0, 12)}.jpg`
    href = `/og/${name}`
    await sharp(source).resize(1200, 630, { fit: 'cover', position: 'centre' }).jpeg({ quality: 80 }).toFile(path.join(outDir, name))
    written.set(source, href)
  }
  map[route] = href
}

const json = `${JSON.stringify(map, null, 2)}\n`
fs.writeFileSync(path.join(repoRoot, 'web/src/generated/og.json'), json)
console.log(`Wrote ${written.size} Open Graph images for ${Object.keys(map).length} routes.`)
