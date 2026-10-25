export const COMPONENT_NAMES = [
  'hero-carousel',
  'stats-strip',
  'stage-cards',
  'stage-timeline',
  'stage-support',
  'timeline',
  'metrics',
  'impact-cards',
  'stage-pipeline',
  'thrust-area-tiles',
  'projects',
  'project-explorer',
  'labs',
  'people',
  'alumni-stories',
  'news-feed',
  'news-list',
  'events',
  'openings',
  'opportunities-band',
  'admissions-panel',
  'incentive-highlights',
  'audience-cards',
  'programme-cards',
  'key-facts',
  'faq',
  'partner-options',
  'people-tiles',
  'documents',
  'contact-routes',
  'cta-band',
  'partner-logos',
  'courses',
  'gallery',
  'contact-card',
  'map',
] as const

export type ComponentName = (typeof COMPONENT_NAMES)[number]

export function isComponentName(name: string): name is ComponentName {
  return (COMPONENT_NAMES as readonly string[]).includes(name)
}
