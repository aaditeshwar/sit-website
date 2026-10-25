import { z } from 'zod'
import {
  ADMISSION_STATUSES,
  EVENT_TYPES,
  FACULTY_CATEGORIES,
  NEWS_CATEGORIES,
  NEWS_STATUSES,
  OPENING_STATUSES,
  OPENING_TYPES,
  PAGE_LAYOUTS,
  PROGRAMMES,
  PROJECT_STATUSES,
  SEEKING,
  STAFF_TYPES,
  STAGE_SLUGS,
  THRUST_AREA_SLUGS,
} from '../../web/src/lib/enums.ts'
import { parseAdmissionDate, parsePartialDate, type PartialDate } from './dates.ts'

export class ContentProblems extends Error {
  readonly issues: string[]

  constructor(issues: string[]) {
    super(`Content validation failed (${issues.length}):\n${issues.map((issue) => `- ${issue}`).join('\n')}`)
    this.name = 'ContentProblems'
    this.issues = issues
  }
}

export function formatZodIssues(where: string, error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length ? issue.path.join('.') : '(root)'
    return `${where}: ${path}: ${issue.message}`
  })
}

export function parseWith<S extends z.ZodTypeAny>(
  schema: S,
  data: unknown,
  where: string,
  issues: string[],
): z.output<S> | undefined {
  const result = schema.safeParse(data)
  if (!result.success) {
    issues.push(...formatZodIssues(where, result.error))
    return undefined
  }
  return result.data
}

function enumField<T extends readonly [string, ...string[]]>(values: T) {
  const list = values.join(' | ')
  return z.enum(values, {
    errorMap: (issue, ctx) => {
      if (issue.code === 'invalid_enum_value') {
        return { message: `expected one of ${list}, received ${JSON.stringify(issue.received)}` }
      }
      return { message: ctx.defaultError }
    },
  })
}

/** `z.preprocess` collapses output types; keep the inner schema's output. */
function pre<S extends z.ZodTypeAny>(fn: (value: unknown) => unknown, schema: S) {
  return z.preprocess(fn, schema) as z.ZodType<z.output<S>, z.ZodTypeDef, unknown>
}

function blankToUndefined(value: unknown): unknown {
  if (typeof value === 'string' && value.trim() === '') return undefined
  return value
}

const optionalText = pre(blankToUndefined, z.string().min(1).optional())

const optionalUrl = pre(
  blankToUndefined,
  z
    .string()
    .refine((value) => {
      try {
        const url = new URL(value)
        return url.protocol === 'http:' || url.protocol === 'https:'
      } catch {
        return false
      }
    }, 'expected an http(s) URL')
    .optional(),
)

const optionalEmail = pre(blankToUndefined, z.string().email('expected an email address').optional())

function assetPathOk(value: string): boolean {
  const relative = value.replace(/^\/+/, '')
  return relative.startsWith('images/') && !relative.includes('..') && !relative.includes('\\')
}

const optionalAsset = pre(
  blankToUndefined,
  z
    .string()
    .refine(assetPathOk, 'expected a site path /images/... or images/...')
    .optional(),
)

const requiredAsset = z.string().min(1).refine(assetPathOk, 'expected a site path /images/... or images/...')

function sheetVisibility(value: unknown): unknown {
  if (value === 'rejected' || value === 'superseded') return 'draft'
  return value
}

function sheetOpeningStatus(value: unknown): unknown {
  if (value === 'published') return 'open'
  if (value === 'rejected' || value === 'superseded') return 'draft'
  return value
}

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'expected a lowercase slug (a-z, 0-9, hyphens)')

const routePath = z.string().regex(/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/, 'expected a site route starting with /')

const href = z.string().refine((value) => {
  if (value.startsWith('/')) {
    const withoutHash = value.split('#')[0] ?? '/'
    const pathOnly = withoutHash.split('?')[0] || '/'
    return routePath.safeParse(pathOnly).success
  }
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}, 'expected a site route or http(s) URL')

function asList(value: unknown): unknown {
  if (value === undefined || value === null || value === '') return []
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  if (typeof value === 'string') return value.split(';').map((item) => item.trim()).filter(Boolean)
  return value
}

function listOf<T extends z.ZodTypeAny>(item: T, minimum = 0) {
  const array = z.array(item)
  return pre(asList, minimum > 0 ? array.min(minimum) : array)
}

function asBool(value: unknown): unknown {
  if (typeof value === 'string') {
    if (value.trim() === '') return undefined
    const folded = value.trim().toLowerCase()
    if (folded === 'true') return true
    if (folded === 'false') return false
  }
  return value
}

const requiredBool = pre(
  asBool,
  z.boolean({
    required_error: 'is required (TRUE or FALSE)',
    invalid_type_error: 'expected TRUE or FALSE',
  }),
)

function asInt(value: unknown): unknown {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'number' && Number.isInteger(value)) return value
  if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) return Number(value.trim())
  return value
}

const optionalInt = pre(asInt, z.number().int().optional())
const requiredInt = pre(
  asInt,
  z.number({ required_error: 'is required', invalid_type_error: 'expected an integer' }).int(),
)

const year = pre(
  asInt,
  z
    .number({ required_error: 'is required', invalid_type_error: 'expected a four-digit year' })
    .int()
    .min(1900)
    .max(2100),
)

const optionalYear = pre(asInt, z.number().int().min(1900).max(2100).optional())

function dateText(parse: (raw: string) => PartialDate | undefined, expected: string) {
  return z.string().superRefine((value, ctx) => {
    if (!parse(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${expected}, received ${JSON.stringify(value)}`,
      })
    }
  }).transform((value) => parse(value) as PartialDate)
}

function requiredDate(parse: (raw: string) => PartialDate | undefined, expected: string) {
  return pre(blankToUndefined, dateText(parse, expected))
}

function optionalDate(parse: (raw: string) => PartialDate | undefined, expected: string) {
  return pre(blankToUndefined, dateText(parse, expected).optional())
}

const requiredPartialDate = requiredDate(parsePartialDate, 'expected YYYY, YYYY-MM or YYYY-MM-DD')
const optionalPartialDate = optionalDate(parsePartialDate, 'expected YYYY, YYYY-MM or YYYY-MM-DD')
const optionalAdmissionDate = optionalDate(
  parseAdmissionDate,
  'expected YYYY, YYYY-MM, YYYY-MM-DD, or a range "YYYY-MM-DD to YYYY-MM-DD"',
)

const deadline = pre((value) => {
  if (typeof value === 'string' && value.trim().toLowerCase() === 'rolling') return 'rolling'
  return blankToUndefined(value)
}, z.union([z.literal('rolling'), requiredDate(parsePartialDate, 'expected a date or "rolling"')]).optional())

const thrustArea = enumField(THRUST_AREA_SLUGS)
const stage = enumField(STAGE_SLUGS)
const programme = enumField(PROGRAMMES)

const link = z.object({
  label: z.string().min(1),
  href,
})

const navLink = z.object({
  label: z.string().min(1),
  href,
})

export const siteSchema = z
  .object({
    name: z.string().min(1),
    short_name: z.string().min(1),
    acronym: z.string().min(1),
    tagline: z.string().min(1),
    url: z.string().url(),
    logo: requiredAsset,
    favicon: requiredAsset,
    og_image: requiredAsset,
    theme: z
      .object({
        primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        primary_dark: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        ink: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        body: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        surface: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        surface_alt: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        dark: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        fonts: z
          .object({
            heading: z.string().min(1),
            body: z.string().min(1),
          })
          .strict(),
      })
      .strict(),
    utility_nav: z.array(navLink),
    primary_cta: navLink,
    nav: z.array(
      navLink.extend({
        children: z.array(navLink).optional(),
      }),
    ),
    footer: z
      .object({
        columns: z.array(
          z.object({
            title: z.string().min(1),
            links: z.array(navLink),
          }),
        ),
        ctas: z.array(navLink),
      })
      .strict(),
    contact: z
      .object({
        address: z.string().min(1),
        phone: z.string().min(1),
        email: z.string().min(1),
        map_embed: z.string().url(),
      })
      .strict(),
    social: z
      .object({
        linkedin: z.string(),
        x: z.string(),
        youtube: z.string(),
      })
      .strict()
      .optional(),
    copyright: z.string().min(1),
  })
  .strict()

export const pageSchema = z
  .object({
    title: z.string().min(1),
    route: routePath,
    description: z.string().min(1),
    hero_image: optionalAsset,
    layout: enumField(PAGE_LAYOUTS).optional(),
  })
  .strict()

const metricSchema = z.object({
  value: pre((value) => (typeof value === 'number' ? String(value) : value), z.string().min(1)),
  label: z.string().min(1),
})

const timelineSchema = z.object({
  stage,
  period: z.string().min(1),
  text: z.string().min(1),
})

export const impactSchema = z
  .object({
    title: z.string().min(1),
    slug,
    route: routePath,
    tagline: z.string().min(1),
    thrust_area: thrustArea,
    current_stage: stage,
    order: requiredInt,
    hero_image: requiredAsset,
    card_image: requiredAsset,
    faculty: listOf(z.string().min(1)),
    website: optionalUrl,
    metrics: z.array(metricSchema).min(1),
    timeline: z.array(timelineSchema).min(1),
    partners: z
      .array(
        z.object({
          name: z.string().min(1),
          role: optionalText,
          logo: optionalAsset,
          url: optionalUrl,
        }),
      )
      .optional(),
    related_projects: listOf(slug).optional(),
    links: z.array(link).optional(),
  })
  .strict()

export const areaSchema = z
  .object({
    title: z.string().min(1),
    short_title: z.string().min(1),
    slug,
    route: routePath,
    order: requiredInt,
    icon: z.string().min(1),
    hero_image: optionalAsset,
    card_image: optionalAsset,
    summary: z.string().min(1),
    subthemes: z.array(z.string().min(1)).min(1),
    impact_stories: listOf(slug),
  })
  .strict()

export const projectSchema = z
  .object({
    id: slug,
    title: z.string().min(1),
    thrust_area: thrustArea,
    stage,
    status: enumField(PROJECT_STATUSES),
    summary: z.string().min(1).max(400),
    description_md: optionalText,
    faculty: listOf(z.string().min(1)),
    partners: listOf(z.string().min(1)),
    sponsor: optionalText,
    seeking: listOf(enumField(SEEKING)),
    background: optionalText,
    website: optionalUrl,
    image: optionalAsset,
    initiative: pre(blankToUndefined, slug.optional()),
    start_year: optionalYear,
    featured: requiredBool,
    published: requiredBool,
    last_updated: optionalPartialDate,
  })
  .strict()

export const newsSchema = z
  .object({
    id: slug,
    date: requiredPartialDate,
    category: enumField(NEWS_CATEGORIES),
    title: z.string().min(1),
    summary: z.string().min(1).max(500),
    body_md: optionalText,
    link: pre(blankToUndefined, href.optional()),
    image: optionalAsset,
    thrust_area: listOf(thrustArea),
    featured: requiredBool,
    status: pre(sheetVisibility, enumField(NEWS_STATUSES)),
    submitted_by: optionalText,
    image_alt: optionalText,
    people: listOf(z.string().min(1)),
  })
  .strict()

export const eventSchema = z
  .object({
    id: slug,
    title: z.string().min(1),
    type: enumField(EVENT_TYPES),
    start_date: requiredPartialDate,
    end_date: optionalPartialDate,
    venue: optionalText,
    summary: z.string().min(1),
    registration_url: optionalUrl,
    image: optionalAsset,
    status: pre(sheetVisibility, enumField(NEWS_STATUSES)),
  })
  .strict()

export const openingSchema = z
  .object({
    id: slug,
    title: z.string().min(1),
    type: enumField(OPENING_TYPES),
    summary: z.string().min(1),
    apply_url: optionalUrl,
    deadline,
    status: pre(sheetOpeningStatus, enumField(OPENING_STATUSES)),
  })
  .strict()

export const admissionSchema = z
  .object({
    cycle: z.string().min(1),
    programme: listOf(programme, 1),
    item: z.string().min(1),
    date: optionalAdmissionDate,
    link: optionalUrl,
    status: enumField(ADMISSION_STATUSES),
  })
  .strict()

export const statSchema = z
  .object({
    label: z.string().min(1),
    value: z.string().min(1),
    suffix: optionalText,
    note: optionalText,
    source: z.string().min(1),
  })
  .strict()

export const heroSchema = z
  .object({
    order: requiredInt,
    kicker: z.string().min(1),
    title: z.string().min(1),
    text: z.string().min(1),
    cta_label: z.string().min(1),
    cta_link: href,
    image: requiredAsset,
    active: requiredBool,
  })
  .strict()

export const labSchema = z
  .object({
    name: z.string().min(1),
    thrust_area: thrustArea,
    summary: z.string().min(1),
    website: optionalUrl,
    faculty: listOf(z.string().min(1)),
    logo: optionalAsset,
  })
  .strict()

export const partnerSchema = z
  .object({
    name: z.string().min(1),
    type: optionalText,
    logo: optionalAsset,
    website: optionalUrl,
    display_order: optionalInt,
  })
  .strict()

export const courseSchema = z
  .object({
    code: z.string().min(1),
    title: z.string().min(1),
    credits: requiredInt,
    description: z.string().min(1),
    offered: optionalText,
    faculty: listOf(z.string().min(1)),
  })
  .strict()

export const facultySchema = z
  .object({
    name: z.string().min(1),
    category: enumField(FACULTY_CATEGORIES),
    role: optionalText,
    affiliation: optionalText,
    degree: optionalText,
    research_interests: optionalText,
    thrust_areas: listOf(thrustArea),
    profile_url: optionalUrl,
    email: optionalEmail,
    photo: optionalAsset,
    display_order: optionalInt,
    active: requiredBool,
  })
  .strict()

export const studentSchema = z
  .object({
    name: z.string().min(1),
    programme,
    research_interests: optionalText,
    supervisor: optionalText,
    thrust_areas: listOf(thrustArea),
    profile_url: optionalUrl,
    photo: optionalAsset,
    year_joined: optionalYear,
    active: requiredBool,
  })
  .strict()

export const alumnusSchema = z
  .object({
    name: z.string().min(1),
    programme,
    graduation_year: year,
    thesis_title: optionalText,
    supervisor: optionalText,
    current_position: optionalText,
    profile_url: optionalUrl,
    photo: optionalAsset,
    story_md: optionalText,
    status: pre((value) => blankToUndefined(sheetVisibility(value)), enumField(NEWS_STATUSES).optional()),
  })
  .strict()

export const staffSchema = z
  .object({
    name: z.string().min(1),
    type: enumField(STAFF_TYPES),
    designation: z.string().min(1),
    email: optionalEmail,
    phone: optionalText,
    photo: optionalAsset,
    active: requiredBool,
  })
  .strict()

export const advisorySchema = z
  .object({
    name: z.string().min(1),
    designation: optionalText,
    organisation: optionalText,
    profile_url: optionalUrl,
    photo: optionalAsset,
    display_order: optionalInt,
  })
  .strict()

export type Site = z.infer<typeof siteSchema>
export type PageFrontMatter = z.infer<typeof pageSchema>
export type ImpactFrontMatter = z.infer<typeof impactSchema>
export type AreaFrontMatter = z.infer<typeof areaSchema>
export type Project = z.infer<typeof projectSchema>
export type NewsItem = z.infer<typeof newsSchema>
export type EventItem = z.infer<typeof eventSchema>
export type Opening = z.infer<typeof openingSchema>
export type Admission = z.infer<typeof admissionSchema>
export type Stat = z.infer<typeof statSchema>
export type HeroSlide = z.infer<typeof heroSchema>
export type Lab = z.infer<typeof labSchema>
export type Partner = z.infer<typeof partnerSchema>
export type Course = z.infer<typeof courseSchema>
export type Faculty = z.infer<typeof facultySchema>
export type Student = z.infer<typeof studentSchema>
export type Alumnus = z.infer<typeof alumnusSchema>
export type Staff = z.infer<typeof staffSchema>
export type Advisory = z.infer<typeof advisorySchema>

export const SITE_KEYS = [
  'name',
  'short_name',
  'acronym',
  'tagline',
  'url',
  'logo',
  'favicon',
  'og_image',
  'theme',
  'utility_nav',
  'primary_cta',
  'nav',
  'footer',
  'contact',
  'social',
  'copyright',
] as const

export const PAGE_KEYS = ['title', 'route', 'description', 'hero_image', 'layout', 'review'] as const
export const IMPACT_KEYS = [
  'title',
  'slug',
  'route',
  'tagline',
  'thrust_area',
  'current_stage',
  'order',
  'hero_image',
  'card_image',
  'faculty',
  'website',
  'metrics',
  'timeline',
  'partners',
  'related_projects',
  'links',
  'sources',
  'review',
] as const
export const AREA_KEYS = [
  'title',
  'short_title',
  'slug',
  'route',
  'order',
  'icon',
  'hero_image',
  'card_image',
  'summary',
  'subthemes',
  'impact_stories',
  'review',
] as const
