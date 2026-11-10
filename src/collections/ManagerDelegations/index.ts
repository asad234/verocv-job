// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/collections/ManagerDelegations/index.ts   (NEW)
//                 + add it to `collections: [...]` in payload.config.ts
// WHAT IT DOES:   A manager ("owner") hands their work to another manager in the
//                 same company ("delegate") while they're away — sick, on vacation…
//
//   pending ──accept──► accepted ──end (either side / end date passes)──► ended
//      │  └─decline──► declined
//      └──cancel (owner)──► cancelled
//
// While accepted and inside startsAt…endsAt, the delegate can switch into the
// owner's workspace and work on everything the owner manages.
//
// All changes go through /api/company/managers/delegations (overrideAccess),
// so the collection itself is read-only for everyone but admins.
//
// After adding: pnpm payload generate:types
// Postgres:     pnpm payload migrate:create && pnpm payload migrate
// ══════════════════════════════════════════════════════════════════════

import type { Access, CollectionConfig, Where } from 'payload'

// Typed as Where so TypeScript accepts the { or: [...] } query.
const readOwnDelegations: Access = ({ req: { user } }) => {
  if (!user) return false
  if ((user as any).roles === 'admin') return true
  const where: Where = {
    or: [{ owner: { equals: user.id } }, { delegate: { equals: user.id } }],
  }
  return where
}

const ManagerDelegations: CollectionConfig = {
  slug: 'manager-delegations',
  admin: {
    defaultColumns: ['owner', 'delegate', 'status', 'reason', 'startsAt', 'endsAt'],
    description: 'Substitute managers covering for an absent manager.',
  },
  access: {
    read: readOwnDelegations,
    create: ({ req: { user } }) => (user as any)?.roles === 'admin',
    update: ({ req: { user } }) => (user as any)?.roles === 'admin',
    delete: ({ req: { user } }) => (user as any)?.roles === 'admin',
  },
  fields: [
    {
      name: 'owner',
      label: 'Absent manager',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'delegate',
      label: 'Substitute manager',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Declined', value: 'declined' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Ended', value: 'ended' },
      ],
    },
    {
      name: 'reason',
      type: 'select',
      defaultValue: 'vacation',
      options: [
        { label: 'Sick leave', value: 'sick' },
        { label: 'Vacation', value: 'vacation' },
        { label: 'Parental leave', value: 'parental' },
        { label: 'Business travel', value: 'travel' },
        { label: 'Other', value: 'other' },
      ],
    },
    { name: 'message', type: 'textarea' },
    { name: 'startsAt', label: 'From', type: 'date' },
    {
      name: 'endsAt',
      label: 'Until',
      type: 'date',
      admin: { description: 'Empty = until someone ends it.' },
    },
    { name: 'respondedAt', type: 'date', admin: { readOnly: true } },
    { name: 'endedAt', type: 'date', admin: { readOnly: true } },
    {
      name: 'endedBy',
      type: 'select',
      options: [
        { label: 'Absent manager', value: 'owner' },
        { label: 'Substitute', value: 'delegate' },
      ],
      admin: { readOnly: true },
    },
  ],
  timestamps: true,
}

export default ManagerDelegations
