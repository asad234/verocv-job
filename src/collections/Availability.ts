import { CollectionConfig } from 'payload';

const Availability: CollectionConfig = {
  slug: 'availability',
  admin: {
    defaultColumns: ['user', 'dateStatus'],
  },
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => !!req.user,
    update: ({ req }) => {
      if (!req.user) return false;
      return {
        user: {
          equals: req.user.id,
        },
      };
    },
    delete: ({ req }) => {
      if (!req.user) return false;
      return {
        user: {
          equals: req.user.id,
        },
      };
    },
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      access: {
        create: () => true,
        update: () => false,
      },
      admin: {
        readOnly: false,
      },
    },
    {
      name: 'dateStatus',
      type: 'array',
      label: 'Date Status',
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true,
        },
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Booked', value: 'booked' },
            { label: 'Available', value: 'available' },
            { label: 'Vacation', value: 'vacation' },
            { label: 'None', value: 'none' },
          ],
          required: true,
        },
      ],
    },
  ],
};

export default Availability;
