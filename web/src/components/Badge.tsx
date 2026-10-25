import { GitMerge, Globe, Sparkles, type LucideIcon } from 'lucide-react'
import { areas } from '../lib/content'
import {
  PROJECT_STATUS_LABELS,
  STAGES,
  THRUST_AREA_LABELS,
  type ProjectStatus,
  type Stage,
  type ThrustArea,
} from '../lib/enums'

const STAGE_ICONS: Record<Stage, LucideIcon> = {
  project: Sparkles,
  initiative: GitMerge,
  ecosystem: Globe,
}

export function StageBadge({ stage }: { stage: Stage }) {
  const meta = STAGES[stage]
  const Icon = STAGE_ICONS[stage]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-alt px-2.5 py-1 text-[12px] font-medium uppercase tracking-wide text-ink">
      <Icon aria-hidden="true" className="h-3.5 w-3.5" color={meta.color} />
      {meta.label}
    </span>
  )
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className="inline-flex items-center rounded-full border border-line bg-surface px-2.5 py-1 text-[12px] font-medium uppercase tracking-wide text-body">
      {PROJECT_STATUS_LABELS[status]}
    </span>
  )
}

export function CategoryBadge({ area }: { area: string }) {
  const match = areas.find((item) => item.slug === area)
  const label =
    match?.short_title ?? (area in THRUST_AREA_LABELS ? THRUST_AREA_LABELS[area as ThrustArea] : area)
  return (
    <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-1 text-[12px] font-medium uppercase tracking-wide text-primary-dark">
      {label}
    </span>
  )
}
