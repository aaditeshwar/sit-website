import { areas, impact, news, normalisePath, pages, projects, site } from './content'
import { publicText } from './editorial'
import { STAGE_SLUGS, STAGES, type Stage } from './enums'

export type PageMeta = {
  path: string
  title: string
  description?: string
  image?: string
  seed: string
  tint: string
  stage?: Stage
  layout: 'home' | 'page' | 'story'
  markdownH1: boolean
}

export type Crumb = { label: string; href: string }

export type Featured = {
  href: string
  title: string
  text?: string
  image?: string
  seed: string
  tint: string
  stage?: Stage
}

export function asStage(value: string | undefined): Stage | undefined {
  if (!value) return undefined
  return (STAGE_SLUGS as readonly string[]).includes(value) ? (value as Stage) : undefined
}

function tintFor(stage: Stage | undefined): string {
  return stage ? STAGES[stage].color : site.theme.primary
}

export function bodyStartsWithH1(body: string | undefined): boolean {
  return /^\s*#\s+\S/.test(body ?? '')
}

function recordText(record: object, key: string): string | undefined {
  const value = (record as Record<string, unknown>)[key]
  return typeof value === 'string' && value.trim() ? value : undefined
}

export function metaFor(pathname: string): PageMeta {
  const path = normalisePath(pathname)
  const page = pages.find((item) => item.route === path)
  if (page) {
    return {
      path,
      title: page.title,
      description: page.description,
      image: page.hero_image,
      seed: path,
      tint: site.theme.primary,
      layout: page.layout === 'home' ? 'home' : 'page',
      markdownH1: bodyStartsWithH1(page.body),
    }
  }

  const story = impact.find((item) => item.route === path)
  if (story) {
    const stage = asStage(story.current_stage)
    return {
      path,
      title: story.title,
      description: story.tagline,
      image: story.hero_image,
      seed: story.slug,
      tint: tintFor(stage),
      stage,
      layout: 'story',
      markdownH1: false,
    }
  }

  const area = areas.find((item) => item.route === path)
  if (area) {
    return {
      path,
      title: area.title,
      description: area.summary,
      image: area.hero_image,
      seed: area.slug,
      tint: site.theme.primary,
      layout: 'page',
      markdownH1: bodyStartsWithH1(area.body),
    }
  }

  const projectId = path.startsWith('/research/projects/') ? path.slice('/research/projects/'.length) : ''
  const project = projectId ? projects.find((item) => item.id === projectId) : undefined
  if (project) {
    const stage = asStage(project.stage)
    return {
      path,
      title: project.title,
      description: project.summary,
      image: project.image,
      seed: project.id,
      tint: tintFor(stage),
      stage,
      layout: 'page',
      markdownH1: bodyStartsWithH1(recordText(project, 'description_md')),
    }
  }

  const newsId = path.startsWith('/news/') ? path.slice('/news/'.length) : ''
  const item = newsId ? news.find((entry) => entry.id === newsId) : undefined
  if (item) {
    return {
      path,
      title: item.title,
      description: item.summary,
      image: recordText(item, 'image'),
      seed: item.id,
      tint: site.theme.primary,
      layout: 'page',
      markdownH1: bodyStartsWithH1(recordText(item, 'body_md')),
    }
  }

  if (path === '/search') {
    return { path, title: 'Search', seed: 'search', tint: site.theme.primary, layout: 'page', markdownH1: false }
  }

  return { path, title: 'Page not found', seed: 'not-found', tint: site.theme.primary, layout: 'page', markdownH1: false }
}

function covers(href: string, path: string): boolean {
  if (href === '/') return path === '/'
  return path === href || path.startsWith(`${href}/`)
}

export function breadcrumbsFor(pathname: string, title: string): Crumb[] {
  const path = normalisePath(pathname)
  if (path === '/') return []

  const crumbs: Crumb[] = [{ label: 'Home', href: '/' }]
  const section = site.nav.find(
    (item) => covers(item.href, path) || item.children?.some((child) => covers(child.href, path)),
  )

  if (section && section.href !== path) crumbs.push({ label: section.label, href: section.href })

  const child = section?.children
    ?.filter((item) => item.href !== section.href && covers(item.href, path))
    .sort((a, b) => b.href.length - a.href.length)[0]

  if (child && child.href !== path) crumbs.push({ label: child.label, href: child.href })

  const current = child && child.href === path ? child.label : title
  const last = crumbs[crumbs.length - 1]
  if (!last || last.href !== path) crumbs.push({ label: current, href: path })
  return crumbs
}

/** A real record to show beside a mega-menu column. */
export function featuredFor(href: string): Featured | undefined {
  if (href === '/impact') {
    const story = [...impact].sort((a, b) => a.order - b.order)[0]
    if (!story) return undefined
    const stage = asStage(story.current_stage)
    return {
      href: story.route,
      title: story.title,
      text: publicText(story.tagline),
      image: story.card_image,
      seed: story.slug,
      tint: tintFor(stage),
      stage,
    }
  }

  if (href === '/research') {
    const area = [...areas].sort((a, b) => a.order - b.order)[0]
    if (!area) return undefined
    return {
      href: area.route,
      title: area.short_title,
      text: publicText(area.summary),
      image: area.card_image,
      seed: area.slug,
      tint: site.theme.primary,
    }
  }

  const page =
    pages.find((item) => item.route === href) ??
    pages.find((item) => item.hero_image && covers(href, item.route))
  if (!page) return undefined
  return {
    href: page.route,
    title: page.title,
    text: publicText(page.description),
    image: page.hero_image,
    seed: page.route,
    tint: site.theme.primary,
  }
}
