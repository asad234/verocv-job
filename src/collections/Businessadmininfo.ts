import type { CollectionConfig } from 'payload'

const BusinessAdminInfo: CollectionConfig = {
  slug: 'business-admin-info',
  admin: {
    useAsTitle: 'firstName',
    defaultColumns: ['firstName', 'lastName', 'user', 'jobTitle', 'twoFactorEnabled'],
  },
  fields: [
    {
      name: 'user',
      label: 'User',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true, // one settings record per user
    },

    // ── General tab ──
    {
      name: 'firstName',
      label: 'First Name',
      type: 'text',
    },
    {
      name: 'lastName',
      label: 'Last Name',
      type: 'text',
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
    },
    {
      name: 'phone',
      label: 'Phone',
      type: 'text',
    },
    {
      name: 'jobTitle',
      label: 'Job Title',
      type: 'text',
    },

    // ── Company tab ──
    {
      name: 'company',
      label: 'Company',
      type: 'group',
      fields: [
        {
          name: 'companyName',
          label: 'Company Name',
          type: 'text',
        },
        {
          name: 'orgNumber',
          label: 'Organization Number',
          type: 'text',
        },
        {
          name: 'industry',
          label: 'Industry',
          type: 'text',
        },
        {
          name: 'companySize',
          label: 'Company Size',
          type: 'text',
        },
        {
          name: 'companyEmail',
          label: 'Company Email',
          type: 'email',
        },
        {
          name: 'companyPhone',
          label: 'Company Phone',
          type: 'text',
        },
        {
          name: 'companyWebsite',
          label: 'Company Website',
          type: 'text',
        },
        {
          name: 'companyAddress',
          label: 'Company Address',
          type: 'text',
        },
        {
          name: 'companyLogo',
          label: 'Company Logo',
          type: 'group',
          fields: [
            {
              name: 'uploadImage',
              label: 'Upload Logo',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'staticImage',
              label: 'Static Logo URL',
              type: 'text',
            },
          ],
        },
      ],
    },

    // ── Notifications tab ──
    {
      name: 'notificationPreferences',
      label: 'Notification Preferences',
      type: 'group',
      fields: [
        {
          name: 'emailNotif',
          label: 'Email Notifications',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'newManagerNotif',
          label: 'New Manager Notifications',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'placementAlert',
          label: 'Placement Alerts',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'weeklyReport',
          label: 'Weekly Report',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },

    // ── Security tab ──
    // Password changes go through Payload's built-in auth (Users collection),
    // not stored here. Only the 2FA toggle state lives on this record.
    {
      name: 'twoFactorEnabled',
      label: 'Two-Factor Enabled',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
  ],
  access: {
    // Owner can create their own record; admins can create for anyone.
    create: ({ req: { user }, data }) => {
      if (!user) return false
      if (user.roles === 'admin') return true
      return data?.user === user.id || data?.user === String(user.id)
    },

    // Owner can read their own record; admins can read all.
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles === 'admin') return true
      return {
        user: {
          equals: user.id,
        },
      }
    },

    // Owner can update their own record; admins can update any.
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles === 'admin') return true
      return {
        user: {
          equals: user.id,
        },
      }
    },

    // Only admins can delete.
    delete: ({ req: { user } }) => user?.roles === 'admin',
  },
  timestamps: true,
}

export default BusinessAdminInfo
