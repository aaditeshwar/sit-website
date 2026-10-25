/** Shared enumerations. Labels for thrust areas are overridden at build time by each area's `short_title`. */

export const THRUST_AREA_SLUGS = [
  'sustainability-and-social-development',
  'sustainable-and-scalable-computing',
  'health-and-social-care-technologies',
  'safe-and-responsible-computing',
] as const

export type ThrustArea = (typeof THRUST_AREA_SLUGS)[number]

export const THRUST_AREA_LABELS: Record<ThrustArea, string> = {
  'sustainability-and-social-development': 'Sustainability and social development',
  'sustainable-and-scalable-computing': 'Sustainable and scalable computing',
  'health-and-social-care-technologies': 'Health and social care',
  'safe-and-responsible-computing': 'Safe and responsible computing',
}

export const STAGES = {
  project: { label: 'Project', color: '#E8A33D', icon: 'sparkles' },
  initiative: { label: 'Initiative', color: '#2F7D6D', icon: 'git-merge' },
  ecosystem: { label: 'Ecosystem', color: '#C21717', icon: 'globe-2' },
} as const

export const STAGE_SLUGS = ['project', 'initiative', 'ecosystem'] as const
export type Stage = (typeof STAGE_SLUGS)[number]

export const PROJECT_STATUSES = ['ongoing', 'open-for-students', 'proposed', 'completed'] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  ongoing: 'Ongoing',
  'open-for-students': 'Open for students',
  proposed: 'Seeking collaborators',
  completed: 'Completed',
}

export const SEEKING = [
  'PhD',
  'MSR',
  'Predoc',
  'RA',
  'Postdoc',
  'Software engineer',
  'Collaborators',
  'Funding',
] as const
export type Seeking = (typeof SEEKING)[number]

export const SEEKING_LABELS: Record<Seeking, string> = {
  PhD: 'PhD',
  MSR: 'MS (Research)',
  Predoc: 'Pre-doc / Research Fellow',
  RA: 'Research assistant',
  Postdoc: 'Postdoc',
  'Software engineer': 'Software engineer',
  Collaborators: 'Collaborators',
  Funding: 'Funding',
}

export const FACULTY_CATEGORIES = ['joint', 'associated', 'adjunct-visiting', 'former'] as const
export type FacultyCategory = (typeof FACULTY_CATEGORIES)[number]

export const FACULTY_CATEGORY_LABELS: Record<FacultyCategory, string> = {
  joint: 'Joint faculty',
  associated: 'Associated faculty',
  'adjunct-visiting': 'Adjunct and visiting faculty',
  former: 'Former faculty',
}

export const PROGRAMMES = ['phd', 'msr', 'mtech'] as const
export type Programme = (typeof PROGRAMMES)[number]

export const PROGRAMME_LABELS: Record<Programme, string> = {
  phd: 'PhD',
  msr: 'MS (Research)',
  mtech: 'M.Tech.',
}

export const NEWS_CATEGORIES = [
  'achievement',
  'announcement',
  'event',
  'opportunity',
  'media',
  'admissions-notice',
] as const
export type NewsCategory = (typeof NEWS_CATEGORIES)[number]

export const EVENT_TYPES = ['workshop', 'talk', 'conference', 'viva', 'outreach', 'other'] as const
export type EventType = (typeof EVENT_TYPES)[number]

export const OPENING_TYPES = ['fellowship', 'position', 'internship', 'call'] as const
export type OpeningType = (typeof OPENING_TYPES)[number]

export const OPENING_STATUSES = ['open', 'closed', 'draft'] as const
export type OpeningStatus = (typeof OPENING_STATUSES)[number]

export const NEWS_STATUSES = ['published', 'draft'] as const
export type NewsStatus = (typeof NEWS_STATUSES)[number]

export const ADMISSION_STATUSES = ['current', 'archived'] as const
export type AdmissionStatus = (typeof ADMISSION_STATUSES)[number]

export const STAFF_TYPES = ['administrative', 'research', 'programme'] as const
export type StaffType = (typeof STAFF_TYPES)[number]

export const PAGE_LAYOUTS = ['home', 'page'] as const
export type PageLayout = (typeof PAGE_LAYOUTS)[number]
