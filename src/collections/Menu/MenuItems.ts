import { CollectionConfig } from "payload";


const MenuItems: CollectionConfig = {
  slug: "menuItems",
  labels: {
    singular: "Menu Item",
    plural: "Menu Items",
  },
  admin: {
    useAsTitle: "label",
  },
  fields: [
    {
      name: "label",
      type: "text",
      required: true,
    },
    {
      name: "url",
      type: "text",
      required: true,
    },
    {
      name: "subItems",
      type: "relationship",
      relationTo: ["menuItems"],
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

export default MenuItems;
