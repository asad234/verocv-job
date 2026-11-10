import type { Access, CollectionConfig, NumberField, Where } from 'payload'

/* ═════════════════════════════════════════════════════════════
   INTERVIEWS — the manager's Interviews page.
   One row per booked interview: candidate, position, date + time,
   duration, format, Google Calendar / Meet link, status,
   interview notes and the evaluation form.

   The app talks to this collection through next-auth routes:
     /api/company/managers/interviews/*
   (Payload's own REST API needs a Payload login, which the app doesn't use.)
═════════════════════════════════════════════════════════════ */

const isAdmin = (user: any) => user?.roles === 'admin'
const isManager = (user: any) => user?.roles === 'client-manager' || user?.roles === 'client-admin'

export const INTERVIEW_STATUSES = ['scheduled', 'completed', 'cancelled', 'no_show'] as const
export const INTERVIEW_FORMATS = ['video', 'phone', 'in_person'] as const
export const RECOMMENDATIONS = ['strong_yes', 'yes', 'maybe', 'no', 'strong_no'] as const

/* ─── Access (admin panel / Payload REST — the app uses its own routes) ─── */
const ownOrAdmin: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isAdmin(user)) return true
  if (isManager(user)) return { manager: { equals: user.id } } as Where
  return false
}

// Typed as NumberField so `type` stays the literal 'number' (a plain object would widen it
// to `string`, which Payload's CollectionConfig type rejects).
const rating = (name: string, label: string): NumberField => ({
  name,
  label,
  type: 'number',
  min: 0,
  max: 5,
  defaultValue: 0,
  admin: { description: '0 = not rated, 1–5 stars' },
})

export const Interviews: CollectionConfig = {
  slug: 'interviews',
  admin: {
    useAsTitle: 'candidateName',
    defaultColumns: ['candidateName', 'position', 'startAt', 'format', 'status', 'manager'],
    group: 'Recruitment',
  },
  access: {
    create: ({ req: { user } }) => isAdmin(user) || isManager(user),
    read: ownOrAdmin,
    update: ownOrAdmin,
    delete: ownOrAdmin,
  },
  timestamps: true,

  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data
        if (typeof data.candidateEmail === 'string')
          data.candidateEmail = data.candidateEmail.trim().toLowerCase()
        return data
      },
    ],
    beforeChange: [
      ({ data, originalDoc, operation, req }) => {
        if (operation === 'create' && req.user && !isAdmin(req.user)) data.manager = req.user.id

        // endAt is always startAt + duration (used for overlap checks and Google Calendar).
        const startAt = data.startAt ?? originalDoc?.startAt
        const duration = Number(data.durationMinutes ?? originalDoc?.durationMinutes ?? 45)
        if (startAt)
          data.endAt = new Date(new Date(startAt).getTime() + duration * 60_000).toISOString()

        // Rescheduled → remember the old time (the employee is told "moved from … to …").
        if (
          operation === 'update' &&
          data.startAt &&
          originalDoc?.startAt &&
          new Date(data.startAt).getTime() !== new Date(originalDoc.startAt).getTime()
        ) {
          data.previousStartAt = originalDoc.startAt
          data.rescheduledAt = new Date().toISOString()
        }

        // Timestamps for status changes.
        const prev = originalDoc?.status
        if (data.status && data.status !== prev) {
          const now = new Date().toISOString()
          if (data.status === 'completed') data.completedAt = now
          if (data.status === 'cancelled' || data.status === 'no_show') data.cancelledAt = now
        }
        return data
      },
    ],
  },

  fields: [
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'No-show', value: 'no_show' },
      ],
      defaultValue: 'scheduled',
      required: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'manager',
      label: 'Booked by (manager)',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    { name: 'interviewerName', type: 'text', admin: { position: 'sidebar' } },
    { name: 'completedAt', type: 'date', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'cancelledAt', type: 'date', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'rescheduledAt', type: 'date', admin: { readOnly: true, position: 'sidebar' } },
    {
      name: 'previousStartAt',
      label: 'Previous date & time',
      type: 'date',
      admin: { readOnly: true, position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
    { name: 'cancelReason', type: 'textarea', admin: { position: 'sidebar' } },

    {
      type: 'tabs',
      tabs: [
        {
          label: 'Booking',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'candidateName', type: 'text', required: true },
                { name: 'candidateEmail', type: 'email', required: true, index: true },
                { name: 'candidatePhone', type: 'text' },
              ],
            },
            {
              // Optional: set when the manager picked one of their own employees
              // instead of typing a candidate's details by hand.
              name: 'employee',
              label: 'Linked employee (optional)',
              type: 'relationship',
              relationTo: 'users',
              index: true,
            },
            { name: 'position', type: 'text', required: true },
            {
              type: 'row',
              fields: [
                {
                  name: 'startAt',
                  label: 'Date & time',
                  type: 'date',
                  required: true,
                  index: true,
                  admin: { date: { pickerAppearance: 'dayAndTime' } },
                },
                {
                  name: 'durationMinutes',
                  type: 'number',
                  required: true,
                  defaultValue: 45,
                  min: 5,
                  max: 480,
                },
                {
                  name: 'endAt',
                  type: 'date',
                  admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
                },
              ],
            },
            {
              name: 'timeZone',
              type: 'text',
              defaultValue: 'Europe/Stockholm',
              admin: {
                description:
                  'IANA time zone the interview was booked in (sent to Google Calendar).',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'format',
                  type: 'select',
                  required: true,
                  defaultValue: 'video',
                  options: [
                    { label: 'Video call (Google Meet)', value: 'video' },
                    { label: 'Phone', value: 'phone' },
                    { label: 'In person', value: 'in_person' },
                  ],
                },
                {
                  name: 'location',
                  type: 'text',
                  admin: {
                    description:
                      'Address for in-person interviews, or the number to call for phone interviews.',
                  },
                },
              ],
            },
            {
              name: 'meetingLink',
              type: 'text',
              admin: {
                description: 'Google Meet link (filled automatically) or any other video link.',
              },
            },
            { name: 'messageToCandidate', type: 'textarea' },
          ],
        },
        {
          label: 'Notes',
          fields: [
            { name: 'notes', label: 'Interview notes', type: 'textarea' },
            { name: 'notesUpdatedAt', type: 'date', admin: { readOnly: true } },
          ],
        },
        {
          label: 'Evaluation',
          fields: [
            {
              name: 'evaluation',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    rating('technicalRating', 'Technical skills'),
                    rating('communicationRating', 'Communication'),
                    rating('cultureFitRating', 'Culture fit'),
                    rating('overallRating', 'Overall'),
                  ],
                },
                { name: 'strengths', type: 'textarea' },
                { name: 'weaknesses', label: 'Weaknesses / concerns', type: 'textarea' },
                {
                  name: 'recommendation',
                  type: 'select',
                  options: [
                    { label: 'Strong yes', value: 'strong_yes' },
                    { label: 'Yes', value: 'yes' },
                    { label: 'Maybe', value: 'maybe' },
                    { label: 'No', value: 'no' },
                    { label: 'Strong no', value: 'strong_no' },
                  ],
                },
                { name: 'additionalComments', type: 'textarea' },
                { name: 'evaluatedAt', type: 'date', admin: { readOnly: true } },
              ],
            },
          ],
        },
        {
          label: 'Google Calendar',
          fields: [
            {
              name: 'google',
              type: 'group',
              admin: {
                description:
                  'Filled by the app when the interview is synced to the manager’s Google Calendar.',
              },
              fields: [
                { name: 'addToCalendar', type: 'checkbox', defaultValue: true },
                {
                  name: 'sendInvite',
                  label: 'Send invitation to the candidate',
                  type: 'checkbox',
                  defaultValue: true,
                },
                { name: 'eventId', type: 'text', index: true, admin: { readOnly: true } },
                { name: 'calendarEmail', type: 'text', admin: { readOnly: true } },
                { name: 'htmlLink', label: 'Event link', type: 'text', admin: { readOnly: true } },
                { name: 'syncedAt', type: 'date', admin: { readOnly: true } },
                { name: 'syncError', type: 'textarea', admin: { readOnly: true } },
              ],
            },
          ],
        },
      ],
    },
  ],
}

export default Interviews
