// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/collections/ManagerAvailability/index.ts   (NEW)
//                 + add it to `collections: [...]` in payload.config.ts
// WHAT IT DOES:   One record per manager: their normal working week and a
//                 "right now" status the business admin sees.
//   weekly[]   Mon…Sun → available (whole day) / partial (from–to) / off
//   status     auto (follow the week) / available / limited / unavailable, + note + until
// All changes go through /api/company/managers/availability (overrideAccess).
// After adding: pnpm payload generate:types   (Postgres: migrate:create + migrate)
// ══════════════════════════════════════════════════════════════════════

import type { Access, CollectionConfig, Where } from 'payload'

const readOwn: Access = ({ req: { user } }) => {
  if (!user) return false
  if ((user as any).roles === 'admin') return true
  const where: Where = { manager: { equals: user.id } }
  return where
}
const adminOnly: Access = ({ req: { user } }) => (user as any)?.roles === 'admin'
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

const ManagerAvailability: CollectionConfig = {
  slug: 'manager-availability',
  admin: {
    defaultColumns: ['manager', 'status', 'statusUntil', 'updatedAt'],
    description: 'Managers’ working week and current availability.',
  },
  access: { read: readOwn, create: adminOnly, update: adminOnly, delete: adminOnly },
  timestamps: true,
  fields: [
    {
      name: 'manager',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'weekly',
      label: 'Working week',
      type: 'array',
      maxRows: 7,
      fields: [
        {
          name: 'day',
          type: 'select',
          required: true,
          options: [
            { label: 'Monday', value: '1' },
            { label: 'Tuesday', value: '2' },
            { label: 'Wednesday', value: '3' },
            { label: 'Thursday', value: '4' },
            { label: 'Friday', value: '5' },
            { label: 'Saturday', value: '6' },
            { label: 'Sunday', value: '7' },
          ],
        },
        {
          name: 'mode',
          type: 'select',
          required: true,
          defaultValue: 'available',
          options: [
            { label: 'Available', value: 'available' },
            { label: 'Partly (from–to)', value: 'partial' },
            { label: 'Off', value: 'off' },
          ],
        },
        {
          name: 'start',
          type: 'text',
          validate: (v: unknown) => !v || TIME.test(String(v)) || 'HH:MM',
        },
        {
          name: 'end',
          type: 'text',
          validate: (v: unknown) => !v || TIME.test(String(v)) || 'HH:MM',
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'auto',
      options: [
        { label: 'Follow working week', value: 'auto' },
        { label: 'Available', value: 'available' },
        { label: 'Limited (busy)', value: 'limited' },
        { label: 'Unavailable', value: 'unavailable' },
      ],
    },
    { name: 'statusNote', type: 'text', maxLength: 200 },
    {
      name: 'statusUntil',
      label: 'Status until (YYYY-MM-DD, empty = until changed)',
      type: 'text',
    },
  ],
}

export default ManagerAvailability
