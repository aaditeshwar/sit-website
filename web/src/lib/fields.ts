export function str(record: object, key: string): string {
  const value = (record as Record<string, unknown>)[key]
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return ''
}

export function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

export function dateLabel(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value.toLowerCase() === 'rolling' ? 'Rolling' : value
  if (typeof value === 'object' && value && 'display' in value) {
    return String((value as { display: unknown }).display ?? '')
  }
  return ''
}

export function yearOf(value: unknown): string {
  if (value && typeof value === 'object' && 'sort' in value) return String((value as { sort: unknown }).sort).slice(0, 4)
  if (typeof value === 'number') return String(value).slice(0, 4)
  if (typeof value === 'string') return value.slice(0, 4)
  return ''
}

export function initials(name: string): string {
  const words = name
    .split(/\s+/)
    .map((part) => part.replace(/[^A-Za-z]/g, ''))
    .filter(Boolean)
  return words
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function titleCase(value: string): string {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

/** Matches the heading ids rehype-slug writes for these titles. */
export function headingId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
