import { authenticated } from '@/access/authenticated'
import type { CollectionConfig } from 'payload'

export const Profiles: CollectionConfig = {
  slug: 'profiles',
  access: {
    admin: () => true,
    create: () => true,
    delete: () => true,
    read: () => true,
    update: () => true,
  },
  admin: {
    defaultColumns: ['user', 'language'],
    useAsTitle: 'id',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'language',
      type: 'select',
      label: 'Profile Language',
      required: true,
      options: [
        { label: 'English', value: 'en' },
        { label: 'Swedish', value: 'sv' },
        { label: 'Spanish', value: 'es' },
        { label: 'French', value: 'fr' },
        { label: 'German', value: 'de' },
        { label: 'Chinese', value: 'zh' },
        { label: 'Japanese', value: 'ja' },
      ],
      defaultValue: 'en',
      admin: {
        position: 'sidebar',
      },
    },
    //Personal information
    {
      name: 'personalInformation',
      type: 'relationship',
      relationTo: 'personal-information',
      required: true,
    },
    //Personal information
    {
      name: 'availabilityInformation',
      type: 'relationship',
      relationTo: 'availability',
      required: false,
    },
    // Profile Details Group
    {
      name: 'profileDetails',
      label: 'Profile Details For Selected User',
      type: 'group',
      fields: [
        {
          name: 'projectDetails',
          type: 'array',
          fields: [
            {
              name: 'role',
              type: 'text',
              required: true,
              label: 'Role',
            },
            {
              name: 'startDate',
              type: 'date',
              required: true,
              label: 'Start Date',
              admin: {
                date: {
                  pickerAppearance: 'default',
                  displayFormat: 'yyyy-MM-dd',
                },
              },
            },
            {
              name: 'endDate',
              type: 'date',
              required: false,
              label: 'End Date',
              admin: {
                date: {
                  pickerAppearance: 'default',
                  displayFormat: 'yyyy-MM-dd',
                },
              },
            },
            {
              name: 'isCurrent',
              type: 'checkbox',
              label: 'Currently working here',
              defaultValue: false,
            },
            {
              name: 'description',
              type: 'textarea',
              required: true,
              label: 'Description',
            },
            {
              name: 'skills',
              type: 'text',
              required: false,
              admin: {
                description: 'Comma-separated list of skills (e.g., "JavaScript, React")',
              },
            },
            {
              name: 'company',
              type: 'text',
              label: 'Company Name',
            },
            {
              name: 'location',
              type: 'text',
              label: 'Location (City, Country)',
            },
            {
              name: 'projectUrl',
              type: 'text',
              label: 'Project URL',
              admin: {
                placeholder: 'https://example.com',
              },
            },
          ],
        },
        // Skills
        {
          name: 'skills',
          label: 'Skills',
          type: 'array',
          fields: [
            {
              name: 'skillName',
              label: 'Skill Name',
              type: 'text',
              required: true,
            },
            {
              name: 'skillRating',
              label: 'Skill Rating',
              type: 'number',
              required: false,
            },
            {
              name: 'skillYearsExperience',
              label: 'Years Experience',
              type: 'number',
              required: false,
            },
          ],
        },

        // References
        {
          name: 'references',
          label: 'References',
          type: 'array',
          fields: [
            {
              name: 'firstName',
              label: 'First Name',
              type: 'text',
              required: true,
            },
            {
              name: 'lastName',
              label: 'Last Name',
              type: 'text',
              required: true,
            },
            {
              name: 'email',
              label: 'Email',
              type: 'email',
              required: true,
            },
            {
              name: 'phoneNumber',
              label: 'Phone Number',
              type: 'text',
              required: true,
            },
            {
              name: 'company',
              label: 'Company',
              type: 'text',
              required: false,
            },
            {
              name: 'positionTitle',
              label: 'Position / Title',
              type: 'text',
              required: true,
            },
            {
              name: 'relationship',
              label: 'Relationship',
              type: 'text',
              required: true,
            },
          ],
        },

        // Certifications and Courses
        {
          name: 'certifications',
          label: 'Certifications and Courses',
          type: 'array',
          fields: [
            {
              name: 'type',
              label: 'Type',
              type: 'select',
              options: [
                { label: 'Certificate', value: 'certificate' },
                { label: 'Course', value: 'course' },
              ],
              required: true,
            },
            {
              name: 'title',
              label: 'Title',
              type: 'text',
              required: true,
            },
            {
              name: 'startDate',
              label: 'Start Date',
              type: 'date',
              required: true,
            },
            {
              name: 'validDate',
              label: 'Valid Date',
              type: 'date',
              required: false,
            },
            {
              name: 'noExpiry',
              label: "Doesn't Expire",
              type: 'checkbox',
              defaultValue: false,
              required: false,
            },
            {
              name: 'code',
              label: 'Code',
              type: 'text',
              required: false,
            },
            {
              name: 'issuer',
              label: 'Issuer',
              type: 'text',
              required: true,
            },
            {
              name: 'supplier',
              label: 'Supplier',
              type: 'text',
              required: false,
            },
            {
              name: 'description',
              label: 'Description',
              type: 'textarea',
              required: false,
            },
            {
              name: 'link',
              label: 'Link',
              type: 'text',
              required: false,
            },
          ],
        },

        // Employers
        {
          name: 'employers',
          label: 'Employers',
          type: 'array',
          fields: [
            {
              name: 'employer',
              label: 'Employer',
              type: 'text',
              required: true,
            },
            {
              name: 'title',
              label: 'Title',
              type: 'text',
              required: true,
            },
            {
              name: 'startDate',
              label: 'Start Date',
              type: 'date',
              required: true,
            },
            {
              name: 'ongoing',
              label: 'Ongoing',
              type: 'checkbox',
              required: false,
            },
            {
              name: 'endDate',
              label: 'End Date',
              type: 'date',
              required: false,
            },
            {
              name: 'description',
              label: 'Description',
              type: 'textarea',
              required: true,
            },
            {
              name: 'link',
              label: 'Link',
              type: 'text',
              required: false,
            },
            {
              name: 'achievements',
              label: 'Achievementse',
              type: 'text',
              required: false,
            },
          ],
        },

        // Education
        {
          name: 'education',
          label: 'Education',
          type: 'array',
          fields: [
            {
              name: 'school',
              label: 'School',
              type: 'text',
              required: true,
            },
            {
              name: 'program',
              label: 'Program',
              type: 'text',
              required: true,
            },
            {
              name: 'level',
              label: 'Level',
              type: 'text',
              required: true,
            },
            {
              name: 'place',
              label: 'Place',
              type: 'text',
              required: true,
            },
            {
              name: 'startDate',
              label: 'Start Date',
              type: 'date',
              required: true,
            },
            {
              name: 'endDate',
              label: 'End Date',
              type: 'date',
              required: false,
            },
            {
              name: 'ongoing',
              label: 'Ongoing',
              type: 'checkbox',
              required: false,
            },
            {
              name: 'description',
              label: 'Description',
              type: 'textarea',
              required: true,
            },
            {
              name: 'link',
              label: 'Link',
              type: 'text',
              required: false,
            },
          ],
        },

        // Languages
        {
          name: 'languages',
          label: 'Languages',
          type: 'array',
          fields: [
            {
              name: 'language',
              label: 'Language',
              type: 'text',
              required: true,
            },
            {
              name: 'level',
              label: 'Level',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
