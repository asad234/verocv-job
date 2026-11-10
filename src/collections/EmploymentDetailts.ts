// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/collections/EmploymentDetails/index.ts  (replace your current file)
// WHAT IT DOES:   "Present Employment Details" — one per user.
//
// Field names are kept from the old version where the meaning is the same, so
// existing rows keep their data (see the labels for what each one is now).
// Required-ness is handled by /api/user/employment-details, because what is
// required depends on the employment status (e.g. nothing about the current
// job is required for someone who is not employed).
//
// ACCESS: this holds salary data, so it is no longer open to everyone.
// Users can read/change only their own row, admins everything. The app's own
// routes use overrideAccess and do their own checks (manager → only employees
// who accepted their invitation).
//
// After replacing: pnpm payload generate:types
// Postgres: pnpm payload migrate:create && pnpm payload migrate
// ══════════════════════════════════════════════════════════════════════

import type { CollectionConfig, Field } from 'payload'

const opts = (values: readonly string[], labels?: Record<string, string>) =>
  values.map((v) => ({ label: labels?.[v] ?? v, value: v }))

const select = (
  name: string,
  label: string,
  values: readonly string[],
  labels?: Record<string, string>,
  extra: Partial<Field> = {},
): Field => ({ name, label, type: 'select', options: opts(values, labels), ...extra }) as Field

const ownOrAdmin = ({ req: { user } }: any) => {
  if (!user) return false
  if (user.roles === 'admin') return true
  return { user: { equals: user.id } }
}

const EmploymentDetails: CollectionConfig = {
  slug: 'employment-details',
  admin: {
    useAsTitle: 'presentTitle',
    defaultColumns: ['presentTitle', 'employmentStatus', 'employerName', 'officeLocation', 'user'],
  },
  access: {
    read: ownOrAdmin,
    create: ({ req: { user } }) => !!user,
    update: ownOrAdmin,
    delete: ({ req: { user } }) => (user as any)?.roles === 'admin',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar', readOnly: true },
    },

    /* ── 1. Current employment ── */
    select(
      'employmentStatus',
      'Employment Status',
      ['employed', 'self_employed', 'not_employed', 'notice_period'],
      {
        employed: 'Employed',
        self_employed: 'Self-employed / Consultant',
        not_employed: 'Not currently employed',
        notice_period: 'Currently serving notice period',
      },
      { defaultValue: 'employed' },
    ),
    { name: 'employerName', label: 'Employer / Company Name', type: 'text' },
    { name: 'presentTitle', label: 'Current Job Title', type: 'text' },
    { name: 'workArea', label: 'Department / Field of Work', type: 'text' },
    select(
      'employmentType',
      'Employment Type',
      ['permanent', 'fixed_term', 'consultant', 'hourly', 'other'],
      {
        permanent: 'Permanent (Tillsvidareanställning)',
        fixed_term: 'Fixed-term (Visstidsanställning)',
        consultant: 'Consultant / Contract',
        hourly: 'Hourly (Timanställning)',
        other: 'Other',
      },
    ),
    { name: 'employmentDate', label: 'Employment Start Date', type: 'date' },
    {
      name: 'employmentEndDate',
      label: 'Employment End Date',
      type: 'date',
      admin: { description: 'Fixed-term or ended employment only.' },
    },
    select('employmentRate', 'Employment Rate (%)', [
      '100%',
      '90%',
      '80%',
      '75%',
      '70%',
      '60%',
      '50%',
      '40%',
      '30%',
      '25%',
      '20%',
      '10%',
    ]),

    /* ── 2. Workplace ── */
    { name: 'officeLocation', label: 'Work City / Municipality', type: 'text' },
    {
      name: 'homeAddress',
      label: 'Work Address',
      type: 'text',
      admin: { description: 'Optional street address of the workplace.' },
    },
    select('workArrangement', 'Work Arrangement', ['onsite', 'hybrid', 'remote'], {
      onsite: 'On-site',
      hybrid: 'Hybrid',
      remote: 'Remote',
    }),

    /* ── 3. Salary & compensation ── */
    {
      name: 'salaryLevel',
      label: 'Current Gross Monthly Salary',
      type: 'text',
      admin: { description: 'Bruttolön per month, before tax.' },
    },
    select(
      'salaryCurrency',
      'Salary Currency',
      ['SEK', 'EUR', 'USD', 'GBP', 'NOK', 'DKK'],
      undefined,
      { defaultValue: 'SEK' },
    ),
    { name: 'feeRate', label: 'Expected Salary / Rate', type: 'text' },
    select('feeCurrency', 'Rate Currency', ['SEK', 'EUR', 'USD', 'GBP', 'NOK', 'DKK'], undefined, {
      defaultValue: 'SEK',
    }),
    // "weekly" stays valid for rows saved by the old form.
    select('feeRateType', 'Rate Type', ['monthly', 'hourly', 'daily', 'weekly'], {
      monthly: 'Monthly salary',
      hourly: 'Hourly rate',
      daily: 'Daily rate',
      weekly: 'Weekly rate (legacy)',
    }),

    /* ── 4. Work preferences & availability ── */
    { name: 'preferredLocation', label: 'Preferred Work Location', type: 'text' },
    { name: 'secondaryLocation', label: 'Secondary Preferred Location', type: 'text' },
    select('canTravel', 'Willing to Travel for Work?', ['Yes', 'No', 'Sometimes']),
    select('assignmentAbroad', 'Available for Assignments Abroad?', ['Yes', 'No', 'Depends'], {
      Yes: 'Yes',
      No: 'No',
      Depends: 'Depends on assignment',
    }),
    select(
      'noticePeriod',
      'Notice Period (Uppsägningstid)',
      ['none', '1_month', '2_months', '3_months', '6_months', 'other'],
      {
        none: 'None',
        '1_month': '1 month',
        '2_months': '2 months',
        '3_months': '3 months',
        '6_months': '6 months',
        other: 'Other',
      },
    ),
    { name: 'availableFrom', label: 'Available From (Tillgänglig från)', type: 'date' },
  ],
  timestamps: true,
}

export default EmploymentDetails
