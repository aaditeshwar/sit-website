import fs from 'node:fs'
import path from 'node:path'
import {
  EVENT_TYPES,
  NEWS_CATEGORIES,
  OPENING_TYPES,
  PROGRAMME_LABELS,
  THRUST_AREA_LABELS,
  THRUST_AREA_SLUGS,
} from '../web/src/lib/enums.ts'
import { repoRoot } from './lib/root.ts'

export type ColumnKind = 'text' | 'date' | 'year' | 'enum' | 'list' | 'image' | 'email' | 'bool' | 'match' | 'gate'

export type MappedColumn = {
  question: string
  column: string
  kind: ColumnKind
  required: boolean
  /** Written into the CSV. Match hints and consent are gates, not columns. */
  store: boolean
  choices?: ReadonlyMap<string, string>
  /** Other sheet headers that mean this column. */
  aliases?: readonly string[]
}

export type FormMap = {
  tab: string
  csv: string
  moderationColumn: 'status' | 'moderation'
  sortField: string
  sortDesc: boolean
  imageDir?: string
  columns: MappedColumn[]
}

const SORT: Record<string, { field: string; desc: boolean }> = {
  news: { field: 'date', desc: true },
  events: { field: 'start_date', desc: true },
  projects: { field: 'title', desc: false },
  openings: { field: 'title', desc: false },
  alumni: { field: 'name', desc: false },
}

/** Slug of a title, at most 60 characters, cut on a hyphen. */
export function slugifyTitle(title: string): string {
  const slug = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return clipSlug(slug, 60)
}

export function clipSlug(slug: string, max: number): string {
  if (slug.length <= max) return slug
  const cut = slug.slice(0, max)
  const dash = cut.lastIndexOf('-')
  if (dash >= 12) return cut.slice(0, dash).replace(/-+$/g, '')
  return cut.replace(/-+$/g, '')
}

/** `base`, or `base-2`, `base-3`, … when `base` is already used. */
export function allocateId(base: string, used: Set<string>): string {
  if (!used.has(base)) return base
  let suffix = 2
  while (used.has(`${base}-${suffix}`)) suffix += 1
  return `${base}-${suffix}`
}

function backticks(cell: string): string[] {
  return [...cell.matchAll(/`([^`]+)`/g)].map((match) => match[1].trim()).filter(Boolean)
}

function splitTableRow(line: string): string[] {
  const parts = line.split('|')
  return parts.slice(1, -1).map((cell) => cell.trim())
}

function isSeparator(cells: string[]): boolean {
  return cells.length > 0 && cells.every((cell) => /^:?-+:?$/.test(cell))
}

function cleanLabel(raw: string): string {
  const bold = raw.match(/\*\*([^*]+)\*\*/)
  if (bold) return bold[1].trim()
  return raw.trim()
}

/** Split `A / B / C`, leaving slashes inside parentheses alone. */
function splitLabels(value: string): string[] {
  const labels: string[] = []
  let current = ''
  let depth = 0
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index] ?? ''
    if (char === '(') depth += 1
    if (char === ')' && depth > 0) depth -= 1
    if (depth === 0 && value.startsWith(' / ', index)) {
      labels.push(current.trim())
      current = ''
      index += 2
      continue
    }
    current += char
  }
  if (current.trim()) labels.push(current.trim())
  return labels
}

function slugsFromNotes(notes: string): string[] {
  const ticks = backticks(notes).filter((tick) => tick !== ';')
  const joined = ticks.find((tick) => tick.includes(';'))
  if (joined) return joined.split(';').map((part) => part.trim()).filter(Boolean)
  return ticks
}

function thrustChoices(): Map<string, string> {
  const choices = new Map<string, string>()
  for (const slug of THRUST_AREA_SLUGS) {
    choices.set(THRUST_AREA_LABELS[slug], slug)
    choices.set(slug, slug)
  }
  return choices
}

function lookupChoice(column: string, label: string): string | undefined {
  if (column === 'programme') {
    return Object.entries(PROGRAMME_LABELS).find(([, text]) => text === label)?.[0]
  }
  if (column === 'type') {
    if (label === 'Call for proposals') return 'call'
    const slug = label.trim().toLowerCase()
    if ((EVENT_TYPES as readonly string[]).includes(slug)) return slug
    if ((OPENING_TYPES as readonly string[]).includes(slug)) return slug
  }
  if (column === 'category') {
    const slug = label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    if ((NEWS_CATEGORIES as readonly string[]).includes(slug)) return slug
  }
  return undefined
}

/** Short label, full option text, and the text before a parenthetical or dash. */
function choiceAliases(raw: string): string[] {
  const plain = raw.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim()
  const aliases = new Set<string>()
  if (plain) aliases.add(plain)
  const short = cleanLabel(raw)
  if (short) aliases.add(short)
  const withoutParen = plain.replace(/\s*\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim()
  if (withoutParen) aliases.add(withoutParen)
  const beforeDash = plain.split(/\s+[—–-]\s+/)[0]?.trim() ?? ''
  if (beforeDash) aliases.add(beforeDash)
  return [...aliases]
}

function addChoice(choices: Map<string, string>, raw: string, slug: string) {
  for (const alias of choiceAliases(raw)) {
    if (!choices.has(alias)) choices.set(alias, slug)
  }
}

function choicesFor(column: string, typeCell: string, notes: string): Map<string, string> | undefined {
  if (/the four thrust areas/i.test(typeCell)) return thrustChoices()
  const match = /^(?:Dropdown|Multiple choice|Checkboxes):\s*(.+)$/i.exec(typeCell.trim())
  if (!match) return undefined
  const rawLabels = splitLabels(match[1]).map((label) => label.trim()).filter(Boolean)
  const labels = rawLabels.map(cleanLabel).filter(Boolean)
  const slugs = slugsFromNotes(notes)
  const choices = new Map<string, string>()
  if (slugs.length === labels.length) {
    rawLabels.forEach((raw, index) => addChoice(choices, raw, slugs[index] ?? ''))
    return choices
  }
  for (const raw of rawLabels) {
    const label = cleanLabel(raw)
    const slug = lookupChoice(column, label)
    if (!slug) {
      throw new Error(`forms/google-forms.md: no slug for ${column} label "${label}"`)
    }
    addChoice(choices, raw, slug)
  }
  return choices
}

const IMAGE_URL_NOTE = 'Use only one of uploading an image or pasting the URL.'

function headerAliases(tab: string, column: string): string[] | undefined {
  if (tab === 'events' && column === 'registration_url') return ['Link']
  if (tab === 'news' && column === 'image') {
    return [`Image (upload). ${IMAGE_URL_NOTE}`, `Image (URL). ${IMAGE_URL_NOTE}`]
  }
  if (tab === 'events' && column === 'image') {
    return ['Image', 'Poster or image', `Image (upload). ${IMAGE_URL_NOTE}`, `Image (URL). ${IMAGE_URL_NOTE}`]
  }
  if (tab === 'projects' && column === 'image') {
    return [
      `Image (landscape, ≥ 1200 px wide) - upload. ${IMAGE_URL_NOTE}`,
      `Image (landscape, ≥ 1200 px wide) - URL. ${IMAGE_URL_NOTE}`,
    ]
  }
  if (tab === 'alumni' && column === 'photo') {
    return [`Photo (upload). ${IMAGE_URL_NOTE}`, `Photo (URL). ${IMAGE_URL_NOTE}`]
  }
  if (tab === 'openings' && column === 'apply_url') return ['Application link']
  if (tab === 'alumni' && column === 'current_position') return ['Current position and organization']
  return undefined
}

function columnKind(column: string, typeCell: string): ColumnKind {
  if (column === 'update_of') return 'match'
  if (column === 'consent') return 'gate'
  if (column === 'featured' || column === 'published') return 'bool'
  if (column === 'image' || column === 'photo') return 'image'
  const type = typeCell.toLowerCase()
  if (type.includes('file upload')) return 'image'
  if (type.includes('checkbox')) return 'list'
  if (type.startsWith('dropdown') || type.startsWith('multiple choice')) return 'enum'
  if (type.includes('date') || column === 'date' || column.endsWith('_date') || column === 'deadline') return 'date'
  if (column === 'start_year' || column === 'graduation_year' || type.includes('yyyy')) return 'year'
  if (type.includes('email') || column === 'contact_email' || column === 'submitted_by') return 'email'
  return 'text'
}

function parseSection(csv: string, heading: string, body: string[]): FormMap {
  const tab = path.posix.basename(csv, '.csv')
  const sort = SORT[tab]
  if (!sort) throw new Error(`forms/google-forms.md: no sort rule for ${csv}`)
  const section = [heading, ...body].join('\n')
  const moderationColumn = /column\s+`moderation`/i.test(section) ? 'moderation' : 'status'
  const tableStart = body.findIndex((line) => line.trim().startsWith('|'))
  if (tableStart < 0) throw new Error(`forms/google-forms.md: ${csv} has no mapping table`)
  const tableLines: string[] = []
  for (const line of body.slice(tableStart)) {
    if (!line.trim().startsWith('|')) break
    tableLines.push(line)
  }
  const header = splitTableRow(tableLines[0] ?? '')
  const questionIndex = header.findIndex((cell) => cell.toLowerCase().startsWith('question'))
  const typeIndex = header.findIndex((cell) => cell.toLowerCase() === 'type')
  const requiredIndex = header.findIndex((cell) => cell.toLowerCase() === 'required')
  const columnIndex = header.findIndex((cell) => cell.toLowerCase().includes('csv'))
  const notesIndex = header.findIndex((cell) => cell.toLowerCase() === 'notes')
  if (questionIndex < 0 || typeIndex < 0 || columnIndex < 0) {
    throw new Error(`forms/google-forms.md: ${csv} table is missing Question, Type, or CSV column`)
  }

  const columns: MappedColumn[] = []
  for (const line of tableLines.slice(1)) {
    const cells = splitTableRow(line)
    if (isSeparator(cells)) continue
    const question = cells[questionIndex] ?? ''
    const typeCell = cells[typeIndex] ?? ''
    const requiredCell = requiredIndex >= 0 ? (cells[requiredIndex] ?? '') : ''
    const columnCell = cells[columnIndex] ?? ''
    const notes = notesIndex >= 0 ? (cells[notesIndex] ?? '') : ''
    const names = backticks(columnCell)
    if (!names.length) continue
    for (const name of names) {
      if (name === 'status' && moderationColumn === 'moderation' && question.includes('(moderator)')) continue
      const kind = columnKind(name, question.includes('(moderator)') ? '' : typeCell)
      const choices = kind === 'enum' || kind === 'list' ? choicesFor(name, typeCell, notes) : undefined
      columns.push({
        question,
        column: name,
        kind,
        required: requiredCell.toLowerCase() === 'yes',
        store: kind !== 'match' && kind !== 'gate',
        choices,
        aliases: headerAliases(tab, name),
      })
    }
  }
  if (!columns.length) throw new Error(`forms/google-forms.md: ${csv} produced no columns`)
  return {
    tab,
    csv,
    moderationColumn,
    sortField: sort.field,
    sortDesc: sort.desc,
    imageDir: columns.some((column) => column.kind === 'image') ? tab : undefined,
    columns,
  }
}

/** Mapping table parsed from `forms/google-forms.md`. */
export function loadFormMaps(markdown?: string): FormMap[] {
  const source = markdown ?? fs.readFileSync(path.join(repoRoot, 'forms/google-forms.md'), 'utf8')
  const lines = source.split(/\r?\n/)
  const sections: { heading: string; body: string[] }[] = []
  let current: { heading: string; body: string[] } | undefined
  for (const line of lines) {
    if (line.startsWith('## ')) {
      current = { heading: line, body: [] }
      sections.push(current)
    } else if (current) {
      current.body.push(line)
    }
  }
  const maps: FormMap[] = []
  for (const section of sections) {
    const csv = /→\s+`(data\/[^`]+)`/.exec(section.heading)?.[1]
    if (!csv) continue
    maps.push(parseSection(csv, section.heading, section.body))
  }
  return maps
}

export const formMaps = loadFormMaps()
