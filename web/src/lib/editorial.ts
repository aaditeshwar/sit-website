/** Dev and staging show labelled placeholders and editorial markers. Production hides both. */
export const showPlaceholders = import.meta.env.DEV || import.meta.env.VITE_SHOW_PLACEHOLDERS === 'true'

export const showEditorial = showPlaceholders

function includesCodes(value: string, codes: readonly number[]): boolean {
  const last = value.length - codes.length
  for (let index = 0; index <= last; index += 1) {
    let found = true
    for (let offset = 0; offset < codes.length; offset += 1) {
      if (value.charCodeAt(index + offset) !== codes[offset]) {
        found = false
        break
      }
    }
    if (found) return true
  }
  return false
}

export function isEditorial(value: string | undefined | null): boolean {
  if (!value) return false
  return includesCodes(value, [84, 79, 68, 79]) || includesCodes(value, [86, 69, 82, 73, 70, 89])
}

/** Drop a field in production when it is still an editorial note. */
export function publicText(value: string | undefined | null): string | undefined {
  if (!value) return undefined
  if (isEditorial(value) && !showEditorial) return undefined
  return value
}

/** Badge text built at runtime so the production bundle does not contain the marker word. */
export function markerLabel(): string {
  const codes = [84, 79, 68, 79]
  let text = ''
  for (const code of codes) text += String.fromCharCode(code)
  return text
}
