import type { CollectionConfig } from 'payload'

/* ═════════════════════════════════════════════════════════════
   GOOGLE CALENDAR CONNECTIONS — one row per manager who connected
   their Google account (used to create Google Meet links and put
   interviews in their Google Calendar).

   Tokens are encrypted (AES-256-GCM, key derived from PAYLOAD_SECRET)
   and never readable through the admin panel or REST — only the
   server code in utils/server/googleCalendar.ts reads them.
═════════════════════════════════════════════════════════════ */

const isAdmin = (user: any) => user?.roles === 'admin'
const hiddenSecret = { read: () => false, update: () => false, create: () => false }

export const GoogleCalendarConnections: CollectionConfig = {
  slug: 'google-calendar-connections',
  admin: {
    useAsTitle: 'googleEmail',
    defaultColumns: ['googleEmail', 'user', 'connectedAt'],
    group: 'Recruitment',
  },
  access: {
    // Admins can see who is connected (and delete a connection). Managers use the app routes.
    create: () => false,
    read: ({ req: { user } }) => isAdmin(user),
    update: () => false,
    delete: ({ req: { user } }) => isAdmin(user),
  },
  timestamps: true,
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true,
      index: true,
      admin: { readOnly: true },
    },
    { name: 'googleEmail', type: 'text', admin: { readOnly: true } },
    { name: 'scope', type: 'text', admin: { readOnly: true } },
    { name: 'connectedAt', type: 'date', admin: { readOnly: true } },
    // Encrypted secrets — hidden everywhere except the server code (overrideAccess).
    { name: 'refreshTokenEnc', type: 'text', access: hiddenSecret, admin: { hidden: true } },
    { name: 'accessTokenEnc', type: 'text', access: hiddenSecret, admin: { hidden: true } },
    { name: 'accessTokenExpiresAt', type: 'date', admin: { hidden: true } },
  ],
}

export default GoogleCalendarConnections
