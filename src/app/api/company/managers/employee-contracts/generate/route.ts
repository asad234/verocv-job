// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/company/managers/employee-contracts/generate/route.ts
// URL:            POST  /api/company/managers/employee-contracts/generate
// WHAT IT DOES:   Manager: generate all agreement sections with AI — either from scratch,
//                 or based on the reference files (contract templates) the manager picked.
//
// If your app folder has no "(frontend)" group, use the same path without it:
//   src/app/api/company/managers/employee-contracts/generate/route.ts
// (Folders in parentheses don't change the URL.)
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { relId, requireManagerId } from '@/utils/server/Contractaccess'
import {
  SECTION_KEYS,
  buildSystemPrompt,
  buildUserPrompt,
  cleanSectionText,
  contractResponseSchema,
  sanitizeContext,
  type AiGenerateMode,
  type AiSectionKey,
  type ContractLanguage,
} from '@/utils/server/Contractprompt'
import {
  loadTemplateForAi,
  MAX_TEMPLATE_CHARS,
  TemplateReadError,
  type TemplateForAi,
} from '@/utils/server/extractTemplateText'

/* ═════════════════════════════════════════════════════════════
   body: {
     mode: 'ai_scratch' | 'from_template'
     templateIds?: string[]          // from_template: 1–3 of the manager's own files, in order
                                     //   (the first is the main template)
     prompt?: string                 // extra instructions
     language?: 'sv' | 'en'          // contract language (default 'sv')
     contract: { ...facts from PersonalInfoDialog — no personal data }
     existingSections?: { [sectionKey]: string }   // sections to keep unchanged
   }
   200: { sections, warnings, missingInformation, templateNames: string[], templateName?: string }
═════════════════════════════════════════════════════════════ */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const MODEL = process.env.OPENAI_CONTRACT_MODEL || 'gpt-4o'
// Reasoning models (o-series, gpt-5) don't accept a custom temperature.
const SUPPORTS_TEMPERATURE = !/^(o\d|gpt-5)/i.test(MODEL)

const MAX_TEMPLATES = 3
const MAX_PROMPT_CHARS = 4_000
const MAX_EXISTING_SECTION_CHARS = 4_000
// All selected templates share this budget (~22k tokens).
const TOTAL_TEMPLATE_CHARS = 90_000

const fail = (message: string, status: number) => NextResponse.json({ message }, { status })

export async function POST(req: NextRequest) {
  try {
    /* ── 1. Auth + config ── */
    const managerId = await requireManagerId(req)
    if (managerId === null) return fail('Not authorized', 403)

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error('❌ OPENAI_API_KEY is not set')
      return fail('AI generation is not configured on the server.', 500)
    }

    /* ── 2. Validate input ── */
    let body: any
    try {
      body = await req.json()
    } catch {
      return fail('Invalid JSON body', 400)
    }

    const mode = body?.mode as AiGenerateMode
    if (mode !== 'ai_scratch' && mode !== 'from_template') {
      return fail('mode must be "ai_scratch" or "from_template"', 400)
    }
    const language: ContractLanguage = body?.language === 'en' ? 'en' : 'sv'
    const instructions =
      typeof body?.prompt === 'string' ? body.prompt.trim().slice(0, MAX_PROMPT_CHARS) : ''
    const context = sanitizeContext(body?.contract)

    const existingSections: Partial<Record<AiSectionKey, string>> = {}
    if (body?.existingSections && typeof body.existingSections === 'object') {
      for (const key of SECTION_KEYS) {
        const value = body.existingSections[key]
        if (typeof value === 'string' && value.trim()) {
          existingSections[key] = value.trim().slice(0, MAX_EXISTING_SECTION_CHARS)
        }
      }
    }
    const hasExistingSections = Object.keys(existingSections).length > 0

    /* ── 3. Load the chosen reference files (from_template only) ── */
    const templates: TemplateForAi[] = []

    if (mode === 'from_template') {
      // Accept templateIds (array) and, for older clients, templateId (single).
      const rawIds: unknown[] = Array.isArray(body?.templateIds)
        ? body.templateIds
        : body?.templateId != null
          ? [body.templateId]
          : []
      const ids = [...new Set(rawIds.map((v) => String(v ?? '').trim()).filter(Boolean))]

      if (ids.length === 0) return fail('Choose at least one reference file to generate from', 400)
      if (ids.length > MAX_TEMPLATES)
        return fail(`Choose at most ${MAX_TEMPLATES} reference files`, 400)

      const payload = await getPayload({ config })
      const perFileBudget = Math.min(
        MAX_TEMPLATE_CHARS,
        Math.floor(TOTAL_TEMPLATE_CHARS / ids.length),
      )

      for (const id of ids) {
        const doc: any = await payload
          .findByID({
            collection: 'contract-templates',
            id,
            depth: 0,
            overrideAccess: true,
            disableErrors: true,
          })
          .catch(() => null)

        // A manager may only use their own reference files.
        if (!doc || Number(relId(doc.owner)) !== managerId) {
          return fail('One of the chosen reference files was not found', 404)
        }

        try {
          templates.push(await loadTemplateForAi(doc, perFileBudget))
        } catch (err) {
          if (err instanceof TemplateReadError)
            return fail(`${doc.filename ?? 'File'}: ${err.message}`, err.status)
          throw err
        }
      }
    }

    /* ── 4. Call OpenAI with a strict JSON schema ── */
    const systemPrompt = buildSystemPrompt({ language, mode, hasExistingSections })
    const userPrompt = buildUserPrompt({
      context,
      instructions,
      language,
      existingSections: hasExistingSections ? existingSections : undefined,
      // PDFs without extractable text are attached as files below; the prompt points to them.
      templates: templates.map((t) =>
        t.kind === 'text'
          ? { name: t.name, text: t.text }
          : {
              name: t.name,
              text: `[This template is attached to this message as the PDF file "${t.name}". Read its full content from the attachment.]`,
            },
      ),
    })

    const pdfAttachments = templates.filter(
      (t): t is Extract<TemplateForAi, { kind: 'pdf' }> => t.kind === 'pdf',
    )
    const userContent =
      pdfAttachments.length === 0
        ? userPrompt
        : [
            ...pdfAttachments.map((t) => ({
              type: 'file' as const,
              file: { filename: t.name, file_data: t.dataUrl },
            })),
            { type: 'text' as const, text: userPrompt },
          ]

    const aiRes = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        ...(SUPPORTS_TEMPERATURE ? { temperature: 0.2 } : {}),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'employment_contract',
            strict: true,
            schema: contractResponseSchema,
          },
        },
        user: `manager-${managerId}`,
      }),
      signal: AbortSignal.timeout(110_000),
    })

    if (!aiRes.ok) {
      const detail = await aiRes.text().catch(() => '')
      console.error(`❌ OpenAI error ${aiRes.status}:`, detail.slice(0, 500))
      if (pdfAttachments.length > 0 && aiRes.status === 400) {
        return fail(
          'The AI could not read the attached PDF. Save the template as DOCX (or a text-based PDF) and upload it again.',
          422,
        )
      }

      let code = ''
      try {
        const parsedError = JSON.parse(detail)
        code = parsedError?.error?.code || parsedError?.error?.type || ''
      } catch {
        // not JSON — fall through to the generic messages
      }
      if (code === 'insufficient_quota' || code === 'credit_balance_exhausted') {
        return fail(
          'AI generation is temporarily unavailable. Please contact your administrator.',
          503,
        )
      }
      if (aiRes.status === 429)
        return fail('The AI service is busy right now. Please try again in a minute.', 429)
      if (aiRes.status === 401) {
        console.error('❌ OPENAI_API_KEY is invalid or revoked')
        return fail('AI generation is not configured correctly on the server.', 500)
      }
      return fail('The AI service could not generate the contract. Please try again.', 502)
    }

    const data = await aiRes.json()
    const message = data?.choices?.[0]?.message
    const finishReason = data?.choices?.[0]?.finish_reason

    if (message?.refusal)
      return fail(
        'The AI declined to generate this contract. Adjust the instructions and try again.',
        422,
      )
    if (finishReason === 'length')
      return fail(
        'The generated contract was cut off. Choose fewer reference files or shorten the instructions.',
        502,
      )

    let parsed: any
    try {
      parsed = JSON.parse(message?.content ?? '')
    } catch {
      console.error('❌ OpenAI returned invalid JSON:', String(message?.content).slice(0, 500))
      return fail('The AI returned an invalid response. Please try again.', 502)
    }

    /* ── 5. Clean up and return ── */
    const sections = Object.fromEntries(
      SECTION_KEYS.map((key) => [key, cleanSectionText(key, parsed?.sections?.[key])]),
    ) as Record<AiSectionKey, string>

    // Sections the manager asked to keep are returned exactly as they were.
    for (const key of SECTION_KEYS) {
      const kept = existingSections[key]
      if (kept) sections[key] = kept
    }

    const toList = (v: unknown) =>
      Array.isArray(v)
        ? v
            .filter((x): x is string => typeof x === 'string' && x.trim() !== '')
            .map((x) => x.trim())
        : []

    const templateNames = templates.map((t) => t.name)
    return NextResponse.json(
      {
        sections,
        warnings: toList(parsed?.warnings),
        missingInformation: toList(parsed?.missingInformation),
        templateNames,
        templateName: templateNames.length > 0 ? templateNames.join(', ') : undefined,
      },
      { status: 200 },
    )
  } catch (error) {
    if ((error as Error)?.name === 'TimeoutError') {
      return fail('The AI took too long to respond. Please try again.', 504)
    }
    console.error('❌ Failed to generate contract:', error)
    return fail('Failed to generate contract', 500)
  }
}
