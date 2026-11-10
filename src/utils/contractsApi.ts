'use client'

import {
  emptySections,
  defaultDocumentStyle,
  type AiDraftEntry,
  type EmployeeContract,
  type ContractEvent,
  type SigningMethod,
} from '@/utils/contractsStore'
import { plainTextToRuns } from '@/utils/richText'

/* ═════════════════════════════════════════════════════════════
   One EmployeeContract on the frontend = two records in Payload:
     employee-contracts   → summary, status, recipient, signing, history
     contract-documents   → editor content (parties, terms, sections, style, AI log)
   This module splits on save and merges on load, so components keep
   using the same flat EmployeeContract type.

   Contracts go through the next-auth manager routes
   (/api/company/managers/employee-contracts/*), like every other manager route.
═════════════════════════════════════════════════════════════ */

const CONTRACTS = '/api/company/managers/employee-contracts'
const PDFS = '/api/contract-pdfs'
const TEMPLATES = '/api/company/managers/contract-templates'

type Doc = Record<string, any>

/* ─────────────────────────────────────────────
   Request helpers
───────────────────────────────────────────── */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data: any,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...init })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = json?.errors?.[0]?.message || json?.error || `Request failed (${res.status})`
    throw new ApiError(msg, res.status, json)
  }
  return json as T
}

const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

const relId = (v: any): string => (v == null ? '' : String(typeof v === 'object' ? v.id : v))
const toRel = (v?: string | null) => (v ? Number(v) : null)
const byContract = (id: string | number) => `where[contract][equals]=${id}`
const normalizeEmail = (v?: string | null) => (v ?? '').trim().toLowerCase()

function pick(obj: Doc, keys: readonly string[]): Doc {
  const out: Doc = {}
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k]
  return out
}

/* ─────────────────────────────────────────────
   Which field lives where
───────────────────────────────────────────── */

// Written to `employee-contracts`
const CONTRACT_KEYS = [
  'employeeName',
  'employeeInitials',
  'employeeTitle',
  'contractType',
  'employmentExtent',
  'startDate',
  'endDate',
] as const

// Read from `employee-contracts`, never written by the frontend
const CONTRACT_READONLY_KEYS = [
  'title',
  'status',
  'displayStatus',
  'updatedAt',
  'signingMethod',
  'signedByName',
  'signatureDataUrl',
  'signatureTypedName',
  'bankIdSignedAt',
  'managerSignedAt',
  'managerSignedByName',
  'managerSignatureDataUrl',
  'managerSignatureTypedName',
] as const

// Written to / read from `contract-documents`
const DOCUMENT_KEYS = [
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
] as const

/* ─────────────────────────────────────────────
   Mapping: Payload docs → EmployeeContract
───────────────────────────────────────────── */
function merge(contractDoc: Doc, contentDoc?: Doc | null): EmployeeContract {
  const content = contentDoc ?? {}
  const title: string = contractDoc.title ?? ''
  const now = new Date().toISOString()

  const contract: EmployeeContract = {
    // Editor content (parties, terms) + read-only server fields (status, signing…)
    ...pick(content, DOCUMENT_KEYS),
    ...pick(contractDoc, CONTRACT_READONLY_KEYS),

    // Required fields — set explicitly so TypeScript can check them
    id: String(contractDoc.id),
    employeeId: relId(contractDoc.employee),
    employeeName: contractDoc.employeeName ?? '',
    employeeInitials: contractDoc.employeeInitials ?? '',
    employeeTitle: contractDoc.employeeTitle ?? '',
    recipientEmail: contractDoc.recipientEmail ?? '',
    contractType: contractDoc.contractType ?? 'permanent',
    employmentExtent: contractDoc.employmentExtent ?? 'full_time',
    startDate: contractDoc.startDate ?? now,
    endDate: contractDoc.endDate ?? null,
    createdAt: contractDoc.createdAt ?? now,
    signedAt: contractDoc.signedAt ?? null,

    history: (contractDoc.history ?? []).map(
      (h: Doc): ContractEvent => ({
        id: String(h.id),
        type: h.type,
        date: h.date,
        note: h.note ?? undefined,
      }),
    ),

    // The list view loads only the summary — rebuild the title run from `title`.
    sections: contentDoc
      ? { ...emptySections, ...(content.sections ?? {}) }
      : {
          ...emptySections,
          agreementTitle: title && title !== 'Untitled contract' ? plainTextToRuns(title) : [],
        },
    documentStyle: { ...defaultDocumentStyle, ...(content.documentStyle ?? {}) },

    referenceTemplateIds: (content.referenceTemplates ?? []).map(relId),
    aiDrafts: (content.aiDrafts ?? []).map(
      (a: Doc): AiDraftEntry => ({
        mode: a.mode,
        prompt: a.prompt ?? '',
        templateIds: (a.templates ?? []).map(relId),
        generatedAt: a.generatedAt ?? now,
      }),
    ),
  }

  return contract
}

/* ─────────────────────────────────────────────
   Mapping: EmployeeContract → Payload data
───────────────────────────────────────────── */
const historyPayload = (history: ContractEvent[]) =>
  history.map((h) => ({ id: h.id, type: h.type, date: h.date, note: h.note ?? null }))

function contractPayload(c: EmployeeContract) {
  return {
    ...pick(c as unknown as Doc, CONTRACT_KEYS),
    employee: toRel(c.employeeId),
    recipientEmail: normalizeEmail(c.recipientEmail) || null,
    history: historyPayload(c.history),
  }
}

function documentPayload(c: EmployeeContract) {
  return {
    ...pick(c as unknown as Doc, DOCUMENT_KEYS),
    sections: c.sections,
    documentStyle: c.documentStyle,
    referenceTemplates: (c.referenceTemplateIds ?? []).map(Number),
    aiDrafts: (c.aiDrafts ?? []).map((a) => ({
      mode: a.mode,
      prompt: a.prompt || null,
      templates: a.templateIds.map(Number),
      generatedAt: a.generatedAt,
    })),
  }
}

/* ═════════════════════════════════════════════════════════════
   CONTRACT LIST PAGE
═════════════════════════════════════════════════════════════ */

/** Summary of every contract this manager created (sections only contain the title). */
export async function loadContracts(): Promise<EmployeeContract[]> {
  const json = await request<{ docs?: Doc[] }>(CONTRACTS, { cache: 'no-store' })
  return (json.docs ?? []).map((d) => merge(d))
}

/** Renew / extend / terminate — appends a history event (and a new end date for renew/extend). */
export async function addLifecycleEvent(
  contract: EmployeeContract,
  type: 'renewed' | 'extended' | 'terminated',
  opts: { endDate?: string; note?: string } = {},
): Promise<EmployeeContract> {
  const json = await request<{ contract: Doc }>(
    `${CONTRACTS}/${contract.id}/lifecycle`,
    jsonInit('POST', { type, endDate: opts.endDate, note: opts.note }),
  )
  return merge(json.contract)
}

/** Only drafts can be deleted (enforced server-side). */
export async function deleteContract(id: string): Promise<void> {
  await request(`${CONTRACTS}/${id}`, { method: 'DELETE' })
}

/* ═════════════════════════════════════════════════════════════
   CONTRACT EDITOR PAGE
═════════════════════════════════════════════════════════════ */

/** Full contract: summary + editor content. */
export async function loadContract(id: string): Promise<EmployeeContract> {
  const json = await request<{ contract: Doc; document: Doc | null }>(`${CONTRACTS}/${id}`, {
    cache: 'no-store',
  })
  return merge(json.contract, json.document)
}

/**
 * Creates the contract if it has no id yet, otherwise updates it.
 * Editor content is only accepted while the contract is a draft.
 * Always put the returned contract back into state (new contracts get their real id).
 */
export async function saveContract(c: EmployeeContract): Promise<EmployeeContract> {
  const body = {
    contract: contractPayload(c),
    ...(c.status && c.status !== 'draft' ? {} : { document: documentPayload(c) }),
  }
  const json = c.id
    ? await request<{ contract: Doc; document: Doc | null }>(
        `${CONTRACTS}/${c.id}`,
        jsonInit('PATCH', body),
      )
    : await request<{ contract: Doc; document: Doc | null }>(CONTRACTS, jsonInit('POST', body))
  return merge(json.contract, json.document)
}

export interface SendResult {
  contract: EmployeeContract
  /** The VeroCV account the contract was delivered to. */
  recipientEmail: string
  recipientName: string
}

/** Error codes from the send route that mean "fix the recipient and try again". */
export const RECIPIENT_ERROR_CODES = [
  'recipient_required',
  'recipient_not_found',
  'recipient_not_employee',
] as const

/**
 * SigningMethodDialog → server. Delivery is in-app only (dashboard + notification).
 * Throws ApiError with:
 *  - data.code in RECIPIENT_ERROR_CODES → no/unknown/non-employee recipient
 *  - status 422 + data.missing: string[] → required information is missing
 */
export async function sendForSignature(
  id: string,
  signingMethod: Exclude<SigningMethod, null>,
  recipientEmail?: string,
): Promise<SendResult> {
  const json = await request<{ contract: Doc; recipientEmail: string; recipientName: string }>(
    `${CONTRACTS}/${id}/send`,
    jsonInit('POST', { signingMethod, recipientEmail: recipientEmail || undefined }),
  )
  return {
    contract: merge(json.contract),
    recipientEmail: json.recipientEmail,
    recipientName: json.recipientName,
  }
}

/** Manager (employer) signs a contract the employee has already signed. */
export async function signContractAsManager(
  id: string,
  payload: {
    fullName: string
    signatureDataUrl: string
    typedName: string | null
    consent: boolean
  },
): Promise<EmployeeContract> {
  const json = await request<{ contract: Doc }>(
    `${CONTRACTS}/${id}/sign`,
    jsonInit('POST', payload),
  )
  return merge(json.contract)
}

/** Download link for the fully signed PDF (manager). */
export const managerSignedPdfUrl = (id: string) => `${CONTRACTS}/${id}/pdf`

/* ═════════════════════════════════════════════════════════════
   CONTRACT PDFs
═════════════════════════════════════════════════════════════ */

export type ContractPdfKind = 'preview' | 'sent' | 'signed'

export interface ContractPdf {
  id: string
  contractId: string
  kind: ContractPdfKind
  version: number
  name: string
  url: string
  sizeBytes: number
  createdAt: string
}

const fromPdfDoc = (doc: Doc): ContractPdf => ({
  id: String(doc.id),
  contractId: relId(doc.contract),
  kind: doc.kind,
  version: doc.version ?? 1,
  name: doc.filename ?? '',
  url: doc.url ?? '',
  sizeBytes: doc.filesize ?? 0,
  createdAt: doc.createdAt ?? new Date().toISOString(),
})

export async function uploadContractPdf(
  contractId: string,
  pdf: Blob,
  kind: ContractPdfKind,
  filename = `contract-${contractId}-${kind}.pdf`,
): Promise<ContractPdf> {
  const form = new FormData()
  form.append('file', new File([pdf], filename, { type: 'application/pdf' }))
  form.append('_payload', JSON.stringify({ contract: Number(contractId), kind }))
  const json = await request<{ doc: Doc }>(`${PDFS}?depth=0`, { method: 'POST', body: form })
  return fromPdfDoc(json.doc)
}

/** All PDFs the user can see, or only one contract's when contractId is given. */
export async function listContractPdfs(contractId?: string): Promise<ContractPdf[]> {
  const filter = contractId ? `${byContract(contractId)}&` : ''
  const json = await request<{ docs?: Doc[] }>(`${PDFS}?${filter}limit=100&depth=0&sort=-createdAt`)
  return (json.docs ?? []).map(fromPdfDoc)
}

/** Only previews can be deleted by managers (enforced server-side). */
export async function deleteContractPdf(id: string): Promise<void> {
  await request(`${PDFS}/${id}`, { method: 'DELETE' })
}

/* ═════════════════════════════════════════════════════════════
   REFERENCE FILES (contract templates)
═════════════════════════════════════════════════════════════ */

/* Reference files go through the next-auth manager routes
   (/api/company/managers/contract-templates/*), like every other manager route. */

export interface ContractTemplateFile {
  id: string
  name: string
  sizeBytes: number
  mimeType: string
  uploadedAt: string
  notes?: string
  /** Opens the file in the browser. Add `?download=1` to download it. */
  url: string
}

const fromTemplateDto = (d: Doc): ContractTemplateFile => ({
  id: String(d.id),
  name: d.name ?? '',
  sizeBytes: d.sizeBytes ?? 0,
  mimeType: d.mimeType ?? 'application/pdf',
  uploadedAt: d.uploadedAt ?? new Date().toISOString(),
  notes: d.notes ?? undefined,
  url: d.url ?? `${TEMPLATES}/${d.id}`,
})

export async function loadTemplates(): Promise<ContractTemplateFile[]> {
  const json = await request<{ data?: Doc[] }>(TEMPLATES, { cache: 'no-store' })
  return (json.data ?? []).map(fromTemplateDto)
}

export async function addTemplateFile(file: File, notes?: string): Promise<ContractTemplateFile> {
  if (file.size > MAX_FILE_BYTES) throw new Error('FILE_TOO_LARGE')
  const form = new FormData()
  form.append('file', file)
  if (notes) form.append('notes', notes)
  const json = await request<{ data: Doc }>(TEMPLATES, { method: 'POST', body: form })
  return fromTemplateDto(json.data)
}

export async function deleteTemplate(id: string): Promise<void> {
  await request(`${TEMPLATES}/${id}`, { method: 'DELETE' })
}

/** Download link for a reference file. */
export const templateDownloadUrl = (t: ContractTemplateFile) => `${t.url}?download=1`

export const MAX_FILE_BYTES = 8 * 1024 * 1024

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
