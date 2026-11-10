// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/managerAvailability.ts   (REPLACE — now also used for employees)
// WHAT IT DOES:   Types, labels (sv/en), date helpers and the "what is this manager's
//                 day like" rule, used by the manager's My availability page, the
//                 business admin's Availability page and the API routes.
//
//   A day's status, strongest first:
//     1. approved time off   → time_off (sick / vab / vacation …)
//     2. employees: "vacation" in their calendar → time_off (vacation)
//     3. status "unavailable" (until that day)  → unavailable
//     4. employees: "booked" in their calendar → booked · "available" → available
//     5. working week: off → off · partial → partial (from–to) · available → available
//     6. status "limited" turns an available day into limited
//   A pending request is shown on top ("pending") but doesn't change the day yet.
// ══════════════════════════════════════════════════════════════════════

export type Lang = 'en' | 'sv'

/* ─── Working week ─── */
export type DayMode = 'available' | 'partial' | 'off'
export interface WeekDay {
  /** 1 = Monday … 7 = Sunday */
  day: number
  mode: DayMode
  start: string // "08:00" (partial only)
  end: string // "12:00"
}
export const DEFAULT_WEEK: WeekDay[] = [1, 2, 3, 4, 5, 6, 7].map((day) => ({
  day,
  mode: day <= 5 ? 'available' : 'off',
  start: '08:00',
  end: '17:00',
}))

/* ─── Status right now ─── */
export type ManualStatus = 'auto' | 'available' | 'limited' | 'unavailable'

/* ─── Time off ─── */
export const TIME_OFF_TYPES = [
  'vacation',
  'sick',
  'vab',
  'parental',
  'comp_time',
  'leave',
  'training',
  'other',
] as const
export type TimeOffType = (typeof TIME_OFF_TYPES)[number]
/** Reported, not asked for: approved straight away (the admin is notified). */
export const REPORTED_TYPES: TimeOffType[] = ['sick', 'vab']
export type TimeOffStatus = 'pending' | 'approved' | 'declined' | 'cancelled'
export type HalfDay = 'none' | 'am' | 'pm'

export interface TimeOffRequest {
  id: string
  managerId: string
  managerName: string
  type: TimeOffType
  startDate: string // YYYY-MM-DD
  endDate: string
  halfDay: HalfDay
  workingDays: number
  note: string
  status: TimeOffStatus
  decidedAt: string | null
  decidedByName: string
  decisionNote: string
  createdAt: string
}

export interface MyAvailability {
  weekly: WeekDay[]
  status: ManualStatus
  statusNote: string
  statusUntil: string // YYYY-MM-DD or ""
  updatedAt: string | null
}

/* ─── One day in the admin's grid ─── */
export type DayKind =
  | 'available'
  | 'partial'
  | 'limited'
  | 'off'
  | 'unavailable'
  | 'time_off'
  | 'booked'

/** What an employee marked in their calendar (the `availability` collection). */
export type CalendarStatus = 'booked' | 'available' | 'vacation' | 'none'
export interface DayCell {
  date: string
  kind: DayKind
  /** partial: working hours */
  hours?: string
  /** time_off: which kind */
  timeOffType?: TimeOffType
  halfDay?: HalfDay
  /** A pending request covers this day. */
  pending?: { id: string; type: TimeOffType }
  /** Comes from the employee's own calendar (not an approved request). */
  fromCalendar?: boolean
}

export interface ManagerAvailabilityRow {
  id: string
  name: string
  email: string
  jobTitle: string
  department: string
  /** The status the manager set (auto = follow the week) */
  status: ManualStatus
  statusNote: string
  statusUntil: string
  days: DayCell[]
  today: DayCell
  /** Next approved time off that hasn't ended. */
  nextTimeOff: TimeOffRequest | null
  pendingCount: number
  /** The manager has filled in their availability at least once. */
  hasSchedule: boolean
}

/** One employee in the manager's team grid. */
export interface TeamAvailabilityRow extends ManagerAvailabilityRow {
  /** Set when the employee belongs to a colleague you're covering for. */
  coveringFor?: { id: string; name: string }
  /** Days in the period the employee marked as booked in their calendar */
  bookedDays: number
}

/* ═════════════════════════ Labels ═════════════════════════ */

export const TYPE_LABELS: Record<
  TimeOffType,
  { en: string; sv: string; icon: string; color: string; bg: string }
> = {
  vacation: {
    en: 'Vacation',
    sv: 'Semester',
    icon: 'tabler:beach',
    color: 'rgb(3,105,161)',
    bg: 'rgb(224,242,254)',
  },
  sick: {
    en: 'Sick',
    sv: 'Sjuk',
    icon: 'tabler:thermometer',
    color: 'rgb(185,28,28)',
    bg: 'rgb(254,226,226)',
  },
  vab: {
    en: 'Care of sick child (VAB)',
    sv: 'VAB',
    icon: 'tabler:baby-carriage',
    color: 'rgb(190,24,93)',
    bg: 'rgb(252,231,243)',
  },
  parental: {
    en: 'Parental leave',
    sv: 'Föräldraledig',
    icon: 'tabler:heart-handshake',
    color: 'rgb(126,34,206)',
    bg: 'rgb(243,232,255)',
  },
  comp_time: {
    en: 'Comp time',
    sv: 'Kompledigt',
    icon: 'tabler:clock-hour-4',
    color: 'rgb(15,118,110)',
    bg: 'rgb(204,251,241)',
  },
  leave: {
    en: 'Leave of absence',
    sv: 'Tjänstledigt',
    icon: 'tabler:door-exit',
    color: 'rgb(71,85,105)',
    bg: 'rgb(241,245,249)',
  },
  training: {
    en: 'Training / conference',
    sv: 'Utbildning / konferens',
    icon: 'tabler:school',
    color: 'rgb(161,98,7)',
    bg: 'rgb(254,249,195)',
  },
  other: {
    en: 'Other',
    sv: 'Annat',
    icon: 'tabler:calendar-off',
    color: 'rgb(75,85,99)',
    bg: 'rgb(243,244,246)',
  },
}

export const STATUS_LABELS: Record<
  TimeOffStatus,
  { en: string; sv: string; color: string; bg: string; border: string }
> = {
  pending: {
    en: 'Pending',
    sv: 'Väntar',
    color: 'rgb(146,64,14)',
    bg: 'rgb(255,251,235)',
    border: 'rgb(253,230,138)',
  },
  approved: {
    en: 'Approved',
    sv: 'Godkänd',
    color: 'rgb(22,101,52)',
    bg: 'rgb(240,253,244)',
    border: 'rgb(187,247,208)',
  },
  declined: {
    en: 'Declined',
    sv: 'Nekad',
    color: 'rgb(185,28,28)',
    bg: 'rgb(254,242,242)',
    border: 'rgb(254,202,202)',
  },
  cancelled: {
    en: 'Cancelled',
    sv: 'Återkallad',
    color: 'rgb(75,85,99)',
    bg: 'rgb(243,244,246)',
    border: 'rgb(229,231,235)',
  },
}

export const MANUAL_STATUS_LABELS: Record<
  ManualStatus,
  { en: string; sv: string; hintEn: string; hintSv: string; dot: string }
> = {
  auto: {
    en: 'Follow my working week',
    sv: 'Följ min arbetsvecka',
    hintEn: 'Your status comes from your week and approved time off.',
    hintSv: 'Din status kommer från din vecka och godkänd ledighet.',
    dot: 'rgb(148,163,184)',
  },
  available: {
    en: 'Available',
    sv: 'Tillgänglig',
    hintEn: 'Ready for new assignments.',
    hintSv: 'Redo för nya uppdrag.',
    dot: 'rgb(34,197,94)',
  },
  limited: {
    en: 'Limited',
    sv: 'Begränsad',
    hintEn: 'Working, but busy — e.g. a big project.',
    hintSv: 'Arbetar, men upptagen — t.ex. ett stort projekt.',
    dot: 'rgb(245,158,11)',
  },
  unavailable: {
    en: 'Unavailable',
    sv: 'Inte tillgänglig',
    hintEn: 'Can’t be reached for work.',
    hintSv: 'Går inte att nå för arbete.',
    dot: 'rgb(239,68,68)',
  },
}

export const DAY_KIND_STYLE: Record<
  DayKind,
  { en: string; sv: string; bg: string; color: string; icon: string }
> = {
  available: {
    en: 'Available',
    sv: 'Tillgänglig',
    bg: 'rgb(187,247,208)',
    color: 'rgb(22,101,52)',
    icon: 'tabler:check',
  },
  partial: {
    en: 'Part of the day',
    sv: 'Del av dagen',
    bg: 'rgb(253,230,138)',
    color: 'rgb(146,64,14)',
    icon: 'tabler:clock',
  },
  limited: {
    en: 'Limited',
    sv: 'Begränsad',
    bg: 'rgb(254,215,170)',
    color: 'rgb(154,52,18)',
    icon: 'tabler:alert-triangle',
  },
  off: {
    en: 'Not working',
    sv: 'Arbetar inte',
    bg: 'rgb(226,232,240)',
    color: 'rgb(100,116,139)',
    icon: 'tabler:minus',
  },
  unavailable: {
    en: 'Unavailable',
    sv: 'Inte tillgänglig',
    bg: 'rgb(254,202,202)',
    color: 'rgb(185,28,28)',
    icon: 'tabler:x',
  },
  time_off: {
    en: 'Time off',
    sv: 'Ledig',
    bg: 'rgb(224,242,254)',
    color: 'rgb(3,105,161)',
    icon: 'tabler:beach',
  },
  booked: {
    en: 'Booked',
    sv: 'Bokad',
    bg: 'rgb(219,234,254)',
    color: 'rgb(30,64,175)',
    icon: 'tabler:briefcase',
  },
}

export const WEEKDAY_SHORT = {
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  sv: ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'],
}
export const WEEKDAY_LONG = {
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  sv: ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'],
}

/* ═════════════════════════ Dates (calendar days, no time zones) ═════════════════════════ */

export const DAY_RE = /^\d{4}-\d{2}-\d{2}$/
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

/** Today in Sweden as YYYY-MM-DD. */
export function todayStr(timeZone = 'Europe/Stockholm'): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

const toUtc = (d: string) => {
  const [y, m, day] = d.split('-').map(Number)
  return Date.UTC(y!, (m ?? 1) - 1, day ?? 1)
}
const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10)

export const addDaysStr = (d: string, n: number) => fromUtc(toUtc(d) + n * 86_400_000)
/** 1 = Monday … 7 = Sunday */
export const weekdayOf = (d: string) => ((new Date(toUtc(d)).getUTCDay() + 6) % 7) + 1
export const isValidDay = (d: unknown): d is string =>
  typeof d === 'string' && DAY_RE.test(d) && fromUtc(toUtc(d)) === d
/** Monday of the week the day is in. */
export const mondayOf = (d: string) => addDaysStr(d, 1 - weekdayOf(d))
export const daysBetween = (a: string, b: string) => Math.round((toUtc(b) - toUtc(a)) / 86_400_000)

export function dayRange(from: string, to: string): string[] {
  const out: string[] = []
  for (let d = from; d <= to && out.length < 400; d = addDaysStr(d, 1)) out.push(d)
  return out
}

/** Working days (by the manager's week) between start and end; a half day counts 0.5. */
export function countWorkingDays(
  start: string,
  end: string,
  weekly: WeekDay[],
  halfDay: HalfDay = 'none',
): number {
  const modeOf = new Map(normalizeWeek(weekly).map((w) => [w.day, w.mode]))
  const n = dayRange(start, end).filter((d) => modeOf.get(weekdayOf(d)) !== 'off').length
  return start === end && halfDay !== 'none' ? n * 0.5 : n
}

export function normalizeWeek(input: unknown): WeekDay[] {
  const list = Array.isArray(input) ? input : []
  return DEFAULT_WEEK.map((def) => {
    const w: any = list.find((x: any) => Number(x?.day) === def.day)
    if (!w) return def
    const mode: DayMode =
      w.mode === 'partial' || w.mode === 'off' || w.mode === 'available' ? w.mode : def.mode
    const start = TIME_RE.test(w.start ?? '') ? w.start : def.start
    const end = TIME_RE.test(w.end ?? '') ? w.end : def.end
    return { day: def.day, mode, start, end }
  })
}

/* ═════════════════════════ The day rule ═════════════════════════ */

type ReqLike = Pick<TimeOffRequest, 'id' | 'type' | 'startDate' | 'endDate' | 'halfDay' | 'status'>

export function dayCell(
  date: string,
  weekly: WeekDay[],
  status: { status: ManualStatus; statusUntil: string; today: string },
  requests: ReqLike[],
  /** Employees: what they marked in their calendar for this day */
  calendar?: CalendarStatus,
): DayCell {
  const covering = requests.filter((r) => r.startDate <= date && r.endDate >= date)
  const approved = covering.find((r) => r.status === 'approved')
  const pending = covering.find((r) => r.status === 'pending')
  const cell: DayCell = { date, kind: 'available' }
  if (pending) cell.pending = { id: pending.id, type: pending.type }

  if (approved) {
    return { ...cell, kind: 'time_off', timeOffType: approved.type, halfDay: approved.halfDay }
  }
  // A manual status applies from today until its end date (or until changed).
  const statusActive =
    status.status !== 'auto' &&
    date >= status.today &&
    (!status.statusUntil || date <= status.statusUntil)
  if (calendar === 'vacation')
    return { ...cell, kind: 'time_off', timeOffType: 'vacation', fromCalendar: true }
  if (statusActive && status.status === 'unavailable') return { ...cell, kind: 'unavailable' }
  if (calendar === 'booked') return { ...cell, kind: 'booked', fromCalendar: true }
  // Marked available in the calendar wins over a non-working day in the week.
  if (calendar === 'available')
    return statusActive && status.status === 'limited'
      ? { ...cell, kind: 'limited' }
      : { ...cell, fromCalendar: true }

  const w = normalizeWeek(weekly).find((x) => x.day === weekdayOf(date))!
  if (w.mode === 'off') return { ...cell, kind: 'off' }
  if (statusActive && status.status === 'limited') return { ...cell, kind: 'limited' }
  if (w.mode === 'partial') return { ...cell, kind: 'partial', hours: `${w.start}–${w.end}` }
  return cell
}

/* ═════════════════════════ Formatting ═════════════════════════ */

export function fmtDay(
  d: string,
  lang: Lang,
  opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' },
) {
  return new Date(`${d}T12:00:00Z`).toLocaleDateString(lang === 'en' ? 'en-GB' : 'sv-SE', {
    timeZone: 'UTC',
    ...opts,
  })
}

export function fmtRange(r: Pick<TimeOffRequest, 'startDate' | 'endDate' | 'halfDay'>, lang: Lang) {
  const sameYear = r.startDate.slice(0, 4) === r.endDate.slice(0, 4)
  const thisYear = r.startDate.slice(0, 4) === todayStr().slice(0, 4)
  const opts: Intl.DateTimeFormatOptions =
    sameYear && thisYear
      ? { day: 'numeric', month: 'short' }
      : { day: 'numeric', month: 'short', year: 'numeric' }
  if (r.startDate === r.endDate) {
    const half =
      r.halfDay === 'am'
        ? lang === 'en'
          ? ' (morning)'
          : ' (förmiddag)'
        : r.halfDay === 'pm'
          ? lang === 'en'
            ? ' (afternoon)'
            : ' (eftermiddag)'
          : ''
    return `${fmtDay(r.startDate, lang, { weekday: 'short', ...opts })}${half}`
  }
  return `${fmtDay(r.startDate, lang, opts)} – ${fmtDay(r.endDate, lang, opts)}`
}

export const daysLabel = (n: number, lang: Lang) =>
  lang === 'en'
    ? `${n} working day${n === 1 ? '' : 's'}`
    : `${String(n).replace('.', ',')} arbetsdag${n === 1 ? '' : 'ar'}`
