import type { CollectionConfig } from 'payload'

export const CoverLetters: CollectionConfig = {
  slug: 'coverLetters',
  lockDocuments: false,
  admin: {
    useAsTitle: 'jobTitle',
    defaultColumns: ['jobTitle', 'companyName', 'createdAt'],
  },
  fields: [
    {
      name: 'user',
      label: 'User',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
    },
    {
      name: 'cv',
      label: 'Linked CV (Optional)',
      type: 'relationship',
      relationTo: 'cvs',
      hasMany: false,
      admin: {
        description: 'Optionally link this cover letter to a specific CV',
      },
    },
    {
      name: 'content',
      label: 'Cover Letter Content',
      type: 'textarea',
      required: true,
    },
    {
      name: 'jobTitle',
      label: 'Job Title',
      type: 'text',
      required: true,
    },
    {
      name: 'companyName',
      label: 'Company Name',
      type: 'text',
    },
    {
      name: 'jobDescription',
      label: 'Job Description',
      type: 'textarea',
    },
    {
      name: 'tone',
      label: 'Tone',
      type: 'select',
      options: [
        { label: 'Professional', value: 'professional' },
        { label: 'Enthusiastic', value: 'enthusiastic' },
        { label: 'Formal', value: 'formal' },
        { label: 'Casual', value: 'casual' },
      ],
      defaultValue: 'professional',
    },
    {
      name: 'notes',
      label: 'Personal Notes',
      type: 'textarea',
      admin: {
        description: 'Your personal notes about this cover letter',
      },
    },
  ],
  access: {
    // FIXED: was using user?.roles?.includes('admin') — roles is a single
    // STRING here (hasMany: false), not an array, so .includes() did a
    // substring match instead of equality. 'client-admin'.includes('admin')
    // is true, which meant every client-admin had full read/update/delete
    // access to every user's cover letters, not just their own.
    read: ({ req: { user } }) => {
      if (user?.roles === 'admin') return true
      return {
        user: {
          equals: user?.id,
        },
      }
    },
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => {
      if (user?.roles === 'admin') return true
      return {
        user: {
          equals: user?.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      if (user?.roles === 'admin') return true
      return {
        user: {
          equals: user?.id,
        },
      }
    },
  },
  timestamps: true,
}

export default CoverLetters
