// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/collections/ChatMessages/index.ts   (NEW)
//                 + add it to `collections: [...]` in payload.config.ts
// WHAT IT DOES:   Every chat message. Belongs to a `chat-conversations` doc.
//                 Written only by /api/chat/... (which checks who may write to
//                 whom); REST/GraphQL access is admin-only.
//
// After adding: pnpm payload generate:types
// Postgres:     pnpm payload migrate:create && pnpm payload migrate
// ══════════════════════════════════════════════════════════════════════

import type { Access, CollectionConfig } from 'payload'

const adminOnly: Access = ({ req: { user } }) => (user as any)?.roles === 'admin'

export const CHAT_MESSAGE_MAX = 4000

const ChatMessages: CollectionConfig = {
  slug: 'chat-messages',
  admin: {
    useAsTitle: 'body',
    defaultColumns: ['conversation', 'sender', 'body', 'createdAt'],
    group: 'Chat',
  },
  access: {
    read: adminOnly,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'conversation',
      type: 'relationship',
      relationTo: 'chat-conversations',
      required: true,
      index: true,
    },
    { name: 'sender', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'body', type: 'textarea', required: true, maxLength: CHAT_MESSAGE_MAX },
  ],
  timestamps: true,
}

export default ChatMessages
