'use client'

import type { RichRun } from './richText'
import type {
  ContractEventType,
  ContractStatus,
  ContractType,
  DocumentStyle,
  EmploymentExtent,
  SectionKey,
  SigningMethod,
} from './contractsStore'

/* ═════════════════════════════════════════════════════════════
   Employee side of contracts — calls /api/user/contracts/*
═════════════════════════════════════════════════════════════ */

export interface MyContractSummary {
  id: string
  title: string
  status: 'pending_signature' | 'pending_manager_signature' | 'active' | 'terminated'
  displayStatus: ContractStatus
  contractType: ContractType
  employmentExtent: EmploymentExtent
  startDate: string | null
  endDate: string | null
  signingMethod: SigningMethod
  signedAt: string | null
  /** Set when the employer has signed too — the contract is then complete. */
  managerSignedAt: string | null
  sentAt: string | null
  companyName: string
  positionTitle: string
  managerName: string
}

export interface MyContractEvent {
  id: string
  type: ContractEventType
  date: string
}

export interface MyContractDetail extends MyContractSummary {
  signedByName: string | null
  signatureDataUrl: string | null
  signatureTypedName: string | null
  bankIdSignedAt: string | null
  managerSignedByName: string | null
  managerSignatureDataUrl: string | null
  history: MyContractEvent[]
  employeeName: string
  sections: Partial<Record<SectionKey, RichRun[]>>
  documentStyle: Partial<DocumentStyle>
  orgNumber: string
  companyAddress: string
  contactPerson: string
  personalNumber: string
  employeeAddress: string
  workplace: string
  signingPlace: string
  signingDate: string | null
  companyLogo: string | null
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', cache: 'no-store', ...init })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`)
  return json as T
}

export async function listMyContracts(): Promise<MyContractSummary[]> {
  const json = await request<{ data?: MyContractSummary[] }>('/api/user/contracts')
  return json.data ?? []
}

export async function getMyContract(id: string): Promise<MyContractDetail> {
  const json = await request<{ data: MyContractDetail }>(`/api/user/contracts/${id}`)
  const detail = json.data
  // The logo has its own small route, so the view works even if the detail
  // route doesn't return `companyLogo`.
  if (!detail.companyLogo) detail.companyLogo = await getMyContractLogo(id)
  return detail
}

/** Company logo of one of my contracts (PNG data URL), or null. */
export async function getMyContractLogo(id: string): Promise<string | null> {
  try {
    const json = await request<{ logo?: string | null }>(`/api/user/contracts/${id}/logo`)
    return json.logo ?? null
  } catch {
    return null
  }
}

export async function signMyContract(
  id: string,
  payload: {
    fullName: string
    signatureDataUrl: string
    typedName: string | null
    consent: boolean
  },
): Promise<void> {
  await request(`/api/user/contracts/${id}/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

/** Both parties have signed — the contract is complete. */
export const isFullySigned = (c: Pick<MyContractSummary, 'signedAt' | 'managerSignedAt'>) =>
  !!c.signedAt && !!c.managerSignedAt

/** A contract is waiting for this employee's action. */
export const needsSignature = (c: Pick<MyContractSummary, 'status' | 'signedAt'>) =>
  c.status === 'pending_signature' && !c.signedAt
