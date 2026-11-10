import type { CollectionConfig } from 'payload'

export const EmployeeHrInfo: CollectionConfig = {
  slug: 'employee-hr-info',
  admin: {
    useAsTitle: 'user',
  },
  fields: [
    {
      name: 'user',
      label: 'Employee',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true, // one HR record per employee
    },
    // ── Employment Information (manager-editable) ──
    {
      name: 'employmentInfo',
      label: 'Employment Information',
      type: 'group',
      fields: [
        { name: 'jobTitle', label: 'Job Title', type: 'text' },
        { name: 'department', label: 'Department', type: 'text' },
        {
          name: 'employmentType',
          label: 'Employment Type',
          type: 'select',
          options: [
            { label: 'Full-time', value: 'full-time' },
            { label: 'Part-time', value: 'part-time' },
            { label: 'Contract', value: 'contract' },
            { label: 'Intern', value: 'intern' },
          ],
        },
        { name: 'startDate', label: 'Start Date', type: 'date' },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { label: 'Active', value: 'active' },
            { label: 'On Leave', value: 'on-leave' },
            { label: 'Terminated', value: 'terminated' },
          ],
          defaultValue: 'active',
        },
      ],
    },
    // ── Work Summary (manager-editable) ──
    {
      name: 'workSummary',
      label: 'Work Summary',
      type: 'textarea',
    },
    // ── Upcoming Events (manager-editable) ──
    {
      name: 'upcomingEvents',
      label: 'Upcoming Events',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'date', type: 'date', required: true },
        {
          name: 'eventType',
          type: 'select',
          options: [
            { label: 'Meeting', value: 'meeting' },
            { label: 'Performance Review', value: 'review' },
            { label: 'Training', value: 'training' },
            { label: 'Other', value: 'other' },
          ],
          defaultValue: 'meeting',
        },
        { name: 'notes', type: 'textarea' },
      ],
    },
    // ── Leave & Vacation Balance (manager-editable) ──
    {
      name: 'leaveBalance',
      label: 'Leave & Vacation Balance',
      type: 'group',
      fields: [
        {
          name: 'vacationDaysTotal',
          label: 'Vacation Days (Total)',
          type: 'number',
          defaultValue: 25,
        },
        {
          name: 'vacationDaysUsed',
          label: 'Vacation Days (Used)',
          type: 'number',
          defaultValue: 0,
        },
        { name: 'sickDaysTotal', label: 'Sick Days (Total)', type: 'number', defaultValue: 10 },
        { name: 'sickDaysUsed', label: 'Sick Days (Used)', type: 'number', defaultValue: 0 },
        { name: 'otherLeaveDays', label: 'Other Leave (Days)', type: 'number', defaultValue: 0 },
      ],
    },
  ],
  access: {
    // Owner (the employee themselves) or admin. client-manager access is
    // enforced entirely inside the custom manager-facing routes via the
    // accepted-invitation check (overrideAccess: true there) — same pattern
    // as cvs/coverLetters/manager-info.
    create: ({ req: { user } }) => !!user,
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles === 'admin') return true
      return { user: { equals: user.id } }
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles === 'admin') return true
      return { user: { equals: user.id } }
    },
    delete: ({ req: { user } }) => user?.roles === 'admin',
  },
  timestamps: true,
}

export default EmployeeHrInfo
