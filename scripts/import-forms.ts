import fs from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Papa from 'papaparse'
import sharp from 'sharp'
import { allocateId, formMaps, slugifyTitle, type FormMap, type MappedColumn } from './forms-mapping.ts'
import { localISODate, parsePartialDate } from './lib/dates.ts'
import { emailLocalPart, normalisePersonName } from './lib/names.ts'
import { repoRoot } from './lib/root.ts'
import {
  alumnusSchema,
  eventSchema,
  formatZodIssues,
  newsSchema,
  openingSchema,
  projectSchema,
} from './lib/schema.ts'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const SEMICOLON_FIELDS = new Set(['people', 'faculty', 'partners', 'supervisor'])
const KNOWN_SHEET_HEADERS = new Set(['timestamp', 'email address', 'moderator_note', 'moderator note'])

const SCHEMAS = {
  'data/news.csv': newsSchema,
  'data/projects.csv': projectSchema,
  'data/events.csv': eventSchema,
  'data/openings.csv': openingSchema,
  'data/people/alumni.csv': alumnusSchema,
} as const

type CsvPath = keyof typeof SCHEMAS

type SheetRow = Record<string, string>

export type ImportOptions = {
  root?: string
  fromDir?: string
  dryRun?: boolean
  today?: string
}

export type FileChange = {
  file: string
  before: string
  after: string
  inserted: number
  updated: number
  deleted: number
}

export type ImportResult = {
  changes: FileChange[]
  inserted: number
  updated: number
  deleted: number
  warnings: string[]
  errors: string[]
  changed: boolean
}

type EncodedImage = {
  absolute: string
  bytes: Buffer
}

const SHEET_URL_FILE = 'forms/published-sheets.env'

function schemaKeys(csv: string): string[] {
  const schema = SCHEMAS[csv as CsvPath]
  return Object.keys(schema.shape)
}

function emptyResult(warnings: string[] = [], errors: string[] = []): ImportResult {
  return { changes: [], inserted: 0, updated: 0, deleted: 0, warnings, errors, changed: false }
}

export function parseArgs(argv: string[], cwd = process.cwd()): ImportOptions {
  const options: ImportOptions = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index] ?? ''
    if (arg === '--dry-run') {
      options.dryRun = true
      continue
    }
    const eq = arg.indexOf('=')
    const flag = eq === -1 ? arg : arg.slice(0, eq)
    const inline = eq === -1 ? undefined : arg.slice(eq + 1)
    if (flag !== '--from-dir' && flag !== '--today' && flag !== '--root') {
      throw new Error(`unknown argument ${arg}`)
    }
    const value = inline ?? argv[index + 1]
    if (!value || value.startsWith('--')) throw new Error(`${flag} needs a value`)
    if (inline === undefined) index += 1
    if (flag === '--from-dir') options.fromDir = path.resolve(cwd, value)
    if (flag === '--today') options.today = value
    if (flag === '--root') options.root = path.resolve(cwd, value)
  }
  return options
}

function readText(file: string): string {
  try {
    return fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')
  } catch {
    return ''
  }
}

function readCsv(file: string): { columns: string[]; rows: SheetRow[] } {
  return readCsvText(readText(file))
}

function readCsvText(text: string): { columns: string[]; rows: SheetRow[] } {
  const source = text.replace(/^\uFEFF/, '')
  if (!source.trim()) return { columns: [], rows: [] }
  const parsed = Papa.parse<SheetRow>(source, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  })
  const columns = (parsed.meta.fields ?? []).map((field) => field.trim()).filter((field) => field && !field.startsWith('__'))
  const rows = parsed.data.map((row) => {
    const clean: SheetRow = {}
    for (const column of columns) clean[column] = row[column] ?? ''
    return clean
  })
  return { columns, rows }
}

type FacultyRef = { name: string; id: string }

function loadFacultyIndex(root: string): Map<string, FacultyRef[]> {
  const index = new Map<string, FacultyRef[]>()
  const file = path.join(root, 'data/people/faculty.csv')
  if (!fs.existsSync(file)) return index
  for (const row of readCsv(file).rows) {
    const name = (row.name ?? '').trim()
    if (!name) continue
    const person = { name, id: emailLocalPart(row.email ?? '') ?? '' }
    addFacultyKey(index, normalisePersonName(person.name), person)
    addFacultyKey(index, person.id, person)
  }
  return index
}

function addFacultyKey(index: Map<string, FacultyRef[]>, key: string | undefined, person: FacultyRef) {
  if (!key) return
  const list = index.get(key) ?? []
  if (!list.some((item) => item.name === person.name)) list.push(person)
  index.set(key, list)
}

function facultyMatches(index: Map<string, FacultyRef[]>, token: string): FacultyRef[] {
  const found = new Map<string, FacultyRef>()
  for (const key of [emailLocalPart(token), normalisePersonName(token)]) {
    if (!key) continue
    for (const person of index.get(key) ?? []) found.set(person.name, person)
  }
  return [...found.values()]
}

function resolveFaculty(index: Map<string, FacultyRef[]>, value: string): string {
  const names: string[] = []
  for (const part of value.split(';')) {
    const token = part.trim()
    if (!token) continue
    const matches = facultyMatches(index, token)
    const resolved = matches.length === 1 && matches[0].id ? matches[0].id : token
    if (!names.includes(resolved)) names.push(resolved)
  }
  return names.join(';')
}

function serialize(columns: string[], rows: SheetRow[]): string {
  const body = Papa.unparse(
    rows.map((row) => {
      const record: SheetRow = {}
      for (const column of columns) record[column] = row[column] ?? ''
      return record
    }),
    { columns, newline: '\n' },
  )
  return body.endsWith('\n') ? body : `${body}\n`
}

function columnOrder(existing: string[], keys: string[]): string[] {
  const order = existing.filter(Boolean)
  for (const key of keys) {
    if (!order.includes(key)) order.push(key)
  }
  return order.length ? order : [...keys]
}

function linesOf(text: string): string[] {
  if (!text) return []
  return text.replace(/\n$/, '').split('\n')
}

function lineDiff(file: string, before: string, after: string): string {
  if (before === after) return ''
  const left = linesOf(before)
  const right = linesOf(after)
  const width = left.length
  const height = right.length
  const scores: number[][] = Array.from({ length: width + 1 }, () => Array<number>(height + 1).fill(0))
  for (let row = width - 1; row >= 0; row -= 1) {
    for (let col = height - 1; col >= 0; col -= 1) {
      scores[row][col] = left[row] === right[col] ? scores[row + 1][col + 1] + 1 : Math.max(scores[row + 1][col], scores[row][col + 1])
    }
  }
  const out = [`--- ${file}`, `+++ ${file}`]
  let row = 0
  let col = 0
  while (row < width && col < height) {
    if (left[row] === right[col]) {
      row += 1
      col += 1
    } else if (scores[row + 1][col] >= scores[row][col + 1]) {
      out.push(`-${left[row]}`)
      row += 1
    } else {
      out.push(`+${right[col]}`)
      col += 1
    }
  }
  while (row < width) out.push(`-${left[row++]}`)
  while (col < height) out.push(`+${right[col++]}`)
  return out.join('\n')
}

/** Drop parenthetical notes so a shorter form question still matches the mapping. */
export function questionKey(value: string): string {
  return value
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function cellByName(row: SheetRow, name: string): string | undefined {
  if (Object.prototype.hasOwnProperty.call(row, name)) return (row[name] ?? '').trim()
  const found = Object.entries(row).find(([key]) => key.trim().toLowerCase() === name.trim().toLowerCase())
  if (!found) return undefined
  return (found[1] ?? '').trim()
}

function readCell(row: SheetRow, column: MappedColumn): string {
  const edited = cellByName(row, `edited_${column.column}`)
  if (edited) return edited
  if (column.question === '(respondent email)') {
    return cellByName(row, 'Email Address') ?? cellByName(row, 'Email address') ?? ''
  }
  if (column.question.includes('(moderator)')) return cellByName(row, column.column) ?? ''
  const byQuestion = cellByName(row, column.question)
  if (byQuestion) return byQuestion
  const wanted = questionKey(column.question)
  if (wanted) {
    const found = Object.entries(row).find(([key, value]) => questionKey(key) === wanted && value.trim())
    if (found) return found[1].trim()
  }
  for (const alias of column.aliases ?? []) {
    const byAlias = cellByName(row, alias)
    if (byAlias) return byAlias
    const found = Object.entries(row).find(([key, value]) => questionKey(key) === questionKey(alias) && value.trim())
    if (found) return found[1].trim()
  }
  return cellByName(row, column.column) ?? ''
}

function isModerationField(form: FormMap, column: MappedColumn): boolean {
  return column.column === form.moderationColumn && column.question.includes('(moderator)')
}

/** Sheet headers that match no question, alias, or moderator column. */
export function unmappedColumns(form: FormMap, sheet: SheetRow[]): string[] {
  const known = new Set<string>(KNOWN_SHEET_HEADERS)
  known.add(questionKey(form.moderationColumn))
  known.add(form.moderationColumn.toLowerCase())
  for (const column of form.columns) {
    known.add(questionKey(column.question))
    known.add(column.column.toLowerCase())
    for (const alias of column.aliases ?? []) known.add(questionKey(alias))
  }
  const headers = new Set<string>()
  for (const row of sheet) {
    for (const key of Object.keys(row)) if (key.trim()) headers.add(key.trim())
  }
  return [...headers]
    .filter((header) => {
      if (header.toLowerCase().startsWith('edited_')) return false
      const key = questionKey(header)
      return !known.has(key) && !known.has(header.toLowerCase())
    })
    .sort((a, b) => a.localeCompare(b))
}

function visibilityField(tab: string): string {
  return tab === 'projects' ? 'published' : 'status'
}

/** Sheet cells use the same words the CSV stores. A blank cell leaves visibility unchanged. */
function visibilityAction(tab: string, raw: string): 'show' | 'hide' | 'closed' | 'leave' | 'unknown' {
  const lower = raw.trim().toLowerCase()
  if (!lower) return 'leave'
  if (tab === 'projects') {
    if (lower === 'true') return 'show'
    if (lower === 'false') return 'hide'
    return 'unknown'
  }
  if (tab === 'openings') {
    if (lower === 'open') return 'show'
    if (lower === 'draft') return 'hide'
    if (lower === 'closed') return 'closed'
    return 'unknown'
  }
  if (lower === 'published') return 'show'
  if (lower === 'draft') return 'hide'
  return 'unknown'
}

function visibilityWrite(tab: string, action: 'show' | 'hide' | 'closed'): string {
  if (tab === 'projects') return action === 'show' ? 'TRUE' : 'FALSE'
  if (tab === 'openings') {
    if (action === 'show') return 'open'
    if (action === 'closed') return 'closed'
    return 'draft'
  }
  return action === 'show' ? 'published' : 'draft'
}

/** CSV address for a "Publish to the web" link. The HTML page itself has no rows. */
export function publishedCsvUrl(input: string): string {
  let url: URL
  try {
    url = new URL(input.trim())
  } catch {
    throw new Error(`published sheet URL is not a URL: ${input}`)
  }
  if (url.hostname !== 'docs.google.com') throw new Error('published sheet URL must be on docs.google.com')
  const gid = url.searchParams.get('gid')
  if (!gid) throw new Error('published sheet URL is missing gid')
  const csv = new URL(url.pathname.replace(/\/pubhtml(?:\/sheet)?\/?$/, '/pub'), url.origin)
  csv.searchParams.set('gid', gid)
  csv.searchParams.set('single', 'true')
  csv.searchParams.set('output', 'csv')
  return csv.toString()
}

export function sheetUrlKey(tab: string): string {
  return `${tab.toUpperCase()}_SHEET_URL`
}

function mapChoice(column: MappedColumn, value: string): string {
  const choices = column.choices
  const trimmed = value.trim()
  if (!choices) return trimmed
  if (choices.has(trimmed)) return choices.get(trimmed) ?? trimmed
  const found = [...choices.entries()].find(([label]) => label.toLowerCase() === trimmed.toLowerCase())
  if (found) return found[1]
  for (const slug of choices.values()) {
    if (slug === trimmed) return slug
  }
  throw new Error(`${column.column}: unknown value "${trimmed}"`)
}

function splitChecked(value: string): string[] {
  const parts = value.includes(';') ? value.split(';') : value.split(',')
  return parts.map((part) => part.trim()).filter(Boolean)
}

function normalizeValue(column: MappedColumn, value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (column.kind === 'date') return normalizeDate(trimmed)
  if (column.kind === 'year') return normalizeYear(trimmed)
  if (column.kind === 'bool') return normalizeBool(trimmed)
  if (column.kind === 'enum') return mapChoice(column, trimmed)
  if (column.kind === 'list') return splitChecked(trimmed).map((part) => mapChoice(column, part)).join(';')
  if (SEMICOLON_FIELDS.has(column.column) && trimmed.includes(';')) {
    return trimmed.split(';').map((part) => part.trim()).filter(Boolean).join(';')
  }
  return trimmed
}

function normalizeDate(value: string): string {
  if (/^\d{4}$/.test(value) || /^\d{4}-\d{2}$/.test(value) || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    if (!parsePartialDate(value)) throw new Error(`invalid date "${value}"`)
    return value
  }
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value)
  if (us) {
    const iso = `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`
    if (!parsePartialDate(iso)) throw new Error(`invalid date "${value}"`)
    return iso
  }
  throw new Error(`invalid date "${value}"`)
}

function normalizeYear(value: string): string {
  if (!/^\d{4}$/.test(value)) throw new Error(`invalid year "${value}"`)
  return value
}

function normalizeBool(value: string): string {
  const folded = value.trim().toLowerCase()
  if (folded === 'true' || folded === 'yes' || folded === 'y') return 'TRUE'
  if (folded === 'false' || folded === 'no' || folded === 'n') return 'FALSE'
  throw new Error(`expected TRUE or FALSE, received "${value.trim()}"`)
}

function hasConsent(value: string): boolean {
  const folded = value.trim().toLowerCase()
  if (!folded || folded === 'no' || folded === 'false' || folded === 'n') return false
  return folded === 'yes' || folded === 'true' || folded === 'y' || folded.includes('consent')
}

function urlSegment(value: string): string {
  if (!/^https?:\/\//i.test(value)) return ''
  try {
    return new URL(value).pathname.split('/').filter(Boolean).pop() ?? ''
  } catch {
    return ''
  }
}

function matchIndex(form: FormMap, rows: SheetRow[], label: string, hint: string): number {
  if (form.tab === 'alumni') {
    const name = label.trim().toLowerCase()
    return rows.findIndex((row) => (row.name ?? '').trim().toLowerCase() === name)
  }
  const trimmedHint = hint.trim()
  if (trimmedHint) {
    const keys = new Set([trimmedHint, urlSegment(trimmedHint), slugifyTitle(trimmedHint)].filter(Boolean))
    const hinted = rows.findIndex((row) => keys.has(row.id ?? '') || (row.title ?? '').trim().toLowerCase() === trimmedHint.toLowerCase())
    if (hinted >= 0) return hinted
  }
  const title = label.trim().toLowerCase()
  if (!title) return -1
  return rows.findIndex((row) => (row.title ?? '').trim().toLowerCase() === title)
}

function materiallyEqual(left: SheetRow, right: SheetRow): boolean {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)])
  for (const key of keys) {
    if ((left[key] ?? '') !== (right[key] ?? '')) return false
  }
  return true
}

function usedIds(rows: SheetRow[]): Set<string> {
  return new Set(rows.map((row) => row.id ?? '').filter(Boolean))
}

function sortRows(form: FormMap, rows: SheetRow[]): SheetRow[] {
  const tie = form.tab === 'alumni' ? 'name' : 'id'
  return rows.slice().sort((left, right) => {
    const a = left[form.sortField] ?? ''
    const b = right[form.sortField] ?? ''
    if (a !== b) {
      const order = a < b ? -1 : 1
      return form.sortDesc ? -order : order
    }
    return (left[tie] ?? '').localeCompare(right[tie] ?? '', 'en')
  })
}

function driveFileId(url: string): string | undefined {
  if (!/drive\.google\.com|docs\.google\.com/i.test(url)) return undefined
  const fromPath = /\/file\/d\/([^/]+)/.exec(url)?.[1]
  if (fromPath) return fromPath
  return /[?&]id=([^&]+)/.exec(url)?.[1]
}

/** A path already in this repository. A leading slash is the site URL (`/images/...`). */
function existingAsset(root: string, cell: string): string | undefined {
  const trimmed = cell.trim()
  const relative = trimmed.replace(/^\/+/, '').replace(/\\/g, '/')
  if (!relative.startsWith('images/') || relative.includes('..')) return undefined
  const absolute = path.join(root, 'assets', ...relative.split('/'))
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) return undefined
  return trimmed.startsWith('/') ? `/${relative}` : relative
}

function resolveLocal(fromDir: string, value: string): string | undefined {
  if (!value || /^https?:\/\//i.test(value)) return undefined
  const root = path.resolve(fromDir)
  const candidate = path.resolve(root, value)
  const relative = path.relative(root, candidate)
  if (relative.startsWith('..') || path.isAbsolute(relative)) return undefined
  if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) return undefined
  return candidate
}

function assertImageSize(bytes: Buffer): Buffer {
  if (bytes.length > MAX_IMAGE_BYTES) throw new Error('image exceeds 10 MB')
  return bytes
}

function looksLikeHtml(bytes: Buffer): boolean {
  const start = bytes.subarray(0, 64).toString('utf8').trim().toLowerCase()
  return start.startsWith('<!doctype html') || start.startsWith('<html')
}

async function downloadHttp(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`GET ${url} failed (${response.status})`)
  return assertImageSize(Buffer.from(await response.arrayBuffer()))
}

/** Public "anyone with the link" Drive files. The form cell is a viewer link, not the file bytes. */
async function downloadDrive(fileId: string): Promise<Buffer> {
  const url = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`
  const response = await fetch(url, { redirect: 'follow' })
  if (!response.ok) throw new Error(`GET ${url} failed (${response.status})`)
  const bytes = assertImageSize(Buffer.from(await response.arrayBuffer()))
  if (looksLikeHtml(bytes)) {
    throw new Error('Drive file is not publicly downloadable. Share it as anyone with the link.')
  }
  return bytes
}

async function loadImageBytes(cell: string, fromDir: string | undefined): Promise<Buffer> {
  if (fromDir) {
    const local = resolveLocal(fromDir, cell)
    if (local) return assertImageSize(await readFile(local))
  }
  if (/^https?:\/\//i.test(cell)) {
    const fileId = driveFileId(cell)
    if (fileId) return downloadDrive(fileId)
    return downloadHttp(cell)
  }
  throw new Error(`image not found: ${cell}`)
}

async function reencode(bytes: Buffer): Promise<{ ext: string; bytes: Buffer }> {
  const source = sharp(bytes, { failOn: 'none' })
  const meta = await source.metadata()
  const format = meta.format ?? ''
  if (!['png', 'jpeg', 'jpg', 'webp', 'gif', 'tiff'].includes(format)) {
    throw new Error(`unsupported image format ${format || 'unknown'}`)
  }
  const pipeline = sharp(bytes, { failOn: 'none' }).rotate().resize({
    width: 2400,
    height: 2400,
    fit: 'inside',
    withoutEnlargement: true,
  })
  if (format === 'png') return { ext: 'png', bytes: await pipeline.png().toBuffer() }
  if (format === 'webp') return { ext: 'webp', bytes: await pipeline.webp().toBuffer() }
  return { ext: 'jpg', bytes: await pipeline.jpeg({ quality: 82 }).toBuffer() }
}

async function sameBytes(file: string, bytes: Buffer): Promise<boolean> {
  try {
    const current = await readFile(file)
    return current.equals(bytes)
  } catch {
    return false
  }
}

async function fetchPublishedRows(pageUrl: string): Promise<SheetRow[]> {
  const csvUrl = publishedCsvUrl(pageUrl)
  const response = await fetch(csvUrl)
  if (!response.ok) throw new Error(`GET ${csvUrl} failed (${response.status})`)
  return readCsvText(await response.text()).rows
}

async function loadSheet(form: FormMap, fromDir: string | undefined, pageUrl: string | undefined): Promise<SheetRow[]> {
  if (fromDir) {
    const file = path.join(fromDir, `${form.tab}.csv`)
    if (!fs.existsSync(file)) return []
    return readCsv(file).rows
  }
  if (!pageUrl) return []
  return fetchPublishedRows(pageUrl)
}

function labelColumn(form: FormMap): MappedColumn | undefined {
  return form.columns.find((column) => column.column === (form.tab === 'alumni' ? 'name' : 'title'))
}

function hintColumn(form: FormMap): MappedColumn | undefined {
  return form.columns.find((column) => column.kind === 'match')
}

/** Fill empty environment variables from a KEY=VALUE file. Existing variables win. */
export function loadEnvFile(file: string): void {
  if (!fs.existsSync(file)) return
  const text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

export async function importForms(options: ImportOptions = {}): Promise<ImportResult> {
  const root = options.root ?? repoRoot
  const today = options.today ?? localISODate()
  const warnings: string[] = []
  const errors: string[] = []
  const pageUrls = new Map<string, string>()
  if (!options.fromDir) {
    loadEnvFile(path.join(repoRoot, '.env'))
    loadEnvFile(path.join(repoRoot, SHEET_URL_FILE))
    for (const form of formMaps) {
      const value = process.env[sheetUrlKey(form.tab)]?.trim()
      if (value) pageUrls.set(form.tab, value)
    }
    if (!pageUrls.size) {
      return emptyResult([`No published sheet URLs are set in ${SHEET_URL_FILE}. Blank lines are skipped.`])
    }
  }

  const changes: FileChange[] = []
  const facultyIndex = loadFacultyIndex(root)
  let inserted = 0
  let updated = 0
  let deleted = 0
  let changed = false

  for (const form of formMaps) {
    const csv = form.csv as CsvPath
    const schema = SCHEMAS[csv]
    if (!schema) {
      errors.push(`${form.csv}: no zod schema`)
      continue
    }
    const keys = schemaKeys(form.csv)
    const file = path.join(root, form.csv)
    const before = readText(file)
    const existing = fs.existsSync(file) ? readCsv(file) : { columns: [], rows: [] }
    const rows = existing.rows.map((row) => ({ ...row }))
    const pageUrl = pageUrls.get(form.tab)
    if (!options.fromDir && !pageUrl) {
      warnings.push(`${form.tab}: no ${sheetUrlKey(form.tab)} yet`)
      continue
    }
    let sheet: SheetRow[]
    try {
      sheet = await loadSheet(form, options.fromDir, pageUrl)
    } catch (error) {
      errors.push(`${form.tab}: ${error instanceof Error ? error.message : String(error)}`)
      continue
    }
    if (options.fromDir && !fs.existsSync(path.join(options.fromDir, `${form.tab}.csv`))) {
      warnings.push(`${form.tab}: no ${form.tab}.csv in ${options.fromDir}`)
    }
    const unmapped = unmappedColumns(form, sheet)
    if (unmapped.length) warnings.push(`${form.tab}: unmapped columns: ${unmapped.join(', ')}`)
    const sheetHeaders = new Set(sheet.flatMap((row) => Object.keys(row).map((key) => questionKey(key))))
    if (pageUrl && sheet.length && !sheetHeaders.has(questionKey(form.moderationColumn))) {
      warnings.push(`${form.tab}: add a ${form.moderationColumn} column. A blank cell leaves visibility unchanged.`)
    }

    let dirty = false
    let fileInserted = 0
    let fileUpdated = 0
    let fileDeleted = 0
    const images: EncodedImage[] = []
    const titleColumn = labelColumn(form)
    const updateColumn = hintColumn(form)

    for (const [index, sheetRow] of sheet.entries()) {
      const where = `${form.tab} row ${index + 2}`
      const moderationRaw = (cellByName(sheetRow, form.moderationColumn) ?? '').trim()
      const action = visibilityAction(form.tab, moderationRaw)
      if (action === 'leave') warnings.push(`${where}: ${form.moderationColumn} is blank, visibility left unchanged`)
      if (action === 'unknown') {
        warnings.push(`${where}: unknown ${form.moderationColumn} "${moderationRaw}"`)
        continue
      }
      const label = titleColumn ? readCell(sheetRow, titleColumn) : ''
      const hint = updateColumn ? readCell(sheetRow, updateColumn) : ''
      const match = matchIndex(form, rows, label, hint)
      const current = match >= 0 ? rows[match] : undefined
      if (!current && action !== 'show' && action !== 'closed') continue

      const consent = form.columns.find((column) => column.kind === 'gate')
      if (consent && !hasConsent(readCell(sheetRow, consent))) {
        warnings.push(`${where}: skipped ${label || 'row'}, no consent`)
        continue
      }

      try {
        const missing = form.columns.filter((column) => {
          if (!column.required || !column.store || column.kind === 'image') return false
          const raw = readCell(sheetRow, column).trim()
          if (raw && raw !== '-') return false
          return !(current && (current[column.column] ?? '').trim())
        })
        if (missing.length) {
          errors.push(`${where}: missing ${missing.map((column) => column.column).join(', ')}`)
          continue
        }
        const incoming: SheetRow = {}
        for (const column of form.columns) {
          if (!column.store || column.kind === 'image' || isModerationField(form, column)) continue
          const raw = readCell(sheetRow, column).trim()
          if (!raw) continue
          incoming[column.column] = raw === '-' ? (column.kind === 'bool' ? 'FALSE' : '') : normalizeValue(column, raw)
        }
        if (incoming.faculty) incoming.faculty = resolveFaculty(facultyIndex, incoming.faculty)

        const merged: SheetRow = { ...(current ?? {}) }
        for (const [key, value] of Object.entries(incoming)) merged[key] = value
        if (!current && (form.tab === 'news' || form.tab === 'projects') && !merged.featured) merged.featured = 'FALSE'
        if (action === 'show' || action === 'hide' || action === 'closed') {
          merged[visibilityField(form.tab)] = visibilityWrite(form.tab, action)
        }
        if (keys.includes('id')) {
          merged.id = current?.id || allocateId(slugifyTitle(label), usedIds(rows))
          if (!merged.id) {
            errors.push(`${where}: could not build an id`)
            continue
          }
        }

        const imageColumn = form.columns.find((column) => column.kind === 'image')
        let pendingImage: EncodedImage | undefined
        let rowImageChanged = false
        if (imageColumn && form.imageDir) {
          const cell = readCell(sheetRow, imageColumn).trim()
          if (cell === '-') {
            merged[imageColumn.column] = ''
          } else if (!cell) {
            if (!current) merged[imageColumn.column] = ''
          } else {
            const local = existingAsset(root, cell)
            if (local) {
              merged[imageColumn.column] = local
            } else try {
              const encoded = await reencode(await loadImageBytes(cell, options.fromDir))
              const base = form.tab === 'alumni' ? slugifyTitle(label) : merged.id
              const relative = `images/${form.imageDir}/${base}.${encoded.ext}`
              const absolute = path.join(root, 'assets', ...relative.split('/'))
              merged[imageColumn.column] = relative
              if (!(await sameBytes(absolute, encoded.bytes))) {
                pendingImage = { absolute, bytes: encoded.bytes }
                rowImageChanged = true
              }
            } catch (error) {
              warnings.push(`${where}: ${error instanceof Error ? error.message : String(error)}`)
              if (!current) merged[imageColumn.column] = ''
            }
          }
        }

        if (form.tab === 'projects') {
          const comparable = { ...merged, last_updated: current?.last_updated ?? '' }
          if (!current || !materiallyEqual(current, comparable)) merged.last_updated = today
        }

        const parsed = schema.safeParse(pick(merged, keys))
        if (!parsed.success) {
          errors.push(...formatZodIssues(where, parsed.error))
          continue
        }

        const textChanged = !current || !materiallyEqual(current, merged)
        if (!textChanged && !rowImageChanged) continue
        if (pendingImage) images.push(pendingImage)
        if (textChanged) {
          dirty = true
          if (current) rows[match] = merged
          else rows.push(merged)
          if (current) fileUpdated += 1
          else fileInserted += 1
        } else {
          fileUpdated += 1
        }
      } catch (error) {
        errors.push(`${where}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    const after = dirty ? serialize(columnOrder(existing.columns, keys), sortRows(form, rows)) : before
    if (after !== before) changed = true
    for (const image of images) {
      changed = true
      if (!options.dryRun) {
        await mkdir(path.dirname(image.absolute), { recursive: true })
        await writeFile(image.absolute, image.bytes)
      }
    }
    if (!options.dryRun && after !== before) {
      await mkdir(path.dirname(file), { recursive: true })
      await writeFile(file, after)
    }
    inserted += fileInserted
    updated += fileUpdated
    deleted += fileDeleted
    changes.push({ file: form.csv, before, after, inserted: fileInserted, updated: fileUpdated, deleted: fileDeleted })
  }

  return { changes, inserted, updated, deleted, warnings, errors, changed }
}

function pick(row: SheetRow, keys: string[]): SheetRow {
  const picked: SheetRow = {}
  for (const key of keys) picked[key] = row[key] ?? ''
  return picked
}

function isDirectRun(): boolean {
  const entry = process.argv[1]
  if (!entry) return false
  return path.resolve(entry) === fileURLToPath(import.meta.url)
}

if (isDirectRun()) {
  try {
    const result = await importForms(parseArgs(process.argv.slice(2)))
    for (const warning of result.warnings) console.warn(`warning: ${warning}`)
    for (const error of result.errors) console.error(`error: ${error}`)
    for (const change of result.changes) {
      const diff = lineDiff(change.file, change.before, change.after)
      if (diff) console.log(diff)
    }
    const fresh = result.inserted + result.updated
    console.log(
      `IMPORT_SUMMARY new=${fresh} inserted=${result.inserted} updated=${result.updated} deleted=${result.deleted} changed=${result.changed}`,
    )
    if (result.errors.length) process.exit(1)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
