// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/adminEmployees.ts   (NEW — shared by server + client)
// WHAT IT DOES:   Types + client for the business admin's employee API:
//   GET /api/company/admin/employees                 all employees of your managers
//   GET /api/company/admin/employees/:id             one employee's profile
//   GET /api/company/admin/employees/:id/cvs         their CVs (full CV data → PDF)
//   GET /api/company/admin/employees/:id/portfolio   their portfolio items
//   GET /api/company/admin/employees/:id/contracts/:cid/pdf   a signed contract as PDF
// The admin sees what the employee shared with the manager(s): "CV only" /
// "Portfolio only" access is respected, and hidden CVs/items are never sent.
// ══════════════════════════════════════════════════════════════════════

export type AccessLevel = 'full' | 'cv_only' | 'portfolio_only'

export interface EmployeeManagerRef {
  id: string
  name: string
  accessLevel: AccessLevel
}

export interface EmployeeRow {
  id: string
  name: string
  email: string
  phone: string
  title: string
  managers: EmployeeManagerRef[]
  /** What the admin may see (best access over all their managers). */
  canSeeProfile: boolean
  canSeeCvs: boolean
  canSeePortfolio: boolean
  cvCount: number
  portfolioCount: number
  connectedAt: string | null
  lastSeenAt: string | null
}

export interface EmployeeProfile extends EmployeeRow {
  personal: null | {
    firstName: string
    lastName: string
    title: string
    phone: string
    workPhone: string
    privateEmail: string
    workEmail: string
    homeAddress: string
    professionalPresentation: string
    personalPresentation: string
    linkedIn: string
  }
  employment: null | Record<string, string> // EmploymentDetailsData (strings)
  contracts: {
    id: string
    title: string
    status: string
    managerName: string
    startDate: string | null
    createdAt: string
    /** Signed by both employee and manager → PDF available. */
    signed: boolean
    signedAt: string | null
  }[]
}

export interface AdminCv {
  id: string
  name: string
  updatedAt: string
  createdAt: string
  template?: string
  personalInfo?: { firstName?: string; lastName?: string; title?: string }
  [key: string]: unknown // the full CV document (for the PDF)
}

export interface AdminPortfolioItem {
  id: string
  type: 'image' | 'video' | 'youtube' | 'link' | 'document' | string
  title: string
  description?: string
  tags?: string[]
  featured?: boolean
  createdAt: string
  imageUrl?: string
  videoUrl?: string
  videoThumbnailUrl?: string
  youtubeUrl?: string
  youtubeVideoId?: string
  youtubeThumbnailUrl?: string
  linkUrl?: string
  linkThumbnailUrl?: string
  documentUrl?: string
  documentName?: string
  documentSize?: number
  documentExt?: string
}

async function json<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(body?.message || 'Request failed') as Error & { status?: number }
    err.status = res.status
    throw err
  }
  return body as T
}
const opts: RequestInit = { credentials: 'include', cache: 'no-store' }
const BASE = '/api/company/admin/employees'

export const employeesApi = {
  list: () =>
    fetch(BASE, opts).then((r) =>
      json<{ data: EmployeeRow[]; managers: { id: string; name: string }[] }>(r),
    ),
  get: (id: string) =>
    fetch(`${BASE}/${id}`, opts)
      .then((r) => json<{ data: EmployeeProfile }>(r))
      .then((b) => b.data),
  cvs: (id: string) =>
    fetch(`${BASE}/${id}/cvs`, opts)
      .then((r) => json<{ data: AdminCv[] }>(r))
      .then((b) => b.data),
  /** The signed contract PDF (inline). Add download=true to download instead. */
  contractPdfUrl: (employeeId: string, contractId: string, download = false) =>
    `${BASE}/${employeeId}/contracts/${contractId}/pdf${download ? '?download=1' : ''}`,
  portfolio: (id: string) =>
    fetch(`${BASE}/${id}/portfolio`, opts)
      .then((r) => json<{ data: AdminPortfolioItem[] }>(r))
      .then((b) => b.data),
}
