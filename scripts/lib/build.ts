import fs from 'node:fs'
import path from 'node:path'
import { glob } from 'node:fs/promises'
import matter from 'gray-matter'
import yaml from 'js-yaml'
import Papa from 'papaparse'
import type { z } from 'zod'
import { emailLocalPart, normalisePersonName } from './names.ts'
import { localISODate } from './dates.ts'
import { formatHealth, type HealthItem, type PlaceholderGroup } from './health.ts'
import { repoRoot } from './root.ts'
import {
  AREA_KEYS,
  IMPACT_KEYS,
  PAGE_KEYS,
  admissionSchema,
  advisorySchema,
  alumnusSchema,
  areaSchema,
  courseSchema,
  eventSchema,
  facultySchema,
  heroSchema,
  impactSchema,
  labSchema,
  newsSchema,
  openingSchema,
  pageSchema,
  partnerSchema,
  parseWith,
  projectSchema,
  siteSchema,
  staffSchema,
  statSchema,
  studentSchema,
  ContentProblems,
  type AreaFrontMatter,
  type Faculty,
  type ImpactFrontMatter,
  type Opening,
  type PageFrontMatter,
  type Site,
} from './schema.ts'

const EXPECTED_ROUTES = [
  '/',
  '/about',
  '/about/vision',
  '/about/how-we-create-impact',
  '/impact/core-stack',
  '/impact/assistech',
  '/impact/gram-vaani',
  '/impact/computer-architecture',
  '/impact/cybersecurity',
  '/research/sustainability-and-social-development',
  '/research/sustainable-and-scalable-computing',
  '/research/health-and-social-care-technologies',
  '/research/safe-and-responsible-computing',
  '/research/projects',
  '/research/labs',
  '/research/centres',
  '/academics',
  '/academics/phd',
  '/academics/ms-research',
  '/academics/mtech-cybersecurity',
  '/academics/research-fellows',
  '/academics/courses',
  '/academics/admissions',
  '/academics/faq',
  '/why-sit',
  '/why-sit/students',
  '/why-sit/faculty',
  '/why-sit/partners',
  '/people',
  '/people/faculty',
  '/people/students',
  '/people/alumni',
  '/people/staff',
  '/people/advisory-board',
  '/news',
  '/events',
  '/openings',
  '/contact',
  '/image-credits',
  '/search',
  '/404',
]

const RESERVED_AREA_SLUGS = new Set(['projects', 'labs', 'centres'])

type PageRecord = PageFrontMatter & { body: string; sourcePath: string; layout: 'home' | 'page' }
type ImpactRecord = ImpactFrontMatter & { body: string; sourcePath: string; relatedProjects: string[] }
type AreaRecord = AreaFrontMatter & {
  body: string
  sourcePath: string
  projects: string[]
  faculty: string[]
  labs: string[]
}
type FacultyOut = Faculty & { projects: string[] }

const CSV_SCHEMAS = {
  'data/projects.csv': projectSchema,
  'data/news.csv': newsSchema,
  'data/events.csv': eventSchema,
  'data/openings.csv': openingSchema,
  'data/admissions.csv': admissionSchema,
  'data/stats.csv': statSchema,
  'data/hero-slides.csv': heroSchema,
  'data/labs.csv': labSchema,
  'data/partners.csv': partnerSchema,
  'data/courses.csv': courseSchema,
  'data/people/faculty.csv': facultySchema,
  'data/people/students.csv': studentSchema,
  'data/people/alumni.csv': alumnusSchema,
  'data/people/staff.csv': staffSchema,
  'data/people/advisory-board.csv': advisorySchema,
} as const

type CsvName = keyof typeof CSV_SCHEMAS

function fieldNames(schema: { shape: Record<string, unknown> }): string[] {
  return Object.keys(schema.shape)
}

async function filesMatching(pattern: string): Promise<string[]> {
  const matches: string[] = []
  for await (const file of glob(pattern, { cwd: repoRoot })) {
    matches.push(file.replace(/\\/g, '/'))
  }
  matches.sort()
  return matches
}

function stripHtmlComments(body: string): string {
  return body.replace(/<!--[\s\S]*?-->/g, '').trim()
}

function readCsv(rel: string): { rows: Record<string, string>[]; errors: string[] } {
  const text = fs.readFileSync(path.join(repoRoot, rel), 'utf8').replace(/^\uFEFF/, '')
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  })
  const errors = parsed.errors.map((error) => {
    const row = error.row === undefined ? '?' : String(error.row + 2)
    return `${rel}:${row}: ${error.message}`
  })
  return { rows: parsed.data, errors }
}

function lineContaining(rel: string, needle: string): number | undefined {
  const lines = fs.readFileSync(path.join(repoRoot, rel), 'utf8').split(/\r?\n/)
  const index = lines.findIndex((line) => line.includes(needle))
  return index >= 0 ? index + 1 : undefined
}

function scanTextFile(rel: string, items: HealthItem[]) {
  const raw = fs.readFileSync(path.join(repoRoot, rel), 'utf8')
  const lines = raw.split(/\r?\n/)
  lines.forEach((line, index) => {
    if (/TODO|VERIFY/.test(line)) {
      const metric = rel.startsWith('content/impact/') && /value:\s*["']TODO/.test(line)
      items.push({
        kind: metric ? 'metric-todo' : 'todo',
        file: rel,
        line: index + 1,
        text: line.trim(),
      })
    }
    if (/owncloud\.iitd\.ac\.in/.test(line)) {
      items.push({ kind: 'owncloud', file: rel, line: index + 1, text: line.trim() })
    }
  })
  const commentRe = /<!--([\s\S]*?)-->/g
  for (const match of raw.matchAll(commentRe)) {
    const index = match.index ?? 0
    items.push({
      kind: 'comment',
      file: rel,
      line: raw.slice(0, index).split(/\r?\n/).length,
      text: (match[1] ?? '').replace(/\s+/g, ' ').trim(),
    })
  }
}

function publicPath(asset: string | undefined): string | undefined {
  if (!asset) return undefined
  return asset.startsWith('/') ? asset : `/${asset}`
}

const SHEET_PASTE_COLUMNS = new Set(['image_upload', 'photo_upload', 'update_of', 'moderation', 'consent'])

function noteAsset(rel: string, asset: string | undefined, items: HealthItem[]) {
  if (!asset) return
  const relative = asset.replace(/^\/+/, '').replace(/\\/g, '/')
  const file = path.join(repoRoot, 'assets', ...relative.split('/'))
  if (!fs.existsSync(file)) {
    items.push({ kind: 'missing-image', file: rel, text: asset })
  }
}

function pickCsvRow(row: Record<string, string>, fields: string[], where: string, items: HealthItem[]): Record<string, string> {
  const picked: Record<string, string> = {}
  for (const [key, value] of Object.entries(row)) {
    if (!key || key === '__parsed_extra' || SHEET_PASTE_COLUMNS.has(key)) continue
    if (!fields.includes(key)) {
      items.push({ kind: 'warning', file: where, text: `unknown column "${key}" ignored` })
      continue
    }
    picked[key] = value
  }
  return picked
}

function pickFrontMatter(
  data: Record<string, unknown>,
  allowed: readonly string[],
  rel: string,
  items: HealthItem[],
): Record<string, unknown> {
  const picked: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (!allowed.includes(key)) {
      items.push({ kind: 'warning', file: rel, text: `unknown front-matter field "${key}" ignored` })
      continue
    }
    if (key === 'review' || key === 'sources') continue
    picked[key] = value
  }
  return picked
}

function readFrontMatter(rel: string, issues: string[]): { data: Record<string, unknown>; body: string } | undefined {
  const raw = fs.readFileSync(path.join(repoRoot, rel), 'utf8')
  const parsed = matter(raw)
  if (parsed.data === null || typeof parsed.data !== 'object' || Array.isArray(parsed.data)) {
    issues.push(`${rel}: front matter must be a YAML mapping`)
    return undefined
  }
  return { data: parsed.data as Record<string, unknown>, body: stripHtmlComments(parsed.content) }
}

function duplicates(values: string[], label: string, issues: string[]) {
  const seen = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) issues.push(`duplicate ${label}: ${value}`)
    seen.add(value)
  }
}

function loadPlaceholders(): PlaceholderGroup[] {
  const rel = 'assets/images/PLACEHOLDERS.csv'
  const file = path.join(repoRoot, rel)
  if (!fs.existsSync(file)) return []
  const { rows } = readCsv(rel)
  const groups = new Map<string, PlaceholderGroup>()
  for (const row of rows) {
    if ((row.status ?? '').toLowerCase() === 'supplied') continue
    const requestFrom = row.request_from || 'Unassigned'
    const group = groups.get(requestFrom) ?? { requestFrom, items: [] }
    group.items.push({
      path: row.path ?? '',
      brief: row.brief ?? '',
      usedOn: row.used_on ?? '',
    })
    groups.set(requestFrom, group)
  }
  return [...groups.values()].sort((a, b) => a.requestFrom.localeCompare(b.requestFrom))
}

function copyAssets() {
  const publicDir = path.join(repoRoot, 'web/public')
  fs.mkdirSync(publicDir, { recursive: true })
  const assetsDir = path.join(repoRoot, 'assets')
  for (const entry of fs.readdirSync(assetsDir)) {
    fs.cpSync(path.join(assetsDir, entry), path.join(publicDir, entry), { recursive: true, force: true })
  }
}

function documentFiles(): { path: string; bytes: number }[] {
  const assetsRoot = path.join(repoRoot, 'assets')
  const dir = path.join(assetsRoot, 'documents')
  if (!fs.existsSync(dir)) return []
  const files: { path: string; bytes: number }[] = []
  const walk = (folder: string) => {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const full = path.join(folder, entry.name)
      if (entry.isDirectory()) walk(full)
      else files.push({ path: path.relative(assetsRoot, full).replace(/\\/g, '/'), bytes: fs.statSync(full).size })
    }
  }
  walk(dir)
  return files.sort((a, b) => a.path.localeCompare(b.path))
}

function writeJson(name: string, data: unknown) {
  const file = path.join(repoRoot, 'web/src/generated', name)
  const next = `${JSON.stringify(data, null, 2)}\n`
  const previous = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
  if (previous !== next) fs.writeFileSync(file, next)
}

function routeOf(href: string): string {
  const withoutHash = href.split('#')[0] ?? '/'
  return withoutHash.split('?')[0] || '/'
}

export async function buildContent(): Promise<string> {
  const issues: string[] = []
  const items: HealthItem[] = []
  const today = localISODate()

  const markdownFiles = await filesMatching('content/**/*.md')
  const yamlFiles = await filesMatching('content/**/*.{yml,yaml}')
  const csvFiles = await filesMatching('data/**/*.csv')
  for (const rel of [...markdownFiles, ...yamlFiles, ...csvFiles]) scanTextFile(rel, items)

  const siteFile = 'content/site.yml'
  const siteRaw = yaml.load(fs.readFileSync(path.join(repoRoot, siteFile), 'utf8'))
  const site = parseWith(siteSchema, siteRaw, siteFile, issues)

  const pages: PageRecord[] = []
  const impact: (ImpactFrontMatter & { body: string; sourcePath: string })[] = []
  const areas: (AreaFrontMatter & { body: string; sourcePath: string })[] = []

  for (const rel of markdownFiles) {
    const loaded = readFrontMatter(rel, issues)
    if (!loaded) continue
    if (rel.startsWith('content/pages/')) {
      const data = pickFrontMatter(loaded.data, PAGE_KEYS, rel, items)
      const page = parseWith(pageSchema, data, rel, issues)
      if (!page) continue
      const layout = page.layout ?? 'page'
      if (page.route === '/' && layout !== 'home') issues.push(`${rel}: the home page must set layout: home`)
      if (page.route !== '/' && layout === 'home') issues.push(`${rel}: layout home is only valid for route /`)
      noteAsset(rel, page.hero_image, items)
      pages.push({ ...page, layout, body: loaded.body, sourcePath: rel })
    } else if (rel.startsWith('content/impact/')) {
      const data = pickFrontMatter(loaded.data, IMPACT_KEYS, rel, items)
      const story = parseWith(impactSchema, data, rel, issues)
      if (!story) continue
      if (story.route !== `/impact/${story.slug}`) {
        issues.push(`${rel}: route must be /impact/${story.slug}`)
      }
      noteAsset(rel, story.hero_image, items)
      noteAsset(rel, story.card_image, items)
      for (const partner of story.partners ?? []) noteAsset(rel, partner.logo, items)
      impact.push({ ...story, body: loaded.body, sourcePath: rel })
    } else if (rel.startsWith('content/research-areas/')) {
      const data = pickFrontMatter(loaded.data, AREA_KEYS, rel, items)
      const area = parseWith(areaSchema, data, rel, issues)
      if (!area) continue
      if (area.route !== `/research/${area.slug}`) issues.push(`${rel}: route must be /research/${area.slug}`)
      if (RESERVED_AREA_SLUGS.has(area.slug)) issues.push(`${rel}: slug "${area.slug}" is reserved for a static research page`)
      noteAsset(rel, area.hero_image, items)
      noteAsset(rel, area.card_image, items)
      areas.push({ ...area, body: loaded.body, sourcePath: rel })
    } else {
      issues.push(`${rel}: markdown outside pages/, impact/ and research-areas/ is not part of the site`)
    }
  }

  const csvRows = new Map<CsvName, Record<string, string>[]>()
  for (const rel of csvFiles) {
    if (!(rel in CSV_SCHEMAS)) {
      issues.push(`${rel}: no schema for this CSV`)
      continue
    }
    const { rows, errors } = readCsv(rel)
    issues.push(...errors)
    csvRows.set(rel as CsvName, rows)
  }
  for (const rel of Object.keys(CSV_SCHEMAS) as CsvName[]) {
    if (!csvRows.has(rel)) issues.push(`missing ${rel}`)
  }

  function parseCsv<S extends z.ZodTypeAny & { shape: Record<string, unknown> }>(rel: CsvName, schema: S): z.output<S>[] {
    const fields = fieldNames(schema)
    const parsed: z.output<S>[] = []
    for (const [index, row] of (csvRows.get(rel) ?? []).entries()) {
      const where = `${rel}:${index + 2}`
      if ('__parsed_extra' in row) issues.push(`${where}: extra values past the header`)
      const value = parseWith(schema, pickCsvRow(row, fields, where, items), where, issues)
      if (value) parsed.push(value)
    }
    return parsed
  }

  const projects = parseCsv('data/projects.csv', projectSchema)
  const news = parseCsv('data/news.csv', newsSchema)
  const events = parseCsv('data/events.csv', eventSchema)
  const openings = parseCsv('data/openings.csv', openingSchema)
  const admissions = parseCsv('data/admissions.csv', admissionSchema)
  const stats = parseCsv('data/stats.csv', statSchema)
  const hero = parseCsv('data/hero-slides.csv', heroSchema)
  const labs = parseCsv('data/labs.csv', labSchema)
  const partners = parseCsv('data/partners.csv', partnerSchema)
  const courses = parseCsv('data/courses.csv', courseSchema)
  const faculty = parseCsv('data/people/faculty.csv', facultySchema)
  const students = parseCsv('data/people/students.csv', studentSchema)
  const alumni = parseCsv('data/people/alumni.csv', alumnusSchema)
  const staff = parseCsv('data/people/staff.csv', staffSchema)
  const advisory = parseCsv('data/people/advisory-board.csv', advisorySchema)

  duplicates(projects.map((row) => row.id), 'project id', issues)
  duplicates(news.map((row) => row.id), 'news id', issues)
  duplicates(events.map((row) => row.id), 'event id', issues)
  duplicates(openings.map((row) => row.id), 'opening id', issues)
  duplicates(courses.map((row) => row.code), 'course code', issues)
  duplicates(pages.map((row) => row.route), 'page route', issues)
  duplicates(impact.map((row) => row.slug), 'impact slug', issues)
  duplicates(areas.map((row) => row.slug), 'research-area slug', issues)
  duplicates(
    [...pages.map((row) => row.route), ...impact.map((row) => row.route), ...areas.map((row) => row.route)],
    'route',
    issues,
  )

  if (issues.length > 0) throw new ContentProblems(issues)
  if (!site) throw new ContentProblems(['content/site.yml: failed to parse'])

  const projectIds = new Set(projects.map((row) => row.id))
  const impactSlugs = new Set(impact.map((row) => row.slug))

  for (const project of projects) {
    const rel = 'data/projects.csv'
    if (project.initiative && !impactSlugs.has(project.initiative)) {
      issues.push(`${rel}: project "${project.id}" initiative "${project.initiative}" does not match an impact story`)
    }
    noteAsset(rel, project.image, items)
    if (!project.published) {
      items.push({
        kind: 'draft',
        file: rel,
        line: lineContaining(rel, project.id),
        text: `${project.id}: unpublished project`,
      })
    }
  }
  for (const story of impact) {
    for (const id of story.related_projects ?? []) {
      if (!projectIds.has(id)) issues.push(`${story.sourcePath}: related_projects references unknown project "${id}"`)
    }
  }
  for (const area of areas) {
    for (const slug of area.impact_stories) {
      if (!impactSlugs.has(slug)) issues.push(`${area.sourcePath}: impact_stories references unknown story "${slug}"`)
    }
  }
  for (const item of news) {
    noteAsset('data/news.csv', item.image, items)
    if (item.status !== 'published') {
      items.push({
        kind: 'draft',
        file: 'data/news.csv',
        line: lineContaining('data/news.csv', item.id),
        text: `${item.id}: status ${item.status}`,
      })
    }
  }
  for (const item of events) {
    noteAsset('data/events.csv', item.image, items)
    if (item.status !== 'published') {
      items.push({
        kind: 'draft',
        file: 'data/events.csv',
        line: lineContaining('data/events.csv', item.id),
        text: `${item.id}: status ${item.status}`,
      })
    }
  }

  const datedOpenings: Opening[] = openings.map((opening) => {
    if (opening.status === 'draft') {
      items.push({
        kind: 'draft',
        file: 'data/openings.csv',
        line: lineContaining('data/openings.csv', opening.id),
        text: `${opening.id}: status draft`,
      })
      return opening
    }
    if (opening.deadline && opening.deadline !== 'rolling' && opening.deadline.sort < today && opening.status === 'open') {
      return { ...opening, status: 'closed' as const }
    }
    return opening
  })

  for (const person of [...faculty, ...students, ...staff]) noteAsset('data/people', person.photo, items)
  for (const person of alumni) noteAsset('data/people/alumni.csv', person.photo, items)
  for (const person of advisory) noteAsset('data/people/advisory-board.csv', person.photo, items)
  for (const lab of labs) noteAsset('data/labs.csv', lab.logo, items)
  for (const partner of partners) noteAsset('data/partners.csv', partner.logo, items)
  for (const slide of hero) noteAsset('data/hero-slides.csv', slide.image, items)
  noteAsset(siteFile, site.logo, items)
  noteAsset(siteFile, site.favicon, items)
  noteAsset(siteFile, site.og_image, items)

  const facultyOut: FacultyOut[] = faculty.map((person) => ({ ...person, projects: [] }))
  const facultyByName = new Map<string, FacultyOut[]>()
  function addFacultyKey(key: string | undefined, person: FacultyOut) {
    if (!key) return
    const list = facultyByName.get(key) ?? []
    if (!list.includes(person)) list.push(person)
    facultyByName.set(key, list)
  }
  for (const person of facultyOut) {
    addFacultyKey(normalisePersonName(person.name), person)
    addFacultyKey(emailLocalPart(person.email ?? ''), person)
  }
  for (const [key, list] of facultyByName) {
    if (list.length > 1) {
      items.push({
        kind: 'warning',
        file: 'data/people/faculty.csv',
        text: `ambiguous faculty name "${list.map((person) => person.name).join(' / ')}" (normalised as "${key}")`,
      })
    }
  }

  function facultyMatches(token: string): FacultyOut[] | undefined {
    const found = new Map<string, FacultyOut>()
    for (const key of [emailLocalPart(token), normalisePersonName(token)]) {
      if (!key) continue
      for (const person of facultyByName.get(key) ?? []) found.set(person.name, person)
    }
    const list = [...found.values()]
    return list.length ? list : undefined
  }

  const warnedNames = new Set<string>()
  function warnUnknownFaculty(rel: string, name: string) {
    const token = `${rel}:${name}`
    if (warnedNames.has(token)) return
    warnedNames.add(token)
    if (facultyMatches(name)) return
    items.push({
      kind: 'unknown-faculty',
      file: rel,
      line: lineContaining(rel, name),
      text: `"${name}" does not match a name or email id in faculty.csv`,
    })
  }

  for (const project of projects) {
    for (const name of project.faculty) {
      const matches = facultyMatches(name)
      if (!matches) {
        warnUnknownFaculty('data/projects.csv', name)
        continue
      }
      if (project.published) {
        for (const person of matches) person.projects.push(project.id)
      }
    }
  }
  for (const story of impact) {
    for (const name of story.faculty) warnUnknownFaculty(story.sourcePath, name)
  }
  for (const lab of labs) {
    for (const name of lab.faculty) warnUnknownFaculty('data/labs.csv', name)
  }

  const publishedProjects = projects.filter((project) => project.published)
  const publishedNews = news.filter((item) => item.status === 'published').sort((a, b) => b.date.sort.localeCompare(a.date.sort))
  const publishedEvents = events
    .filter((item) => item.status === 'published')
    .sort((a, b) => b.start_date.sort.localeCompare(a.start_date.sort))
  const publishedOpenings = datedOpenings.filter((opening) => opening.status !== 'draft')
  const activeHero = hero.filter((slide) => slide.active).sort((a, b) => a.order - b.order)
  const publishedImpact: ImpactRecord[] = [...impact]
    .sort((a, b) => a.order - b.order)
    .map((story) => {
      const { related_projects: related = [], ...rest } = story
      return {
        ...rest,
        hero_image: publicPath(story.hero_image) ?? story.hero_image,
        card_image: publicPath(story.card_image) ?? story.card_image,
        partners: story.partners?.map((partner) => ({ ...partner, logo: publicPath(partner.logo) })),
        relatedProjects: related.filter((id) => publishedProjects.some((project) => project.id === id)),
      }
    })

  const publishedAreas: AreaRecord[] = [...areas]
    .sort((a, b) => a.order - b.order)
    .map((area) => ({
      ...area,
      hero_image: publicPath(area.hero_image),
      card_image: publicPath(area.card_image),
      projects: publishedProjects.filter((project) => project.thrust_area === area.slug).map((project) => project.id),
      faculty: facultyOut.filter((person) => person.thrust_areas.some((slug) => slug === area.slug)).map((person) => person.name),
      labs: labs.filter((lab) => lab.thrust_area === area.slug).map((lab) => lab.name),
    }))

  const withPhoto = <T extends { photo?: string }>(person: T): T => ({ ...person, photo: publicPath(person.photo) })

  const projectRoutes = publishedProjects.filter((project) => project.description_md).map((project) => `/research/projects/${project.id}`)
  const newsRoutes = publishedNews.filter((item) => item.body_md).map((item) => `/news/${item.id}`)
  const paths = [
    ...pages.map((page) => page.route),
    ...publishedImpact.map((story) => story.route),
    ...publishedAreas.map((area) => area.route),
    ...projectRoutes,
    ...newsRoutes,
    '/search',
    '/404',
  ]
  const pathSet = new Set(paths)
  for (const route of EXPECTED_ROUTES) {
    if (!pathSet.has(route)) issues.push(`missing expected route ${route}`)
  }

  const linkSets: { where: string; href: string }[] = []
  for (const link of site.utility_nav) linkSets.push({ where: `${siteFile} utility_nav`, href: link.href })
  linkSets.push({ where: `${siteFile} primary_cta`, href: site.primary_cta.href })
  for (const item of site.nav) {
    linkSets.push({ where: `${siteFile} nav`, href: item.href })
    for (const child of item.children ?? []) linkSets.push({ where: `${siteFile} nav`, href: child.href })
  }
  for (const column of site.footer.columns) {
    for (const link of column.links) linkSets.push({ where: `${siteFile} footer`, href: link.href })
  }
  for (const link of site.footer.ctas) linkSets.push({ where: `${siteFile} footer`, href: link.href })
  for (const slide of activeHero) linkSets.push({ where: 'data/hero-slides.csv', href: slide.cta_link })
  for (const item of publishedNews) {
    if (item.link) linkSets.push({ where: `data/news.csv (${item.id})`, href: item.link })
  }
  for (const link of linkSets) {
    if (!link.href.startsWith('/')) continue
    const route = routeOf(link.href)
    if (!pathSet.has(route)) issues.push(`${link.where}: unknown internal route ${link.href}`)
  }

  if (issues.length > 0) throw new ContentProblems(issues)

  const publishedSite: Site & { buildDate: string } = {
    ...site,
    logo: publicPath(site.logo) ?? site.logo,
    favicon: publicPath(site.favicon) ?? site.favicon,
    og_image: publicPath(site.og_image) ?? site.og_image,
    buildDate: today,
  }

  const publicProjects = publishedProjects.map((project) => ({ ...project, image: publicPath(project.image) }))
  const publicNews = publishedNews.map((item) => ({ ...item, image: publicPath(item.image) }))
  const publicEvents = publishedEvents.map((item) => ({ ...item, image: publicPath(item.image) }))
  const publicPages = pages
    .map((page) => ({ ...page, hero_image: publicPath(page.hero_image) }))
    .sort((a, b) => a.route.localeCompare(b.route))
  const publicStats = stats.map((stat) => ({
    label: stat.label,
    value: stat.value,
    suffix: stat.suffix,
    note: stat.note,
  }))
  const publicHero = activeHero.map((slide) => ({ ...slide, image: publicPath(slide.image) }))
  const publicLabs = labs.map((lab) => ({ ...lab, logo: publicPath(lab.logo) }))
  const publicPartners = [...partners]
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((partner) => ({ ...partner, logo: publicPath(partner.logo) }))
  const publicPeople = {
    faculty: facultyOut.filter((person) => person.active).map(withPhoto),
    formerFaculty: facultyOut.filter((person) => !person.active).map(withPhoto),
    students: students.filter((person) => person.active).map(withPhoto),
    formerStudents: students.filter((person) => !person.active).map(withPhoto),
    alumni: alumni.filter((person) => person.status !== 'draft').map(withPhoto),
    staff: staff.filter((person) => person.active).map(withPhoto),
    formerStaff: staff.filter((person) => !person.active).map(withPhoto),
    advisoryBoard: [...advisory]
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .map(withPhoto),
  }

  const routes = {
    paths: [...pathSet].sort((a, b) => a.localeCompare(b)),
    static: pages.map((page) => page.route).sort((a, b) => a.localeCompare(b)),
    impact: publishedImpact.map((story) => story.slug),
    areas: publishedAreas.map((area) => area.slug),
    projects: publishedProjects.filter((project) => project.description_md).map((project) => project.id),
    news: publishedNews.filter((item) => item.body_md).map((item) => item.id),
  }

  fs.mkdirSync(path.join(repoRoot, 'web/src/generated'), { recursive: true })
  writeJson('site.json', publishedSite)
  writeJson('pages.json', publicPages)
  writeJson('impact.json', publishedImpact)
  writeJson('areas.json', publishedAreas)
  writeJson('projects.json', publicProjects)
  writeJson('news.json', publicNews)
  writeJson('events.json', publicEvents)
  writeJson('openings.json', publishedOpenings)
  writeJson('admissions.json', admissions)
  writeJson('people.json', publicPeople)
  writeJson('labs.json', publicLabs)
  writeJson('courses.json', courses)
  writeJson('stats.json', publicStats)
  writeJson('hero.json', publicHero)
  writeJson('partners.json', publicPartners)
  writeJson('routes.json', routes)
  writeJson('documents.json', documentFiles())
  const placeholders = loadPlaceholders()
  writeJson('health.json', { items, placeholders })
  copyAssets()

  const header = [
    'Content OK.',
    `Pages ${pages.length}, impact ${publishedImpact.length}, thrust areas ${publishedAreas.length}, projects ${publicProjects.length} published (${projects.length - publicProjects.length} unpublished), news ${publicNews.length} published (${news.length - publicNews.length} drafts), events ${publicEvents.length}, openings ${publishedOpenings.length}, faculty ${publicPeople.faculty.length} active / ${publicPeople.formerFaculty.length} former, students ${publicPeople.students.length}, alumni ${publicPeople.alumni.length}, staff ${publicPeople.staff.length}, labs ${publicLabs.length}, courses ${courses.length}, admissions ${admissions.length}, hero slides ${publicHero.length}, stats ${publicStats.length}.`,
    `Routes ${routes.paths.length}.`,
    '',
  ].join('\n')

  return header + formatHealth(items, placeholders)
}
