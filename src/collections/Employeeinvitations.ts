import type { CollectionConfig, Where } from 'payload'

const EmployeeInvitations: CollectionConfig = {
  slug: 'employee-invitations',
  admin: {
    useAsTitle: 'employeeEmail',
    defaultColumns: ['employeeEmail', 'bossName', 'companyName', 'status', 'createdAt'],
  },
  fields: [
    {
      name: 'manager',
      label: 'Manager (sender)',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'employee',
      label: 'Employee (recipient)',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    // Snapshotted at send-time so the notification always shows what was true
    // when the invite was sent, even if the manager later renames themselves
    // or the business-admin renames the company.
    {
      name: 'bossName',
      label: 'Boss Name (snapshot)',
      type: 'text',
      required: true,
    },
    {
      name: 'companyName',
      label: 'Company Name (snapshot)',
      type: 'text',
    },
    {
      name: 'employeeEmail',
      label: 'Employee Email (snapshot)',
      type: 'email',
      required: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Declined', value: 'declined' },
      ],
      defaultValue: 'pending',
      required: true,
    },
    {
      name: 'respondedAt',
      label: 'Responded At',
      type: 'date',
      admin: { position: 'sidebar' },
    },
    // Set when an already-accepted connection is later ended by one side,
    // as opposed to a genuine decline of a still-pending invite. Lets the
    // employee's notification bell distinguish "your manager revoked
    // access" from "you declined this invite" even though both cases land
    // on status: "declined".
    {
      name: 'revokedBy',
      label: 'Revoked By',
      type: 'select',
      options: [
        { label: 'Manager', value: 'manager' },
        { label: 'Employee', value: 'employee' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'Set when one side of an accepted connection ends it, to distinguish that from a genuine decline of a pending invite.',
        readOnly: true,
      },
    },
  ],
  access: {
    // Manager can create invitations (only naming themselves as the sender —
    // enforced in the API route, which is the source of truth here since it
    // also needs to look up the employee by email and snapshot names).
    create: ({ req: { user } }) => {
      if (!user) return false
      return user.roles === 'client-manager' || user.roles === 'admin'
    },

    // Sender (manager) can see invites they sent; recipient (employee) can see
    // invites addressed to them; admin sees all.
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles === 'admin') return true
      const where: Where = {
        or: [{ manager: { equals: user.id } }, { employee: { equals: user.id } }],
      }
      return where
    },

    // The invited employee can respond (accept/decline) to their own
    // invitations, and the sending manager can revoke a connection they
    // started; admin can update anything. The API routes are still the
    // real gatekeepers of *which* transitions are allowed (e.g. only
    // revoking an "accepted" invite) — this only controls who may touch
    // the record at all.
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles === 'admin') return true
      const where: Where = {
        or: [{ employee: { equals: user.id } }, { manager: { equals: user.id } }],
      }
      return where
    },

    delete: ({ req: { user } }) => user?.roles === 'admin',
  },
  timestamps: true,
}

export default EmployeeInvitations
