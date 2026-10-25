import { areas, events, impact, news, pages, site } from './content'
import ogImages from '../generated/og.json'
import { breadcrumbsFor, metaFor } from './document'
import { publicText } from './editorial'

const og = ogImages as Record<string, string>

function plainText(body: string | undefined): string | undefined {
  if (!body) return undefined
  const plain = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/::[^\n]+/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const text = publicText(plain)
  if (!text) return undefined
  return text.length > 155 ? text.slice(0, 155) : text
}

export function pageTitle(pathname: string): string {
  const meta = metaFor(pathname)
  if (meta.layout === 'home') return `${site.name} | ${site.tagline}`
  return `${meta.title} · ${site.short_name}`
}

export function pageDescription(pathname: string): string | undefined {
  const meta = metaFor(pathname)
  const written = publicText(meta.description)
  if (written) return written
  const body =
    pages.find((item) => item.route === meta.path)?.body ??
    impact.find((item) => item.route === meta.path)?.body ??
    areas.find((item) => item.route === meta.path)?.body
  return plainText(body)
}

export function canonicalUrl(pathname: string): string {
  const path = metaFor(pathname).path
  if (path === '/') return `${site.url}/`
  return `${site.url}${path}/`
}

export function ogImageUrl(pathname: string): string | undefined {
  const path = metaFor(pathname).path
  const relative = og[path] ?? og['/']
  return relative ? `${site.url}${relative}` : undefined
}

function absolute(href: string): string {
  if (href.startsWith('http')) return href
  if (href === '/') return `${site.url}/`
  return `${site.url}${href.endsWith('/') ? href : `${href}/`}`
}

function dated(record: object, key: string): string | undefined {
  const value = (record as Record<string, unknown>)[key]
  if (!value || typeof value !== 'object' || !('sort' in value)) return undefined
  const sort = (value as { sort?: unknown }).sort
  return typeof sort === 'string' ? sort : undefined
}

function text(record: object, key: string): string | undefined {
  const value = (record as Record<string, unknown>)[key]
  return typeof value === 'string' ? publicText(value) : undefined
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

export function structuredData(pathname: string): unknown[] {
  const path = metaFor(pathname).path
  const crumbs = breadcrumbsFor(pathname, metaFor(pathname).title)
  const items = crumbs.length > 0 ? crumbs : [{ label: 'Home', href: '/' }]
  const data: unknown[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.label,
        item: absolute(crumb.href),
      })),
    },
  ]

  if (path === '/') {
    const parent = site.utility_nav.find((item) => item.label === 'IIT Delhi')
    data.push({
      '@context': 'https://schema.org',
      '@type': 'CollegeOrUniversity',
      name: site.name,
      alternateName: site.short_name,
      url: `${site.url}/`,
      parentOrganization: {
        '@type': 'CollegeOrUniversity',
        name: parent?.label ?? 'IIT Delhi',
        url: parent?.href,
      },
    })
  }

  if (path === '/events') {
    for (const event of events) {
      if (event.status !== 'published') continue
      const node: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: event.title,
        startDate: dated(event, 'start_date'),
        description: text(event, 'summary'),
        url: `${site.url}/events/`,
      }
      const end = dated(event, 'end_date')
      if (end) node.endDate = end
      const venue = text(event, 'venue')
      if (venue) node.location = { '@type': 'Place', name: venue }
      data.push(node)
    }
  }

  const newsId = path.startsWith('/news/') ? path.slice('/news/'.length) : ''
  const article = newsId ? news.find((entry) => entry.id === newsId) : undefined
  if (article) {
    data.push({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.title,
      datePublished: dated(article, 'date'),
      description: text(article, 'summary'),
      mainEntityOfPage: canonicalUrl(path),
    })
  }

  return data
}
