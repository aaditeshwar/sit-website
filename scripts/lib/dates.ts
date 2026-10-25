const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export type PartialDate = {
  raw: string
  /** First day of the period, for sorting. */
  sort: string
  display: string
}

const YEAR = /^(\d{4})$/
const MONTH = /^(\d{4})-(\d{2})$/
const DAY = /^(\d{4})-(\d{2})-(\d{2})$/

function monthName(month: number): string | undefined {
  return MONTHS[month - 1]
}

function validMonthDay(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1) return false
  const dt = new Date(Date.UTC(year, month - 1, day))
  return dt.getUTCFullYear() === year && dt.getUTCMonth() === month - 1 && dt.getUTCDate() === day
}

/** ISO `YYYY`, `YYYY-MM` or `YYYY-MM-DD`. Partial dates sort as the first day of the period. */
export function parsePartialDate(raw: string): PartialDate | undefined {
  const value = raw.trim()
  const year = YEAR.exec(value)
  if (year) {
    return { raw: value, sort: `${value}-01-01`, display: value }
  }
  const month = MONTH.exec(value)
  if (month) {
    const y = Number(month[1])
    const m = Number(month[2])
    const name = monthName(m)
    if (!name) return undefined
    return { raw: value, sort: `${value}-01`, display: `${name} ${y}` }
  }
  const day = DAY.exec(value)
  if (day) {
    const y = Number(day[1])
    const m = Number(day[2])
    const d = Number(day[3])
    const name = monthName(m)
    if (!name || !validMonthDay(y, m, d)) return undefined
    return { raw: value, sort: value, display: `${d} ${name} ${y}` }
  }
  return undefined
}

const RANGE = /^(\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})$/

/** A partial date, or an inclusive range written `YYYY-MM-DD to YYYY-MM-DD`. */
export function parseAdmissionDate(raw: string): PartialDate | undefined {
  const value = raw.trim()
  const range = RANGE.exec(value)
  if (!range) return parsePartialDate(value)
  const start = parsePartialDate(range[1])
  const end = parsePartialDate(range[2])
  if (!start || !end) return undefined
  return { raw: value, sort: start.sort, display: `${start.display} – ${end.display}` }
}

export function localISODate(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
