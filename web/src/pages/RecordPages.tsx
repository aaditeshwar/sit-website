import { A } from '../components/A'
import { useParams } from 'react-router-dom'
import { CategoryBadge, StageBadge, StatusBadge } from '../components/Badge'
import { Button } from '../components/Button'
import { areas, impact, news, projects } from '../lib/content'
import { asStage } from '../lib/document'
import { publicText } from '../lib/editorial'
import { PROJECT_STATUSES, SEEKING_LABELS, type ProjectStatus, type Seeking } from '../lib/enums'
import { dateLabel, str, stringList, titleCase } from '../lib/fields'
import { Markdown } from '../lib/markdown'
import { facultyLabel, facultyProfile } from '../lib/people'
import { StoryLayout } from '../layouts/StoryLayout'
import { NotFoundPage } from './NotFoundPage'

function asStatus(value: string): ProjectStatus | undefined {
  return (PROJECT_STATUSES as readonly string[]).includes(value) ? (value as ProjectStatus) : undefined
}

export function ImpactPage() {
  const { slug } = useParams()
  const story = impact.find((item) => item.slug === slug)
  if (!story) return <NotFoundPage />
  return <StoryLayout story={story} />
}

export function AreaPage() {
  const { area: slug } = useParams()
  const area = areas.find((item) => item.slug === slug)
  if (!area) return <NotFoundPage />
  return (
    <div>
      <ul className="mb-8 flex list-none flex-wrap gap-2 p-0" aria-label="Subthemes">
        {area.subthemes.map((theme) => (
          <li key={theme} className="rounded-full border border-line bg-surface-alt px-3 py-1 text-sm text-ink">
            {theme}
          </li>
        ))}
      </ul>
      <Markdown body={area.body} />
    </div>
  )
}

export function ProjectPage() {
  const { id } = useParams()
  const project = projects.find((item) => item.id === id)
  if (!project) return <NotFoundPage />
  const stage = asStage(project.stage)
  const status = asStatus(project.status)
  const body = str(project, 'description_md')
  const website = publicText(str(project, 'website'))
  const sponsor = publicText(str(project, 'sponsor'))
  const background = publicText(str(project, 'background'))
  return (
    <article className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {stage ? <StageBadge stage={stage} /> : null}
        {status ? <StatusBadge status={status} /> : null}
        <CategoryBadge area={project.thrust_area} />
      </div>
      {body ? <Markdown body={body} /> : null}
      {stringList(project.faculty).length ? (
        <p>
          {stringList(project.faculty).map((name, index) => {
            const label = facultyLabel(name)
            const profile = facultyProfile(name)
            return (
              <span key={name}>
                {index > 0 ? ', ' : null}
                {profile ? <A href={profile}>{label}</A> : label}
              </span>
            )
          })}
        </p>
      ) : null}
      {stringList(project.partners).length ? <p>{stringList(project.partners).join(', ')}</p> : null}
      {stringList(project.seeking).length ? (
        <ul className="flex list-none flex-wrap gap-2 p-0">
          {stringList(project.seeking).map((item) => (
            <li key={item} className="rounded-full border border-line px-2 py-0.5 text-[12px]">
              {item in SEEKING_LABELS ? SEEKING_LABELS[item as Seeking] : item}
            </li>
          ))}
        </ul>
      ) : null}
      {sponsor ? <p>{sponsor}</p> : null}
      {background ? <p>{background}</p> : null}
      {website ? <Button href={website}>Website</Button> : null}
    </article>
  )
}

export function NewsPage() {
  const { id } = useParams()
  const item = news.find((entry) => entry.id === id)
  if (!item) return <NotFoundPage />
  const body = str(item, 'body_md')
  const link = publicText(str(item, 'link'))
  const category = str(item, 'category')
  return (
    <article className="space-y-4">
      <p className="text-sm">{[dateLabel(item.date), category ? titleCase(category) : ''].filter(Boolean).join(' · ')}</p>
      {body ? <Markdown body={body} /> : null}
      {link ? (
        <p>
          <A href={link}>Read more</A>
        </p>
      ) : null}
    </article>
  )
}
