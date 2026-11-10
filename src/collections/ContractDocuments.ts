// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/collections/ContractDocuments/index.ts
// WHAT IT DOES:   Payload collection 'contract-documents': editor content (parties, terms, sections, style, AI log).
//
// Register it in payload.config.ts → collections: [ ... ]
// ══════════════════════════════════════════════════════════════════════

import type { Access, CollectionConfig, Where } from 'payload'
import { APIError } from 'payload'

/* ═════════════════════════════════════════════════════════════
   CONTRACT DOCUMENTS — everything on the contract editor page
   (ManagerContractEditor + PersonalInfoDialog + GenerateContractDialog):
   party details, terms, the rich-text sections, document style,
   which reference templates were used and every AI generation.

   Exactly one per contract. Created automatically when a contract
   is created — never create these directly.
═════════════════════════════════════════════════════════════ */

const isAdmin = (user: any) => user?.roles === 'admin'
const isManager = (user: any) => user?.roles === 'client-manager' || user?.roles === 'client-admin'
const adminOnlyField = ({ req: { user } }: any) => isAdmin(user)
const relId = (v: any) => (v == null || v === '' ? null : typeof v === 'object' ? v.id : v)

const runsToText = (runs: unknown): string =>
  Array.isArray(runs)
    ? runs.map((r: any) => (typeof r?.text === 'string' ? r.text : '')).join('')
    : ''

const titleFrom = (doc: any): string =>
  runsToText(doc?.sections?.agreementTitle) ||
  runsToText(doc?.sections?.position) ||
  doc?.positionTitle ||
  'Untitled contract'

const EMPTY_STRING_TO_NULL = [
  'noticePeriod',
  'payDay',
  'vacationDaysPerYear',
  'hasCollectiveAgreement',
  'signingDate',
]

/* ─── Access ─── */
const canRead: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isAdmin(user)) return true
  if (isManager(user)) return { manager: { equals: user.id } }
  // The employee needs to read the text to sign it — but never a draft.
  return {
    and: [{ employee: { equals: user.id } }, { contractStatus: { not_equals: 'draft' } }],
  } as Where
}

const canUpdate: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isAdmin(user)) return true
  if (isManager(user)) return { manager: { equals: user.id } }
  return false
}

/* ─── Collection ─── */
export const ContractDocuments: CollectionConfig = {
  slug: 'contract-documents',
  admin: {
    useAsTitle: 'positionTitle',
    defaultColumns: ['positionTitle', 'contract', 'companyName', 'contractStatus', 'updatedAt'],
    group: 'Contracts',
  },
  access: {
    create: ({ req: { user } }) => isAdmin(user), // created by the contract hook
    read: canRead,
    update: canUpdate,
    delete: ({ req: { user } }) => isAdmin(user), // deleted with its contract
  },
  timestamps: true,

  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data
        for (const key of EMPTY_STRING_TO_NULL) if (data[key] === '') data[key] = null
        return data
      },
    ],
    beforeChange: [
      ({ originalDoc, operation, req, context, data }) => {
        // Once sent, the text the employee is signing must not change.
        if (
          operation === 'update' &&
          !context?.fromContract &&
          !isAdmin(req.user) &&
          originalDoc?.contractStatus &&
          originalDoc.contractStatus !== 'draft'
        ) {
          throw new APIError(
            'This contract has been sent and can no longer be edited. Create a new contract instead.',
            403,
          )
        }
        return data
      },
    ],
    afterChange: [
      // Push the agreement title up to the contract so the list page can show it.
      async ({ doc, previousDoc, req, context }) => {
        if (context?.fromContract) return doc
        const title = titleFrom(doc)
        if (title !== titleFrom(previousDoc)) {
          await req.payload.update({
            collection: 'employee-contracts',
            id: relId(doc.contract),
            data: { title },
            req,
            overrideAccess: true,
            context: { fromDocument: true },
          })
        }
        return doc
      },
    ],
  },

  fields: [
    {
      name: 'contract',
      type: 'relationship',
      relationTo: 'employee-contracts',
      required: true,
      unique: true,
      index: true,
      access: { update: adminOnlyField },
      admin: { readOnly: true, position: 'sidebar' },
    },
    // Denormalized from the contract (kept in sync by its afterChange hook) for access rules.
    {
      name: 'manager',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      access: { update: adminOnlyField },
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'employee',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      access: { update: adminOnlyField },
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'contractStatus',
      type: 'select',
      options: ['draft', 'pending_signature', 'pending_manager_signature', 'active', 'terminated'],
      defaultValue: 'draft',
      index: true,
      access: { update: adminOnlyField },
      admin: { readOnly: true, position: 'sidebar' },
    },

    {
      type: 'tabs',
      tabs: [
        {
          label: 'Parties',
          fields: [
            {
              type: 'collapsible',
              label: 'Employer (Arbetsgivare)',
              fields: [
                { name: 'companyName', type: 'text' },
                { name: 'orgNumber', label: 'Org. number', type: 'text' },
                { name: 'companyAddress', type: 'textarea' },
                { name: 'contactPerson', type: 'text' },
              ],
            },
            {
              type: 'collapsible',
              label: 'Employee (Arbetstagare)',
              fields: [
                { name: 'personalNumber', label: 'Personnummer', type: 'text' },
                { name: 'employeeAddress', type: 'textarea' },
              ],
            },
          ],
        },
        {
          label: 'Terms',
          fields: [
            { name: 'positionTitle', type: 'text' },
            { name: 'workplace', type: 'text' },
            {
              name: 'noticePeriod',
              type: 'select',
              options: [
                { label: '1 month', value: '1_month' },
                { label: '2 months', value: '2_months' },
                { label: '3 months', value: '3_months' },
              ],
            },
            { name: 'monthlySalaryAmount', type: 'text' },
            {
              name: 'payDay',
              type: 'select',
              options: [
                { label: 'The 25th', value: '25th' },
                { label: 'Last business day', value: 'last_business_day' },
              ],
            },
            {
              name: 'vacationDaysPerYear',
              type: 'select',
              options: [
                { label: '25', value: '25' },
                { label: '28', value: '28' },
                { label: '30', value: '30' },
              ],
            },
            { name: 'otherBenefits', type: 'textarea' },
            { name: 'otherNotes', type: 'textarea' },
            {
              name: 'hasCollectiveAgreement',
              type: 'select',
              options: [
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'signingPlace', type: 'text' },
                { name: 'signingDate', type: 'date' },
              ],
            },
          ],
        },
        {
          label: 'Content',
          fields: [
            {
              // The company logo as a PNG data URL (resized in the browser to max 600 px).
              // Shown small at the top of the contract, and as a faint watermark on the
              // signed PDF. Payload limits text fields to 40 000 characters by default,
              // so the limit is raised here.
              name: 'companyLogo',
              label: 'Company logo',
              type: 'textarea',
              maxLength: 1_500_000,
              admin: { readOnly: true },
            },
            {
              // Record<SectionKey, RichRun[]> — stored as-is so per-run
              // bold/color/font/size round-trips untouched.
              name: 'sections',
              type: 'json',
              defaultValue: {},
              validate: (value: unknown) =>
                value == null || (typeof value === 'object' && !Array.isArray(value))
                  ? true
                  : 'Sections must be an object keyed by section name',
            },
            {
              name: 'documentStyle',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'headingFont', type: 'text' },
                    { name: 'headingColor', type: 'text', defaultValue: '#051650' },
                    { name: 'headingSize', type: 'number', defaultValue: 13 },
                    { name: 'headingBold', type: 'checkbox', defaultValue: true },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'bodyFont', type: 'text' },
                    { name: 'bodyColor', type: 'text', defaultValue: '#1f2937' },
                    { name: 'bodySize', type: 'number', defaultValue: 10 },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'AI & templates',
          fields: [
            {
              name: 'referenceTemplates',
              label: 'Reference files used',
              type: 'relationship',
              relationTo: 'contract-templates',
              hasMany: true,
            },
            {
              // One entry per "Generate Draft" click in GenerateContractDialog.
              name: 'aiDrafts',
              type: 'array',
              fields: [
                {
                  name: 'mode',
                  type: 'select',
                  options: [
                    { label: 'AI from scratch', value: 'ai_scratch' },
                    { label: 'From template', value: 'from_template' },
                    { label: 'AI with templates', value: 'ai_with_templates' },
                  ],
                  required: true,
                },
                { name: 'prompt', type: 'textarea' },
                {
                  name: 'templates',
                  type: 'relationship',
                  relationTo: 'contract-templates',
                  hasMany: true,
                },
                {
                  name: 'generatedAt',
                  type: 'date',
                  admin: { date: { pickerAppearance: 'dayAndTime' } },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

export default ContractDocuments
