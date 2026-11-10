import type { CollectionConfig } from 'payload';

const Menus: CollectionConfig = {
  slug: "menus",  // This defines the collection's slug for internal use (in the API URL)
  labels: {
    singular: "Menu",
    plural: "Menus",
  },
  admin: {
    useAsTitle: "title", // This uses the "title" field as the title in the Admin panel
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "enabled",
      type: "checkbox",
      label: "Enable Menu",
      defaultValue: true,
    },
    {
      name: "slug",
      type: "text",  
      required: true,
      unique: true, 
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: "items",
      type: "relationship",
      relationTo: "menuItems",
      hasMany: true,
    },
  ],
  access: {
    create: ({ req: { user } }) => user?.roles === 'admin',
    update: ({ req: { user } }) => user?.roles === 'admin',
    delete: ({ req: { user } }) => user?.roles === 'admin',
    read: () => true,
  },
};

export default Menus;
