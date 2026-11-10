import type { CollectionConfig } from 'payload'

export const Portfolio: CollectionConfig = {
  slug: 'portfolio',

  // Disable Payload's document-locking feature.
  // Locking is designed for the admin UI to prevent concurrent edits.
  // This collection is written programmatically via API routes, so locking
  // is irrelevant — and the locked-documents query was causing DELETE to fail.
  lockDocuments: false,

  access: {
    create: ({ req: { user } }) => Boolean(user),
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
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles === 'admin') return true
      return { user: { equals: user.id } }
    },
  },

  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'user', 'featured', 'hidden', 'createdAt'],
    group: 'Portfolio',
  },

  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        position: 'sidebar',
        description: 'The user who owns this portfolio item',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Image', value: 'image' },
        { label: 'Video', value: 'video' },
        { label: 'YouTube', value: 'youtube' },
        { label: 'Website Link', value: 'link' },
        { label: 'Document', value: 'document' },
      ],
      admin: {
        position: 'sidebar',
        description: 'The kind of content this portfolio item contains',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      required: false,
    },
    {
      name: 'tags',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      required: false,
      admin: {
        position: 'sidebar',
        description: 'Featured items are sorted to the top of the portfolio grid',
      },
    },
    {
      name: 'hidden',
      type: 'checkbox',
      defaultValue: false,
      required: false,
      admin: {
        position: 'sidebar',
        description: 'Hidden items are not shown to the manager viewing this portfolio',
      },
    },

    // ── IMAGE ──────────────────────────────────────────────────────────────
    {
      name: 'image',
      label: 'Image File',
      type: 'relationship',
      relationTo: 'media',
      required: false,
      admin: {
        condition: (data) => data?.type === 'image',
        description: 'Upload the image file (JPG, PNG, WebP, GIF, SVG)',
      },
    },

    // ── VIDEO ──────────────────────────────────────────────────────────────
    {
      name: 'video',
      label: 'Video File',
      type: 'relationship',
      relationTo: 'media',
      required: false,
      admin: {
        condition: (data) => data?.type === 'video',
        description: 'Upload the video file (MP4, MOV, WebM)',
      },
    },
    {
      name: 'videoThumbnail',
      label: 'Video Thumbnail',
      type: 'relationship',
      relationTo: 'media',
      required: false,
      admin: {
        condition: (data) => data?.type === 'video',
        description: 'Optional thumbnail image shown before playback',
      },
    },

    // ── YOUTUBE ────────────────────────────────────────────────────────────
    {
      name: 'youtubeUrl',
      label: 'YouTube URL',
      type: 'text',
      required: false,
      admin: {
        condition: (data) => data?.type === 'youtube',
        placeholder: 'https://www.youtube.com/watch?v=...',
      },
    },
    {
      name: 'youtubeVideoId',
      label: 'YouTube Video ID',
      type: 'text',
      required: false,
      admin: {
        condition: (data) => data?.type === 'youtube',
        readOnly: true,
      },
    },

    // ── LINK ───────────────────────────────────────────────────────────────
    {
      name: 'linkUrl',
      label: 'Website URL',
      type: 'text',
      required: false,
      admin: {
        condition: (data) => data?.type === 'link',
        placeholder: 'https://myproject.com',
      },
    },
    {
      name: 'linkThumbnail',
      label: 'Link Preview Image',
      type: 'relationship',
      relationTo: 'media',
      required: false,
      admin: {
        condition: (data) => data?.type === 'link',
        description: 'Optional screenshot or preview image for the link',
      },
    },

    // ── DOCUMENT ───────────────────────────────────────────────────────────
    {
      name: 'document',
      label: 'Document File',
      type: 'relationship',
      relationTo: 'media',
      required: false,
      admin: {
        condition: (data) => data?.type === 'document',
        description: 'Upload the document (PDF, DOCX, DOC, PPTX, PPT)',
      },
    },
    {
      name: 'documentName',
      label: 'Original File Name',
      type: 'text',
      required: false,
      admin: {
        condition: (data) => data?.type === 'document',
      },
    },
    {
      name: 'documentSize',
      label: 'File Size (bytes)',
      type: 'number',
      required: false,
      admin: {
        condition: (data) => data?.type === 'document',
      },
    },
    {
      name: 'documentExt',
      label: 'File Extension',
      type: 'select',
      required: false,
      options: [
        { label: 'PDF', value: 'pdf' },
        { label: 'DOCX', value: 'docx' },
        { label: 'DOC', value: 'doc' },
        { label: 'PPTX', value: 'pptx' },
        { label: 'PPT', value: 'ppt' },
      ],
      admin: {
        condition: (data) => data?.type === 'document',
      },
    },
  ],

  timestamps: true,
}

export default Portfolio
