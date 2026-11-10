import type { CollectionConfig } from 'payload'
import { authenticated } from '../../access/authenticated'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    // Configure to allow both OAuth and credentials
    //disableLocalStrategy: false, // Keep local strategy enabled
    maxLoginAttempts: 5,
    lockTime: 600 * 1000, // 10 minutes
    // Add this to handle OAuth users without passwords
    verify: false, // Disable email verification for now
  },
  access: {
    // Only admins get access to the Payload admin panel.
    // client-admin is a separate app-level role with its own dashboard (handled outside Payload access control).
    admin: ({ req: { user } }) => {
      return user?.roles === 'admin'
    },

    // Only admins can read other users, users (including client-admins/client-managers) can read themselves
    read: ({ req: { user } }) => {
      if (user) {
        // Admins can read all users
        if (user.roles === 'admin') {
          return true
        }
        // Users can read only themselves
        return {
          id: {
            equals: user.id,
          },
        }
      }
      return false
    },

    // Public/self sign-up is only allowed for the default 'client' role.
    // Creating anything else (admin, client-admin, client-manager) requires an
    // authenticated admin or client-admin — otherwise anyone could POST a role
    // field to escalate their own privileges.
    create: ({ req: { user }, data }) => {
      const targetRole = data?.roles ?? 'client'

      // Unauthenticated requests: only plain client self-registration allowed
      if (!user) {
        return targetRole === 'client'
      }

      // Full admins can create any role
      if (user.roles === 'admin') {
        return true
      }

      // client-admins can create managers (or additional clients) for their org,
      // but not other admins or client-admins
      if (user.roles === 'client-admin') {
        return targetRole === 'client-manager' || targetRole === 'client'
      }

      // Everyone else can only ever create a plain client account
      return targetRole === 'client'
    },

    // Only admins can update other users, users (including client-admins/client-managers) can update themselves
    update: ({ req: { user } }) => {
      if (user) {
        if (user.roles === 'admin') {
          return true
        }
        // Users can only update themselves
        return {
          id: {
            equals: user.id,
          },
        }
      }
      return false
    },

    // Only admins can delete users
    delete: ({ req: { user } }) => {
      return user?.roles === 'admin'
    },
  },
  admin: {
    defaultColumns: ['name', 'email', 'roles', 'authType', 'onboardingCompleted'],
    hidden: ({ user }) => user?.roles !== 'admin',
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: false,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Client Admin', value: 'client-admin' },
        { label: 'Client Manager', value: 'client-manager' },
        { label: 'Client', value: 'client' },
      ],
      defaultValue: 'client',
      required: true,
    },
    {
      name: 'authType',
      type: 'select',
      options: [
        { label: 'Email/Password', value: 'credentials' },
        { label: 'Google OAuth', value: 'google' },
        { label: 'LinkedIn OAuth', value: 'linkedin' },
        { label: 'GitHub OAuth', value: 'github' },
      ],
      defaultValue: 'credentials',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'hasPassword',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        hidden: true, // Hide from admin UI
      },
    },
    {
      name: 'onboardingCompleted',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Whether the user has completed the onboarding process',
      },
    },
    // ── Fields used by the business-admin's manager management UI ──
    // These stay business-admin-assigned (not manager-editable), so they live
    // here rather than in manager-info. phone/department, which the manager
    // edits themselves via Manager Settings, live in manager-info instead.
    {
      name: 'accessLevel',
      label: 'Access Level',
      type: 'text',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Pending', value: 'pending' },
      ],
      defaultValue: 'active',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'createdBy',
      label: 'Created By',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        description:
          'The business-admin who created this account (used to scope the manager list per business-admin).',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        // Ensure data exists before proceeding
        if (!data) {
          return data
        }

        // For OAuth users, mark as not having password
        if (data.authType && data.authType !== 'credentials') {
          data.hasPassword = false
        } else {
          // For credentials users, mark as having password
          data.hasPassword = true
        }

        // Ensure authType is set - only set if it's not already defined
        if (!data.authType) {
          data.authType = 'credentials'
        }

        return data
      },
    ],
    beforeChange: [
      ({ data, operation, req }) => {
        // For OAuth users creating accounts
        if (operation === 'create' && data?.authType !== 'credentials') {
          // Just mark that they don't have a user-set password
          data.hasPassword = false
          // The password should already be provided by the signIn callback
          // No need to generate it here since it's handled in authOptions
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === 'create') {
          const { name, email, id, roles } = doc

          if (!name || typeof name !== 'string') {
            console.error('❌ User name is missing or invalid:', { name, email, id })
            return
          }

          if (!email || typeof email !== 'string') {
            console.error('❌ User email is missing or invalid:', { name, email, id })
            return
          }

          const nameParts = name.split(' ')
          const firstName = nameParts[0] || ''
          const lastName = nameParts.slice(1).join(' ') || ''

          // client-admin uses business-admin-info, client-manager uses manager-info.
          // admin and client continue to use personal-information as before.
          if (roles === 'client-admin' || roles === 'client-manager') {
            const targetCollection =
              roles === 'client-admin' ? 'business-admin-info' : 'manager-info'

            console.log(
              '🔄 User created hook triggered for:',
              email,
              `- Creating ${targetCollection}...`,
            )

            setTimeout(async () => {
              try {
                // Idempotent: another code path (e.g. create-manager's API route)
                // may have already created this record with more detail (phone,
                // department, etc.) before this deferred hook runs — check first
                // rather than risk a duplicate-key error on the unique `user` field.
                const existing = await req.payload.find({
                  collection: targetCollection,
                  where: { user: { equals: id } },
                  limit: 1,
                  overrideAccess: true,
                })

                if (existing.docs.length === 0) {
                  await req.payload.create({
                    collection: targetCollection,
                    data: {
                      user: Number(id),
                      firstName,
                      lastName,
                      email,
                    },
                    // The hook may run in contexts where req.user isn't the new
                    // user themselves (e.g. an admin or client-admin created them),
                    // so bypass access control here the same way personal-information
                    // creation always has.
                    overrideAccess: true,
                  })
                  console.log(`✅ ${targetCollection} created for user:`, id)
                }
              } catch (error) {
                console.error(`❌ Deferred creation of ${targetCollection} failed:`, error)
              }
            }, 0)

            return
          }

          console.log(
            '🔄 User created hook triggered for:',
            email,
            '- Creating personal information...',
          )

          setTimeout(async () => {
            try {
              await req.payload.create({
                collection: 'personal-information',
                data: {
                  user: id,
                  firstName,
                  lastName,
                  recoveryEmail: email,
                },
              })
              console.log('✅ Personal information created for user:', id)
            } catch (error) {
              console.error('❌ Deferred creation of Personal Information failed:', error)
            }
          }, 0)
        }
      },
    ],
  },
}
