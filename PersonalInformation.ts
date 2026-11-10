import type { CollectionConfig } from 'payload'

export type ProfileImage = {
  uploadImage?:
    | {
        id: number
        url: string
      }
    | null
    | undefined
  staticImage?: string | null | undefined
}

const PersonalInformation: CollectionConfig = {
  slug: 'personal-information',
  admin: {
    useAsTitle: 'firstName',
    defaultColumns: [
      'firstName',
      'lastName',
      'user',
      'privateEmailVerified',
      'recoveryEmailVerified',
    ],
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
      name: 'privateEmail',
      label: 'Private Email',
      type: 'email',
    },
    {
      name: 'workEmail',
      label: 'Work Email',
      type: 'email',
    },
    {
      name: 'recoveryEmail',
      label: 'Recovery Email',
      type: 'email',
      unique: true,
    },
    // Email Verification Fields
    {
      name: 'privateEmailVerified',
      label: 'Private Email Verified',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Whether the private email has been verified',
        readOnly: true,
      },
    },
    {
      name: 'privateEmailVerificationToken',
      label: 'Private Email Verification Token',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'recoveryEmailVerified',
      label: 'Recovery Email Verified',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Whether the recovery email has been verified',
        readOnly: true,
      },
    },
    {
      name: 'recoveryEmailVerificationToken',
      label: 'Recovery Email Verification Token',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'verificationEmailsSentAt',
      label: 'Verification Emails Sent At',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'When verification emails were last sent',
        readOnly: true,
        date: {
          pickerAppearance: 'default',
          displayFormat: 'yyyy-MM-dd HH:mm:ss',
        },
      },
    },
    // Profile Reminder Tracking Fields - NEW
    {
      name: 'profileReminderSent',
      label: 'Profile Reminder Sent',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Whether a profile completion reminder email has been sent',
        readOnly: true,
      },
    },
    {
      name: 'profileReminderSentAt',
      label: 'Profile Reminder Sent At',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'When profile completion reminder email was sent',
        readOnly: true,
        date: {
          pickerAppearance: 'default',
          displayFormat: 'yyyy-MM-dd HH:mm:ss',
        },
      },
    },
    // End of Profile Reminder Fields
    {
      name: 'homeAddress',
      label: 'Home Address',
      type: 'text',
    },
    {
      name: 'phoneNumber',
      label: 'Phone Number',
      type: 'text',
    },
    {
      name: 'workPhoneNumber',
      label: 'Work Phone',
      type: 'text',
    },
    {
      name: 'dateOfBirth',
      label: 'Date of Birth',
      type: 'date',
    },
    {
      name: 'gender',
      label: 'Gender',
      type: 'select',
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'companyType',
      label: 'Company Type',
      type: 'text',
    },
    {
      name: 'title',
      label: 'Title',
      type: 'text',
    },
    {
      name: 'professionalPresentation',
      label: 'Professional Presentation',
      type: 'textarea',
    },
    {
      name: 'personalPresentation',
      label: 'Personal Presentation',
      type: 'textarea',
    },
    {
      name: 'profileImage',
      label: 'Profile Image',
      type: 'group',
      fields: [
        {
          name: 'uploadImage',
          label: 'Upload Image',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Upload a custom profile image',
          },
        },
        {
          name: 'staticImage',
          label: 'Select Static Image',
          type: 'text',
          admin: {
            description: 'Enter the URL for the static image or choose from predefined options',
          },
        },
      ],
    },
    {
      name: 'socialLinks',
      label: 'Social Links',
      type: 'group',
      fields: [
        {
          name: 'linkedIn',
          label: 'LinkedIn',
          type: 'text',
          admin: {
            description: 'e.g. linkedin.com/in/username',
          },
        },
        {
          name: 'x',
          label: 'X (Twitter)',
          type: 'text',
          admin: {
            description: 'e.g. x.com/username',
          },
        },
        {
          name: 'gitHub',
          label: 'GitHub',
          type: 'text',
          admin: {
            description: 'e.g. github.com/username',
          },
        },
        {
          name: 'website',
          label: 'Website',
          type: 'text',
        },
      ],
    },
    {
      name: 'notificationPreferences',
      label: 'Notification Preferences',
      type: 'group',
      fields: [
        {
          name: 'emailNotifications',
          label: 'Email Notifications',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'pushNotifications',
          label: 'Push Notifications',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'smsNotifications',
          label: 'SMS Notifications',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
  ],
  access: {
    create: () => true,
    update: () => true,
    delete: ({ req: { user } }) => user?.roles === 'admin',
    read: () => true,
  },
}

export default PersonalInformation
