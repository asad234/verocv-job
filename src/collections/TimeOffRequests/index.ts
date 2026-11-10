// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/collections/TimeOffRequests/index.ts   (NEW)
//                 + add it to `collections: [...]` in payload.config.ts
// WHAT IT DOES:   A manager's request for days off (vacation, comp time, leave…),
//                 decided by their business admin. Sick leave and VAB are reported
//                 (approved straight away — the admin is notified).
//
//   pending ──approve──► approved ──cancel (manager, before it starts)──► cancelled
//      │  └─decline──► declined
//      └──cancel (manager)──► cancelled
//
// Dates are plain calendar days "YYYY-MM-DD" (no time-zone shifts).
// All changes go through /api/company/managers/time-off and /api/company/admin/time-off.
// After adding: pnpm payload generate:types   (Postgres: migrate:create + migrate)
// ══════════════════════════════════════════════════════════════════════

import type { Access, CollectionConfig, Where } from 'payload'

const readOwn: Access = ({ req: { user } }) => {
  if (!user) return false
  if ((user as any).roles === 'admin') return true
  const where: Where = { or: [{ manager: { equals: user.id } }, { approver: { equals: user.id } }] }
  return where
}
const adminOnly: Access = ({ req: { user } }) => (user as any)?.roles === 'admin'
const DAY = /^\d{4}-\d{2}-\d{2}$/

const TimeOffRequests: CollectionConfig = {
  slug: 'time-off-requests',
  admin: {
    defaultColumns: ['manager', 'type', 'startDate', 'endDate', 'status', 'approver'],
    description: 'Days-off requests from managers to their business admin.',
  },
  access: { read: readOwn, create: adminOnly, update: adminOnly, delete: adminOnly },
  timestamps: true,
  fields: [
    { name: 'manager', type: 'relationship', relationTo: 'users', required: true, index: true },
    {
      name: 'approver',
      label: 'Business admin',
      type: 'relationship',
      relationTo: 'users',
      index: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Vacation (Semester)', value: 'vacation' },
        { label: 'Sick (Sjuk)', value: 'sick' },
        { label: 'Care of sick child (VAB)', value: 'vab' },
        { label: 'Parental leave (Föräldraledig)', value: 'parental' },
        { label: 'Comp time (Kompledigt)', value: 'comp_time' },
        { label: 'Leave of absence (Tjänstledigt)', value: 'leave' },
        { label: 'Training / conference', value: 'training' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'startDate',
      type: 'text',
      required: true,
      index: true,
      validate: (v: unknown) => DAY.test(String(v ?? '')) || 'YYYY-MM-DD',
    },
    {
      name: 'endDate',
      type: 'text',
      required: true,
      index: true,
      validate: (v: unknown) => DAY.test(String(v ?? '')) || 'YYYY-MM-DD',
    },
    {
      name: 'halfDay',
      label: 'Half day (one-day requests only)',
      type: 'select',
      defaultValue: 'none',
      options: [
        { label: 'Whole day(s)', value: 'none' },
        { label: 'Morning', value: 'am' },
        { label: 'Afternoon', value: 'pm' },
      ],
    },
    { name: 'workingDays', type: 'number', admin: { readOnly: true } },
    { name: 'note', label: 'Message from the manager', type: 'textarea', maxLength: 1000 },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Declined', value: 'declined' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    { name: 'decidedBy', type: 'relationship', relationTo: 'users' },
    { name: 'decidedAt', type: 'date', index: true },
    {
      name: 'decisionNote',
      label: 'Message from the business admin',
      type: 'textarea',
      maxLength: 1000,
    },
    { name: 'cancelledAt', type: 'date' },
  ],
}

export default TimeOffRequests
