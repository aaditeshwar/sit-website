import fs from 'node:fs'
import path from 'node:path'
import { buildContent } from './lib/build.ts'
import { repoRoot } from './lib/root.ts'
import { ContentProblems } from './lib/schema.ts'

const watch = process.argv.includes('--watch')
let running = false
let queued = false

async function run(): Promise<void> {
  if (running) {
    queued = true
    return
  }
  running = true
  try {
    process.stdout.write(await buildContent())
  } catch (error) {
    if (error instanceof ContentProblems) console.error(error.message)
    else console.error(error)
    if (!watch) process.exit(1)
  } finally {
    running = false
    if (queued) {
      queued = false
      await run()
    }
  }
}

await run()

if (watch) {
  let timer: NodeJS.Timeout | undefined
  const schedule = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      void run()
    }, 200)
  }
  for (const dir of ['content', 'data', 'assets']) {
    fs.watch(path.join(repoRoot, dir), { recursive: true }, schedule)
  }
  console.log('Watching content, data and assets.')
}
