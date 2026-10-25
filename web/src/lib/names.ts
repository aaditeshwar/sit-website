/** Case-insensitive match that treats dots as spaces. */
export function normalisePersonName(name: string): string {
  return name
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\./g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** `aseth`, `aseth@iitd.ac.in`, and `aseth@cse.iitd.ac.in` all yield `aseth`. */
export function emailLocalPart(value: string): string | undefined {
  const trimmed = value.trim().toLowerCase()
  if (!trimmed || /\s/.test(trimmed)) return undefined
  const at = trimmed.indexOf('@')
  const local = at >= 0 ? trimmed.slice(0, at) : trimmed
  if (!/^[a-z][a-z0-9._-]*$/.test(local)) return undefined
  return local
}
