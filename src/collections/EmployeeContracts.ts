// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/collections/EmployeeContracts/index.ts
// WHAT IT DOES:   Payload collection 'employee-contracts': contract list, status, recipient,
//                 employee + manager signatures, history.
//
// Register it in payload.config.ts → collections: [ ... ]
// ══════════════════════════════════════════════════════════════════════

import type { Access, CollectionConfig, FieldHook, Where } from 'payload'
import { APIError } from 'payload'

/* ═════════════════════════════════════════════════════════════
   EMPLOYEE CONTRACTS — the contract list page (ManagerContracts)
   One row per contract: who it's for, type, dates, lifecycle status,
   recipient, signing method + signature, and the full event history.

   Editor content lives in `contract-documents` (1:1, auto-created).
   Generated PDFs live in `contract-pdfs` (1:many).

   The app talks to this collection through next-auth routes:
     /api/company/managers/employee-contracts/*   (manager)
     /api/user/contracts/*                        (employee)
═════════════════════════════════════════════════════════════ */

export const EXPIRING_SOON_DAYS = 30

const isAdmin = (user: any) => user?.roles === 'admin'
const isManager = (user: any) => user?.roles === 'client-manager' || user?.roles === 'client-admin'
const adminOnlyField = ({ req: { user } }: any) => isAdmin(user)
const relId = (v: any) => (v == null || v === '' ? null : typeof v === 'object' ? v.id : v)

const CONTRACT_TYPES = [
  { label: 'Permanent (Tillsvidare)', value: 'permanent' },
  { label: 'Temporary (Visstid)', value: 'temporary' },
  { label: 'On-call (Behovsanställning)', value: 'on_call' },
  { label: 'Consultant (Konsult)', value: 'consultant' },
]

const HISTORY_TYPES = [
  { label: 'Created', value: 'created' },
  { label: 'Sent', value: 'sent' },
  { label: 'Signed (employee)', value: 'signed' },
  { label: 'Signed (manager)', value: 'manager_signed' },
  { label: 'Renewed', value: 'renewed' },
  { label: 'Extended', value: 'extended' },
  { label: 'Terminated', value: 'terminated' },
  { label: 'AI drafted', value: 'ai_drafted' },
]

const STATUSES = [
  { label: 'Draft', value: 'draft' },
  { label: 'Pending signature (employee)', value: 'pending_signature' },
  { label: 'Awaiting manager signature', value: 'pending_manager_signature' },
  { label: 'Active (fully signed)', value: 'active' },
  { label: 'Terminated', value: 'terminated' },
]

const DISPLAY_STATUSES = [
  ...STATUSES,
  { label: 'Expiring soon', value: 'expiring_soon' },
  { label: 'Expired', value: 'expired' },
]

const EMPTY_STRING_TO_NULL = [
  'employee',
  'recipientEmail',
  'endDate',
  'signingMethod',
  'signedAt',
  'bankIdSignedAt',
  'managerSignedAt',
]

/* ─── Access (admin panel / Payload REST — the app uses its own routes) ─── */
const canCreate: Access = ({ req: { user } }) => isAdmin(user) || isManager(user)

const canRead: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isAdmin(user)) return true
  if (isManager(user)) return { manager: { equals: user.id } }
  return {
    and: [{ employee: { equals: user.id } }, { status: { not_equals: 'draft' } }],
  } as Where
}

const canUpdate: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isAdmin(user)) return true
  if (isManager(user)) return { manager: { equals: user.id } }
  return false
}

const canDelete: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isAdmin(user)) return true
  if (isManager(user)) {
    return { and: [{ manager: { equals: user.id } }, { status: { equals: 'draft' } }] } as Where
  }
  return false
}

/* ─── Helpers ─── */
// draft → pending_signature (sent) → pending_manager_signature (employee signed)
//       → active (manager signed too — fully signed) → terminated
function deriveStatus(
  history: any[] = [],
  signedAt?: string | null,
  managerSignedAt?: string | null,
) {
  if (history.some((h) => h?.type === 'terminated')) return 'terminated'
  if (signedAt && managerSignedAt) return 'active'
  if (signedAt) return 'pending_manager_signature'
  if (history.some((h) => h?.type === 'sent')) return 'pending_signature'
  return 'draft'
}

const computeDisplayStatus: FieldHook = ({ siblingData }) => {
  const status = siblingData?.status
  if (status !== 'active' || !siblingData?.endDate) return status
  const msLeft = new Date(siblingData.endDate).getTime() - Date.now()
  if (msLeft < 0) return 'expired'
  if (msLeft / 86_400_000 <= EXPIRING_SOON_DAYS) return 'expiring_soon'
  return 'active'
}

/* ─── Collection ─── */
export const EmployeeContracts: CollectionConfig = {
  slug: 'employee-contracts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'employeeName', 'contractType', 'status', 'startDate', 'endDate'],
    group: 'Contracts',
  },
  access: { create: canCreate, read: canRead, update: canUpdate, delete: canDelete },
  timestamps: true,

  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data
        for (const key of EMPTY_STRING_TO_NULL) if (data[key] === '') data[key] = null
        if (typeof data.recipientEmail === 'string')
          data.recipientEmail = data.recipientEmail.trim().toLowerCase()
        return data
      },
    ],

    beforeChange: [
      ({ data, originalDoc, operation, req }) => {
        const admin = isAdmin(req.user)

        if (operation === 'create' && req.user && !admin) data.manager = req.user.id

        if (operation === 'update' && !admin) {
          if (originalDoc?.status === 'terminated') {
            throw new APIError('A terminated contract can no longer be changed.', 403)
          }
          // History is an audit log: entries can be added, never removed.
          if (
            Array.isArray(data.history) &&
            data.history.length < (originalDoc?.history?.length ?? 0)
          ) {
            throw new APIError('Contract history is append-only.', 403)
          }
        }

        data.status = deriveStatus(
          data.history ?? originalDoc?.history,
          data.signedAt !== undefined ? data.signedAt : originalDoc?.signedAt,
          data.managerSignedAt !== undefined ? data.managerSignedAt : originalDoc?.managerSignedAt,
        )
        if (!data.title && !originalDoc?.title) data.title = 'Untitled contract'
        return data
      },
    ],

    afterChange: [
      // Keep the editor document and PDFs in sync with ownership + status.
      async ({ doc, previousDoc, operation, req, context }) => {
        if (context?.fromDocument) return doc

        const sync = {
          manager: relId(doc.manager),
          employee: relId(doc.employee),
          contractStatus: doc.status,
        }

        if (operation === 'create') {
          await req.payload.create({
            collection: 'contract-documents',
            data: { contract: doc.id, ...sync },
            req,
            overrideAccess: true,
            context: { fromContract: true },
          })
          return doc
        }

        const changed =
          relId(previousDoc?.manager) !== sync.manager ||
          relId(previousDoc?.employee) !== sync.employee ||
          previousDoc?.status !== sync.contractStatus

        if (changed) {
          await req.payload.update({
            collection: 'contract-documents',
            where: { contract: { equals: doc.id } },
            data: sync,
            req,
            overrideAccess: true,
            context: { fromContract: true },
          })
          await req.payload.update({
            collection: 'contract-pdfs',
            where: { contract: { equals: doc.id } },
            data: { manager: sync.manager, employee: sync.employee },
            req,
            overrideAccess: true,
            context: { fromContract: true },
          })
        }
        return doc
      },
    ],

    afterDelete: [
      async ({ doc, req }) => {
        await req.payload.delete({
          collection: 'contract-documents',
          where: { contract: { equals: doc.id } },
          req,
          overrideAccess: true,
        })
        await req.payload.delete({
          collection: 'contract-pdfs',
          where: { contract: { equals: doc.id } },
          req,
          overrideAccess: true,
        })
      },
    ],
  },

  fields: [
    { name: 'title', type: 'text', admin: { readOnly: true } },
    {
      name: 'status',
      type: 'select',
      options: STATUSES,
      defaultValue: 'draft',
      index: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'displayStatus',
      type: 'select',
      options: DISPLAY_STATUSES,
      virtual: true,
      admin: { readOnly: true, position: 'sidebar' },
      hooks: { afterRead: [computeDisplayStatus] },
    },
    {
      name: 'manager',
      label: 'Created by (manager)',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      access: { update: adminOnlyField },
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'employee',
      label: 'Employee (user account)',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      // The VeroCV account email the contract was sent to (for display/audit).
      // Delivery itself is in-app: the contract appears in that employee's dashboard.
      name: 'recipientEmail',
      label: 'Recipient (VeroCV account email)',
      type: 'email',
      index: true,
      admin: { position: 'sidebar' },
    },

    // Admin-only convenience: shows the linked editor document and PDFs.
    {
      name: 'document',
      label: 'Editor document',
      type: 'join',
      collection: 'contract-documents',
      on: 'contract',
    },
    { name: 'pdfs', label: 'PDF files', type: 'join', collection: 'contract-pdfs', on: 'contract' },

    {
      type: 'tabs',
      tabs: [
        {
          label: 'Overview',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'employeeName', type: 'text' },
                { name: 'employeeInitials', type: 'text', maxLength: 4 },
                { name: 'employeeTitle', type: 'text' },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'contractType',
                  type: 'select',
                  options: CONTRACT_TYPES,
                  defaultValue: 'permanent',
                  required: true,
                },
                {
                  name: 'employmentExtent',
                  type: 'select',
                  options: [
                    { label: 'Full-time (Heltid)', value: 'full_time' },
                    { label: 'Part-time (Deltid)', value: 'part_time' },
                  ],
                  defaultValue: 'full_time',
                  required: true,
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'startDate', type: 'date' },
                { name: 'endDate', type: 'date' },
              ],
            },
          ],
        },
        {
          label: 'Signing',
          fields: [
            {
              name: 'signingMethod',
              type: 'select',
              options: [
                { label: 'BankID', value: 'bankid' },
                { label: 'VeroCV signature', value: 'verocv' },
              ],
              access: { update: adminOnlyField },
            },
            { name: 'signedAt', type: 'date', access: { update: adminOnlyField } },
            { name: 'signedByName', type: 'text', access: { update: adminOnlyField } },
            { name: 'signatureTypedName', type: 'text', access: { update: adminOnlyField } },
            {
              // A PNG of the signature as a data URL. Payload limits text fields to
              // 40 000 characters by default (defaultMaxTextLength) — a signature image
              // is longer, which caused "Signature Data Url is invalid". Allow up to
              // ~750 KB here (the sign route accepts at most 700 000 characters).
              name: 'signatureDataUrl',
              type: 'textarea',
              maxLength: 750_000,
              access: { update: adminOnlyField },
              admin: { readOnly: true },
            },
            { name: 'bankIdSignedAt', type: 'date', access: { update: adminOnlyField } },

            // ── Manager (employer) signature — set by the manager sign route ──
            { name: 'managerSignedAt', type: 'date', access: { update: adminOnlyField } },
            { name: 'managerSignedByName', type: 'text', access: { update: adminOnlyField } },
            { name: 'managerSignatureTypedName', type: 'text', access: { update: adminOnlyField } },
            {
              name: 'managerSignatureDataUrl',
              type: 'textarea',
              maxLength: 750_000, // see signatureDataUrl above
              access: { update: adminOnlyField },
              admin: { readOnly: true },
            },
          ],
        },
        {
          label: 'History',
          fields: [
            {
              name: 'history',
              type: 'array',
              fields: [
                { name: 'type', type: 'select', options: HISTORY_TYPES, required: true },
                {
                  name: 'date',
                  type: 'date',
                  required: true,
                  admin: { date: { pickerAppearance: 'dayAndTime' } },
                },
                { name: 'note', type: 'textarea' },
              ],
            },
          ],
        },
      ],
    },
  ],
}

export default EmployeeContracts
