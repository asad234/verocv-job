'use client'

/* ═════════════════════════════════════════════════════════════
   REPORTS — data loader.
   Collects everything the Reports page shows from the SAME endpoints
   the other manager pages already use, so the numbers are real:

     /api/company/managers/employees                 (Profile / CVs / Portfolios pages)
     /api/company/managers/invitations               (Invitations page)
     /api/company/managers/interviews                (Interviews page)
     /api/company/managers/employee-contracts        (Contracts page)
     /api/company/managers/employees/:id/cvs
     /api/company/managers/employees/:id/cover-letters
     /api/company/managers/employees/:id/portfolio
     /api/company/managers/employees/:id/hr-info

   Per-employee requests run a few at a time; an employee whose access
   level doesn't include a section (e.g. "CVs only") simply has no data
   for it — the report shows "—" instead of guessing.
═════════════════════════════════════════════════════════════ */

import { listInterviews, type Interview } from './interviewsApi'
import { loadContracts } from './contractsApi'
import type { EmployeeContract } from './contractsStore'

export interface ReportEmployee {
  employeeId: string
  employeeName: string
  employeeEmail: string
  acceptedAt: string | null
}

export interface ReportInvitation {
  id: string
  employeeEmail: string
  firstName?: string
  lastName?: string
  accessLevel?: 'full' | 'cv_only' | 'portfolio_only'
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
  respondedAt: string | null
  revokedBy?: string | null
}

export interface ReportCV {
  id: string
  name: string
  isPublic?: boolean
  updatedAt: string
  createdAt: string
  experience?: unknown[]
  education?: unknown[]
  skills?: unknown[]
}

export interface ReportCoverLetter {
  id: string
  jobTitle: string
  companyName?: string
  createdAt: string
}

export interface ReportPortfolioItem {
  id: string
  type: string
  title: string
  createdAt: string
}

export interface ReportProfile {
  personalInformation: Record<string, any> | null
  employmentDetails: Record<string, any> | null
  cv: Record<string, any> | null
  hrInfo: Record<string, any> | null
}

/** One section per employee: data, or null when it couldn't be loaded (no access / error). */
export interface EmployeeReportData {
  cvs: ReportCV[] | null
  coverLetters: ReportCoverLetter[] | null
  portfolio: ReportPortfolioItem[] | null
  profile: ReportProfile | null
}

export interface ReportData {
  employees: ReportEmployee[]
  invitations: ReportInvitation[]
  interviews: Interview[]
  contracts: EmployeeContract[]
  perEmployee: Record<string, EmployeeReportData>
  /** Sections that failed to load entirely (shown as a note on the page). */
  failed: string[]
  loadedAt: string
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include', cache: 'no-store' })
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  return (await res.json()) as T
}

/** Runs `fn` over `items`, at most `limit` at a time. */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++
      out[i] = await fn(items[i]!)
    }
  })
  await Promise.all(workers)
  return out
}

const settle = async <T>(p: Promise<T>): Promise<T | null> => {
  try {
    return await p
  } catch {
    return null
  }
}

export async function loadReportData(
  onProgress?: (done: number, total: number) => void,
): Promise<ReportData> {
  const failed: string[] = []

  const [employeesRes, invitationsRes, interviews, contracts] = await Promise.all([
    settle(getJson<{ data?: ReportEmployee[] }>('/api/company/managers/employees')),
    settle(getJson<{ data?: ReportInvitation[] }>('/api/company/managers/invitations')),
    settle(listInterviews()),
    settle(loadContracts()),
  ])
  if (!employeesRes) failed.push('employees')
  if (!invitationsRes) failed.push('invitations')
  if (!interviews) failed.push('interviews')
  if (!contracts) failed.push('contracts')

  const employees = (employeesRes?.data ?? []).map((e) => ({
    ...e,
    employeeId: String(e.employeeId),
  }))
  const perEmployee: Record<string, EmployeeReportData> = {}

  let done = 0
  onProgress?.(0, employees.length)
  await mapLimit(employees, 4, async (emp) => {
    const base = `/api/company/managers/employees/${emp.employeeId}`
    const [cvs, letters, portfolio, profile] = await Promise.all([
      settle(getJson<{ data?: ReportCV[] }>(`${base}/cvs`)),
      settle(getJson<{ data?: ReportCoverLetter[] }>(`${base}/cover-letters`)),
      settle(getJson<{ items?: ReportPortfolioItem[] }>(`${base}/portfolio`)),
      settle(getJson<ReportProfile>(`${base}/hr-info`)),
    ])
    perEmployee[emp.employeeId] = {
      cvs: cvs ? (cvs.data ?? []) : null,
      coverLetters: letters ? (letters.data ?? []) : null,
      portfolio: portfolio ? (portfolio.items ?? []) : null,
      profile: profile ?? null,
    }
    onProgress?.(++done, employees.length)
  })

  return {
    employees,
    invitations: invitationsRes?.data ?? [],
    interviews: interviews ?? [],
    contracts: contracts ?? [],
    perEmployee,
    failed,
    loadedAt: new Date().toISOString(),
  }
}
