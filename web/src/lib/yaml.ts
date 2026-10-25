import yaml from 'js-yaml'

export function parseYamlList(source: string, name: string): Record<string, unknown>[] {
  let parsed: unknown
  try {
    parsed = yaml.load(source)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'invalid YAML'
    throw new Error(`Could not read YAML for "${name}": ${message}`)
  }
  if (!Array.isArray(parsed)) throw new Error(`Markdown component "${name}" expected a YAML list`)
  return parsed.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`Markdown component "${name}" item ${index + 1} must be a mapping`)
    }
    return item as Record<string, unknown>
  })
}

export function fencedRecords(markdown: string, name: string): Record<string, unknown>[] {
  const marker = `\`\`\`yaml ${name}`
  const start = markdown.indexOf(marker)
  if (start < 0) return []
  const bodyStart = markdown.indexOf('\n', start)
  const end = markdown.indexOf('```', bodyStart + 1)
  if (bodyStart < 0 || end < 0) return []
  return parseYamlList(markdown.slice(bodyStart + 1, end), name)
}
