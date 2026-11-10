import {
  DEFAULT_HEADING_FONT,
  DEFAULT_BODY_FONT,
  DEFAULT_ACCENT_COLOR,
  type PdfFontValue,
} from '@/utils/pdfFonts'
import { isSectionFilled, type RichRun } from '@/utils/richText'
import type { GenerateMode } from '@/utils/contractAiAssist'

/* ═════════════════════════════════════════════════════════════
   Contract types + defaults.
   Persistence lives in contractsApi.ts (Payload) — this file no
   longer reads or writes localStorage.
═════════════════════════════════════════════════════════════ */

/* ─── Basic unions ─── */
export type ContractType = 'permanent' | 'temporary' | 'on_call' | 'consultant'
export type EmploymentExtent = 'full_time' | 'part_time'

/** What the list page shows (includes the date-based states). */
export type ContractStatus =
  | 'draft'
  | 'pending_signature'
  | 'pending_manager_signature'
  | 'active'
  | 'expiring_soon'
  | 'expired'
  | 'terminated'

/** What is stored in the database (no date-based states). */
export type StoredContractStatus =
  | 'draft'
  | 'pending_signature'
  | 'pending_manager_signature'
  | 'active'
  | 'terminated'

export type NoticePeriod = '1_month' | '2_months' | '3_months' | ''
export type PayDay = '25th' | 'last_business_day' | ''
export type VacationDaysOption = '25' | '28' | '30' | ''
export type YesNo = 'yes' | 'no' | ''
/** VeroCV signing is the only method. ('bankid' only appears on old, already-signed contracts.) */
export type SigningMethod = 'verocv' | 'bankid' | null

/* ─── History ─── */
export type ContractEventType =
  | 'created'
  | 'sent'
  | 'signed'
  | 'manager_signed'
  | 'renewed'
  | 'extended'
  | 'terminated'
  | 'ai_drafted'

export interface ContractEvent {
  id: string
  type: ContractEventType
  date: string
  note?: string
}

/* ─── AI generation log ─── */
export interface AiDraftEntry {
  mode: GenerateMode
  prompt: string
  templateIds: string[]
  generatedAt: string
}

/* ─── Sections ─── */
export type SectionKey =
  | 'agreementTitle'
  | 'position'
  | 'jobDuties'
  | 'mainWorkplace'
  | 'workingHours'
  | 'salary'
  | 'overtime'
  | 'vacation'
  | 'socialSecurity'
  | 'pensionInsurance'
  | 'companyPolicy'
  | 'bonusProgram'
  | 'termination'
  | 'other'
  | 'confidentiality'
  | 'dataProtection'
  | 'advanceVacationPay'

// Each section is a list of styled runs, so per-phrase bold/color/font/size
// is possible and maps 1:1 onto react-pdf's nested <Text> children.
export type ContractSections = Record<SectionKey, RichRun[]>

/* ─── Document style ─── */
export interface DocumentStyle {
  headingFont: PdfFontValue
  headingColor: string
  headingSize: number
  headingBold: boolean
  bodyFont: PdfFontValue
  bodyColor: string
  bodySize: number
}

export const defaultDocumentStyle: DocumentStyle = {
  headingFont: DEFAULT_HEADING_FONT,
  headingColor: DEFAULT_ACCENT_COLOR,
  headingSize: 13,
  headingBold: true,
  bodyFont: DEFAULT_BODY_FONT,
  bodyColor: '#1f2937',
  bodySize: 10,
}

/* ─── The contract (one flat object on the frontend) ─── */
export interface EmployeeContract {
  // ── Stored in `employee-contracts` ──
  id: string // "" until first save
  employeeId: string // "" until an employee user is linked
  employeeName: string
  employeeInitials: string
  employeeTitle: string
  /** The VeroCV account email of the recipient — from the linked employee, or typed by the manager. */
  recipientEmail?: string
  contractType: ContractType
  employmentExtent: EmploymentExtent
  startDate: string
  endDate: string | null
  history: ContractEvent[]

  // ── Server-managed (read-only on the frontend) ──
  createdAt: string
  updatedAt?: string
  title?: string
  status?: StoredContractStatus
  displayStatus?: ContractStatus
  signingMethod?: SigningMethod
  signedAt: string | null
  signedByName?: string
  signatureDataUrl?: string | null // drawn signature image, VeroCV signing only
  signatureTypedName?: string | null // if the employee typed instead of drew
  bankIdSignedAt?: string | null // set by the future BankID integration

  // Manager (employer) signature — after the employee has signed
  managerSignedAt?: string | null
  managerSignedByName?: string
  managerSignatureDataUrl?: string | null
  managerSignatureTypedName?: string | null

  // ── Stored in `contract-documents` ──
  sections: ContractSections
  documentStyle: DocumentStyle

  // Employer (Arbetsgivare)
  companyName?: string
  orgNumber?: string
  companyAddress?: string
  contactPerson?: string

  // Employee (Arbetstagare)
  personalNumber?: string
  employeeAddress?: string

  // Employment terms (Anställningsvillkor)
  positionTitle?: string
  workplace?: string
  noticePeriod?: NoticePeriod

  // Salary & benefits (Lön och förmåner)
  monthlySalaryAmount?: string
  payDay?: PayDay
  vacationDaysPerYear?: VacationDaysOption
  otherBenefits?: string

  // Other / collective agreement (Övrigt)
  otherNotes?: string
  hasCollectiveAgreement?: YesNo
  signingPlace?: string
  signingDate?: string

  /** Company logo (PNG data URL) — shown at the top of the contract and as a watermark on the signed PDF. */
  companyLogo?: string | null

  // Reference files + AI log
  referenceTemplateIds?: string[]
  aiDrafts?: AiDraftEntry[]
}

/* ─── Section defaults / ordering ─── */
export const emptySections: ContractSections = {
  agreementTitle: [],
  position: [],
  jobDuties: [],
  mainWorkplace: [],
  workingHours: [],
  salary: [],
  overtime: [],
  vacation: [],
  socialSecurity: [],
  pensionInsurance: [],
  companyPolicy: [],
  bonusProgram: [],
  termination: [],
  other: [],
  confidentiality: [],
  dataProtection: [],
  advanceVacationPay: [],
}

export const CONTRACT_SECTION_ORDER: SectionKey[] = [
  'agreementTitle',
  'position',
  'jobDuties',
  'mainWorkplace',
  'workingHours',
  'salary',
  'overtime',
  'vacation',
  'socialSecurity',
  'pensionInsurance',
  'companyPolicy',
  'bonusProgram',
  'termination',
  'confidentiality',
  'dataProtection',
  'advanceVacationPay',
  'other',
]

export { isSectionFilled }
