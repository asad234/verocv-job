// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/collections/ManagerDeletions/index.ts   (NEW)
//                 + add it to `collections: [...]` in payload.config.ts
// WHAT IT DOES:   A record of every manager a business admin deleted, and why
//                 (fired, left the job, contract ended, created by mistake, other).
//                 The manager's account itself is gone — this keeps the who/why/when.
//                 Written only by DELETE /api/company/admin/managers/:id.
// ══════════════════════════════════════════════════════════════════════

import type { Access, CollectionConfig, Where } from 'payload'

const readOwn: Access = ({ req: { user } }) => {
  if (!user) return false
  if ((user as any).roles === 'admin') return true
  if ((user as any).roles !== 'client-admin') return false
  const where: Where = { deletedBy: { equals: user.id } }
  return where
}
const adminOnly: Access = ({ req: { user } }) => (user as any)?.roles === 'admin'

const ManagerDeletions: CollectionConfig = {
  slug: 'manager-deletions',
  admin: {
    useAsTitle: 'managerName',
    defaultColumns: ['managerName', 'managerEmail', 'reason', 'deletedBy', 'createdAt'],
    description: 'Managers deleted by a business admin, with the reason.',
  },
  access: { read: readOwn, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    { name: 'managerName', type: 'text', required: true },
    { name: 'managerEmail', type: 'email' },
    {
      name: 'managerId',
      type: 'number',
      admin: { description: 'The deleted user id (the account no longer exists).' },
    },
    {
      name: 'reason',
      type: 'select',
      required: true,
      options: [
        { label: 'Fired', value: 'fired' },
        { label: 'Left the job', value: 'left_job' },
        { label: 'Contract ended', value: 'contract_ended' },
        { label: 'Created by mistake', value: 'created_by_mistake' },
        { label: 'Other', value: 'other' },
      ],
    },
    { name: 'note', type: 'textarea' },
    { name: 'deletedBy', type: 'relationship', relationTo: 'users' },
    {
      name: 'removed',
      type: 'json',
      admin: { description: 'How many records were removed per collection.' },
    },
  ],
  timestamps: true,
}

export default ManagerDeletions
