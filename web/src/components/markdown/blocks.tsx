import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import {
  ArrowDown,
  ArrowRight,
  Award,
  Cpu,
  GraduationCap,
  Handshake,
  HeartPulse,
  Leaf,
  Shield,
  Users,
  type LucideIcon,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CategoryBadge, StageBadge, StatusBadge } from '../Badge'
import { Button } from '../Button'
import { Card } from '../Card'
import { Lightbox } from '../Lightbox'
import { ResponsiveImage } from '../ResponsiveImage'
import { TodoBadge } from '../TodoBadge'
import type { ComponentName } from '../../lib/component-names'
import { areas, documents, pages, routeManifest, site } from '../../lib/content'
import { isEditorial, publicText } from '../../lib/editorial'
import {
  FACULTY_CATEGORY_LABELS,
  PROGRAMME_LABELS,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUSES,
  SEEKING_LABELS,
  STAGES,
  STAGE_SLUGS,
  type FacultyCategory,
  type Programme,
  type ProjectStatus,
  type Seeking,
  type Stage,
} from '../../lib/enums'
import { dateLabel, formatBytes, initials, str, stringList, titleCase, yearOf } from '../../lib/fields'
import { imagesInFolder } from '../../lib/images'
import { useReadySearch, withParam } from '../../lib/live'
import { facultyLabel, facultyProfile } from '../../lib/people'
import { collection, groupRows, incentiveTiles, select, type Attrs, type Row } from '../../lib/query'
import { useMarkdownScope } from '../../lib/scope'
import { asStage } from '../../lib/document'

export type BlockProps = { attrs: Attrs; items: Record<string, unknown>[] }

const AREA_ICONS: Record<string, LucideIcon> = {
  leaf: Leaf,
  cpu: Cpu,
  'heart-pulse': HeartPulse,
  shield: Shield,
}

const INCENTIVE_ICONS = [GraduationCap, Users, Handshake, Award]

function areaLabel(slug: string): string {
  return areas.find((area) => area.slug === slug)?.short_title ?? titleCase(slug)
}

function labelValue(field: string, value: string): string {
  if ((field === 'thrust_area' || field === 'thrust_areas') && areas.some((area) => area.slug === value)) return areaLabel(value)
  if (field === 'stage' && value in STAGES) return STAGES[value as Stage].label
  if (field === 'status' && (PROJECT_STATUSES as readonly string[]).includes(value)) {
    return PROJECT_STATUS_LABELS[value as ProjectStatus]
  }
  if (field === 'seeking' && value in SEEKING_LABELS) return SEEKING_LABELS[value as Seeking]
  if (field === 'programme' && value in PROGRAMME_LABELS) return PROGRAMME_LABELS[value as Programme]
  if (field === 'category' && value in FACULTY_CATEGORY_LABELS) return FACULTY_CATEGORY_LABELS[value as FacultyCategory]
  return titleCase(value)
}

function EmptyNote({ text }: { text?: string }) {
  if (!text) return null
  return <p>{text}</p>
}

function BlockTitle({ title }: { title?: string }) {
  if (!title) return null
  return <h2 className="md-heading mb-4 font-heading text-[30px] font-semibold leading-tight">{title}</h2>
}

function Marked({ value }: { value?: string }) {
  const visible = publicText(value)
  if (!visible) return null
  return (
    <>
      {visible}
      {isEditorial(value) ? (
        <>
          {' '}
          <TodoBadge />
        </>
      ) : null}
    </>
  )
}

function Avatar({ name, photo, size }: { name: string; photo?: string; size: 'sm' | 'md' | 'lg' }) {
  const box = size === 'sm' ? 'h-10 w-10' : size === 'lg' ? 'h-40 w-40' : 'h-28 w-28'
  if (photo) {
    return (
      <div className={`relative ${box} overflow-hidden rounded-full bg-surface-alt`}>
        <ResponsiveImage src={photo} alt="" seed={name} fill sizes="160px" />
      </div>
    )
  }
  return (
    <span className={`inline-flex ${box} items-center justify-center rounded-full bg-surface-alt font-heading text-ink`} aria-hidden="true">
      {initials(name) || '–'}
    </span>
  )
}

function when(row: Row): string {
  const value = row.date ?? row.start_date
  if (value && typeof value === 'object' && 'sort' in value) return String((value as { sort: unknown }).sort)
  return ''
}

function isUpcoming(row: Row): boolean {
  const sort = when(row)
  return Boolean(sort) && sort >= site.buildDate
}

function rowYear(row: Row): string {
  return yearOf(row.date ?? row.start_date ?? row.graduation_year)
}

function rowMatches(row: Row, params: URLSearchParams, fields: string[], search: boolean): boolean {
  for (const field of fields) {
    const expected = params.get(field)
    if (!expected) continue
    if (field === 'year') {
      if (rowYear(row) !== expected) return false
      continue
    }
    const raw = row[field]
    if (Array.isArray(raw)) {
      if (!raw.map(String).includes(expected)) return false
    } else if (String(raw ?? '') !== expected) return false
  }
  if (!search) return true
  const query = params.get('q')?.trim().toLowerCase()
  if (!query) return true
  const haystack = [row.title, row.name, row.summary, row.thesis_title, row.research_interests, row.item]
    .map((value) => String(value ?? '').toLowerCase())
    .join(' ')
  return haystack.includes(query)
}

function optionsFor(field: string, rows: Row[]): { value: string; label: string }[] {
  const values = new Set<string>()
  for (const row of rows) {
    if (field === 'year') {
      const year = rowYear(row)
      if (year) values.add(year)
      continue
    }
    const raw = row[field]
    if (Array.isArray(raw)) raw.forEach((item) => values.add(String(item)))
    else if (raw != null && raw !== '') values.add(String(raw))
  }
  return [...values].sort((a, b) => a.localeCompare(b)).map((value) => ({ value, label: labelValue(field, value) }))
}

function useClientList(rows: Row[], fields: string[], search: boolean) {
  const { pathname, params, setParams, ready } = useReadySearch()
  const shown = ready ? rows.filter((row) => rowMatches(row, params, fields, search)) : rows
  return { pathname, params, setParams, ready, shown }
}

function FilterControls({
  rows,
  fields,
  search,
  pathname,
  params,
  setParams,
}: {
  rows: Row[]
  fields: string[]
  search: boolean
  pathname: string
  params: URLSearchParams
  setParams: (next: URLSearchParams, mode?: 'push' | 'replace') => void
}) {
  return (
    <div className="mb-6 space-y-4">
      {search ? (
        <form action={pathname} method="get" onSubmit={(event) => event.preventDefault()}>
          <label className="block text-sm font-medium text-ink">
            Search
            <input
              name="q"
              value={params.get('q') ?? ''}
              className="mt-1 w-full max-w-md rounded-md border border-line bg-surface px-3 py-2 text-base text-ink"
              onChange={(event) => {
                const next = new URLSearchParams(params)
                if (event.target.value) next.set('q', event.target.value)
                else next.delete('q')
                next.delete('page')
                setParams(next, 'replace')
              }}
            />
          </label>
        </form>
      ) : null}
      {fields.map((field) => {
        const options = optionsFor(field, rows)
        if (!options.length) return null
        return (
          <div key={field}>
            <p className="mb-2 text-sm font-medium text-ink">{labelValue(field, field)}</p>
            <ul className="flex list-none flex-wrap gap-2 p-0">
              {options.map((option) => {
                const pressed = params.get(field) === option.value
                return (
                  <li key={option.value}>
                    <a
                      href={withParam(pathname, params, field, option.value)}
                      aria-pressed={pressed}
                      className={`inline-flex min-h-11 items-center rounded-full border px-3 text-sm ${pressed ? 'border-primary bg-primary text-white' : 'border-line bg-surface text-ink'}`}
                      onClick={(event) => {
                        event.preventDefault()
                        const next = new URLSearchParams(params)
                        if (pressed) next.delete(field)
                        else next.set(field, option.value)
                        next.delete('page')
                        setParams(next)
                      }}
                    >
                      {option.label}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

function projectHref(row: Row): string | undefined {
  const id = str(row, 'id')
  if ((routeManifest.projects as string[]).includes(id)) return `/research/projects/${id}`
  const website = publicText(str(row, 'website'))
  if (website) return website
  return undefined
}

function ProjectList({ rows, attrs }: { rows: Row[]; attrs: Attrs }) {
  const layout = attrs.layout === 'list' ? 'list' : 'cards'
  const groups = groupRows(rows, attrs.group_by, attrs.group_order)
  const nested = Boolean(attrs.title || attrs.group_by)
  return (
    <div className="space-y-8">
      <BlockTitle title={attrs.title} />
      {groups.map((group) => (
        <section key={group.key || 'all'}>
          {group.key ? <h2 className="mb-4 font-heading text-[24px] font-semibold text-ink">{labelValue(attrs.group_by || '', group.key)}</h2> : null}
          <ul className={layout === 'list' ? 'space-y-4' : 'grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3'}>
            {group.rows.map((row) => {
              const stage = asStage(str(row, 'stage'))
              const status = (PROJECT_STATUSES as readonly string[]).includes(str(row, 'status'))
                ? (str(row, 'status') as ProjectStatus)
                : undefined
              const href = projectHref(row)
              const Title = nested ? 'h3' : 'h2'
              return (
                <li key={str(row, 'id')}>
                  <article className={layout === 'list' ? 'flex gap-4 rounded-lg border border-line p-4' : 'flex h-full flex-col rounded-lg border border-line bg-surface'}>
                    <div className={layout === 'list' ? 'relative h-24 w-32 shrink-0 overflow-hidden rounded-md bg-surface-alt' : 'relative aspect-[3/2] overflow-hidden rounded-t-lg bg-surface-alt'}>
                      <ResponsiveImage
                        src={str(row, 'image') || undefined}
                        alt=""
                        seed={str(row, 'id')}
                        tint={stage ? STAGES[stage].color : undefined}
                        fill
                        sizes={layout === 'list' ? '128px' : '(min-width: 1024px) 400px, 50vw'}
                      />
                    </div>
                    <div className={layout === 'list' ? 'min-w-0' : 'flex flex-1 flex-col gap-3 p-5'}>
                      <div className="mb-2 flex flex-wrap gap-2">
                        {stage ? <StageBadge stage={stage} /> : null}
                        {status ? <StatusBadge status={status} /> : null}
                        {str(row, 'thrust_area') ? <CategoryBadge area={str(row, 'thrust_area')} /> : null}
                      </div>
                      <Title className="font-heading text-[20px] font-semibold leading-snug text-ink">
                        {href ? (
                          <a className="text-inherit no-underline hover:text-primary" href={href}>
                            {str(row, 'title')}
                          </a>
                        ) : (
                          str(row, 'title')
                        )}
                      </Title>
                      {publicText(str(row, 'summary')) ? (
                        <p className="mt-2 text-sm">
                          <Marked value={str(row, 'summary')} />
                        </p>
                      ) : null}
                      <div className="mt-3">
                        <ul className="flex list-none flex-wrap gap-2 p-0">
                          {stringList(row.faculty).map((name) => {
                            const label = facultyLabel(name)
                            const profile = facultyProfile(name)
                            return (
                              <li key={name}>
                                {profile ? (
                                  <a className="text-sm text-primary" href={profile}>
                                    {label}
                                  </a>
                                ) : (
                                  <span className="text-sm">{label}</span>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                        <ul className="mt-2 flex list-none flex-wrap gap-2 p-0">
                          {stringList(row.seeking).map((item) => (
                            <li key={item} className="rounded-full border border-line px-2 py-0.5 text-[12px]">
                              {item in SEEKING_LABELS ? SEEKING_LABELS[item as Seeking] : item}
                            </li>
                          ))}
                        </ul>
                        <ProjectDetails row={row} />
                      </div>
                    </div>
                  </article>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

function ProjectDetails({ row }: { row: Row }) {
  if ((routeManifest.projects as string[]).includes(str(row, 'id'))) return null
  const background = publicText(str(row, 'background'))
  const partners = stringList(row.partners)
  const sponsor = publicText(str(row, 'sponsor'))
  if (!background && !partners.length && !sponsor) return null
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-ink">Details</summary>
      {background ? <p className="mt-2">{background}</p> : null}
      {partners.length ? <p className="mt-2">{partners.join(', ')}</p> : null}
      {sponsor ? <p className="mt-2">{sponsor}</p> : null}
    </details>
  )
}

function HeroCarousel({ attrs }: BlockProps) {
  const slides = select('hero-slides', { ...attrs, sort: attrs.sort || 'order:asc' })
  const [motion, setMotion] = useState<'wait' | 'ok' | 'reduce'>('wait')
  useEffect(() => {
    setMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduce' : 'ok')
  }, [])
  const plugins = useMemo(
    () => (motion === 'ok' ? [Autoplay({ delay: 7000, stopOnInteraction: false, stopOnMouseEnter: true, stopOnFocusIn: true })] : []),
    [motion],
  )
  const [ref, api] = useEmblaCarousel({ loop: slides.length > 1 }, plugins)
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (!api) return
    const onSelect = () => setIndex(api.selectedScrollSnap())
    api.on('select', onSelect)
    onSelect()
    return () => {
      api.off('select', onSelect)
    }
  }, [api])
  if (!slides.length) return null
  return (
    <div className="relative h-[70vh] max-h-[70vh] bg-dark md:h-[80vh] md:max-h-[80vh]" aria-roledescription="carousel">
      <div ref={ref} className="h-full overflow-hidden">
        <div className="flex h-full">
          {slides.map((slide, slideIndex) => (
            <div key={str(slide, 'title')} className="relative h-full min-w-0 flex-[0_0_100%]">
              <ResponsiveImage src={str(slide, 'image')} alt="" seed={str(slide, 'title')} fill priority={slideIndex === 0} sizes="100vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/55 to-dark/20" aria-hidden="true" />
              <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-page flex-col items-start px-4 pb-24 md:px-6 md:pb-36">
                <p className="text-sm uppercase tracking-wide text-white/80">{str(slide, 'kicker')}</p>
                <h2 className="mt-2 max-w-3xl font-heading text-[36px] font-semibold leading-[1.1] text-white md:text-[56px]">{str(slide, 'title')}</h2>
                <p className="mt-3 max-w-xl text-white/90">{str(slide, 'text')}</p>
                {str(slide, 'cta_link') ? (
                  <div className="mt-5">
                    <Button href={str(slide, 'cta_link')}>{str(slide, 'cta_label')}</Button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
      {slides.length > 1 ? (
        <div className="absolute inset-x-0 bottom-4 flex items-center justify-between px-4 md:bottom-16 md:px-6">
          <div className="flex gap-2">
            <button type="button" className="min-h-11 rounded-md bg-white/15 px-3 text-sm text-white" onClick={() => api?.scrollPrev()}>
              Previous
            </button>
            <button type="button" className="min-h-11 rounded-md bg-white/15 px-3 text-sm text-white" onClick={() => api?.scrollNext()}>
              Next
            </button>
          </div>
          <div className="flex gap-2">
            {slides.map((slide, slideIndex) => (
              <button
                key={str(slide, 'title')}
                type="button"
                aria-label={`Slide ${slideIndex + 1}`}
                aria-current={slideIndex === index}
                className="inline-flex h-11 w-11 items-center justify-center"
                onClick={() => api?.scrollTo(slideIndex)}
              >
                <span className={`h-3 w-3 rounded-full ${slideIndex === index ? 'bg-white' : 'bg-white/40'}`} />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function StatFigure({ value, suffix }: { value: string; suffix?: string }) {
  const finalText = `${value}${suffix ?? ''}`
  const [text, setText] = useState(finalText)
  const ref = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    const parsed = /^(\d+(?:\.\d+)?)(.*)$/.exec(value.trim())
    if (!parsed?.[1]) return
    const node = ref.current
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const target = Number(parsed[1])
    const decimals = parsed[1].includes('.') ? (parsed[1].split('.')[1]?.length ?? 0) : 0
    const rest = `${parsed[2] ?? ''}${suffix ?? ''}`
    let frame = 0
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        observer.disconnect()
        const start = performance.now()
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / 800)
          const current = target * progress
          setText(`${decimals ? current.toFixed(decimals) : String(Math.round(current))}${rest}`)
          if (progress < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      },
      { threshold: 0.5 },
    )
    observer.observe(node)
    return () => {
      observer.disconnect()
      if (frame) cancelAnimationFrame(frame)
    }
  }, [suffix, value])
  return (
    <p ref={ref} className="stat-figure font-heading text-[40px] font-semibold leading-none text-ink md:text-[56px]">
      {text}
    </p>
  )
}

function StatsStrip({ attrs }: BlockProps) {
  const rows = select(attrs.source || 'stats', attrs)
  if (!rows.length) return <EmptyNote text={attrs.empty} />
  return (
    <div className="mx-auto max-w-page px-4 py-8 text-inherit md:px-6 md:py-12">
      <BlockTitle title={attrs.title} />
      <ul className="grid list-none grid-cols-2 gap-6 p-0 md:grid-cols-3">
        {rows.map((row) => (
          <li key={str(row, 'label')}>
            <StatFigure value={str(row, 'value')} suffix={str(row, 'suffix') || undefined} />
            <p className="mt-2 text-sm opacity-80">{str(row, 'label')}</p>
            {publicText(str(row, 'note')) ? (
              <p className="text-xs opacity-70">
                <Marked value={str(row, 'note')} />
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}

function StageFlow({ items, large }: { items: Record<string, unknown>[]; large?: boolean }) {
  return (
    <ol className="flex list-none flex-col gap-2 p-0 md:flex-row md:items-stretch">
      {items.map((item, index) => {
        const stage = asStage(str(item, 'stage'))
        const href = str(item, 'link')
        const title = str(item, 'title')
        return (
          <li key={title || index} className="flex flex-1 flex-col md:flex-row md:items-center">
            <article
              className={`h-full flex-1 rounded-lg border border-line bg-surface p-5 ${large ? 'md:p-8' : ''}`}
              style={{ borderTopWidth: 4, borderTopColor: stage ? STAGES[stage].color : undefined }}
            >
              {stage ? <StageBadge stage={stage} /> : null}
              <h3 className={`mt-3 font-heading font-semibold text-ink ${large ? 'text-[28px]' : 'text-[22px]'}`}>
                {href ? (
                  <a className="text-inherit no-underline hover:text-primary" href={href}>
                    {title}
                  </a>
                ) : (
                  title
                )}
              </h3>
              <p className="mt-3">{str(item, 'text')}</p>
            </article>
            {index < items.length - 1 ? (
              <span className="flex justify-center py-1 text-body md:px-2" aria-hidden="true">
                <ArrowDown className="h-5 w-5 md:hidden" />
                <ArrowRight className="hidden h-5 w-5 md:block" />
              </span>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

function StageCards({ items }: BlockProps) {
  return <StageFlow items={items} />
}

function StageTimeline({ items }: BlockProps) {
  return <StageFlow items={items} large />
}

function StageSupport({ items }: BlockProps) {
  return (
    <ul className="grid list-none gap-6 p-0 md:grid-cols-3">
      {items.map((item) => {
        const stage = asStage(str(item, 'stage'))
        return (
          <li key={str(item, 'stage')} className="rounded-lg border border-line p-5" style={{ borderTopWidth: 4, borderTopColor: stage ? STAGES[stage].color : undefined }}>
            {stage ? <h3 className="font-heading text-[22px] font-semibold" style={{ color: STAGES[stage].color }}>{STAGES[stage].label}</h3> : null}
            <ul className="mt-3 list-disc space-y-2 pl-5">
              {stringList(item.items).map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </li>
        )
      })}
    </ul>
  )
}

function TimelineBlock({ attrs }: BlockProps) {
  const story = useMarkdownScope()?.impact
  const rows = story?.timeline ?? []
  if (!rows.length) return <EmptyNote text={attrs.empty} />
  return (
    <ol className="grid list-none gap-4 p-0 md:grid-cols-3">
      {rows.map((item) => {
        const stage = asStage(item.stage)
        return (
          <li
            key={`${item.stage}-${item.period}`}
            className="rounded-lg border border-line bg-surface p-5"
            style={stage ? { borderTopWidth: 4, borderTopColor: STAGES[stage].color } : undefined}
          >
            {stage ? <StageBadge stage={stage} /> : null}
            <p className="mt-3 font-heading text-[20px] font-semibold text-ink">{item.period}</p>
            <p className="mt-2 text-sm">{item.text}</p>
          </li>
        )
      })}
    </ol>
  )
}

function MetricsBlock({ attrs }: BlockProps) {
  const metrics = useMarkdownScope()?.impact?.metrics ?? []
  const visible = metrics.filter((metric) => publicText(metric.value))
  if (!visible.length) return <EmptyNote text={attrs.empty} />
  return (
    <ul className="grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map((metric) => (
        <li key={metric.label}>
          <p className="stat-figure font-heading text-[40px] font-semibold leading-none md:text-[56px]">
            <Marked value={metric.value} />
          </p>
          <p className="mt-2 text-sm opacity-80">{metric.label}</p>
        </li>
      ))}
    </ul>
  )
}

function ImpactCards({ attrs }: BlockProps) {
  const scope = useMarkdownScope()
  const rows = select('impact', { ...attrs, sort: attrs.sort || 'order:asc' }, scope)
  if (!rows.length) return <EmptyNote text={attrs.empty} />
  const wide = attrs.layout === 'large'
  return (
    <ul className={`grid list-none gap-6 p-0 sm:grid-cols-2 ${wide ? '' : 'lg:grid-cols-3'}`}>
      {rows.map((row) => {
        const stage = asStage(str(row, 'current_stage'))
        return (
          <li key={str(row, 'slug')}>
            <Card
              href={str(row, 'route')}
              title={str(row, 'title')}
              text={<Marked value={str(row, 'tagline')} />}
              image={str(row, 'card_image') || undefined}
              seed={str(row, 'slug')}
              tint={stage ? STAGES[stage].color : undefined}
              badges={stage ? <StageBadge stage={stage} /> : undefined}
            />
          </li>
        )
      })}
    </ul>
  )
}

function StagePipeline({ attrs }: BlockProps) {
  const rows = select(attrs.source || 'projects', attrs)
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {STAGE_SLUGS.map((stage) => {
        const matching = rows.filter((row) => str(row, 'stage') === stage)
        const top = [...matching].sort((left, right) => Number(Boolean(right.featured)) - Number(Boolean(left.featured)) || str(left, 'title').localeCompare(str(right, 'title'))).slice(0, 5)
        return (
          <section key={stage} className="rounded-lg border border-line p-5" style={{ borderTopWidth: 4, borderTopColor: STAGES[stage].color }}>
            <h3 className="font-heading text-[22px] font-semibold text-ink">{STAGES[stage].label}</h3>
            <p className="stat-figure mt-2 font-heading text-[40px] font-semibold text-ink">{matching.length}</p>
            <ul className="mt-4 space-y-2">
              {top.map((row) => {
                const href = projectHref(row)
                const title = str(row, 'title')
                return <li key={str(row, 'id')}>{href ? <a href={href}>{title}</a> : title}</li>
              })}
            </ul>
            <a className="mt-4 inline-block text-sm text-primary" href={`/research/projects?stage=${stage}`}>
              View all
            </a>
          </section>
        )
      })}
    </div>
  )
}

function ThrustTiles({ attrs }: BlockProps) {
  const rows = select('areas', { sort: 'order:asc' })
  const summary = attrs.show_summary === 'true'
  const subthemes = attrs.show_subthemes === 'true' || attrs.compact === 'true'
  if (attrs.compact === 'true') {
    return (
      <ul className="grid list-none gap-4 p-0 sm:grid-cols-2">
        {rows.map((row) => {
          const Icon = AREA_ICONS[str(row, 'icon')] ?? Leaf
          return (
            <li key={str(row, 'slug')}>
              <article className="flex h-full gap-3 rounded-lg border border-line p-3">
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-surface-alt">
                  <ResponsiveImage src={str(row, 'card_image') || undefined} alt="" seed={str(row, 'slug')} fill sizes="96px" />
                </div>
                <div className="min-w-0 flex-1">
                  <Icon aria-hidden="true" className="h-5 w-5 text-primary" />
                  <h3 className="font-heading text-lg font-semibold text-ink">
                    <a className="text-inherit no-underline hover:text-primary" href={str(row, 'route')}>
                      {str(row, 'short_title') || str(row, 'title')}
                    </a>
                  </h3>
                  <ul className="mt-1 list-disc pl-5 text-sm">
                    {stringList(row.subthemes).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </article>
            </li>
          )
        })}
      </ul>
    )
  }
  return (
    <ul className="grid list-none gap-6 p-0 sm:grid-cols-2">
      {rows.map((row) => {
        const Icon = AREA_ICONS[str(row, 'icon')] ?? Leaf
        return (
          <li key={str(row, 'slug')}>
            <article className="flex h-full flex-col overflow-hidden rounded-lg border border-line">
              <div className="relative aspect-[3/2] bg-surface-alt">
                <ResponsiveImage src={str(row, 'card_image') || undefined} alt="" seed={str(row, 'slug')} fill sizes="(min-width: 640px) 50vw, 100vw" />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <Icon aria-hidden="true" className="h-6 w-6 text-primary" />
                <h3 className="font-heading text-[22px] font-semibold text-ink">
                  <a className="text-inherit no-underline hover:text-primary" href={str(row, 'route')}>
                    {str(row, 'short_title') || str(row, 'title')}
                  </a>
                </h3>
                {summary ? <p><Marked value={str(row, 'summary')} /></p> : null}
                {subthemes ? (
                  <ul className="list-disc pl-5">
                    {stringList(row.subthemes).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          </li>
        )
      })}
    </ul>
  )
}

function ProjectsBlock({ attrs }: BlockProps) {
  const rows = select(attrs.source || 'projects', attrs, useMarkdownScope())
  if (!rows.length) return <EmptyNote text={attrs.empty} />
  return <ProjectList rows={rows} attrs={attrs} />
}

function ProjectExplorer({ attrs }: BlockProps) {
  const rows = select(attrs.source || 'projects', attrs)
  const fields = (attrs.filters || '').split(',').map((part) => part.trim()).filter(Boolean)
  const { pathname, params, setParams, shown } = useClientList(rows, fields, true)
  return (
    <div>
      <FilterControls rows={rows} fields={fields} search pathname={pathname} params={params} setParams={setParams} />
      <p className="mb-4 text-sm" aria-live="polite">
        {shown.length} projects
      </p>
      <ProjectList rows={shown} attrs={attrs.layout ? { layout: attrs.layout } : {}} />
    </div>
  )
}

function LabsBlock({ attrs }: BlockProps) {
  const rows = select('labs', attrs)
  if (!rows.length) return <EmptyNote text={attrs.empty} />
  const groups = groupRows(rows, attrs.group_by, attrs.group_order)
  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.key || 'labs'}>
          {group.key ? <h2 className="mb-4 font-heading text-[24px] font-semibold text-ink">{labelValue(attrs.group_by || 'thrust_area', group.key)}</h2> : null}
          <ul className="grid list-none gap-4 p-0">
            {group.rows.map((row) => {
              const name = str(row, 'name')
              const website = publicText(str(row, 'website'))
              return (
                <li key={name} className="flex gap-4 rounded-lg border border-line p-4">
                  {str(row, 'logo') ? (
                    <ResponsiveImage src={str(row, 'logo')} alt="" seed={name} className="h-14 w-14 object-contain" sizes="56px" />
                  ) : (
                    <Avatar name={name} size="sm" />
                  )}
                  <div>
                    <h3 className="font-heading text-[20px] font-semibold text-ink">{website ? <a href={website}>{name}</a> : name}</h3>
                    <p className="mt-1 text-sm">{str(row, 'summary')}</p>
                    {stringList(row.faculty).length ? <p className="mt-2 text-sm">{stringList(row.faculty).join(', ')}</p> : null}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

function PersonMeta({ row }: { row: Row }) {
  const text =
    str(row, 'role') ||
    str(row, 'designation') ||
    (str(row, 'category') ? labelValue('category', str(row, 'category')) : '') ||
    (str(row, 'programme') ? labelValue('programme', str(row, 'programme')) : '')
  if (!text) return null
  return <p className="text-sm">{text}</p>
}

function thrustDots(areasOnPerson: string[]): ReactNode {
  if (!areasOnPerson.length) return null
  return (
    <ul className="flex list-none gap-1 p-0">
      {areasOnPerson.map((slug) => (
        <li key={slug}>
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" title={areaLabel(slug)}>
            <span className="sr-only">{areaLabel(slug)}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

function PersonName({ name, profile }: { name: string; profile?: string }) {
  const href = publicText(profile) || facultyProfile(name)
  if (!href) return <span>{name}</span>
  return (
    <a className="text-inherit no-underline hover:text-primary" href={href}>
      {name}
    </a>
  )
}

function PeopleGrid({ rows, layout }: { rows: Row[]; layout: string }) {
  if (layout === 'compact') {
    return (
      <ul className="grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((row) => (
          <li key={str(row, 'name')} className="flex items-center gap-3">
            <Avatar name={str(row, 'name')} photo={str(row, 'photo') || undefined} size="sm" />
            <PersonName name={str(row, 'name')} profile={str(row, 'profile_url')} />
          </li>
        ))}
      </ul>
    )
  }
  if (layout === 'feature') {
    return (
      <ul className="grid list-none gap-8 p-0">
        {rows.map((row) => (
          <li key={str(row, 'name')} className="flex flex-col gap-4 sm:flex-row">
            <Avatar name={str(row, 'name')} photo={str(row, 'photo') || undefined} size="lg" />
            <div>
              <h3 className="font-heading text-[28px] font-semibold text-ink">
                <PersonName name={str(row, 'name')} profile={str(row, 'profile_url')} />
              </h3>
              {str(row, 'role') ? <p>{str(row, 'role')}</p> : null}
              {str(row, 'affiliation') ? <p className="text-sm">{str(row, 'affiliation')}</p> : null}
              {str(row, 'research_interests') ? <p className="mt-2 max-w-prose">{str(row, 'research_interests')}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    )
  }
  return (
    <ul className="grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-4">
      {rows.map((row) => {
        const name = str(row, 'name')
        const photo = str(row, 'photo')
        return (
          <li key={name} className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface">
            <div className="relative aspect-square bg-surface-alt">
              {photo ? (
                <ResponsiveImage src={photo} alt="" seed={name} fill sizes="(min-width: 1024px) 320px, 50vw" />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center font-heading text-[40px] text-ink" aria-hidden="true">
                  {initials(name)}
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1 p-4">
              <h3 className="font-heading text-[20px] font-semibold text-ink">
                <PersonName name={name} profile={str(row, 'profile_url')} />
              </h3>
              <PersonMeta row={row} />
              {str(row, 'affiliation') ? <p className="text-sm">{str(row, 'affiliation')}</p> : null}
              {str(row, 'research_interests') ? <p className="mt-1 line-clamp-2 text-sm">{str(row, 'research_interests')}</p> : null}
              <div className="mt-auto pt-3">{thrustDots(stringList(row.thrust_areas))}</div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function PeopleTable({ rows, columns }: { rows: Row[]; columns: string[] }) {
  const [sort, setSort] = useState<{ column: string; dir: number } | null>(null)
  const ordered = sort
    ? [...rows].sort((left, right) => {
        const compared = str(left, sort.column).localeCompare(str(right, sort.column), undefined, { numeric: true })
        return compared * sort.dir
      })
    : rows
  return (
    <div className="markdown-table overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} className="border-b border-line px-3 py-2" aria-sort={sort?.column === column ? (sort.dir < 0 ? 'descending' : 'ascending') : 'none'}>
                <button
                  type="button"
                  className="font-medium text-ink"
                  onClick={() => setSort((current) => ({ column, dir: current?.column === column && current.dir === 1 ? -1 : 1 }))}
                >
                  {titleCase(column)}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ordered.map((row) => (
            <tr key={`${str(row, 'name')}-${str(row, 'graduation_year')}`}>
              {columns.map((column) => (
                <td key={column} className="border-b border-line px-3 py-2 align-top">
                  {column === 'name' ? <PersonName name={str(row, 'name')} profile={str(row, 'profile_url')} /> : str(row, column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PeopleBlock({ attrs }: BlockProps) {
  const rows = select(attrs.source, attrs, useMarkdownScope())
  const fields = (attrs.filters || '').split(',').map((part) => part.trim()).filter(Boolean)
  const search = attrs.search === 'true'
  const { pathname, params, setParams, shown } = useClientList(rows, fields, search)
  if (!rows.length) return <EmptyNote text={attrs.empty} />
  const layout = attrs.layout || 'grid'
  const groups = groupRows(shown, attrs.group_by, attrs.group_order)
  const columns = (attrs.columns || 'name').split(',').map((part) => part.trim()).filter(Boolean)
  return (
    <div>
      <FilterControls rows={rows} fields={fields} search={search} pathname={pathname} params={params} setParams={setParams} />
      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.key || 'people'}>
            {group.key ? <h2 className="mb-4 font-heading text-[24px] font-semibold text-ink">{labelValue(attrs.group_by || '', group.key)}</h2> : null}
            {layout === 'table' ? <PeopleTable rows={group.rows} columns={columns} /> : <PeopleGrid rows={group.rows} layout={layout} />}
          </section>
        ))}
      </div>
    </div>
  )
}

function AlumniStories({ attrs }: BlockProps) {
  const rows = select(attrs.source || 'alumni', attrs).filter((row) => publicText(str(row, 'story_md')))
  if (!rows.length) return <EmptyNote text={attrs.empty} />
  return (
    <ul className="grid list-none gap-6 p-0 md:grid-cols-2">
      {rows.map((row) => (
        <li key={str(row, 'name')} className="rounded-lg border border-line p-5">
          <div className="max-w-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{str(row, 'story_md')}</ReactMarkdown>
          </div>
          <footer className="mt-4 flex items-center gap-3">
            <Avatar name={str(row, 'name')} photo={str(row, 'photo') || undefined} size="sm" />
            <p>
              <span className="font-medium text-ink">{str(row, 'name')}</span>
              {str(row, 'graduation_year') ? <span className="block text-sm">{str(row, 'graduation_year')}</span> : null}
              {publicText(str(row, 'current_position')) ? <span className="block text-sm">{str(row, 'current_position')}</span> : null}
            </p>
          </footer>
        </li>
      ))}
    </ul>
  )
}

function newsHref(row: Row): string | undefined {
  const id = str(row, 'id')
  if ((routeManifest.news as string[]).includes(id)) return `/news/${id}`
  return publicText(str(row, 'link')) || publicText(str(row, 'registration_url'))
}

function FeedCard({ row }: { row: Row }) {
  const href = newsHref(row)
  const tag = str(row, 'category') || str(row, 'type')
  const date = dateLabel(row.date ?? row.start_date)
  return (
    <article className="rounded-lg border border-line p-4">
      <p className="text-sm">
        {date}
        {tag ? ` · ${titleCase(tag)}` : ''}
      </p>
      <h3 className="mt-1 font-heading text-[20px] font-semibold text-ink">
        {href ? <a href={href}>{str(row, 'title')}</a> : str(row, 'title')}
      </h3>
      {publicText(str(row, 'summary')) ? (
        <p className="mt-2 text-sm">
          <Marked value={str(row, 'summary')} />
        </p>
      ) : null}
    </article>
  )
}

function NewsFeed({ attrs }: BlockProps) {
  const include = (attrs.include || 'news,events').split(',').map((part) => part.trim())
  const events = include.includes('events') ? collection('events') : []
  const upcoming = events.filter(isUpcoming).sort((left, right) => when(left).localeCompare(when(right)))
  const rest = [
    ...(include.includes('news') ? collection('news') : []),
    ...events.filter((row) => !isUpcoming(row)),
  ].sort((left, right) => when(right).localeCompare(when(left)))
  const limit = Number(attrs.limit)
  const rows = [...upcoming, ...rest].slice(0, limit > 0 ? limit : undefined)
  if (!rows.length) return <EmptyNote text={attrs.empty} />
  return (
    <ul className="grid list-none gap-4 p-0 md:grid-cols-2">
      {rows.map((row) => (
        <li key={`${str(row, 'id')}-${str(row, 'title')}`}>
          <FeedCard row={row} />
        </li>
      ))}
    </ul>
  )
}

function NewsList({ attrs }: BlockProps) {
  const rows = select(attrs.source || 'news', { ...attrs, sort: attrs.sort || 'date:desc' })
  const fields = (attrs.filters || '').split(',').map((part) => part.trim()).filter(Boolean)
  const { pathname, params, setParams, ready, shown } = useClientList(rows, fields, true)
  const pageSize = Number(attrs.page_size) || shown.length || 1
  const page = Math.max(1, Number(params.get('page') || '1'))
  const pageCount = Math.max(1, Math.ceil(shown.length / pageSize))
  const visible = ready ? shown.slice((page - 1) * pageSize, page * pageSize) : shown
  return (
    <div>
      <FilterControls rows={rows} fields={fields} search pathname={pathname} params={params} setParams={setParams} />
      <ul className="space-y-4">
        {visible.map((row) => (
          <li key={str(row, 'id')}>
            <FeedCard row={row} />
          </li>
        ))}
      </ul>
      {ready && pageCount > 1 ? (
        <nav className="mt-6 flex flex-wrap gap-2" aria-label="News pages">
          {Array.from({ length: pageCount }, (_, index) => {
            const number = index + 1
            const next = new URLSearchParams(params)
            if (number === 1) next.delete('page')
            else next.set('page', String(number))
            const query = next.toString()
            return (
              <a
                key={number}
                href={query ? `${pathname}?${query}` : pathname}
                aria-current={number === page ? 'page' : undefined}
                className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border px-3 ${number === page ? 'border-primary bg-primary text-white' : 'border-line'}`}
                onClick={(event) => {
                  event.preventDefault()
                  setParams(next)
                }}
              >
                {number}
              </a>
            )
          })}
        </nav>
      ) : null}
    </div>
  )
}

function DateBlock({ value }: { value: unknown }) {
  const label = dateLabel(value)
  const full = /^(\d{1,2})\s+(\S+)\s+(\d{4})$/.exec(label)
  if (!full) return <p className="text-sm font-medium text-ink">{label}</p>
  return (
    <p className="min-w-14 text-center">
      <span className="block font-heading text-[28px] font-semibold leading-none text-ink">{full[1]}</span>
      <span className="text-xs uppercase tracking-wide">{full[2]}</span>
    </p>
  )
}

function EventsBlock({ attrs }: BlockProps) {
  const rows = select(attrs.source || 'events', attrs)
  const fields = (attrs.filters || '').split(',').map((part) => part.trim()).filter(Boolean)
  const { pathname, params, setParams, shown } = useClientList(rows, fields, false)
  if (!rows.length) return <EmptyNote text={attrs.empty} />
  const groups =
    attrs.upcoming_first === 'true'
      ? [
          { key: 'Upcoming', rows: shown.filter(isUpcoming).sort((a, b) => when(a).localeCompare(when(b))) },
          { key: 'Past', rows: shown.filter((row) => !isUpcoming(row)).sort((a, b) => when(b).localeCompare(when(a))) },
        ].filter((group) => group.rows.length)
      : [{ key: '', rows: shown }]
  return (
    <div>
      {fields.length ? <FilterControls rows={rows} fields={fields} search={false} pathname={pathname} params={params} setParams={setParams} /> : null}
      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.key || 'events'}>
            {group.key ? <h2 className="mb-4 font-heading text-[24px] font-semibold text-ink">{group.key}</h2> : null}
            <ul className="space-y-4">
              {group.rows.map((row) => {
                const href = publicText(str(row, 'registration_url'))
                return (
                  <li key={str(row, 'id')} className="flex gap-4 rounded-lg border border-line p-4">
                    <DateBlock value={row.start_date} />
                    <div>
                      <p className="text-sm">
                        <span className="rounded-full border border-line px-2 py-0.5 text-[12px]">{titleCase(str(row, 'type'))}</span>
                      </p>
                      <h3 className="font-heading text-[20px] font-semibold text-ink">{href ? <a href={href}>{str(row, 'title')}</a> : str(row, 'title')}</h3>
                      {str(row, 'venue') ? <p className="text-sm">{str(row, 'venue')}</p> : null}
                      <p className="mt-1 text-sm">{str(row, 'summary')}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

function OpeningsBlock({ attrs }: BlockProps) {
  const rows = select(attrs.source || 'openings', attrs, useMarkdownScope())
  if (!rows.length) return <EmptyNote text={attrs.empty} />
  return (
    <ul className="grid list-none gap-4 p-0">
      {rows.map((row) => {
        const apply = publicText(str(row, 'apply_url'))
        return (
          <li key={str(row, 'id')} className="rounded-lg border border-line p-5">
            <p className="text-sm">{titleCase(str(row, 'type'))}</p>
            <h3 className="font-heading text-[22px] font-semibold text-ink">{str(row, 'title')}</h3>
            <p className="mt-2">{str(row, 'summary')}</p>
            <p className="mt-2 text-sm">{dateLabel(row.deadline) || 'Rolling'}</p>
            {str(row, 'contact') ? <p className="text-sm">{str(row, 'contact')}</p> : null}
            {apply ? (
              <div className="mt-4">
                <Button href={apply}>Apply</Button>
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

function pageTitle(route: string): string {
  return pages.find((page) => page.route === route)?.title ?? route
}

function Opportunities({ attrs }: BlockProps) {
  const limit = Number(attrs.limit) || 6
  const columns = [
    { title: pageTitle('/academics/admissions'), href: '/academics/admissions', rows: select('admissions', { status: attrs.admissions || 'current' }).slice(0, limit) },
    { title: pageTitle('/openings'), href: '/openings', rows: select('openings', { status: attrs.openings || 'open' }).slice(0, limit) },
    {
      title: pageTitle('/research/projects'),
      href: `/research/projects?status=${attrs.projects || 'open-for-students'}`,
      rows: select('projects', { status: attrs.projects || 'open-for-students' }).slice(0, limit),
    },
  ]
  if (columns.every((column) => column.rows.length === 0)) return <EmptyNote text={attrs.empty} />
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {columns.map((column) => (
        <section key={column.href}>
          <h3 className="font-heading text-[22px] font-semibold text-ink">
            <a href={column.href}>{column.title}</a>
          </h3>
          <ul className="mt-3 space-y-3">
            {column.rows.map((row) => {
              const label = str(row, 'title') || str(row, 'item')
              const href = str(row, 'route') || publicText(str(row, 'link')) || publicText(str(row, 'apply_url')) || projectHref(row)
              return <li key={label}>{href ? <a href={href}>{label}</a> : label}</li>
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

function AdmissionsPanel({ attrs }: BlockProps) {
  const rows = select('admissions', attrs)
  if (!rows.length) return <EmptyNote text={attrs.empty} />
  const cycles = new Map<string, Row[]>()
  for (const row of rows) {
    const key = str(row, 'cycle')
    const list = cycles.get(key) ?? []
    list.push(row)
    cycles.set(key, list)
  }
  const prominent = attrs.show_dates === 'true'
  return (
    <div className="space-y-6">
      {[...cycles.entries()].map(([cycle, items]) => (
        <section key={cycle} className="rounded-lg border border-line p-5">
          <h3 className="font-heading text-[22px] font-semibold text-ink">{cycle}</h3>
          <ul className="mt-4 space-y-4">
            {items.map((row) => {
              const href = publicText(str(row, 'link'))
              const date = dateLabel(row.date)
              return (
                <li key={`${cycle}-${str(row, 'item')}`} className={prominent && date ? 'grid gap-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center' : undefined}>
                  {date ? <p className={prominent ? 'font-heading text-[24px] font-semibold leading-tight text-ink' : 'text-sm'}>{date}</p> : null}
                  {href ? <a href={href}>{str(row, 'item')}</a> : <p>{str(row, 'item')}</p>}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

function IncentiveHighlights({ attrs }: BlockProps) {
  const tiles = incentiveTiles()
  if (!tiles.length) return <EmptyNote text={attrs.empty} />
  return (
    <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((tile, index) => {
        const Icon = INCENTIVE_ICONS[index] ?? Award
        return (
          <li key={tile.text}>
            <a href={tile.href} className="flex h-full flex-col gap-3 rounded-lg border border-line p-4 text-inherit no-underline hover:border-primary">
              <Icon aria-hidden="true" className="h-6 w-6 text-primary" />
              <span>{tile.text}</span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}

function AudienceCards({ items }: BlockProps) {
  return (
    <ul className="grid list-none gap-6 p-0 md:grid-cols-3">
      {items.map((item) => (
        <li key={str(item, 'title')}>
          <article className="h-full rounded-lg border border-line p-6">
            <h2 className="font-heading text-[24px] font-semibold text-ink">
              <a href={str(item, 'href')}>{str(item, 'title')}</a>
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5">
              {stringList(item.points).map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        </li>
      ))}
    </ul>
  )
}

function ProgrammeCards({ items }: BlockProps) {
  return (
    <ul className="grid list-none gap-6 p-0 md:grid-cols-2">
      {items.map((item) => (
        <li key={str(item, 'title')}>
          <article className="h-full rounded-lg border border-line p-6">
            <h2 className="font-heading text-[24px] font-semibold text-ink">
              <a href={str(item, 'href')}>{str(item, 'title')}</a>
            </h2>
            <p className="mt-3">{str(item, 'text')}</p>
            <ul className="mt-4 flex list-none flex-wrap gap-2 p-0">
              {stringList(item.tags).map((tag) => (
                <li key={tag} className="rounded-full bg-primary-50 px-2 py-1 text-[12px] text-primary-dark">
                  {tag}
                </li>
              ))}
            </ul>
          </article>
        </li>
      ))}
    </ul>
  )
}

function KeyFacts({ items }: BlockProps) {
  return (
    <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {items.map((item) => (
        <div key={str(item, 'label')} className="rounded-lg border border-line p-4">
          <dd className="font-heading text-[22px] font-semibold text-ink">{str(item, 'value')}</dd>
          <dt className="mt-1 text-sm">{str(item, 'label')}</dt>
        </div>
      ))}
    </dl>
  )
}

function FaqBlock({ items }: BlockProps) {
  const visible = items
    .map((item) => ({ q: str(item, 'q'), a: str(item, 'a') }))
    .filter((item) => item.q && publicText(item.a))
  if (!visible.length) return null
  const json = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: visible.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: publicText(item.a) },
    })),
  }).replace(/</g, '\\u003c')
  return (
    <div className="space-y-3">
      {visible.map((item) => (
        <details key={item.q} className="rounded-lg border border-line px-4 py-3">
          <summary className="cursor-pointer font-medium text-ink">{item.q}</summary>
          <p className="mt-3 max-w-prose">
            <Marked value={item.a} />
          </p>
        </details>
      ))}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
    </div>
  )
}

function PartnerOptions({ items }: BlockProps) {
  return (
    <ul className="grid list-none gap-4 p-0 md:grid-cols-3">
      {items.map((item) => (
        <li key={str(item, 'title')}>
          <article className="h-full rounded-lg border border-line p-5">
            <h3 className="font-heading text-[20px] font-semibold text-ink">
              <a href={str(item, 'href')}>{str(item, 'title')}</a>
            </h3>
            <p className="mt-2">{str(item, 'text')}</p>
          </article>
        </li>
      ))}
    </ul>
  )
}

function PeopleTiles({ items }: BlockProps) {
  return (
    <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const count = select(str(item, 'count_source'), str(item, 'count_filter') ? { filter: str(item, 'count_filter') } : {}).length
        return (
          <li key={str(item, 'title')}>
            <a href={str(item, 'href')} className="flex h-full flex-col gap-3 rounded-lg border border-line p-4 text-inherit no-underline hover:border-primary">
              <ResponsiveImage src={str(item, 'icon')} alt="" seed={str(item, 'title')} className="h-12 w-12 object-contain" sizes="48px" />
              <span className="font-heading text-[20px] font-semibold text-ink">{str(item, 'title')}</span>
              <span className="font-heading text-[28px] text-primary">{count}</span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}

function DocumentsBlock({ items }: BlockProps) {
  const visible = items.filter((item) => {
    const file = str(item, 'file')
    const known = documents.some((entry) => entry.path === file.replace(/^\//, ''))
    if (known) return true
    return Boolean(file) ? false : import.meta.env.DEV || import.meta.env.VITE_SHOW_PLACEHOLDERS === 'true'
  })
  if (!visible.length) return null
  return (
    <ul className="space-y-4">
      {visible.map((item) => {
        const file = str(item, 'file')
        const known = documents.find((entry) => entry.path === file.replace(/^\//, ''))
        const ext = file.split('.').pop()?.toUpperCase()
        return (
          <li key={str(item, 'title')} className="flex gap-4 rounded-lg border border-line p-4">
            {str(item, 'thumbnail') ? (
              <ResponsiveImage src={str(item, 'thumbnail')} alt="" seed={str(item, 'title')} className="h-20 w-16 object-cover" sizes="64px" />
            ) : null}
            <div>
              {known ? (
                <a href={`/${file.replace(/^\//, '')}`}>{str(item, 'title')}</a>
              ) : (
                <p className="font-medium text-ink">{str(item, 'title')}</p>
              )}
              {known ? (
                <p className="text-sm">
                  {ext} · {formatBytes(known.bytes)}
                </p>
              ) : null}
              {str(item, 'note') ? <p className="text-sm">{str(item, 'note')}</p> : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function ContactRoutes({ items }: BlockProps) {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={str(item, 'label')}>
          <a className="font-medium" href={str(item, 'href')}>
            {str(item, 'label')}
          </a>
          <p>{str(item, 'text')}</p>
        </li>
      ))}
    </ul>
  )
}

function CtaBand({ items }: BlockProps) {
  return (
    <div className="bg-dark text-white">
      <div className="mx-auto flex max-w-page flex-col items-start gap-3 px-4 py-14 md:flex-row md:px-6 md:py-20">
        {items.map((item, index) => (
          <Button key={str(item, 'href')} href={str(item, 'href')} variant={index === 0 ? 'primary' : 'inverse'}>
            {str(item, 'label')}
          </Button>
        ))}
      </div>
    </div>
  )
}

function PartnerLogos({ attrs }: BlockProps) {
  const rows = select(attrs.source || 'partners', attrs)
  if (!rows.length) return null
  return (
    <ul className="flex list-none flex-wrap items-center gap-8 p-0">
      {rows.map((row) => {
        const name = str(row, 'name')
        const href = publicText(str(row, 'website'))
        const logo = str(row, 'logo')
        const mark = logo ? (
          <ResponsiveImage src={logo} alt={name} seed={name} className="h-12 w-auto object-contain grayscale hover:grayscale-0" sizes="160px" />
        ) : (
          <span>{name}</span>
        )
        return <li key={name}>{href ? <a href={href}>{mark}</a> : mark}</li>
      })}
    </ul>
  )
}

function CoursesBlock({ attrs }: BlockProps) {
  const rows = select(attrs.source || 'courses', attrs)
  if (!rows.length) return <EmptyNote text={attrs.empty} />
  if (attrs.layout === 'accordion') {
    return (
      <div className="space-y-3">
        {rows.map((row) => (
          <details key={str(row, 'code')} className="rounded-lg border border-line px-4 py-3">
            <summary className="cursor-pointer font-medium text-ink">
              {str(row, 'code')} {str(row, 'title')}
            </summary>
            <p className="mt-3 text-sm">{str(row, 'credits')} credits</p>
            <p className="mt-2 max-w-prose">{str(row, 'description')}</p>
          </details>
        ))}
      </div>
    )
  }
  return (
    <ul className="grid list-none gap-4 p-0 md:grid-cols-2">
      {rows.map((row) => (
        <li key={str(row, 'code')} className="rounded-lg border border-line p-4">
          <h3 className="font-heading text-[20px] font-semibold text-ink">
            {str(row, 'code')} {str(row, 'title')}
          </h3>
          <p className="text-sm">{str(row, 'credits')} credits</p>
          <p className="mt-2 text-sm">{str(row, 'description')}</p>
        </li>
      ))}
    </ul>
  )
}

function GalleryBlock({ attrs }: BlockProps) {
  const files = imagesInFolder(attrs.folder || '')
  const [open, setOpen] = useState<string | undefined>(undefined)
  if (!files.length) return <EmptyNote text={attrs.empty} />
  return (
    <>
      <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {files.map((file) => (
          <li key={file} className="mb-4 break-inside-avoid">
            <button type="button" className="block w-full" onClick={() => setOpen(file)} aria-label="Enlarge">
              <ResponsiveImage src={file} alt="" seed={file} className="h-auto w-full rounded-lg" sizes="(min-width: 1024px) 33vw, 50vw" />
            </button>
          </li>
        ))}
      </ul>
      <Lightbox open={Boolean(open)} onClose={() => setOpen(undefined)} src={open} alt="" />
    </>
  )
}

function ContactCard({ attrs }: BlockProps) {
  const email = publicText(site.contact.email)
  return (
    <address className="not-italic">
      <p className="whitespace-pre-line">{attrs.source ? site.contact.address : site.contact.address}</p>
      <p className="mt-3">
        <a href={`tel:${site.contact.phone.replace(/[^\d+]/g, '')}`}>{site.contact.phone}</a>
      </p>
      {email ? (
        <p className="mt-1">
          <a href={`mailto:${email}`}>{email}</a> {isEditorial(site.contact.email) ? <TodoBadge /> : null}
        </p>
      ) : null}
    </address>
  )
}

function MapBlock({ attrs }: BlockProps) {
  const [loaded, setLoaded] = useState(false)
  const src = attrs.source?.endsWith('map_embed') || !attrs.source ? site.contact.map_embed : ''
  if (!src) return null
  if (!loaded) {
    return (
      <button type="button" className="min-h-11 rounded-md border border-line px-4 py-2" onClick={() => setLoaded(true)}>
        Show map
      </button>
    )
  }
  return <iframe title="Map" src={src} className="h-80 w-full rounded-lg border border-line" loading="lazy" referrerPolicy="no-referrer" />
}

export const BLOCKS: Record<ComponentName, (props: BlockProps) => ReactNode> = {
  'hero-carousel': HeroCarousel,
  'stats-strip': StatsStrip,
  'stage-cards': StageCards,
  'stage-timeline': StageTimeline,
  'stage-support': StageSupport,
  timeline: TimelineBlock,
  metrics: MetricsBlock,
  'impact-cards': ImpactCards,
  'stage-pipeline': StagePipeline,
  'thrust-area-tiles': ThrustTiles,
  projects: ProjectsBlock,
  'project-explorer': ProjectExplorer,
  labs: LabsBlock,
  people: PeopleBlock,
  'alumni-stories': AlumniStories,
  'news-feed': NewsFeed,
  'news-list': NewsList,
  events: EventsBlock,
  openings: OpeningsBlock,
  'opportunities-band': Opportunities,
  'admissions-panel': AdmissionsPanel,
  'incentive-highlights': IncentiveHighlights,
  'audience-cards': AudienceCards,
  'programme-cards': ProgrammeCards,
  'key-facts': KeyFacts,
  faq: FaqBlock,
  'partner-options': PartnerOptions,
  'people-tiles': PeopleTiles,
  documents: DocumentsBlock,
  'contact-routes': ContactRoutes,
  'cta-band': CtaBand,
  'partner-logos': PartnerLogos,
  courses: CoursesBlock,
  gallery: GalleryBlock,
  'contact-card': ContactCard,
  map: MapBlock,
}
