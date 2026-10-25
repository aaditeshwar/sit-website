import { A } from '../components/A'
import { StageBadge } from '../components/Badge'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { ResponsiveImage } from '../components/ResponsiveImage'
import { TodoBadge } from '../components/TodoBadge'
import { areas, impact } from '../lib/content'
import { asStage, breadcrumbsFor } from '../lib/document'
import { isEditorial, publicText } from '../lib/editorial'
import { STAGES } from '../lib/enums'
import { headingId, initials } from '../lib/fields'
import { Markdown } from '../lib/markdown'
import { facultyMember, facultyProfile } from '../lib/people'

type Story = (typeof impact)[number]

function optionalField(record: object, key: string): string | undefined {
  if (!(key in record)) return undefined
  const value = (record as Record<string, unknown>)[key]
  return typeof value === 'string' ? publicText(value) : undefined
}

function storySections(body: string): { id: string; label: string }[] {
  return [...body.matchAll(/^## (.+)$/gm)].map((match) => {
    const label = (match[1] ?? '').trim()
    return { id: headingId(label), label }
  })
}

function withoutBands(body: string): string {
  return body.replace(/^::(?:timeline|metrics)\s*$/gm, '')
}

export function StoryLayout({ story }: { story: Story }) {
  const stage = asStage(story.current_stage)
  const area = areas.find((item) => item.slug === story.thrust_area)
  const sections = storySections(story.body)
  const tagline = publicText(story.tagline)
  const ordered = [...impact].sort((left, right) => left.order - right.order)
  const next = ordered.length > 1 ? ordered[(ordered.findIndex((item) => item.slug === story.slug) + 1) % ordered.length] : undefined
  const links = (story.links ?? []).filter((link) => {
    const href = publicText(link.href)
    return Boolean(href) && !story.body.includes(href ?? '')
  })
  const nextStage = next ? asStage(next.current_stage) : undefined

  return (
    <article>
      <section className="relative h-[280px] overflow-hidden bg-dark md:h-[420px]">
        <ResponsiveImage src={story.hero_image} alt="" seed={story.slug} tint={stage ? STAGES[stage].color : undefined} fill priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/60 to-dark/25" aria-hidden="true" />
        <div className="relative z-10 mx-auto flex h-full max-w-page items-end px-4 pb-8 md:px-6 md:pb-10">
          <div className="max-w-xl md:max-w-[55%]">
            {stage && stage !== 'ecosystem' ? (
              <div className="mb-3">
                <StageBadge stage={stage} />
              </div>
            ) : null}
            <h1 className="font-heading text-[36px] font-semibold leading-[1.1] text-white md:text-[48px]">{story.title}</h1>
            {tagline ? (
              <p className="mt-3 text-base leading-relaxed text-white/90 md:text-[18px]">
                {tagline}
                {isEditorial(story.tagline) ? (
                  <>
                    {' '}
                    <TodoBadge />
                  </>
                ) : null}
              </p>
            ) : null}
            {area ? (
              <p className="mt-3">
                <A className="text-white underline decoration-white/40 underline-offset-2" href={area.route}>
                  {area.short_title}
                </A>
              </p>
            ) : null}
          </div>
        </div>
      </section>
      <div className="border-b border-line bg-surface">
        <div className="mx-auto max-w-page px-4 py-3 md:px-6">
          <Breadcrumbs crumbs={breadcrumbsFor(story.route, story.title)} />
        </div>
      </div>
      {sections.length ? (
        <nav aria-label="On this page" className="story-nav sticky z-30 border-b border-line bg-surface/95">
          <ul className="mx-auto flex max-w-page list-none gap-4 overflow-x-auto px-4 py-3 md:px-6">
            {sections.map((section) => (
              <li key={section.id} className="shrink-0">
                <A className="text-sm text-ink no-underline hover:text-primary" href={`#${section.id}`}>
                  {section.label}
                </A>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
      <div className="story-band bg-surface-alt">
        <Markdown body="::timeline" scope={{ impact: story }} />
      </div>
      <div className="story-band bg-dark text-white">
        <Markdown body="::metrics" scope={{ impact: story }} />
      </div>
      <div className="mx-auto max-w-page px-4 py-14 md:px-6 md:py-24">
        <Markdown body={withoutBands(story.body)} scope={{ impact: story }} />
        {story.faculty.length ? (
          <section className="mt-12">
            <h2 className="md-heading mb-4 font-heading text-[30px] font-semibold leading-tight">Faculty</h2>
            <ul className="flex list-none flex-wrap gap-6 p-0">
              {story.faculty.map((name) => {
                const person = facultyMember(name)
                const label = person?.name ?? name
                const profile = facultyProfile(name)
                return (
                  <li key={name} className="flex items-center gap-3">
                    {person?.photo ? (
                      <span className="relative inline-block h-14 w-14 overflow-hidden rounded-full bg-surface-alt">
                        <ResponsiveImage src={person.photo} alt="" seed={label} fill sizes="56px" />
                      </span>
                    ) : (
                      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-surface-alt font-heading text-ink" aria-hidden="true">
                        {initials(label)}
                      </span>
                    )}
                    {profile ? <A href={profile}>{label}</A> : <span className="text-ink">{label}</span>}
                  </li>
                )
              })}
            </ul>
          </section>
        ) : null}
        {story.partners?.length ? (
          <section className="mt-12">
            <h2 className="md-heading mb-4 font-heading text-[30px] font-semibold leading-tight">Partners</h2>
            <ul className="flex list-none flex-wrap gap-2 p-0">
              {story.partners.map((partner) => {
                const href = optionalField(partner, 'url')
                const logo = optionalField(partner, 'logo')
                const chip = (
                  <span className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-sm">
                    {logo ? <ResponsiveImage src={logo} alt="" seed={partner.name} className="h-6 w-6 object-contain" sizes="24px" /> : null}
                    <span className="text-ink">{partner.name}</span>
                    {partner.role ? <span>{partner.role}</span> : null}
                  </span>
                )
                return <li key={partner.name}>{href ? <A className="no-underline" href={href}>{chip}</A> : chip}</li>
              })}
            </ul>
          </section>
        ) : null}
        {links.length ? (
          <section className="mt-12">
            <h2 className="md-heading mb-4 font-heading text-[30px] font-semibold leading-tight">Links</h2>
            <ul className="list-disc space-y-1 pl-5">
              {links.map((link) => {
                const href = publicText(link.href)
                if (!href) return null
                return (
                  <li key={href}>
                    <A href={href}>{link.label}</A>
                  </li>
                )
              })}
            </ul>
          </section>
        ) : null}
        {next ? (
          <section className="mt-12">
            <h2 className="md-heading mb-4 font-heading text-[30px] font-semibold leading-tight">Next story</h2>
            <A
              href={next.route}
              className="group flex items-center gap-4 rounded-lg border border-line bg-surface p-3 no-underline sm:gap-5 sm:p-4"
            >
              <span className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-surface-alt sm:h-20 sm:w-32">
                <ResponsiveImage
                  src={next.card_image}
                  alt=""
                  seed={next.slug}
                  tint={nextStage ? STAGES[nextStage].color : undefined}
                  fill
                  sizes="128px"
                />
              </span>
              <span className="min-w-0">
                {nextStage && nextStage !== 'ecosystem' ? (
                  <span className="mb-2 block">
                    <StageBadge stage={nextStage} />
                  </span>
                ) : null}
                <span className="block font-heading text-lg font-semibold leading-snug text-ink group-hover:text-primary sm:text-[20px]">
                  {next.title}
                </span>
                {publicText(next.tagline) ? (
                  <span className="mt-1 block line-clamp-3 text-sm leading-relaxed">{publicText(next.tagline)}</span>
                ) : null}
              </span>
            </A>
          </section>
        ) : null}
      </div>
    </article>
  )
}
