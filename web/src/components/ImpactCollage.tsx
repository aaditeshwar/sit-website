import { A } from './A'
import { ResponsiveImage } from './ResponsiveImage'
import { select } from '../lib/query'
import { str } from '../lib/fields'

/** The four impact-story card images, beside the home intro. */
export function ImpactCollage() {
  const stories = select('impact', { sort: 'order:asc' }).slice(0, 4)
  if (!stories.length) return null
  return (
    <ul className="grid list-none grid-cols-2 gap-3 p-0" aria-label="Impact stories">
      {stories.map((story) => (
        <li key={str(story, 'slug')}>
          <A href={str(story, 'route')} className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-surface-alt">
            <ResponsiveImage
              src={str(story, 'card_image') || undefined}
              alt=""
              seed={str(story, 'slug')}
              fill
              sizes="(min-width: 1024px) 280px, 45vw"
            />
            <span className="sr-only">{str(story, 'title')}</span>
          </A>
        </li>
      ))}
    </ul>
  )
}
