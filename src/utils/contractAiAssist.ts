'use client'

import type { EmployeeContract, SectionKey } from './contractsStore'
import { plainTextToRuns, runsToPlainText, isSectionFilled, type RichRun } from './richText'

/* ═════════════════════════════════════════════════════════════
   Client side of AI contract generation.
   Calls POST /api/company/managers/employee-contracts/generate
═════════════════════════════════════════════════════════════ */

// 'ai_with_templates' is kept so older saved AI logs still type-check.
export type GenerateMode = 'ai_scratch' | 'from_template' | 'ai_with_templates'
export type ContractLanguage = 'sv' | 'en'

/** How many reference files a contract can be generated from at once. */
export const MAX_GENERATE_TEMPLATES = 3

export interface GenerateOptions {
  mode: 'ai_scratch' | 'from_template'
  prompt: string
  templateIds: string[]
  language: ContractLanguage
  /** true = sections the manager already wrote are kept; false = everything is replaced. */
  keepExisting: boolean
}

export interface GenerateResult {
  sections: Partial<Record<SectionKey, RichRun[]>>
  warnings: string[]
  missingInformation: string[]
  /** Comma-separated names of the reference files used (from_template). */
  templateName?: string
  templateNames: string[]
}

/**
 * The facts from PersonalInfoDialog that the AI may see.
 * Personal data (employee name, personnummer, addresses) is never sent to the AI —
 * it is printed in the parties block from the form instead.
 */
export function buildContractContext(c: EmployeeContract) {
  return {
    contractType: c.contractType,
    employmentExtent: c.employmentExtent,
    startDate: c.startDate,
    endDate: c.endDate ?? '',
    positionTitle: c.positionTitle ?? '',
    workplace: c.workplace ?? '',
    noticePeriod: c.noticePeriod ?? '',
    monthlySalaryAmount: c.monthlySalaryAmount ?? '',
    payDay: c.payDay ?? '',
    vacationDaysPerYear: c.vacationDaysPerYear ?? '',
    otherBenefits: c.otherBenefits ?? '',
    otherNotes: c.otherNotes ?? '',
    hasCollectiveAgreement: c.hasCollectiveAgreement ?? '',
    companyName: c.companyName ?? '',
    signingPlace: c.signingPlace ?? '',
  }
}

/** Sections that already have content in the editor. */
export function filledSectionKeys(c: EmployeeContract): SectionKey[] {
  return (Object.keys(c.sections) as SectionKey[]).filter((k) => isSectionFilled(c.sections[k]))
}

export async function generateContractDraft(
  contract: EmployeeContract,
  options: GenerateOptions,
): Promise<GenerateResult> {
  const keptKeys = options.keepExisting ? filledSectionKeys(contract) : []
  const existingSections = Object.fromEntries(
    keptKeys.map((k) => [k, runsToPlainText(contract.sections[k])]),
  )

  const res = await fetch('/api/company/managers/employee-contracts/generate', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: options.mode,
      prompt: options.prompt,
      templateIds: options.mode === 'from_template' ? options.templateIds : undefined,
      language: options.language,
      contract: buildContractContext(contract),
      existingSections: keptKeys.length > 0 ? existingSections : undefined,
    }),
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json?.message || `Generation failed (${res.status})`)
  }

  // Convert plain text → rich runs so every section is editable in RichTextEditor.
  // Kept sections are left out so their existing formatting is untouched.
  const sections: Partial<Record<SectionKey, RichRun[]>> = {}
  for (const [key, text] of Object.entries(json.sections ?? {})) {
    if (keptKeys.includes(key as SectionKey)) continue
    if (typeof text === 'string' && text.trim()) {
      sections[key as SectionKey] = plainTextToRuns(text)
    }
  }

  return {
    sections,
    warnings: Array.isArray(json.warnings) ? json.warnings : [],
    missingInformation: Array.isArray(json.missingInformation) ? json.missingInformation : [],
    templateName: json.templateName,
    templateNames: Array.isArray(json.templateNames) ? json.templateNames : [],
  }
}
