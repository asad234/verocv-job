// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/collections/ContractPdfs/index.ts
// WHAT IT DOES:   Payload collection 'contract-pdfs': PDF files (preview / sent / signed).
//                 The signed PDF is created automatically when the employee signs.
//
// Register it in payload.config.ts → collections: [ ... ]
// ══════════════════════════════════════════════════════════════════════

import path from 'node:path'
import type { Access, CollectionConfig, Where } from 'payload'
import { APIError } from 'payload'

/* ═════════════════════════════════════════════════════════════
   CONTRACT PDFs — only the finished PDF files.
   Many per contract: previews, the version that was sent, and the
   signed copy. Uploaded files are immutable (no updates, except admin).
═════════════════════════════════════════════════════════════ */

// Absolute path so the server can read the files back for downloads.
export const CONTRACT_PDFS_DIR = path.resolve(process.cwd(), 'media/contract-pdfs')

const isAdmin = (user: any) => user?.roles === 'admin'
const isManager = (user: any) => user?.roles === 'client-manager' || user?.roles === 'client-admin'
const adminOnlyField = ({ req: { user } }: any) => isAdmin(user)
const relId = (v: any) => (v == null || v === '' ? null : typeof v === 'object' ? v.id : v)

/* ─── Access (admin panel / Payload REST — the app downloads via its own routes) ─── */
const canRead: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isAdmin(user)) return true
  if (isManager(user)) return { manager: { equals: user.id } }
  // Employees see the sent and signed versions of their own contracts.
  return {
    and: [{ employee: { equals: user.id } }, { kind: { in: ['sent', 'signed'] } }],
  } as Where
}

const canDelete: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isAdmin(user)) return true
  if (isManager(user)) {
    // Previews can be cleaned up; sent/signed copies are legal records.
    return { and: [{ manager: { equals: user.id } }, { kind: { equals: 'preview' } }] } as Where
  }
  return false
}

export const ContractPdfs: CollectionConfig = {
  slug: 'contract-pdfs',
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'contract', 'kind', 'version', 'createdAt'],
    group: 'Contracts',
  },
  upload: {
    // Local disk by default — use a storage adapter (S3, Vercel Blob…) in production.
    staticDir: CONTRACT_PDFS_DIR,
    mimeTypes: ['application/pdf'],
  },
  access: {
    create: ({ req: { user } }) => isAdmin(user) || isManager(user),
    read: canRead,
    update: ({ req: { user } }) => isAdmin(user),
    delete: canDelete,
  },
  timestamps: true,

  hooks: {
    beforeChange: [
      async ({ data, operation, req, context }) => {
        if (operation !== 'create' || context?.fromContract) return data

        const contractId = relId(data.contract)
        if (!contractId) throw new APIError('A contract is required.', 400)

        // Server-side calls (no req.user, e.g. the signed PDF created when signing) and
        // admins are trusted; a manager uploading via REST may only attach PDFs to own contracts.
        const trusted = !req.user || isAdmin(req.user)
        const contract = await req.payload
          .findByID({
            collection: 'employee-contracts',
            id: contractId,
            depth: 0,
            req,
            overrideAccess: trusted,
          })
          .catch(() => null)
        if (!contract) throw new APIError('Contract not found.', 404)

        const { totalDocs } = await req.payload.count({
          collection: 'contract-pdfs',
          where: { contract: { equals: contractId } },
          req,
          overrideAccess: true,
        })

        data.manager = relId(contract.manager)
        data.employee = relId(contract.employee)
        data.contractStatusAtUpload = contract.status
        data.version = totalDocs + 1
        return data
      },
    ],
  },

  fields: [
    {
      name: 'contract',
      type: 'relationship',
      relationTo: 'employee-contracts',
      required: true,
      index: true,
    },
    {
      name: 'kind',
      type: 'select',
      required: true,
      defaultValue: 'preview',
      options: [
        { label: 'Preview / draft', value: 'preview' },
        { label: 'Sent for signature', value: 'sent' },
        { label: 'Signed', value: 'signed' },
      ],
      index: true,
      admin: { position: 'sidebar' },
    },
    { name: 'version', type: 'number', admin: { readOnly: true, position: 'sidebar' } },
    {
      name: 'contractStatusAtUpload',
      type: 'text',
      admin: { readOnly: true, position: 'sidebar' },
    },
    // Copied from the contract for access rules.
    {
      name: 'manager',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      access: { update: adminOnlyField },
      admin: { readOnly: true },
    },
    {
      name: 'employee',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      access: { update: adminOnlyField },
      admin: { readOnly: true },
    },
  ],
}

export default ContractPdfs
