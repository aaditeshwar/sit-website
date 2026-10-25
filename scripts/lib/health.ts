export type HealthKind =
  | 'todo'
  | 'metric-todo'
  | 'comment'
  | 'draft'
  | 'missing-image'
  | 'unknown-faculty'
  | 'owncloud'
  | 'placeholder'
  | 'warning'

export type HealthItem = {
  kind: HealthKind
  file: string
  line?: number
  text: string
}

export type PlaceholderGroup = {
  requestFrom: string
  items: { path: string; brief: string; usedOn: string }[]
}

function cell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()
}

function count(items: HealthItem[], kind: HealthKind): number {
  return items.filter((item) => item.kind === kind).length
}

export function formatHealth(items: HealthItem[], placeholders: PlaceholderGroup[]): string {
  const markers = items.filter((item) => item.kind === 'todo' || item.kind === 'metric-todo')
  const lines: string[] = [
    '# Content health',
    '',
    `- ${markers.length} TODO/VERIFY markers (${count(items, 'metric-todo')} impact metrics still TODO)`,
    `- ${count(items, 'comment')} HTML comments`,
    `- ${count(items, 'draft')} draft or unpublished rows`,
    `- ${count(items, 'unknown-faculty')} faculty names with no match in faculty.csv`,
    `- ${count(items, 'missing-image')} missing image files`,
    `- ${count(items, 'owncloud')} links to owncloud.iitd.ac.in`,
    `- ${count(items, 'warning')} other content warnings`,
    `- ${placeholders.reduce((sum, group) => sum + group.items.length, 0)} placeholder images still outstanding`,
    '',
    '## Items',
    '',
    '| Kind | File | Line | Detail |',
    '| --- | --- | --- | --- |',
  ]

  const sorted = [...items].sort((a, b) => {
    const kind = a.kind.localeCompare(b.kind)
    if (kind !== 0) return kind
    const file = a.file.localeCompare(b.file)
    if (file !== 0) return file
    return (a.line ?? 0) - (b.line ?? 0)
  })

  for (const item of sorted) {
    lines.push(`| ${item.kind} | ${cell(item.file)} | ${item.line ?? ''} | ${cell(item.text)} |`)
  }

  lines.push('', '## Placeholders still outstanding', '')
  if (placeholders.length === 0) {
    lines.push('None.')
  }
  for (const group of placeholders) {
    lines.push(`### ${group.requestFrom}`, '')
    for (const item of group.items) {
      lines.push(`- \`${item.path}\` — ${item.brief} _(${item.usedOn})_`)
    }
    lines.push('')
  }

  return lines.join('\n').trimEnd() + '\n'
}
