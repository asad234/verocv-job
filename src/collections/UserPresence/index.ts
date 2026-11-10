// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/collections/UserPresence/index.ts   (NEW)
//                 + add it to `collections: [...]` in payload.config.ts
// WHAT IT DOES:   Each person's chat status — Available, Busy, In a meeting,
//                 Away, Not at the office, Not available, Appear offline —
//                 with an optional note and an end time, plus when they last
//                 had VeroCV open (so "Available" turns into "Offline" when
//                 they've closed it).
//                 Written only by /api/chat/presence and the chat unread poll.
//
// After adding: pnpm payload generate:types
// Postgres:     pnpm payload migrate:create && pnpm payload migrate
// ══════════════════════════════════════════════════════════════════════

import type { Access, CollectionConfig, Where } from 'payload'

const readOwn: Access = ({ req: { user } }) => {
  if (!user) return false
  if ((user as any).roles === 'admin') return true
  const where: Where = { user: { equals: user.id } }
  return where
}
const adminOnly: Access = ({ req: { user } }) => (user as any)?.roles === 'admin'

const UserPresence: CollectionConfig = {
  slug: 'user-presence',
  admin: {
    useAsTitle: 'status',
    defaultColumns: ['user', 'status', 'message', 'until', 'lastSeenAt'],
    group: 'Chat',
  },
  access: { read: readOwn, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'available',
      options: [
        { label: 'Available', value: 'available' },
        { label: 'Busy', value: 'busy' },
        { label: 'In a meeting', value: 'in_meeting' },
        { label: 'Away', value: 'away' },
        { label: 'Not at the office', value: 'out_of_office' },
        { label: 'Not available', value: 'not_available' },
        { label: 'Appear offline', value: 'offline' },
      ],
    },
    { name: 'message', type: 'text', maxLength: 80 },
    {
      name: 'until',
      type: 'date',
      admin: {
        description: 'The status ends by itself at this time (back to Available).',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'lastSeenAt',
      type: 'date',
      admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
    },
  ],
  timestamps: true,
}

export default UserPresence
