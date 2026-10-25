import { markerLabel, showEditorial } from '../lib/editorial'

export function TodoBadge() {
  if (!showEditorial) return null
  return (
    <span className="inline-flex items-center rounded bg-amber-300 px-1.5 py-0.5 align-middle text-[11px] font-semibold uppercase tracking-wide text-ink">
      {markerLabel()}
    </span>
  )
}
