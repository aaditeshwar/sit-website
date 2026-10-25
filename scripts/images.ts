import { createHash } from 'node:crypto'
import { access, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Papa from 'papaparse'
import sharp from 'sharp'
import { repoRoot } from './lib/root.ts'

const WIDTHS = [320, 640, 960, 1280, 1920]
const RASTER = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])

type Format = 'webp' | 'jpeg' | 'png'

type Variant = {
  width: number
  format: Format
  src: string
}

type ManifestEntry = {
  hash: string
  width: number
  height: number
  placeholder: boolean
  variants: Variant[]
}

const imagesDir = path.join(repoRoot, 'assets', 'images')
const outDir = path.join(repoRoot, 'web', 'public', '_img')
const manifestPath = path.join(repoRoot, 'web', 'src', 'generated', 'image-manifest.json')

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(full)))
    else files.push(full)
  }
  return files
}

async function placeholderPaths(): Promise<Set<string>> {
  const text = await readFile(path.join(imagesDir, 'PLACEHOLDERS.csv'), 'utf8')
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true })
  const paths = new Set<string>()
  for (const row of parsed.data) {
    const file = (row.path ?? '').trim().replace(/\\/g, '/')
    if (file && (row.status ?? '').trim() === 'placeholder') paths.add(file)
  }
  return paths
}

function formatsFor(ext: string): Format[] {
  if (ext === '.png') return ['webp', 'png']
  if (ext === '.webp') return ['webp']
  return ['webp', 'jpeg']
}

function isPortrait(rel: string): boolean {
  return rel.startsWith('images/people/')
}

async function exists(file: string): Promise<boolean> {
  try {
    await access(file)
    return true
  } catch {
    return false
  }
}

async function loadPrevious(): Promise<Record<string, ManifestEntry>> {
  try {
    return JSON.parse(await readFile(manifestPath, 'utf8')) as Record<string, ManifestEntry>
  } catch {
    return {}
  }
}

async function pooled<T>(items: T[], limit: number, task: (item: T) => Promise<void>) {
  let index = 0
  async function worker() {
    while (index < items.length) {
      const current = index
      index += 1
      await task(items[current] as T)
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker())
  await Promise.all(workers)
}

async function encode(buffer: Buffer, width: number, format: Format): Promise<Buffer> {
  const resized = sharp(buffer).rotate().resize({ width, withoutEnlargement: true })
  if (format === 'webp') return resized.webp({ quality: 75 }).toBuffer()
  if (format === 'png') return resized.png({ compressionLevel: 9 }).toBuffer()
  return resized.jpeg({ quality: 80, mozjpeg: true }).toBuffer()
}

async function sourceBuffer(file: string, portrait: boolean): Promise<{ buffer: Buffer; width: number; height: number }> {
  if (!portrait) {
    const meta = await sharp(file).rotate().metadata()
    const width = meta.width ?? 0
    const height = meta.height ?? 0
    if (!width || !height) throw new Error('missing dimensions')
    return { buffer: await readFile(file), width, height }
  }
  const meta = await sharp(file).rotate().metadata()
  const width = meta.width ?? 0
  const height = meta.height ?? 0
  if (!width || !height) throw new Error('missing dimensions')
  const side = Math.min(width, height)
  const left = Math.round((width - side) / 2)
  const top = Math.max(0, Math.min(Math.round(height / 3 - side / 2), height - side))
  const buffer = await sharp(file).rotate().extract({ left, top, width: side, height: side }).toBuffer()
  return { buffer, width: side, height: side }
}

async function main() {
  const started = Date.now()
  const placeholders = await placeholderPaths()
  const previous = await loadPrevious()
  await mkdir(outDir, { recursive: true })
  await mkdir(path.dirname(manifestPath), { recursive: true })

  const files = (await walk(imagesDir)).filter((file) => RASTER.has(path.extname(file).toLowerCase()))
  const manifest: Record<string, ManifestEntry> = {}
  const kept = new Set<string>()
  let encoded = 0
  let reused = 0
  const failures: string[] = []

  await pooled(files, 4, async (file) => {
    const rel = path.relative(path.join(repoRoot, 'assets'), file).replace(/\\/g, '/')
    const bytes = await readFile(file)
    const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12)
    const cached = previous[rel]
    if (cached?.hash === hash && cached.variants.length > 0) {
      const ready = await Promise.all(cached.variants.map((variant) => exists(path.join(repoRoot, 'web', 'public', variant.src.slice(1)))))
      if (ready.every(Boolean)) {
        manifest[rel] = { ...cached, placeholder: placeholders.has(rel) }
        for (const variant of cached.variants) kept.add(path.basename(variant.src))
        reused += 1
        return
      }
    }

    try {
      const portrait = isPortrait(rel)
      const source = await sourceBuffer(file, portrait)
      const widths = WIDTHS.filter((width) => width <= source.width)
      if (widths.length === 0) widths.push(source.width)
      const formats = formatsFor(path.extname(file).toLowerCase())
      const variants: Variant[] = []
      for (const width of widths) {
        for (const format of formats) {
          const name = `${hash}-${width}.${format}`
          const dest = path.join(outDir, name)
          if (!(await exists(dest))) {
            const output = await encode(source.buffer, width, format)
            await writeFile(dest, output)
            encoded += 1
          }
          kept.add(name)
          variants.push({ width, format, src: `/_img/${name}` })
        }
      }
      manifest[rel] = {
        hash,
        width: source.width,
        height: source.height,
        placeholder: placeholders.has(rel),
        variants,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      failures.push(`${rel}: ${message}`)
    }
  })

  const ordered = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)))
  await writeFile(manifestPath, `${JSON.stringify(ordered, null, 2)}\n`)

  for (const name of await readdir(outDir)) {
    if (!kept.has(name)) await rm(path.join(outDir, name), { force: true })
  }

  const seconds = ((Date.now() - started) / 1000).toFixed(1)
  console.log(
    `Images: ${Object.keys(ordered).length} sources (${reused} reused, ${encoded} derivatives written) in ${seconds}s.`,
  )
  if (failures.length) {
    console.error(failures.join('\n'))
    process.exitCode = 1
  }
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isDirect) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
