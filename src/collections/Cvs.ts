import type { CollectionConfig, Where } from 'payload'

export const CVs: CollectionConfig = {
  slug: 'cvs',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'user',
      label: 'User',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'isPublic',
      label: 'Public CV',
      type: 'checkbox',
      defaultValue: false,
      hooks: {
        beforeChange: [
          ({ siblingData, value, originalDoc }) => {
            if (value === true && !originalDoc?.url) {
              const hexString = Array.from({ length: 8 }, () =>
                Math.floor(Math.random() * 16).toString(16),
              ).join('')
              siblingData.url = hexString
            }
            if (value === false) {
              siblingData.url = ''
            }
            return value
          },
        ],
      },
    },
    {
      name: 'url',
      label: 'Public URL',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Generated automatically when making CV public.',
      },
    },
    {
      name: 'hidden',
      label: 'Hidden from Manager',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          "When enabled, this CV is not shown to the manager viewing this employee's CVs",
      },
    },
    {
      name: 'name',
      label: 'CV Name',
      type: 'text',
      required: true,
    },
    {
      name: 'personalInfo',
      label: 'Personal Information',
      type: 'group',
      fields: [
        { name: 'firstName', type: 'text', required: true },
        { name: 'lastName', type: 'text', required: true },
        { name: 'homeAddress', type: 'text' },
        { name: 'phoneNumber', type: 'text' },
        { name: 'workPhoneNumber', type: 'text' },
        { name: 'privateEmail', type: 'email' },
        { name: 'workEmail', type: 'email' },
        { name: 'recoveryEmail', type: 'email' },
        { name: 'dateOfBirth', type: 'date' },
        {
          name: 'gender',
          type: 'select',
          options: [
            { label: 'Male', value: 'male' },
            { label: 'Female', value: 'female' },
            { label: 'Other', value: 'other' },
          ],
        },
        { name: 'title', type: 'text' },
        { name: 'professionalPresentation', type: 'textarea' },
        { name: 'personalPresentation', type: 'textarea' },
        { name: 'companyType', type: 'text' },
        {
          name: 'profileImage',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'companyLogo',
          type: 'group',
          fields: [
            {
              name: 'uploadImage',
              type: 'upload',
              relationTo: 'media',
            },
            { name: 'staticImage', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'experience',
      label: 'Work Experience',
      type: 'array',
      fields: [
        { name: 'employer', type: 'text', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'startDate', type: 'date' },
        { name: 'endDate', type: 'date' },
        { name: 'ongoing', type: 'checkbox', defaultValue: false },
        { name: 'description', type: 'textarea' },
        { name: 'link', type: 'text' },
        { name: 'visible', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      name: 'skills',
      label: 'Skills',
      type: 'array',
      fields: [
        { name: 'skillName', type: 'text', required: true },
        {
          name: 'skillRating',
          type: 'number',
          admin: { description: '0-100 or 1-10 rating scale' },
        },
        { name: 'skillYearsExperience', type: 'number' },
        { name: 'visible', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      name: 'education',
      label: 'Education',
      type: 'array',
      fields: [
        { name: 'school', type: 'text', required: true },
        { name: 'program', type: 'text', required: true },
        { name: 'level', type: 'text' },
        { name: 'place', type: 'text' },
        { name: 'startDate', type: 'date' },
        { name: 'endDate', type: 'date' },
        { name: 'ongoing', type: 'checkbox', defaultValue: false },
        { name: 'description', type: 'textarea' },
        { name: 'link', type: 'text' },
        { name: 'visible', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      name: 'projects',
      label: 'Projects',
      type: 'array',
      fields: [
        { name: 'role', type: 'text', required: true },
        { name: 'company', type: 'text' },
        { name: 'location', type: 'text' },
        { name: 'projectUrl', type: 'text' },
        { name: 'startDate', type: 'date' },
        { name: 'endDate', type: 'date' },
        { name: 'isCurrent', type: 'checkbox', defaultValue: false },
        { name: 'description', type: 'textarea' },
        { name: 'skills', type: 'text', admin: { description: 'Comma-separated skill tags' } },
        { name: 'visible', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      name: 'languages',
      label: 'Languages',
      type: 'array',
      fields: [
        { name: 'language', type: 'text', required: true },
        {
          name: 'level',
          type: 'select',
          options: [
            { label: 'Beginner', value: 'beginner' },
            { label: 'Intermediate', value: 'intermediate' },
            { label: 'Advanced', value: 'advanced' },
            { label: 'Fluent', value: 'fluent' },
            { label: 'Native', value: 'native' },
          ],
        },
        { name: 'visible', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      name: 'certifications',
      label: 'Certifications',
      type: 'array',
      fields: [
        {
          name: 'type',
          type: 'select',
          options: [
            { label: 'Certificate', value: 'certificate' },
            { label: 'Course', value: 'course' },
          ],
        },
        { name: 'title', type: 'text', required: true },
        { name: 'issuer', type: 'text' },
        { name: 'supplier', type: 'text' },
        { name: 'startDate', type: 'date' },
        { name: 'validDate', type: 'date' },
        { name: 'code', type: 'text' },
        { name: 'description', type: 'textarea' },
        { name: 'link', type: 'text' },
        { name: 'visible', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      name: 'references',
      label: 'References',
      type: 'array',
      fields: [
        { name: 'firstName', type: 'text', required: true },
        { name: 'lastName', type: 'text', required: true },
        { name: 'email', type: 'email' },
        { name: 'phoneNumber', type: 'text' },
        { name: 'company', type: 'text' },
        { name: 'positionTitle', type: 'text' },
        { name: 'relationship', type: 'text' },
        { name: 'visible', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      name: 'template',
      label: 'Template',
      type: 'select',
      options: [
        { label: 'Modern', value: 'modern' },
        { label: 'Classic', value: 'classic' },
        { label: 'Minimal', value: 'minimalist' },
        { label: 'ATS Friendly', value: 'ats' },
      ],
      defaultValue: 'modern',
    },
    {
      name: 'visibility',
      label: 'Section Visibility',
      type: 'json',
    },
    {
      name: 'portfolioItems',
      label: 'Portfolio Items',
      type: 'json',
    },
    {
      name: 'accentColor',
      label: 'Accent Color',
      type: 'text',
    },
    {
      name: 'headingFontId',
      label: 'Heading Font',
      type: 'text',
    },
    {
      name: 'bodyFontId',
      label: 'Body Font',
      type: 'text',
    },
  ],

  access: {
    // Public CVs (isPublic: true) are readable by anyone — matches the
    // existing /api/cv/public/[url] route's purpose. Everything else is
    // owner-only or admin.
    read: ({ req: { user } }) => {
      if (user?.roles === 'admin') return true
      if (!user) {
        const publicOnly: Where = { isPublic: { equals: true } }
        return publicOnly
      }
      const ownOrPublic: Where = {
        or: [{ user: { equals: user.id } }, { isPublic: { equals: true } }],
      }
      return ownOrPublic
    },
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles === 'admin') return true
      return { user: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles === 'admin') return true
      return { user: { equals: user.id } }
    },
  },
}

export default CVs
