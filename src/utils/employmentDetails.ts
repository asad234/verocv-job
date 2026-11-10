// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/employmentDetails.ts
// WHAT IT DOES:   Shared (client + server) definitions for "Present Employment
//                 Details": option lists, EN/SV labels, which fields apply in
//                 which situation, and validation/normalisation.
//
//                 Used by the employee form, the /api/user/employment-details
//                 route, and the manager's Employee Profile view — so the rules
//                 are identical everywhere.
//
//                 Database field names are kept from the old collection where the
//                 meaning is the same (so existing data keeps working):
//                   officeLocation  = Work city / municipality
//                   homeAddress     = Work address (optional)
//                   employmentDate  = Employment start date
//                   presentTitle    = Current job title
//                   workArea        = Department / field of work
//                   salaryLevel     = Current gross monthly salary (bruttolön)
//                   feeRate         = Expected salary / rate
// ══════════════════════════════════════════════════════════════════════

export type Lang = 'en' | 'sv'

export const EMPLOYMENT_STATUSES = [
  'employed',
  'self_employed',
  'not_employed',
  'notice_period',
] as const
export const EMPLOYMENT_TYPES = [
  'permanent',
  'fixed_term',
  'consultant',
  'hourly',
  'other',
] as const
export const WORK_ARRANGEMENTS = ['onsite', 'hybrid', 'remote'] as const
export const EMPLOYMENT_RATES = [
  '100%',
  '90%',
  '80%',
  '75%',
  '70%',
  '60%',
  '50%',
  '40%',
  '30%',
  '25%',
  '20%',
  '10%',
] as const
export const CURRENCIES = ['SEK', 'EUR', 'USD', 'GBP', 'NOK', 'DKK'] as const
/** "weekly" is kept only so older saved rows stay valid — it isn't offered in the form. */
export const RATE_TYPES = ['monthly', 'hourly', 'daily', 'weekly'] as const
export const RATE_TYPES_OFFERED = ['monthly', 'hourly', 'daily'] as const
export const TRAVEL_OPTIONS = ['Yes', 'No', 'Sometimes'] as const
export const ABROAD_OPTIONS = ['Yes', 'No', 'Depends'] as const
export const NOTICE_PERIODS = [
  'none',
  '1_month',
  '2_months',
  '3_months',
  '6_months',
  'other',
] as const

export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number]
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number]

export interface EmploymentDetailsData {
  employmentStatus: EmploymentStatus
  employerName: string
  presentTitle: string
  workArea: string
  employmentType: EmploymentType | ''
  employmentDate: string // yyyy-mm-dd or ''
  employmentEndDate: string
  employmentRate: string
  officeLocation: string
  homeAddress: string
  workArrangement: string
  salaryLevel: string
  salaryCurrency: string
  feeRate: string
  feeCurrency: string
  feeRateType: string
  preferredLocation: string
  secondaryLocation: string
  canTravel: string
  assignmentAbroad: string
  noticePeriod: string
  availableFrom: string
}

export const EMPTY_EMPLOYMENT_DETAILS: EmploymentDetailsData = {
  employmentStatus: 'employed',
  employerName: '',
  presentTitle: '',
  workArea: '',
  employmentType: 'permanent',
  employmentDate: '',
  employmentEndDate: '',
  employmentRate: '100%',
  officeLocation: '',
  homeAddress: '',
  workArrangement: 'onsite',
  salaryLevel: '',
  salaryCurrency: 'SEK',
  feeRate: '',
  feeCurrency: 'SEK',
  feeRateType: 'monthly',
  preferredLocation: '',
  secondaryLocation: '',
  canTravel: 'No',
  assignmentAbroad: 'No',
  noticePeriod: '',
  availableFrom: '',
}

/* ─── Labels ─── */
type Dict = Record<string, { en: string; sv: string }>

export const STATUS_LABELS: Dict = {
  employed: { en: 'Employed', sv: 'Anställd' },
  self_employed: { en: 'Self-employed / Consultant', sv: 'Egenföretagare / Konsult' },
  not_employed: { en: 'Not currently employed', sv: 'Inte anställd just nu' },
  notice_period: { en: 'Currently serving notice period', sv: 'Går under uppsägningstid' },
}
export const TYPE_LABELS: Dict = {
  permanent: { en: 'Permanent employment (Tillsvidareanställning)', sv: 'Tillsvidareanställning' },
  fixed_term: { en: 'Fixed-term employment (Visstidsanställning)', sv: 'Visstidsanställning' },
  consultant: { en: 'Consultant / Contract (Konsultuppdrag)', sv: 'Konsultuppdrag' },
  hourly: { en: 'Hourly employment (Timanställning)', sv: 'Timanställning' },
  other: { en: 'Other', sv: 'Annat' },
}
export const ARRANGEMENT_LABELS: Dict = {
  onsite: { en: 'On-site (På plats)', sv: 'På plats' },
  hybrid: { en: 'Hybrid (Hybridarbete)', sv: 'Hybridarbete' },
  remote: { en: 'Remote (Distansarbete)', sv: 'Distansarbete' },
}
export const RATE_TYPE_LABELS: Dict = {
  monthly: { en: 'Monthly salary', sv: 'Månadslön' },
  hourly: { en: 'Hourly rate', sv: 'Timpris' },
  daily: { en: 'Daily rate', sv: 'Dagpris' },
  weekly: { en: 'Weekly rate', sv: 'Veckopris' },
}
export const TRAVEL_LABELS: Dict = {
  Yes: { en: 'Yes', sv: 'Ja' },
  No: { en: 'No', sv: 'Nej' },
  Sometimes: { en: 'Sometimes', sv: 'Ibland' },
  Depends: { en: 'Depends on assignment', sv: 'Beror på uppdraget' },
}
export const NOTICE_LABELS: Dict = {
  none: { en: 'No notice period', sv: 'Ingen uppsägningstid' },
  '1_month': { en: '1 month', sv: '1 månad' },
  '2_months': { en: '2 months', sv: '2 månader' },
  '3_months': { en: '3 months', sv: '3 månader' },
  '6_months': { en: '6 months', sv: '6 månader' },
  other: { en: 'Other', sv: 'Annat' },
}
export const CURRENCY_LABELS: Dict = {
  SEK: { en: 'SEK — Swedish krona', sv: 'SEK — svensk krona' },
  EUR: { en: 'EUR — Euro', sv: 'EUR — euro' },
  USD: { en: 'USD — US dollar', sv: 'USD — amerikansk dollar' },
  GBP: { en: 'GBP — British pound', sv: 'GBP — brittiskt pund' },
  NOK: { en: 'NOK — Norwegian krone', sv: 'NOK — norsk krona' },
  DKK: { en: 'DKK — Danish krone', sv: 'DKK — dansk krona' },
}

export const label = (dict: Dict, value: string | null | undefined, lang: Lang) =>
  value ? (dict[value]?.[lang] ?? value) : ''

/* ─── Which fields apply ─── */
export function fieldRules(d: Pick<EmploymentDetailsData, 'employmentStatus' | 'employmentType'>) {
  const working = d.employmentStatus !== 'not_employed'
  const consultant = d.employmentStatus === 'self_employed' || d.employmentType === 'consultant'
  return {
    working,
    consultant,
    showEmployer: working,
    showEmploymentType: working,
    showStartDate: working,
    showEndDate:
      working && (d.employmentType === 'fixed_term' || d.employmentStatus === 'notice_period'),
    showEmploymentRate: working && !consultant,
    showWorkplace: working,
    /** Employees have a gross monthly salary; consultants bill a rate instead. */
    showCurrentSalary: working && !consultant,
    showNoticePeriod: working && d.employmentStatus !== 'self_employed',
    required: {
      employmentStatus: true,
      presentTitle: working,
      workArea: working,
      employmentType: working,
      officeLocation: working,
    } as Record<string, boolean>,
  }
}

/* ─── Validation / normalisation ─── */
export type EmploymentErrorCode = 'required' | 'invalid' | 'endBeforeStart' | 'number'
export type EmploymentErrors = Partial<Record<keyof EmploymentDetailsData, EmploymentErrorCode>>

const str = (v: unknown, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const oneOf = <T extends readonly string[]>(list: T, v: unknown): T[number] | '' =>
  typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T[number]) : ''
const toDate = (v: unknown) => {
  const s = str(v, 40)
  if (!s) return ''
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? 'invalid' : d.toISOString().slice(0, 10)
}
/** "45 000" / "45000,50" → "45000.50"; '' if empty; 'invalid' if not a number. */
const toAmount = (v: unknown) => {
  const s = str(v, 40).replace(/\s/g, '').replace(',', '.')
  if (!s) return ''
  return /^\d+(\.\d{1,2})?$/.test(s) ? s : 'invalid'
}

/**
 * Cleans raw input (from the form or a saved document), drops fields that don't
 * apply to the chosen situation, and reports errors. Safe to run on old rows:
 * a missing status is treated as "employed".
 */
export function normalizeEmploymentDetails(raw: any): {
  data: EmploymentDetailsData
  errors: EmploymentErrors
} {
  const r = raw && typeof raw === 'object' ? raw : {}
  const errors: EmploymentErrors = {}

  const employmentStatus = (oneOf(EMPLOYMENT_STATUSES, r.employmentStatus) ||
    'employed') as EmploymentStatus
  let employmentType = oneOf(EMPLOYMENT_TYPES, r.employmentType)
  if (!employmentType && employmentStatus === 'self_employed') employmentType = 'consultant'

  const rules = fieldRules({ employmentStatus, employmentType })

  const data: EmploymentDetailsData = {
    employmentStatus,
    employerName: rules.showEmployer ? str(r.employerName, 200) : '',
    presentTitle: str(r.presentTitle, 200),
    workArea: str(r.workArea, 200),
    employmentType: rules.showEmploymentType ? employmentType : '',
    employmentDate: rules.showStartDate ? toDate(r.employmentDate) : '',
    employmentEndDate: rules.showEndDate ? toDate(r.employmentEndDate) : '',
    employmentRate: rules.showEmploymentRate
      ? oneOf(EMPLOYMENT_RATES, r.employmentRate) || '100%'
      : '',
    officeLocation: rules.showWorkplace ? str(r.officeLocation, 200) : '',
    homeAddress: rules.showWorkplace ? str(r.homeAddress, 400) : '',
    workArrangement: rules.showWorkplace ? oneOf(WORK_ARRANGEMENTS, r.workArrangement) : '',
    salaryLevel: rules.showCurrentSalary ? toAmount(r.salaryLevel) : '',
    salaryCurrency: oneOf(CURRENCIES, r.salaryCurrency) || 'SEK',
    feeRate: toAmount(r.feeRate),
    feeCurrency: oneOf(CURRENCIES, r.feeCurrency) || 'SEK',
    feeRateType: oneOf(RATE_TYPES, r.feeRateType) || (rules.consultant ? 'hourly' : 'monthly'),
    preferredLocation: str(r.preferredLocation, 200),
    secondaryLocation: str(r.secondaryLocation, 200),
    canTravel: oneOf(TRAVEL_OPTIONS, r.canTravel) || 'No',
    assignmentAbroad: oneOf(ABROAD_OPTIONS, r.assignmentAbroad) || 'No',
    noticePeriod: rules.showNoticePeriod ? oneOf(NOTICE_PERIODS, r.noticePeriod) : '',
    availableFrom: toDate(r.availableFrom),
  }

  for (const [field, needed] of Object.entries(rules.required)) {
    if (needed && !(data as any)[field]) errors[field as keyof EmploymentDetailsData] = 'required'
  }
  for (const f of ['employmentDate', 'employmentEndDate', 'availableFrom'] as const) {
    if (data[f] === 'invalid') {
      errors[f] = 'invalid'
      data[f] = ''
    }
  }
  for (const f of ['salaryLevel', 'feeRate'] as const) {
    if (data[f] === 'invalid') {
      errors[f] = 'number'
      data[f] = ''
    }
  }
  if (
    data.employmentDate &&
    data.employmentEndDate &&
    data.employmentEndDate < data.employmentDate
  ) {
    errors.employmentEndDate = 'endBeforeStart'
  }
  return { data, errors }
}

/** Shape written to Payload — empty strings become null so selects/dates stay valid. */
export function toPayloadData(d: EmploymentDetailsData) {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(d)) out[k] = v === '' ? null : v
  for (const k of ['employmentDate', 'employmentEndDate', 'availableFrom'] as const) {
    if (d[k]) out[k] = new Date(`${d[k]}T00:00:00.000Z`).toISOString()
  }
  return out
}

/** Formats a stored amount for display: "45000" → "45 000". */
export function formatAmount(v: string | null | undefined, lang: Lang) {
  if (!v) return ''
  const n = Number(v)
  return Number.isFinite(n)
    ? n.toLocaleString(lang === 'sv' ? 'sv-SE' : 'en-GB', { maximumFractionDigits: 2 })
    : v
}
