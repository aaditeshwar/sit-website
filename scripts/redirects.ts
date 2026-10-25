import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { repoRoot } from './lib/root.ts'

/** Where an old sit.iitd.ac.in path should land. `410` drops stored portrait URLs. */
export type RedirectExpectation = {
  from: string
  status: 301 | 410
  to?: string
}

const areas = [
  'sustainability-and-social-development',
  'sustainable-and-scalable-computing',
  'health-and-social-care-technologies',
  'safe-and-responsible-computing',
] as const

function canonical(target: string): string {
  const hash = target.split('#')
  const [pathname, query] = (hash[0] ?? target).split('?')
  const file = /\.[a-z0-9]+$/i.test(pathname ?? '')
  const withSlash = file || (pathname ?? '').endsWith('/') ? pathname : `${pathname}/`
  const search = query ? `?${query}` : ''
  return `${withSlash}${search}`
}

const mapped: Array<[string, string]> = [
  ['/frontend/vision', '/about/vision'],
  ['/people', '/people'],
  ['/faculty', '/people/faculty'],
  ['/students', '/people/students'],
  ['/alumni', '/people/alumni'],
  ['/researchstaff', '/people/staff'],
  ['/adminstaff', '/people/staff'],
  ['/research', '/research/projects'],
  ['/impact', '/impact/core-stack'],
  ['/about/facilities', '/about'],
  ['/about/leadership', '/about'],
  ['/about/reports', '/about'],
  ['/impact/architecture-and-security', '/impact/computer-architecture'],
  ...areas.map((area, index): [string, string] => [`/show-news/${53 + index}`, `/research/${area}`]),
  ...areas.map(
    (area, index): [string, string] => [
      `/show-news/${57 + index}`,
      `/research/projects?thrust_area=${area}`,
    ],
  ),
  ['/show-news/47', '/academics/research-fellows'],
  ['/show-news/43', '/academics/research-fellows'],
  ['/show-news/48', '/academics/research-fellows'],
  ['/show-news/64', '/academics/research-fellows'],
  ['/show-news/63', '/research/centres'],
  ['/phd', '/academics/phd'],
  ['/msr', '/academics/ms-research'],
  ['/mtechcs', '/academics/mtech-cybersecurity'],
  ['/admission', '/academics/admissions'],
  ['/how', '/academics/admissions'],
  ['/courses', '/academics/courses'],
  ['/contact', '/contact'],
  [
    '/public/storage/uploads/placement/SIT Brochure 2023-24_updated_1688555498.pdf',
    '/documents/sit-brochure-2023-24.pdf',
  ],
]

const gonePrefixes = ['/public/storage/faculty_images/', '/public/storage/student_images/']

export function expectedRedirects(): RedirectExpectation[] {
  return [
    ...mapped.map(([from, to]) => ({ from, status: 301 as const, to: canonical(to) })),
    { from: '/show-news/6', status: 301, to: '/news/' },
    { from: '/show-news/35', status: 301, to: '/news/' },
    { from: '/public/storage/faculty_images/person.jpg', status: 410 },
    { from: '/public/storage/student_images/person.jpg', status: 410 },
  ]
}

function patternFor(urlPath: string): string {
  const relative = urlPath.replace(/^\//, '')
  const escaped = relative.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\ ')
  return `^${escaped}/?$`
}

export function redirectRules(): string[] {
  const lines = mapped.map(([from, to]) => `  RewriteRule ${patternFor(from)} ${canonical(to)} [R=301,L]`)
  lines.push('  RewriteRule ^show-news(?:/.*)?$ /news/ [R=301,L]')
  for (const prefix of gonePrefixes) {
    lines.push(`  RewriteRule ^${prefix.replace(/^\//, '')} - [G,L]`)
  }
  return lines
}

const begin = '  # --- BEGIN generated redirects (scripts/redirects.ts) ---'
const end = '  # --- END generated redirects ---'

export function applyRedirects(file: string): void {
  const text = fs.readFileSync(file, 'utf8')
  const pattern = /  # --- BEGIN generated redirects \(scripts\/redirects\.ts\) ---[\s\S]*?  # --- END generated redirects ---/
  if (!pattern.test(text)) throw new Error(`Redirect markers missing in ${file}`)
  const block = [begin, ...redirectRules(), end].join('\n')
  fs.writeFileSync(file, text.replace(pattern, block))
}

const targets = [path.join(repoRoot, 'web/public/.htaccess'), path.join(repoRoot, 'web/dist/.htaccess')]

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url : false
if (invoked) {
  for (const file of targets) {
    if (!fs.existsSync(file)) continue
    applyRedirects(file)
    console.log(`Wrote redirects into ${path.relative(repoRoot, file)}`)
  }
}
