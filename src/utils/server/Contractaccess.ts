/* ═════════════════════════════════════════════════════════════
   SERVER ONLY — auth + shared helpers for the contract routes.
   Same next-auth pattern as the other manager / user routes.
═════════════════════════════════════════════════════════════ */

import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export const relId = (v: any) => (v == null || v === '' ? null : typeof v === 'object' ? v.id : v)

export const normalizeEmail = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : '')
export const isValidEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 254

async function readToken(req: NextRequest) {
  return getToken({ req, secret: process.env.NEXTAUTH_SECRET || process.env.PAYLOAD_SECRET })
}

export async function requireManagerId(req: NextRequest): Promise<number | null> {
  const token = await readToken(req)
  const role = token?.roles as string | undefined
  if (!token?.id || (role !== 'client-manager' && role !== 'client-admin')) return null
  const id = Number(token.id)
  return Number.isFinite(id) ? id : null
}

export async function requireUserId(req: NextRequest): Promise<number | null> {
  const token = await readToken(req)
  if (!token?.id) return null
  const id = Number(token.id)
  return Number.isFinite(id) ? id : null
}

/** The employee has accepted an invitation from this manager. */
export async function requireAcceptedEmployee(payload: any, managerId: number, employeeId: number) {
  const result = await payload.find({
    collection: 'employee-invitations',
    where: {
      and: [
        { manager: { equals: managerId } },
        { employee: { equals: employeeId } },
        { status: { equals: 'accepted' } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return result.docs.length > 0
}

/**
 * The user has accepted at least one manager invitation that is still active
 * (not declined / revoked by either side). Contracts and Interviews — the
 * pages under "Others" — are only for these employees.
 */
export async function hasManagerAccess(payload: any, userId: number) {
  const result = await payload.find({
    collection: 'employee-invitations',
    where: { and: [{ employee: { equals: userId } }, { status: { equals: 'accepted' } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return result.docs.length > 0
}

/** Message + status returned when someone without a manager connection calls an "Others" route. */
export const NO_MANAGER_ACCESS = {
  body: {
    message: 'Only employees connected to a manager can use this page',
    code: 'NO_MANAGER_ACCESS',
  },
  status: 403,
} as const

/**
 * Removes server-only fields before a contract is sent to a browser:
 * the BankID order (incl. qrStartSecret) and the BankID signature evidence.
 */
export function publicContract<T>(doc: T): T {
  if (!doc || typeof doc !== 'object') return doc
  const { bankIdOrder, bankIdCompletion, ...rest } = doc as any
  return rest as T
}

/* ─── Which fields a manager may write ─── */
export const CONTRACT_WRITABLE_FIELDS = [
  'employeeName',
  'employeeInitials',
  'employeeTitle',
  'contractType',
  'employmentExtent',
  'startDate',
  'endDate',
  'history',
] as const

export const DOCUMENT_WRITABLE_FIELDS = [
  'sections',
  'documentStyle',
  'companyName',
  'orgNumber',
  'companyAddress',
  'contactPerson',
  'personalNumber',
  'employeeAddress',
  'positionTitle',
  'workplace',
  'noticePeriod',
  'monthlySalaryAmount',
  'payDay',
  'vacationDaysPerYear',
  'otherBenefits',
  'otherNotes',
  'hasCollectiveAgreement',
  'signingPlace',
  'signingDate',
  'companyLogo',
  'referenceTemplates',
  'aiDrafts',
] as const

export function pickFields(source: unknown, keys: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (!source || typeof source !== 'object') return out
  for (const key of keys) {
    const value = (source as Record<string, unknown>)[key]
    if (value !== undefined) out[key] = value
  }
  return out
}

export async function findContractDocument(payload: any, contractId: string | number) {
  const { docs } = await payload.find({
    collection: 'contract-documents',
    where: { contract: { equals: contractId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return docs[0] ?? null
}
