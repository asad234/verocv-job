import path from 'node:path'
import type { Access, CollectionConfig } from 'payload'

/* ═════════════════════════════════════════════════════════════
   CONTRACT TEMPLATES — the "Reference Files" page.
   The manager's uploaded company contracts / clause libraries,
   used by GenerateContractDialog and the AI generate route.
═════════════════════════════════════════════════════════════ */

// Absolute path so the AI route can read the uploaded files from disk.
export const CONTRACT_TEMPLATES_DIR = path.resolve(process.cwd(), 'media/contract-templates')

const isAdmin = (user: any) => user?.roles === 'admin'
const isManager = (user: any) => user?.roles === 'client-manager' || user?.roles === 'client-admin'

const ownerOrAdmin: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isAdmin(user)) return true
  if (isManager(user)) return { owner: { equals: user.id } }
  return false
}

export const ContractTemplates: CollectionConfig = {
  slug: 'contract-templates',
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'owner', 'filesize', 'createdAt'],
    group: 'Contracts',
  },
  upload: {
    staticDir: CONTRACT_TEMPLATES_DIR,
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },
  access: {
    create: ({ req: { user } }) => isAdmin(user) || isManager(user),
    read: ownerOrAdmin,
    update: ownerOrAdmin,
    delete: ownerOrAdmin,
  },
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === 'create' && req.user && !isAdmin(req.user)) data.owner = req.user.id
        return data
      },
    ],
  },
  fields: [
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    { name: 'notes', type: 'textarea' },
  ],
  timestamps: true,
}

export default ContractTemplates
