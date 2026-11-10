import type { CollectionConfig } from 'payload'

const ManagerInfo: CollectionConfig = {
  slug: 'manager-info',
  admin: {
    useAsTitle: 'firstName',
    defaultColumns: ['firstName', 'lastName', 'user', 'department', 'jobTitle'],
  },
  fields: [
    {
      name: 'user',
      label: 'User',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true, // one settings record per manager
    },

    // ── General tab ──
    { name: 'firstName', label: 'First Name', type: 'text' },
    { name: 'lastName', label: 'Last Name', type: 'text' },
    { name: 'email', label: 'Work Email', type: 'email' },
    { name: 'privateEmail', label: 'Private Email', type: 'email' },
    { name: 'phone', label: 'Phone', type: 'text' },
    { name: 'mobilePhone', label: 'Mobile Phone', type: 'text' },
    { name: 'jobTitle', label: 'Job Title', type: 'text' },
    { name: 'homeAddress', label: 'Home Address', type: 'text' },
    {
      name: 'gender',
      label: 'Gender',
      type: 'select',
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
      ],
    },
    { name: 'professionalBio', label: 'Professional Bio', type: 'textarea' },

    // ── Emergency contact (General tab) ──
    {
      name: 'emergencyContact',
      label: 'Emergency Contact Information',
      type: 'group',
      admin: {
        description: 'Who to contact in case of an emergency involving this manager.',
      },
      fields: [
        { name: 'firstName', label: 'First Name', type: 'text' },
        { name: 'lastName', label: 'Last Name', type: 'text' },
        {
          name: 'relationship',
          label: 'Relationship',
          type: 'text',
          admin: { description: 'e.g. Spouse, Parent, Sibling, Friend' },
        },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'phoneNumber', label: 'Phone Number', type: 'text' },
      ],
    },

    // ── Department tab ──
    {
      name: 'department',
      label: 'Department',
      type: 'group',
      fields: [
        { name: 'companyName', label: 'Company Name', type: 'text' },
        { name: 'department', label: 'Department Name', type: 'text' },
        { name: 'deptSize', label: 'Team Size', type: 'text' },
        { name: 'deptFocus', label: 'Department Focus', type: 'text' },
        { name: 'managedSince', label: 'Managing Since', type: 'date' },
        { name: 'deptGoals', label: 'Team Goals', type: 'textarea' },
      ],
    },

    // ── Notifications tab ──
    {
      name: 'notificationPreferences',
      label: 'Notification Preferences',
      type: 'group',
      fields: [
        { name: 'emailNotif', label: 'Email Notifications', type: 'checkbox', defaultValue: true },
        { name: 'cvActivity', label: 'CV Activity', type: 'checkbox', defaultValue: true },
        { name: 'placementAlert', label: 'Placement Alerts', type: 'checkbox', defaultValue: true },
        { name: 'weeklyDigest', label: 'Weekly Digest', type: 'checkbox', defaultValue: false },
        {
          name: 'scheduleReminders',
          label: 'Schedule Reminders',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },

    // ── Preferences tab ──
    {
      name: 'preferences',
      label: 'Preferences',
      type: 'group',
      fields: [
        { name: 'timezone', label: 'Timezone', type: 'text', defaultValue: 'Europe/Stockholm' },
        { name: 'dateFormat', label: 'Date Format', type: 'text', defaultValue: 'YYYY-MM-DD' },
      ],
    },

    // Passwords live on the users record (Payload auth) and are changed via
    // /api/company/managers/settings/password — nothing security-related is stored here.
  ],
  access: {
    // Owner can create their own record; admins (and client-admins, since they
    // manage managers) can create for anyone.
    create: ({ req: { user }, data }) => {
      if (!user) return false
      if (user.roles === 'admin' || user.roles === 'client-admin') return true
      return data?.user === user.id || data?.user === String(user.id)
    },

    // Owner can read their own record; admins and client-admins can read all
    // (client-admins need this to show managers in their manager list).
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles === 'admin' || user.roles === 'client-admin') return true
      return {
        user: { equals: user.id },
      }
    },

    // Owner can update their own record; admins and client-admins can update any.
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles === 'admin' || user.roles === 'client-admin') return true
      return {
        user: { equals: user.id },
      }
    },

    // Only admins can delete.
    delete: ({ req: { user } }) => user?.roles === 'admin',
  },
  timestamps: true,
}

export default ManagerInfo
