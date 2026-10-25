import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Repository root (parent of `scripts/`). */
export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

export function relPath(file: string): string {
  return path.relative(repoRoot, file).replace(/\\/g, '/')
}
