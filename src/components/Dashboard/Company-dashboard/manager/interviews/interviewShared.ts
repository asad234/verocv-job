// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/manager/views/interviewShared.ts
// WHAT IT DOES:   Colors, labels and date helpers shared by the interview views
//                 (ManagerInterviews, InterviewBookingPage, InterviewDetailDrawer).
// ══════════════════════════════════════════════════════════════════════

import type { InterviewFormat, InterviewStatus, Recommendation } from '@/utils/interviewsApi'

export const NAVY = 'rgb(5,22,80)'
export const LIGHT = 'rgb(239,246,255)'
export const MEET_GREEN = 'rgb(22,163,74)'

export const STATUS_STYLE: Record<
  InterviewStatus,
  { bg: string; text: string; border: string; dot: string; en: string; sv: string }
> = {
  scheduled: {
    bg: 'rgb(239,246,255)',
    text: 'rgb(30,64,175)',
    border: 'rgb(191,219,254)',
    dot: 'rgb(59,130,246)',
    en: 'Scheduled',
    sv: 'Bokad',
  },
  completed: {
    bg: 'rgb(240,253,244)',
    text: 'rgb(22,101,52)',
    border: 'rgb(187,247,208)',
    dot: 'rgb(34,197,94)',
    en: 'Completed',
    sv: 'Genomförd',
  },
  cancelled: {
    bg: 'rgb(243,244,246)',
    text: 'rgb(55,65,81)',
    border: 'rgb(209,213,219)',
    dot: 'rgb(107,114,128)',
    en: 'Cancelled',
    sv: 'Avbokad',
  },
  no_show: {
    bg: 'rgb(254,242,242)',
    text: 'rgb(153,27,27)',
    border: 'rgb(254,202,202)',
    dot: 'rgb(239,68,68)',
    en: 'No-show',
    sv: 'Uteblev',
  },
}

export const FORMAT_CFG: Record<
  InterviewFormat,
  { icon: string; en: string; sv: string; hintEn: string; hintSv: string }
> = {
  video: {
    icon: 'tabler:video',
    en: 'Video call',
    sv: 'Videosamtal',
    hintEn: 'Google Meet',
    hintSv: 'Google Meet',
  },
  phone: {
    icon: 'tabler:phone',
    en: 'Phone',
    sv: 'Telefon',
    hintEn: 'You call the candidate',
    hintSv: 'Du ringer kandidaten',
  },
  in_person: {
    icon: 'tabler:building',
    en: 'In person',
    sv: 'På plats',
    hintEn: 'At your office',
    hintSv: 'På ert kontor',
  },
}

export const RECOMMENDATION_CFG: Record<
  Exclude<Recommendation, null>,
  { color: string; bg: string; en: string; sv: string }
> = {
  strong_yes: {
    color: 'rgb(21,128,61)',
    bg: 'rgb(240,253,244)',
    en: 'Strong Yes',
    sv: 'Starkt Ja',
  },
  yes: { color: 'rgb(22,101,52)', bg: 'rgb(240,253,244)', en: 'Yes', sv: 'Ja' },
  maybe: { color: 'rgb(146,64,14)', bg: 'rgb(255,251,235)', en: 'Maybe', sv: 'Kanske' },
  no: { color: 'rgb(153,27,27)', bg: 'rgb(254,242,242)', en: 'No', sv: 'Nej' },
  strong_no: { color: 'rgb(127,29,29)', bg: 'rgb(254,242,242)', en: 'Strong No', sv: 'Starkt Nej' },
}

export const DURATIONS = [15, 30, 45, 60, 90] as const

/* ─── Helpers ─── */
export function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts.length > 1
    ? `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase()
    : name.slice(0, 2).toUpperCase()
}
export function fmtDate(d: string | Date, isEn: boolean) {
  return new Date(d).toLocaleDateString(isEn ? 'en-GB' : 'sv-SE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
export function fmtLongDate(d: string | Date, isEn: boolean) {
  return new Date(d).toLocaleDateString(isEn ? 'en-GB' : 'sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
export function fmtTime(d: string | Date) {
  return new Date(d).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
}
export function endOf(startAt: string, durationMinutes: number) {
  return new Date(new Date(startAt).getTime() + durationMinutes * 60_000)
}
export function startOfWeek(d: Date) {
  const date = new Date(d)
  const day = (date.getDay() + 6) % 7 // Mon = 0
  date.setDate(date.getDate() - day)
  date.setHours(0, 0, 0, 0)
  return date
}
export function addDays(d: Date, n: number) {
  const date = new Date(d)
  date.setDate(date.getDate() + n)
  return date
}
export function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}
export function weekLabel(weekStart: Date, isEn: boolean) {
  const fmt = (d: Date) =>
    d.toLocaleDateString(isEn ? 'en-GB' : 'sv-SE', { day: 'numeric', month: 'short' })
  return `${fmt(weekStart)} – ${fmt(addDays(weekStart, 6))}`
}
const pad = (n: number) => String(n).padStart(2, '0')
/** Local "YYYY-MM-DD" for <input type="date"> (toISOString would shift to UTC). */
export function toDateInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
/** Local "HH:MM" for <input type="time">. */
export function toTimeInput(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
/** "YYYY-MM-DD" + "HH:MM" in the browser's time zone → ISO string. */
export function localToIso(date: string, time: string) {
  const [y, m, d] = date.split('-').map(Number)
  const [h, min] = time.split(':').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, h ?? 0, min ?? 0, 0, 0).toISOString()
}
export function browserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Stockholm'
  } catch {
    return 'Europe/Stockholm'
  }
}
export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
