import {
  admissions,
  areas,
  courses,
  events,
  hero,
  impact,
  labs,
  news,
  openings,
  pages,
  partners,
  people,
  projects,
  site,
  stats,
} from './content'
import { publicText } from './editorial'
import { imagesInFolder } from './images'
import { fencedRecords } from './yaml'

export type Row = Record<string, unknown>
export type Attrs = Record<string, string>
export type ImpactStory = (typeof impact)[number]
export type MarkdownScope = { impact?: ImpactStory }

export type IncentiveTile = { text: string; href: string }

const SHORTHAND = ['thrust_area', 'status', 'seeking', 'sponsor', 'programme', 'featured'] as const

function asRows(value: readonly object[]): Row[] {
  return value as unknown as Row[]
}

export function collection(source: string | undefined): Row[] {
  switch (source) {
    case 'projects':
      return asRows(projects)
    case 'news':
      return asRows(news)
    case 'events':
      return asRows(events)
    case 'openings':
      return asRows(openings)
    case 'faculty':
      return asRows([...people.faculty, ...people.formerFaculty])
    case 'students':
      return asRows([...people.students, ...people.formerStudents])
    case 'alumni':
      return asRows(people.alumni)
    case 'staff':
      return asRows([...people.staff, ...people.formerStaff])
    case 'advisory-board':
      return asRows(people.advisoryBoard)
    case 'labs':
      return asRows(labs)
    case 'courses':
      return asRows(courses)
    case 'stats':
      return asRows(stats)
    case 'hero-slides':
      return asRows(hero)
    case 'partners':
      return asRows(partners)
    case 'admissions':
      return asRows(admissions)
    case 'impact':
      return asRows(impact)
    case 'areas':
      return asRows(areas)
    default:
      return []
  }
}

function field(row: Row, key: string): unknown {
  return row[key]
}

function matches(row: Row, expr: string): boolean {
  const notEmpty = /^([A-Za-z0-9_]+)!=$/.exec(expr)
  if (notEmpty) {
    const value = field(row, notEmpty[1] ?? '')
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'string') return value.trim().length > 0
    return value != null && value !== false
  }
  const contains = /^([A-Za-z0-9_]+)~(.*)$/.exec(expr)
  if (contains) {
    const value = field(row, contains[1] ?? '')
    const needle = contains[2] ?? ''
    if (Array.isArray(value)) return value.map(String).includes(needle)
    return String(value ?? '').includes(needle)
  }
  const equal = /^([A-Za-z0-9_]+)=(.*)$/.exec(expr)
  if (equal) {
    const value = field(row, equal[1] ?? '')
    const expected = equal[2] ?? ''
    if (Array.isArray(value)) return value.map(String).includes(expected)
    if (typeof value === 'boolean') return value === (expected === 'true' || expected === 'TRUE')
    return String(value ?? '') === expected
  }
  return true
}

function conditions(attrs: Attrs): string[] {
  const list = attrs.filter
    ? attrs.filter
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
    : []
  for (const key of SHORTHAND) {
    if (attrs[key]) list.push(`${key}=${attrs[key]}`)
  }
  return list
}

export function resolveIds(raw: string, scope?: MarkdownScope): string[] {
  const parts = raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length === 1 && parts[0] === 'related_projects') return scope?.impact?.relatedProjects ?? []
  return parts
}

function missing(value: unknown): boolean {
  return value == null || value === ''
}

function sortToken(value: unknown): string {
  if (value && typeof value === 'object' && 'sort' in value) return String((value as { sort: unknown }).sort)
  if (typeof value === 'boolean') return value ? '1' : '0'
  if (typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.join(',')
  return String(value ?? '')
}

function compareValues(left: unknown, right: unknown, direction: number): number {
  if (missing(left) && missing(right)) return 0
  if (missing(left)) return 1
  if (missing(right)) return -1
  if (typeof left === 'number' && typeof right === 'number') return (left - right) * direction
  if (typeof left === 'boolean' && typeof right === 'boolean') return (Number(left) - Number(right)) * direction
  const a = sortToken(left)
  const b = sortToken(right)
  if (a === b) return 0
  return (a < b ? -1 : 1) * direction
}

export function sortRows(rows: Row[], spec?: string): Row[] {
  if (!spec) return rows
  const keys = spec
    .split(',')
    .map((part) => {
      const [name, dir] = part.split(':').map((item) => item.trim())
      return { name: name ?? '', dir: dir === 'asc' ? 1 : -1 }
    })
    .filter((key) => key.name)
  return [...rows].sort((left, right) => {
    for (const key of keys) {
      const compared = compareValues(field(left, key.name), field(right, key.name), key.dir)
      if (compared) return compared
    }
    return 0
  })
}

export function select(source: string | undefined, attrs: Attrs, scope?: MarkdownScope): Row[] {
  let rows = collection(source)
  if (attrs.ids) {
    const ids = resolveIds(attrs.ids, scope)
    rows = rows.filter((row) => ids.includes(String(row.id ?? '')))
  }
  const required = conditions(attrs)
  if (required.length) rows = rows.filter((row) => required.every((expr) => matches(row, expr)))
  rows = sortRows(rows, attrs.sort || attrs.default_sort)
  const limit = Number(attrs.limit)
  if (limit > 0) rows = rows.slice(0, limit)
  return rows
}

export function groupRows(rows: Row[], groupBy?: string, groupOrder?: string): { key: string; rows: Row[] }[] {
  if (!groupBy) return [{ key: '', rows }]
  const order = groupOrder
    ?.split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  const grouped = new Map<string, Row[]>()
  for (const row of rows) {
    const raw = field(row, groupBy)
    const keys = Array.isArray(raw) ? raw.map(String) : [String(raw ?? '')]
    for (const key of keys) {
      if (!key) continue
      const list = grouped.get(key) ?? []
      list.push(row)
      grouped.set(key, list)
    }
  }
  const keys = order
    ? [...order.filter((key) => grouped.has(key)), ...[...grouped.keys()].filter((key) => !order.includes(key))]
    : [...grouped.keys()]
  return keys
    .filter((key) => (grouped.get(key)?.length ?? 0) > 0)
    .map((key) => ({ key, rows: grouped.get(key) ?? [] }))
}

export function incentiveTiles(): IncentiveTile[] {
  const page = pages.find((item) => item.route === '/why-sit')
  if (!page) return []
  const cards = fencedRecords(page.body, 'audience-cards')
  const tiles: IncentiveTile[] = []
  for (const card of cards) {
    const points = Array.isArray(card.points) ? card.points.filter((point): point is string => typeof point === 'string') : []
    if (points[0]) tiles.push({ text: points[0], href: '/why-sit' })
  }
  for (const card of cards) {
    const points = Array.isArray(card.points) ? card.points.filter((point): point is string => typeof point === 'string') : []
    const fellow = points.find((point) => point.includes('Research Fellows'))
    if (fellow && !tiles.some((tile) => tile.text === fellow)) tiles.push({ text: fellow, href: '/why-sit' })
  }
  return tiles
}

function present(rows: Row[]): Row[] | null {
  return rows.length ? [{}] : []
}

/** Rows a leaf component will render. `null` means the component is not data-backed. */
export function rowsFor(name: string, attrs: Attrs, scope?: MarkdownScope): Row[] | null {
  switch (name) {
    case 'hero-carousel':
      return select('hero-slides', { ...attrs, sort: attrs.sort || 'order:asc' }, scope)
    case 'stats-strip':
      return select(attrs.source || 'stats', attrs, scope)
    case 'impact-cards':
      return select('impact', { ...attrs, sort: attrs.sort || 'order:asc' }, scope)
    case 'thrust-area-tiles':
      return select('areas', { sort: 'order:asc' }, scope)
    case 'stage-pipeline':
    case 'project-explorer':
      return select('projects', attrs, scope)
    case 'projects':
      return select(attrs.source || 'projects', attrs, scope)
    case 'labs':
      return select('labs', attrs, scope)
    case 'people':
      return select(attrs.source, attrs, scope)
    case 'alumni-stories':
      return select(attrs.source || 'alumni', attrs, scope)
    case 'news-list':
      return select(attrs.source || 'news', { ...attrs, sort: attrs.sort || 'date:desc' }, scope)
    case 'news-feed':
      return present([...collection('news'), ...collection('events')])
    case 'events':
      return select(attrs.source || 'events', attrs, scope)
    case 'openings':
      return select(attrs.source || 'openings', attrs, scope)
    case 'admissions-panel':
      return select('admissions', attrs, scope)
    case 'courses':
      return select(attrs.source || 'courses', attrs, scope)
    case 'partner-logos':
      return select(attrs.source || 'partners', attrs, scope)
    case 'opportunities-band': {
      const found =
        select('admissions', { status: attrs.admissions || 'current' }, scope).length +
        select('openings', { status: attrs.openings || 'open' }, scope).length +
        select('projects', { status: attrs.projects || 'open-for-students' }, scope).length
      return found ? [{}] : []
    }
    case 'incentive-highlights':
      return incentiveTiles().length ? [{}] : []
    case 'gallery':
      return imagesInFolder(attrs.folder || '').length ? [{}] : []
    case 'timeline':
      return (scope?.impact?.timeline.length ?? 0) > 0 ? [{}] : []
    case 'metrics': {
      const visible = (scope?.impact?.metrics ?? []).filter((metric) => publicText(metric.value))
      return visible.length ? [{}] : []
    }
    case 'contact-card':
      return site.contact.address ? [{}] : []
    case 'map':
      return site.contact.map_embed ? [{}] : []
    default:
      return null
  }
}

export function isEmptySection(name: string, attrs: Attrs, scope?: MarkdownScope, items?: unknown[]): boolean {
  if (attrs.empty) return false
  if (items) return items.length === 0
  const rows = rowsFor(name, attrs, scope)
  if (!rows) return false
  return rows.length === 0
}
