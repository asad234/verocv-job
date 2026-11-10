import type { CollectionConfig } from 'payload'

const JobAds: CollectionConfig = {
  slug: 'job-ads',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'company',
      type: 'text',
      required: true,
    },
    {
      name: 'location',
      type: 'text',
      required: true,
    },
    {
      name: 'startDate',
      type: 'date',
      required: true,
    },
    {
      name: 'jobId',
      type: 'number',
      required: true,
      admin: {
        readOnly: true,
      },
      hooks: {
        beforeChange: [
          async ({ req: { payload }, data, operation }) => {
            // If this is an update operation and jobId is already set, don't change it
            if (operation === 'update' && data?.jobId) {
              return data.jobId;
            }

            // Generate a new jobId for new job ads
            const generateRandomJobId = () => {
              return Math.floor(100000 + Math.random() * 900000); // 6 digit number
            };

            let jobId = generateRandomJobId();

            // Check if the jobId already exists in the database
            let existingJob = await payload.find({
              collection: 'job-ads',
              where: {
                jobId: {
                  equals: jobId, // Use 'equals' operator to match the jobId field
                },
              },
            });

            // If jobId exists, generate a new one
            while (existingJob.docs.length > 0) {
              jobId = generateRandomJobId();
              // Query again to check if the new jobId exists
              existingJob = await payload.find({
                collection: 'job-ads',
                where: {
                  jobId: {
                    equals: jobId, // Ensure the 'jobId' field is unique
                  },
                },
              });
            }

            return jobId;
          },
        ],
      },
    },
    {
      name: 'shortdescription',
      label: 'Short description',
      type: 'text',
      required: true,
    },
    {
      name: 'fulldescription',
      label: 'Full description',
      type: 'richText',
      required: true,
    },
    {
      name: 'confirmationEmail',
      type: 'richText',
      label: 'Bekräftelsemail',
      admin: {
        description: 'The email sent to the user to confirm their job application.',
      },
    },
    {
      name: 'massEmail',
      type: 'richText',
      label: 'Massutskick till sökande',
      admin: {
        description: 'The email sent to all applicants in bulk.',
      },
    },
  ],
  access: {
    create: ({ req: { user } }) => user?.roles === 'admin',
    update: ({ req: { user } }) => user?.roles === 'admin',
    delete: ({ req: { user } }) => user?.roles === 'admin',
    read: () => true,
  },
};

export default JobAds;
