import admissions from '../generated/admissions.json'
import documents from '../generated/documents.json'
import areas from '../generated/areas.json'
import courses from '../generated/courses.json'
import events from '../generated/events.json'
import hero from '../generated/hero.json'
import impact from '../generated/impact.json'
import labs from '../generated/labs.json'
import news from '../generated/news.json'
import openings from '../generated/openings.json'
import pages from '../generated/pages.json'
import partners from '../generated/partners.json'
import people from '../generated/people.json'
import projects from '../generated/projects.json'
import routeManifest from '../generated/routes.json'
import site from '../generated/site.json'
import stats from '../generated/stats.json'

export {
  admissions,
  areas,
  documents,
  courses,
  events,
  hero,
  impact,
  labs,
  news,
  openings,
  pages,
  partners,
  people,
  projects,
  routeManifest,
  site,
  stats,
}

export function normalisePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1)
  return pathname || '/'
}
