// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/server/contractScopes.ts   (NEW — server only)
// WHAT IT DOES:   The contract API as reusable route handlers, so the SAME contract
//                 system (employee-contracts + contract-documents + contract-pdfs)
//                 can be used by more than one "employer → recipient" pair.
//
//   OWNER side  (creates, sends and counter-signs — the employer):
//     ownerListHandlers, ownerItemHandlers, ownerSendHandler, ownerSignHandler,
//     ownerPdfHandler, ownerLifecycleHandler, ownerTemplatesHandlers,
//     ownerTemplateItemHandlers, ownerLogoHandler, ownerGenerateHandler
//   RECIPIENT side (reads and signs — the person being hired):
//     recipientListHandler, recipientItemHandler, recipientSignHandler, recipientPdfHandler
//
//   Used by:
//     /api/company/admin/manager-contracts/*   business admin → their managers
//     /api/company/managers/my-contracts/*     manager signs contracts from the admin
//   The existing manager → employee routes are unchanged.
//
//   In the database an admin → manager contract is a normal employee-contracts row:
//     manager  = the admin (employer side)      employee = the manager (recipient)
// ══════════════════════════════════════════════════════════════════════

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ensureSignedPdf, readPdfFile } from '@/utils/server/contractPdf'
import { CONTRACT_TEMPLATES_DIR } from '@/collections/ContractTemplates'
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

/* ═════════════════════════ Shared helpers ═════════════════════════ */

export const relId = (v: any) => (v == null || v === '' ? null : typeof v === 'object' ? v.id : v)
const normalizeEmail = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : '')
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 254
const isBlank = (v: unknown) => v == null || String(v).trim() === ''
const json = (body: unknown, status = 200) => NextResponse.json(body, { status })
const fail = (message: string, status: number, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ message, ...extra }, { status })

/* Same field lists as the manager → employee routes. */
const CONTRACT_WRITABLE_FIELDS = [
  'employeeName',
  'employeeInitials',
  'employeeTitle',
  'contractType',
  'employmentExtent',
  'startDate',
  'endDate',
  'history',
] as const
const DOCUMENT_WRITABLE_FIELDS = [
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
/* Must be filled before sending (mirrors the editor's check). */
const REQUIRED_ON_CONTRACT = ['employeeName', 'startDate']
const REQUIRED_ON_DOCUMENT = [
  'companyName',
  'orgNumber',
  'companyAddress',
  'personalNumber',
  'employeeAddress',
  'positionTitle',
  'workplace',
  'noticePeriod',
  'monthlySalaryAmount',
  'payDay',
  'vacationDaysPerYear',
  'hasCollectiveAgreement',
  'signingPlace',
  'signingDate',
]

function pickFields(source: unknown, keys: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (!source || typeof source !== 'object') return out
  for (const key of keys) {
    const value = (source as Record<string, unknown>)[key]
    if (value !== undefined) out[key] = value
  }
  return out
}

/** Server-only fields never go to the browser. */
function publicContract<T>(doc: T): T {
  if (!doc || typeof doc !== 'object') return doc
  const { bankIdOrder, bankIdCompletion, ...rest } = doc as any
  return rest as T
}

async function findContractDocument(payload: any, contractId: string | number) {
  const { docs } = await payload.find({
    collection: 'contract-documents',
    where: { contract: { equals: contractId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return docs[0] ?? null
}

/** Drawn / typed signature as a PNG (~500 KB max). */
const MAX_SIGNATURE_CHARS = 700_000
const PNG_DATA_URL = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/

function readSignature(body: any) {
  const fullName = typeof body?.fullName === 'string' ? body.fullName.trim().slice(0, 120) : ''
  const typedName = typeof body?.typedName === 'string' ? body.typedName.trim().slice(0, 120) : null
  const signatureDataUrl = typeof body?.signatureDataUrl === 'string' ? body.signatureDataUrl : ''
  if (body?.consent !== true) return { error: 'You must confirm that you agree to the contract' }
  if (fullName.length < 2) return { error: 'Your full name is required' }
  if (
    !signatureDataUrl ||
    signatureDataUrl.length > MAX_SIGNATURE_CHARS ||
    !PNG_DATA_URL.test(signatureDataUrl)
  ) {
    return { error: 'A valid signature is required' }
  }
  return { fullName, typedName: typedName || null, signatureDataUrl }
}

function auditNote(req: NextRequest, method: string, userId: number) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  const ua = (req.headers.get('user-agent') ?? 'unknown').slice(0, 200)
  return `signing_method:${method}; user:${userId}; ip:${ip}; ua:${ua}`
}

async function pdfResponse(payload: any, contract: any, download: boolean) {
  const pdfDoc = await ensureSignedPdf(payload, contract.id)
  const bytes = pdfDoc ? await readPdfFile(pdfDoc) : null
  if (!bytes) return fail('The PDF could not be created', 500)
  const name = String(pdfDoc.filename || `contract-${contract.id}.pdf`).replace(/[^\w.\-]/g, '_')
  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(bytes.length),
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${name}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

/* ═════════════════════════ OWNER side ═════════════════════════ */

export interface Owner {
  /** User id stored in employee-contracts.manager (the employer side). */
  id: number
  /** Whatever the scope needs later (e.g. the admin object). */
  raw?: any
}

export interface OwnerScope {
  /** Logged-in owner, or null → 403. */
  owner: (req: NextRequest) => Promise<Owner | null>
  /** May this owner send a contract to this user? (user doc, depth 0) */
  canSendTo: (payload: any, owner: Owner, recipient: any) => Promise<boolean>
  /** Message when canSendTo fails. */
  notAllowedMessage: string
  /** Base URL of this scope's reference-file routes (for download links). */
  templatesUrl: string
  /** Used in OpenAI's `user` field. */
  label: string
}

type Ctx = { params: Promise<{ id: string }> }

async function loadOwned(payload: any, id: string, ownerId: number) {
  const contract = await payload.findByID({
    collection: 'employee-contracts',
    id,
    depth: 0,
    overrideAccess: true,
    disableErrors: true,
  })
  if (!contract || Number(relId(contract.manager)) !== ownerId) return null
  return contract
}

async function recipientAllowed(
  scope: OwnerScope,
  payload: any,
  owner: Owner,
  userId: number | null,
) {
  if (!userId) return true
  const user = await payload.findByID({
    collection: 'users',
    id: userId,
    depth: 0,
    overrideAccess: true,
    disableErrors: true,
  })
  return !!user && (await scope.canSendTo(payload, owner, user))
}

/** GET list · POST create draft.  body: { contract, document } */
export function ownerListHandlers(scope: OwnerScope) {
  return {
    async GET(req: NextRequest) {
      try {
        const owner = await scope.owner(req)
        if (!owner) return fail('Not authorized', 403)
        const payload = await getPayload({ config })
        const result = await payload.find({
          collection: 'employee-contracts',
          where: { manager: { equals: owner.id } },
          sort: '-createdAt',
          limit: 200,
          depth: 0,
          overrideAccess: true,
        })
        return json({ docs: (result.docs as any[]).map(publicContract) })
      } catch (error) {
        console.error('❌ Failed to list contracts:', error)
        return fail('Failed to load contracts', 500)
      }
    },

    async POST(req: NextRequest) {
      try {
        const owner = await scope.owner(req)
        if (!owner) return fail('Not authorized', 403)
        const body = (await req.json().catch(() => ({}))) as { contract?: any; document?: any }
        const payload = await getPayload({ config })

        const employeeId = body.contract?.employee ? Number(body.contract.employee) : null
        if (!(await recipientAllowed(scope, payload, owner, employeeId)))
          return fail(scope.notAllowedMessage, 403)

        const recipientEmail = normalizeEmail(body.contract?.recipientEmail)
        const created: any = await payload.create({
          collection: 'employee-contracts',
          data: {
            ...pickFields(body.contract, CONTRACT_WRITABLE_FIELDS),
            employee: employeeId,
            recipientEmail: recipientEmail && isValidEmail(recipientEmail) ? recipientEmail : null,
            manager: owner.id,
          } as any,
          overrideAccess: true,
        })
        if (body.document) {
          await payload.update({
            collection: 'contract-documents',
            where: { contract: { equals: created.id } },
            data: pickFields(body.document, DOCUMENT_WRITABLE_FIELDS) as any,
            overrideAccess: true,
          })
        }
        const [contract, document] = await Promise.all([
          payload.findByID({
            collection: 'employee-contracts',
            id: created.id,
            depth: 0,
            overrideAccess: true,
          }),
          findContractDocument(payload, created.id),
        ])
        return json({ contract: publicContract(contract), document }, 201)
      } catch (error) {
        console.error('❌ Failed to create contract:', error)
        return fail((error as Error)?.message || 'Failed to save contract', 500)
      }
    },
  }
}

/** GET one (editor) · PATCH save · DELETE draft. */
export function ownerItemHandlers(scope: OwnerScope) {
  return {
    async GET(req: NextRequest, { params }: Ctx) {
      try {
        const { id } = await params
        const owner = await scope.owner(req)
        if (!owner) return fail('Not authorized', 403)
        const payload = await getPayload({ config })
        const contract = await loadOwned(payload, id, owner.id)
        if (!contract) return fail('Contract not found', 404)
        const document = await findContractDocument(payload, contract.id)
        return json({ contract: publicContract(contract), document })
      } catch (error) {
        console.error('❌ Failed to load contract:', error)
        return fail('Failed to load contract', 500)
      }
    },

    async PATCH(req: NextRequest, { params }: Ctx) {
      try {
        const { id } = await params
        const owner = await scope.owner(req)
        if (!owner) return fail('Not authorized', 403)
        const body = (await req.json().catch(() => ({}))) as { contract?: any; document?: any }
        const payload = await getPayload({ config })
        const existing = await loadOwned(payload, id, owner.id)
        if (!existing) return fail('Contract not found', 404)

        if (body.document && existing.status !== 'draft') {
          return fail('This contract has been sent and can no longer be edited.', 409)
        }

        if (body.contract) {
          const data: Record<string, unknown> = pickFields(body.contract, CONTRACT_WRITABLE_FIELDS)
          if ('employee' in body.contract) {
            const employeeId = body.contract.employee ? Number(body.contract.employee) : null
            const current =
              relId(existing.employee) != null ? Number(relId(existing.employee)) : null
            if (
              employeeId !== current &&
              !(await recipientAllowed(scope, payload, owner, employeeId))
            ) {
              return fail(scope.notAllowedMessage, 403)
            }
            data.employee = employeeId
          }
          if ('recipientEmail' in body.contract) {
            const email = normalizeEmail(body.contract.recipientEmail)
            data.recipientEmail = email && isValidEmail(email) ? email : null
          }
          await payload.update({
            collection: 'employee-contracts',
            id,
            data: data as any,
            overrideAccess: true,
          })
        }

        if (body.document) {
          await payload.update({
            collection: 'contract-documents',
            where: { contract: { equals: existing.id } },
            data: pickFields(body.document, DOCUMENT_WRITABLE_FIELDS) as any,
            overrideAccess: true,
          })
        }

        const [contract, document] = await Promise.all([
          payload.findByID({
            collection: 'employee-contracts',
            id,
            depth: 0,
            overrideAccess: true,
          }),
          findContractDocument(payload, existing.id),
        ])
        return json({ contract: publicContract(contract), document })
      } catch (error) {
        console.error('❌ Failed to save contract:', error)
        return fail((error as Error)?.message || 'Failed to save contract', 500)
      }
    },

    async DELETE(req: NextRequest, { params }: Ctx) {
      try {
        const { id } = await params
        const owner = await scope.owner(req)
        if (!owner) return fail('Not authorized', 403)
        const payload = await getPayload({ config })
        const contract = await loadOwned(payload, id, owner.id)
        if (!contract) return fail('Contract not found', 404)
        if (contract.status !== 'draft') return fail('Only drafts can be deleted', 409)
        await payload.delete({ collection: 'employee-contracts', id, overrideAccess: true })
        return json({ ok: true })
      } catch (error) {
        console.error('❌ Failed to delete contract:', error)
        return fail('Failed to delete contract', 500)
      }
    },
  }
}

/**
 * POST send for signature.  body: { signingMethod: 'verocv' | 'bankid', recipientEmail? }
 * Only VeroCV signing is offered on this route (the recipient signs in the app).
 */
export function ownerSendHandler(scope: OwnerScope) {
  return async function POST(req: NextRequest, { params }: Ctx) {
    try {
      const { id } = await params
      const owner = await scope.owner(req)
      if (!owner) return fail('Not authorized', 403)
      const body = (await req.json().catch(() => ({}))) as {
        signingMethod?: string
        recipientEmail?: string
      }
      if (body.signingMethod === 'bankid') {
        return fail('BankID is not available here yet. Choose VeroCV signing.', 400, {
          code: 'bankid_unavailable',
        })
      }
      if (body.signingMethod !== 'verocv') return fail('Invalid signing method', 400)

      const payload = await getPayload({ config })
      const contract: any = await loadOwned(payload, id, owner.id)
      if (!contract) return fail('Contract not found', 404)
      if (contract.status !== 'draft') return fail('This contract has already been sent', 409)

      const content: any = (await findContractDocument(payload, contract.id)) ?? {}
      const missing = [
        ...REQUIRED_ON_CONTRACT.filter((k) => isBlank(contract[k])),
        ...REQUIRED_ON_DOCUMENT.filter((k) => isBlank(content[k])),
      ]
      if (missing.length > 0) return fail('Missing required information', 422, { missing })

      // Recipient: the linked person, or a VeroCV account found by email.
      let recipient: any = null
      const linkedId = relId(contract.employee)
      if (linkedId != null) {
        recipient = await payload.findByID({
          collection: 'users',
          id: linkedId,
          depth: 0,
          overrideAccess: true,
          disableErrors: true,
        })
        if (!recipient)
          return fail("The selected person's account no longer exists.", 422, {
            code: 'recipient_required',
          })
      } else {
        const email = normalizeEmail(body.recipientEmail)
        if (!email || !isValidEmail(email))
          return fail('Enter the email of their VeroCV account', 422, {
            code: 'recipient_required',
          })
        const { docs } = await payload.find({
          collection: 'users',
          where: { email: { equals: email } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })
        recipient = docs[0] ?? null
        if (!recipient)
          return fail('No VeroCV account found with that email', 404, {
            code: 'recipient_not_found',
          })
      }
      if (!(await scope.canSendTo(payload, owner, recipient))) {
        return fail(scope.notAllowedMessage, 400, { code: 'recipient_not_employee' })
      }

      const recipientId = Number(recipient.id)
      const recipientEmail = normalizeEmail(recipient.email)
      const now = new Date().toISOString()
      await payload.update({
        collection: 'employee-contracts',
        id,
        overrideAccess: true,
        data: {
          signingMethod: 'verocv',
          employee: recipientId,
          recipientEmail,
          history: [
            ...(contract.history ?? []),
            { type: 'sent', date: now, note: `signing_method:verocv; to_user:${recipientId}` },
          ],
        } as any,
      })
      const updated = await payload.findByID({
        collection: 'employee-contracts',
        id,
        depth: 0,
        overrideAccess: true,
      })
      return json({
        contract: publicContract(updated),
        recipientEmail,
        recipientName: recipient.name ?? '',
      })
    } catch (error) {
      console.error('❌ Failed to send contract:', error)
      return fail('Failed to send contract', 500)
    }
  }
}

/** POST — the owner counter-signs after the recipient. body: { fullName, signatureDataUrl, typedName, consent } */
export function ownerSignHandler(scope: OwnerScope) {
  return async function POST(req: NextRequest, { params }: Ctx) {
    try {
      const { id } = await params
      const owner = await scope.owner(req)
      if (!owner) return fail('Not authorized', 403)
      const sig = readSignature(await req.json().catch(() => ({})))
      if ('error' in sig) return fail(sig.error!, 400)

      const payload = await getPayload({ config })
      const contract: any = await loadOwned(payload, id, owner.id)
      if (!contract) return fail('Contract not found', 404)
      if (!contract.signedAt) return fail('The other party has not signed yet', 409)
      if (contract.managerSignedAt) return fail('You have already signed this contract', 409)
      if (contract.status === 'terminated') return fail('This contract has been terminated', 409)

      const now = new Date().toISOString()
      const updated: any = await payload.update({
        collection: 'employee-contracts',
        id,
        overrideAccess: true,
        data: {
          managerSignedAt: now,
          managerSignedByName: sig.fullName,
          managerSignatureDataUrl: sig.signatureDataUrl,
          managerSignatureTypedName: sig.typedName,
          history: [
            ...(contract.history ?? []),
            { type: 'manager_signed', date: now, note: auditNote(req, 'verocv', owner.id) },
          ],
        } as any,
      })
      try {
        await ensureSignedPdf(payload, updated.id)
      } catch (pdfError) {
        console.error('❌ Signed, but the PDF could not be generated:', pdfError)
      }
      return json({ contract: publicContract(updated) })
    } catch (error) {
      console.error('❌ Failed to sign contract:', error)
      return fail('Failed to sign contract', 500)
    }
  }
}

/** GET the fully signed PDF (?download=1 to download). */
export function ownerPdfHandler(scope: OwnerScope) {
  return async function GET(req: NextRequest, { params }: Ctx) {
    try {
      const { id } = await params
      const owner = await scope.owner(req)
      if (!owner) return fail('Not authorized', 403)
      const payload = await getPayload({ config })
      const contract = await loadOwned(payload, id, owner.id)
      if (!contract) return fail('Contract not found', 404)
      if (!contract.signedAt || !contract.managerSignedAt)
        return fail('The contract is not signed by both parties yet', 409)
      return pdfResponse(payload, contract, req.nextUrl.searchParams.get('download') === '1')
    } catch (error) {
      console.error('❌ Failed to load contract PDF:', error)
      return fail('Failed to load contract PDF', 500)
    }
  }
}

/** POST renew / extend / terminate.  body: { type, endDate?, note? } */
export function ownerLifecycleHandler(scope: OwnerScope) {
  return async function POST(req: NextRequest, { params }: Ctx) {
    try {
      const { id } = await params
      const owner = await scope.owner(req)
      if (!owner) return fail('Not authorized', 403)
      const body = (await req.json().catch(() => ({}))) as {
        type?: string
        endDate?: string
        note?: string
      }
      const type = body.type
      if (type !== 'renewed' && type !== 'extended' && type !== 'terminated')
        return fail('Invalid action', 400)

      const payload = await getPayload({ config })
      const contract: any = await loadOwned(payload, id, owner.id)
      if (!contract) return fail('Contract not found', 404)
      if (contract.status === 'terminated')
        return fail('This contract has already been terminated', 409)
      if (type === 'terminated' && contract.status === 'draft')
        return fail('Delete the draft instead', 409)
      if (type !== 'terminated' && contract.status !== 'active')
        return fail('Only active contracts can be renewed or extended', 409)

      let endDate: string | undefined
      if (type !== 'terminated') {
        const d = body.endDate ? new Date(body.endDate) : null
        if (!d || Number.isNaN(d.getTime())) return fail('A valid new end date is required', 400)
        endDate = d.toISOString()
      }
      const note =
        typeof body.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 1000) : null
      const updated = await payload.update({
        collection: 'employee-contracts',
        id,
        overrideAccess: true,
        data: {
          ...(endDate ? { endDate } : {}),
          history: [...(contract.history ?? []), { type, date: new Date().toISOString(), note }],
        } as any,
      })
      return json({ contract: publicContract(updated) })
    } catch (error) {
      console.error('❌ Failed to update contract lifecycle:', error)
      return fail('Failed to update contract', 500)
    }
  }
}

/** GET — the owner's latest company logo (from their previous contracts). */
export function ownerLogoHandler(scope: OwnerScope) {
  return async function GET(req: NextRequest) {
    try {
      const owner = await scope.owner(req)
      if (!owner) return fail('Not authorized', 403)
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'contract-documents',
        where: { and: [{ manager: { equals: owner.id } }, { companyLogo: { exists: true } }] },
        sort: '-updatedAt',
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      const logo =
        typeof (docs[0] as any)?.companyLogo === 'string' && (docs[0] as any).companyLogo
          ? (docs[0] as any).companyLogo
          : null
      return json({ logo })
    } catch (error) {
      console.error('❌ Failed to load company logo:', error)
      return fail('Failed to load company logo', 500)
    }
  }
}

/* ─── Reference files (contract-templates, owned by `owner`) ─── */
const MAX_FILE_BYTES = 8 * 1024 * 1024
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const ALLOWED = new Set(['application/pdf', DOCX, 'application/msword'])

const templateDto = (scope: OwnerScope, doc: any) => ({
  id: String(doc.id),
  name: doc.filename ?? '',
  sizeBytes: doc.filesize ?? 0,
  mimeType: doc.mimeType ?? 'application/pdf',
  uploadedAt: doc.createdAt ?? null,
  notes: doc.notes ?? null,
  url: `${scope.templatesUrl}/${doc.id}`,
})

export function ownerTemplatesHandlers(scope: OwnerScope) {
  return {
    async GET(req: NextRequest) {
      try {
        const owner = await scope.owner(req)
        if (!owner) return fail('Not authorized', 403)
        const payload = await getPayload({ config })
        const result = await payload.find({
          collection: 'contract-templates',
          where: { owner: { equals: owner.id } },
          sort: '-createdAt',
          limit: 100,
          depth: 0,
          overrideAccess: true,
        })
        return json({ data: (result.docs as any[]).map((d) => templateDto(scope, d)) })
      } catch (error) {
        console.error('❌ Failed to list contract templates:', error)
        return fail('Failed to load reference files', 500)
      }
    },
    async POST(req: NextRequest) {
      try {
        const owner = await scope.owner(req)
        if (!owner) return fail('Not authorized', 403)
        const form = await req.formData().catch(() => null)
        const file = form?.get('file')
        if (!file || typeof file === 'string') return fail('Choose a file to upload', 400)
        const name = (file.name || 'template').slice(0, 200)
        const lower = name.toLowerCase()
        const mimetype =
          file.type && ALLOWED.has(file.type)
            ? file.type
            : lower.endsWith('.pdf')
              ? 'application/pdf'
              : lower.endsWith('.docx')
                ? DOCX
                : lower.endsWith('.doc')
                  ? 'application/msword'
                  : ''
        if (!mimetype) return fail('Only PDF and Word files can be uploaded', 415)
        if (file.size > MAX_FILE_BYTES) return fail('The file is larger than 8 MB', 413)
        const notesRaw = form?.get('notes')
        const notes =
          typeof notesRaw === 'string' && notesRaw.trim() ? notesRaw.trim().slice(0, 2000) : null
        const payload = await getPayload({ config })
        const buffer = Buffer.from(await file.arrayBuffer())
        const doc = await payload.create({
          collection: 'contract-templates',
          data: { owner: owner.id, notes } as any,
          file: { data: buffer, mimetype, name, size: buffer.length },
          overrideAccess: true,
        })
        return json({ data: templateDto(scope, doc) }, 201)
      } catch (error) {
        console.error('❌ Failed to upload contract template:', error)
        return fail('Failed to upload the file', 500)
      }
    },
  }
}

async function loadOwnTemplate(payload: any, id: string, ownerId: number) {
  const doc = await payload.findByID({
    collection: 'contract-templates',
    id,
    depth: 0,
    overrideAccess: true,
    disableErrors: true,
  })
  if (!doc || Number(relId(doc.owner)) !== ownerId) return null
  return doc
}

async function readTemplateFile(doc: any): Promise<Buffer | null> {
  if (doc.filename) {
    try {
      return await readFile(path.join(CONTRACT_TEMPLATES_DIR, path.basename(doc.filename)))
    } catch {
      // fall through to remote storage
    }
  }
  if (doc.url && /^https?:\/\//i.test(doc.url)) {
    const res = await fetch(doc.url)
    if (res.ok) return Buffer.from(await res.arrayBuffer())
  }
  return null
}

export function ownerTemplateItemHandlers(scope: OwnerScope) {
  return {
    async GET(req: NextRequest, { params }: Ctx) {
      try {
        const { id } = await params
        const owner = await scope.owner(req)
        if (!owner) return fail('Not authorized', 403)
        const payload = await getPayload({ config })
        const doc = await loadOwnTemplate(payload, id, owner.id)
        if (!doc) return fail('File not found', 404)
        const file = await readTemplateFile(doc)
        if (!file) return fail('The file could not be found in storage', 404)
        const download = req.nextUrl.searchParams.get('download') === '1'
        const safeName = String(doc.filename ?? `template-${doc.id}`).replace(/"/g, '')
        return new NextResponse(new Uint8Array(file), {
          status: 200,
          headers: {
            'Content-Type': doc.mimeType || 'application/octet-stream',
            'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${safeName}"`,
            'Cache-Control': 'private, no-store',
          },
        })
      } catch (error) {
        console.error('❌ Failed to read contract template:', error)
        return fail('Failed to open the file', 500)
      }
    },
    async DELETE(req: NextRequest, { params }: Ctx) {
      try {
        const { id } = await params
        const owner = await scope.owner(req)
        if (!owner) return fail('Not authorized', 403)
        const payload = await getPayload({ config })
        const doc = await loadOwnTemplate(payload, id, owner.id)
        if (!doc) return fail('File not found', 404)
        await payload.delete({ collection: 'contract-templates', id: doc.id, overrideAccess: true })
        return json({ ok: true })
      } catch (error) {
        console.error('❌ Failed to delete contract template:', error)
        return fail('Failed to delete the file', 500)
      }
    },
  }
}

/* ─── AI draft (same as the manager's generate route, for this owner) ─── */
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const MODEL = process.env.OPENAI_CONTRACT_MODEL || 'gpt-4o'
const SUPPORTS_TEMPERATURE = !/^(o\d|gpt-5)/i.test(MODEL)
const MAX_TEMPLATES = 3
const MAX_PROMPT_CHARS = 4_000
const MAX_EXISTING_SECTION_CHARS = 4_000
const TOTAL_TEMPLATE_CHARS = 90_000

export function ownerGenerateHandler(scope: OwnerScope) {
  return async function POST(req: NextRequest) {
    try {
      const owner = await scope.owner(req)
      if (!owner) return fail('Not authorized', 403)
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        console.error('❌ OPENAI_API_KEY is not set')
        return fail('AI generation is not configured on the server.', 500)
      }

      let body: any
      try {
        body = await req.json()
      } catch {
        return fail('Invalid JSON body', 400)
      }
      const mode = body?.mode as AiGenerateMode
      if (mode !== 'ai_scratch' && mode !== 'from_template')
        return fail('mode must be "ai_scratch" or "from_template"', 400)
      const language: ContractLanguage = body?.language === 'en' ? 'en' : 'sv'
      const instructions =
        typeof body?.prompt === 'string' ? body.prompt.trim().slice(0, MAX_PROMPT_CHARS) : ''
      const context = sanitizeContext(body?.contract)

      const existingSections: Partial<Record<AiSectionKey, string>> = {}
      if (body?.existingSections && typeof body.existingSections === 'object') {
        for (const key of SECTION_KEYS) {
          const value = body.existingSections[key]
          if (typeof value === 'string' && value.trim())
            existingSections[key] = value.trim().slice(0, MAX_EXISTING_SECTION_CHARS)
        }
      }
      const hasExistingSections = Object.keys(existingSections).length > 0

      const templates: TemplateForAi[] = []
      if (mode === 'from_template') {
        const rawIds: unknown[] = Array.isArray(body?.templateIds)
          ? body.templateIds
          : body?.templateId != null
            ? [body.templateId]
            : []
        const ids = [...new Set(rawIds.map((v) => String(v ?? '').trim()).filter(Boolean))]
        if (ids.length === 0)
          return fail('Choose at least one reference file to generate from', 400)
        if (ids.length > MAX_TEMPLATES)
          return fail(`Choose at most ${MAX_TEMPLATES} reference files`, 400)
        const payload = await getPayload({ config })
        const perFileBudget = Math.min(
          MAX_TEMPLATE_CHARS,
          Math.floor(TOTAL_TEMPLATE_CHARS / ids.length),
        )
        for (const id of ids) {
          const doc: any = await loadOwnTemplate(payload, id, owner.id).catch(() => null)
          if (!doc) return fail('One of the chosen reference files was not found', 404)
          try {
            templates.push(await loadTemplateForAi(doc, perFileBudget))
          } catch (err) {
            if (err instanceof TemplateReadError)
              return fail(`${doc.filename ?? 'File'}: ${err.message}`, err.status)
            throw err
          }
        }
      }

      const systemPrompt = buildSystemPrompt({ language, mode, hasExistingSections })
      const userPrompt = buildUserPrompt({
        context,
        instructions,
        language,
        existingSections: hasExistingSections ? existingSections : undefined,
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
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
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
          user: `${scope.label}-${owner.id}`,
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
          // not JSON
        }
        if (code === 'insufficient_quota' || code === 'credit_balance_exhausted')
          return fail(
            'AI generation is temporarily unavailable. Please contact your administrator.',
            503,
          )
        if (aiRes.status === 429)
          return fail('The AI service is busy right now. Please try again in a minute.', 429)
        if (aiRes.status === 401)
          return fail('AI generation is not configured correctly on the server.', 500)
        return fail('The AI service could not generate the contract. Please try again.', 502)
      }

      const data = await aiRes.json()
      const message = data?.choices?.[0]?.message
      if (message?.refusal)
        return fail(
          'The AI declined to generate this contract. Adjust the instructions and try again.',
          422,
        )
      if (data?.choices?.[0]?.finish_reason === 'length')
        return fail(
          'The generated contract was cut off. Choose fewer reference files or shorten the instructions.',
          502,
        )
      let parsed: any
      try {
        parsed = JSON.parse(message?.content ?? '')
      } catch {
        return fail('The AI returned an invalid response. Please try again.', 502)
      }

      const sections = Object.fromEntries(
        SECTION_KEYS.map((key) => [key, cleanSectionText(key, parsed?.sections?.[key])]),
      ) as Record<AiSectionKey, string>
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
      return json({
        sections,
        warnings: toList(parsed?.warnings),
        missingInformation: toList(parsed?.missingInformation),
        templateNames,
        templateName: templateNames.length > 0 ? templateNames.join(', ') : undefined,
      })
    } catch (error) {
      if ((error as Error)?.name === 'TimeoutError')
        return fail('The AI took too long to respond. Please try again.', 504)
      console.error('❌ Failed to generate contract:', error)
      return fail('Failed to generate contract', 500)
    }
  }
}

/* ═════════════════════════ RECIPIENT side ═════════════════════════ */

export interface RecipientScope {
  /** Logged-in recipient's user id, or null → 403. */
  recipient: (req: NextRequest) => Promise<number | null>
}

/** Events the recipient sees ("created", "ai_drafted" and notes stay internal). */
const VISIBLE_EVENTS = new Set([
  'sent',
  'signed',
  'manager_signed',
  'renewed',
  'extended',
  'terminated',
])

async function loadReceived(payload: any, id: string, userId: number) {
  const contract = await payload.findByID({
    collection: 'employee-contracts',
    id,
    depth: 0,
    overrideAccess: true,
    disableErrors: true,
  })
  if (!contract || Number(relId(contract.employee)) !== userId || contract.status === 'draft')
    return null
  return contract
}

const lastSent = (history: any[] = []) =>
  [...history].reverse().find((h) => h?.type === 'sent')?.date ?? null
const displayStatus = (d: any) =>
  d.signedAt && !d.managerSignedAt && d.status !== 'terminated'
    ? 'pending_manager_signature'
    : (d.displayStatus ?? d.status)

/** GET — contracts sent to me (never drafts), newest first. */
export function recipientListHandler(scope: RecipientScope) {
  return async function GET(req: NextRequest) {
    try {
      const userId = await scope.recipient(req)
      if (userId === null) return fail('Not authorized', 403)
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'employee-contracts',
        where: { and: [{ employee: { equals: userId } }, { status: { not_equals: 'draft' } }] },
        sort: '-createdAt',
        limit: 100,
        depth: 0,
        overrideAccess: true,
      })
      const list = docs as any[]
      if (!list.length) return json({ data: [] })
      const ids = list.map((d) => d.id)
      const senderIds = [...new Set(list.map((d) => relId(d.manager)).filter((v) => v != null))]
      const [contents, senders] = await Promise.all([
        payload.find({
          collection: 'contract-documents',
          where: { contract: { in: ids } },
          limit: ids.length,
          depth: 0,
          overrideAccess: true,
        }),
        senderIds.length
          ? payload.find({
              collection: 'users',
              where: { id: { in: senderIds } },
              limit: senderIds.length,
              depth: 0,
              overrideAccess: true,
            })
          : Promise.resolve({ docs: [] as any[] }),
      ])
      const contentBy = new Map((contents.docs as any[]).map((c) => [String(relId(c.contract)), c]))
      const nameBy = new Map(
        (senders.docs as any[]).map((u) => [String(u.id), u.name || u.email || '']),
      )
      return json({
        data: list.map((d) => {
          const c = contentBy.get(String(d.id))
          return {
            id: String(d.id),
            title: d.title ?? '',
            status: d.status,
            displayStatus: displayStatus(d),
            contractType: d.contractType,
            employmentExtent: d.employmentExtent,
            startDate: d.startDate ?? null,
            endDate: d.endDate ?? null,
            signingMethod: d.signingMethod ?? null,
            signedAt: d.signedAt ?? null,
            managerSignedAt: d.managerSignedAt ?? null,
            sentAt: lastSent(d.history),
            companyName: c?.companyName ?? '',
            positionTitle: c?.positionTitle || d.employeeTitle || '',
            senderName: nameBy.get(String(relId(d.manager))) ?? '',
          }
        }),
      })
    } catch (error) {
      console.error('❌ Failed to load received contracts:', error)
      return fail('Failed to load contracts', 500)
    }
  }
}

/** GET — one received contract with its full text and both signatures. */
export function recipientItemHandler(scope: RecipientScope) {
  return async function GET(req: NextRequest, { params }: Ctx) {
    try {
      const { id } = await params
      const userId = await scope.recipient(req)
      if (userId === null) return fail('Not authorized', 403)
      const payload = await getPayload({ config })
      const d: any = await loadReceived(payload, id, userId)
      if (!d) return fail('Contract not found', 404)
      const [c, sender]: any[] = await Promise.all([
        findContractDocument(payload, d.id),
        relId(d.manager) != null
          ? payload.findByID({
              collection: 'users',
              id: relId(d.manager),
              depth: 0,
              overrideAccess: true,
              disableErrors: true,
            })
          : null,
      ])
      const content = c ?? {}
      return json({
        data: {
          id: String(d.id),
          title: d.title ?? '',
          status: d.status,
          displayStatus: displayStatus(d),
          contractType: d.contractType,
          employmentExtent: d.employmentExtent,
          startDate: d.startDate ?? null,
          endDate: d.endDate ?? null,
          signingMethod: d.signingMethod ?? null,
          signedAt: d.signedAt ?? null,
          signedByName: d.signedByName ?? null,
          signatureDataUrl: d.signatureDataUrl ?? null,
          managerSignedAt: d.managerSignedAt ?? null,
          managerSignedByName: d.managerSignedByName ?? null,
          managerSignatureDataUrl: d.managerSignatureDataUrl ?? null,
          sentAt: lastSent(d.history),
          history: (d.history ?? [])
            .filter((h: any) => VISIBLE_EVENTS.has(h?.type))
            .map((h: any) => ({ id: String(h.id ?? h.date), type: h.type, date: h.date })),
          senderName: sender?.name || sender?.email || '',
          employeeName: d.employeeName ?? '',
          sections: content.sections ?? {},
          documentStyle: content.documentStyle ?? {},
          companyName: content.companyName ?? '',
          orgNumber: content.orgNumber ?? '',
          companyAddress: content.companyAddress ?? '',
          contactPerson: content.contactPerson ?? '',
          personalNumber: content.personalNumber ?? '',
          employeeAddress: content.employeeAddress ?? '',
          positionTitle: content.positionTitle || d.employeeTitle || '',
          workplace: content.workplace ?? '',
          signingPlace: content.signingPlace ?? '',
          signingDate: content.signingDate ?? null,
          companyLogo:
            typeof content.companyLogo === 'string' && content.companyLogo
              ? content.companyLogo
              : null,
        },
      })
    } catch (error) {
      console.error('❌ Failed to load contract:', error)
      return fail('Failed to load contract', 500)
    }
  }
}

/** POST — the recipient signs (VeroCV signing). body: { fullName, signatureDataUrl, typedName, consent } */
export function recipientSignHandler(scope: RecipientScope) {
  return async function POST(req: NextRequest, { params }: Ctx) {
    try {
      const { id } = await params
      const userId = await scope.recipient(req)
      if (userId === null) return fail('Not authorized', 403)
      const sig = readSignature(await req.json().catch(() => ({})))
      if ('error' in sig) return fail(sig.error!, 400)

      const payload = await getPayload({ config })
      const contract: any = await loadReceived(payload, id, userId)
      if (!contract) return fail('Contract not found', 404)
      if (contract.status !== 'pending_signature' || contract.signedAt)
        return fail('This contract is not waiting for your signature', 409)
      if (contract.signingMethod !== 'verocv')
        return fail('This contract must be signed with BankID', 409)

      const now = new Date().toISOString()
      const updated: any = await payload.update({
        collection: 'employee-contracts',
        id,
        overrideAccess: true,
        data: {
          signedAt: now,
          signedByName: sig.fullName,
          signatureDataUrl: sig.signatureDataUrl,
          signatureTypedName: sig.typedName,
          history: [
            ...(contract.history ?? []),
            { type: 'signed', date: now, note: auditNote(req, 'verocv', userId) },
          ],
        } as any,
      })
      return json({
        data: { id: String(updated.id), status: updated.status, signedAt: updated.signedAt },
      })
    } catch (error) {
      console.error('❌ Failed to sign contract:', error)
      return fail('Failed to sign contract', 500)
    }
  }
}

/** GET — the fully signed PDF (?download=1 to download). */
export function recipientPdfHandler(scope: RecipientScope) {
  return async function GET(req: NextRequest, { params }: Ctx) {
    try {
      const { id } = await params
      const userId = await scope.recipient(req)
      if (userId === null) return fail('Not authorized', 403)
      const payload = await getPayload({ config })
      const contract = await loadReceived(payload, id, userId)
      if (!contract) return fail('Contract not found', 404)
      if (!contract.signedAt || !contract.managerSignedAt)
        return fail('The contract is not signed by both parties yet', 409)
      return pdfResponse(payload, contract, req.nextUrl.searchParams.get('download') === '1')
    } catch (error) {
      console.error('❌ Failed to load contract PDF:', error)
      return fail('Failed to load contract PDF', 500)
    }
  }
}
