'use client'

// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/myManagerContractsApi.ts   (NEW — client only)
// WHAT IT DOES:   Manager side of contracts FROM the business admin:
//   GET  /api/company/managers/my-contracts            list
//   GET  /api/company/managers/my-contracts/:id        full contract
//   POST /api/company/managers/my-contracts/:id/sign   sign (VeroCV)
//   GET  /api/company/managers/my-contracts/:id/pdf    signed PDF
// ══════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import type { RichRun } from '@/utils/richText'
import type { DocumentStyle, SectionKey } from '@/utils/contractsStore'

export interface ReceivedContract {
  id: string
  title: string
  status: 'pending_signature' | 'pending_manager_signature' | 'active' | 'terminated' | string
  displayStatus: string
  contractType: string
  employmentExtent: string
  startDate: string | null
  endDate: string | null
  signingMethod: string | null
  signedAt: string | null
  managerSignedAt: string | null
  sentAt: string | null
  companyName: string
  positionTitle: string
  /** The business admin who sent it. */
  senderName: string
}

export interface ReceivedContractDetail extends ReceivedContract {
  signedByName: string | null
  signatureDataUrl: string | null
  managerSignedByName: string | null
  managerSignatureDataUrl: string | null
  history: { id: string; type: string; date: string }[]
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

const BASE = '/api/company/managers/my-contracts'
/** Fired after signing so badges refresh (same event the other contract pages use). */
export const CONTRACTS_CHANGED_EVENT = 'verocv:contracts-changed'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', cache: 'no-store', ...init })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.message || `Request failed (${res.status})`)
  return body as T
}

export const myManagerContractsApi = {
  list: () => request<{ data: ReceivedContract[] }>(BASE).then((b) => b.data ?? []),
  get: (id: string) =>
    request<{ data: ReceivedContractDetail }>(`${BASE}/${id}`).then((b) => b.data),
  sign: (
    id: string,
    body: { fullName: string; signatureDataUrl: string; typedName: string | null; consent: true },
  ) =>
    request(`${BASE}/${id}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  pdfUrl: (id: string, download = false) => `${BASE}/${id}/pdf${download ? '?download=1' : ''}`,
}

export const needsMySignature = (c: Pick<ReceivedContract, 'status' | 'signedAt'>) =>
  c.status === 'pending_signature' && !c.signedAt
export const isFullySigned = (c: Pick<ReceivedContract, 'signedAt' | 'managerSignedAt'>) =>
  !!c.signedAt && !!c.managerSignedAt

/** Number of contracts waiting for my signature (for the sidebar badge). */
export function useMyContractsToSign(): number {
  const [n, setN] = useState(0)
  useEffect(() => {
    let alive = true
    const load = () =>
      myManagerContractsApi
        .list()
        .then((l) => alive && setN(l.filter(needsMySignature).length))
        .catch(() => {})
    load()
    window.addEventListener(CONTRACTS_CHANGED_EVENT, load)
    const t = setInterval(load, 120_000)
    return () => {
      alive = false
      window.removeEventListener(CONTRACTS_CHANGED_EVENT, load)
      clearInterval(t)
    }
  }, [])
  return n
}
