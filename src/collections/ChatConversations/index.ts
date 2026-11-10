// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/collections/ChatConversations/index.ts   (NEW)
//                 + add it to `collections: [...]` in payload.config.ts
// WHAT IT DOES:   One chat between two people (employee ↔ manager, manager ↔
//                 manager, manager ↔ company admin, admin ↔ employee).
//                 The messages themselves live in `chat-messages`.
//
//   key          "dm:<lowest user id>:<highest user id>" — one chat per pair
//   members[]    who's in it + when each of them last read it (→ unread counts
//                and "Seen" under your last message)
//   lastMessage  copy of the newest message, so the chat list needs one query
//
// Everything goes through /api/chat/... (overrideAccess), so REST/GraphQL is
// read-only for the members and closed for everyone else.
//
// After adding: pnpm payload generate:types
// Postgres:     pnpm payload migrate:create && pnpm payload migrate
// ══════════════════════════════════════════════════════════════════════

import type { Access, CollectionConfig, Where } from 'payload'

const readOwnConversations: Access = ({ req: { user } }) => {
  if (!user) return false
  if ((user as any).roles === 'admin') return true
  const where: Where = { 'members.user': { equals: user.id } }
  return where
}

const adminOnly: Access = ({ req: { user } }) => (user as any)?.roles === 'admin'

const ChatConversations: CollectionConfig = {
  slug: 'chat-conversations',
  admin: {
    useAsTitle: 'key',
    defaultColumns: ['key', 'lastMessageAt', 'createdAt'],
    description: 'Chats between employees, managers and admins.',
    group: 'Chat',
  },
  access: {
    read: readOwnConversations,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'key',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { readOnly: true, description: 'dm:<id>:<id> — one conversation per pair of people.' },
    },
    {
      name: 'members',
      type: 'array',
      required: true,
      minRows: 2,
      fields: [
        { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
        { name: 'lastReadAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true },
    },
    {
      name: 'lastMessageAt',
      type: 'date',
      index: true,
      admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'lastMessage',
      type: 'group',
      admin: { readOnly: true },
      fields: [
        { name: 'body', type: 'text' },
        { name: 'sender', type: 'relationship', relationTo: 'users' },
      ],
    },
  ],
  timestamps: true,
}

export default ChatConversations
