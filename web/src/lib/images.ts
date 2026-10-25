import manifest from '../generated/image-manifest.json'

export type ImageFormat = 'webp' | 'jpeg' | 'png'

export type ImageVariant = {
  width: number
  format: ImageFormat
  src: string
}

export type ImageEntry = {
  hash: string
  width: number
  height: number
  placeholder: boolean
  variants: ImageVariant[]
}

export const imageManifest = manifest as Record<string, ImageEntry>

export function imageKey(src: string | undefined): string {
  if (!src) return ''
  return src.replace(/^\//, '')
}

export function lookupImage(src: string | undefined): ImageEntry | undefined {
  const key = imageKey(src)
  if (!key) return undefined
  return imageManifest[key]
}

export function imagesInFolder(folder: string): string[] {
  const prefix = `${folder.replace(/^\//, '').replace(/\/$/, '')}/`
  if (prefix === '/') return []
  return Object.keys(imageManifest)
    .filter((key) => key.startsWith(prefix))
    .sort((a, b) => a.localeCompare(b))
}
