import { CollectionConfig } from "payload";

const JobApplications: CollectionConfig = {
  slug: "job-applications",
  fields: [
    {
      name: "jobId",
      type: "relationship",
      relationTo: "job-ads",
      required: true,
    },
    {
      name: "firstName",
      type: "text",
      required: true,
    },
    {
      name: "lastName",
      type: "text",
      required: true,
    },
    {
      name: "employmentType",
      type: "select",
      options: [
        { label: "Privat/Egenkonsult", value: "Privat/Egenkonsult" },
        { label: "Konsultbolag/Konsultförmedlare", value: "Konsultbolag/Konsultförmedlare" },
      ],
      required: true,
    },
    {
      name: "personalNumber",
      type: "text",
      required: true,
      minLength: 10,
    },
    {
      name: "hasForeignPersonalNumber",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "hasForeignAddress",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "residence",
      type: "text",
      required: true,
    },
    {
      name: "city",
      type: "text",
      required: true,
    },
    {
      name: "postalCode",
      type: "text",
      required: true,
    },
    {
      name: "coAddress",
      type: "text",
    },
    {
      name: "email",
      type: "email",
      required: true,
      validate: (val: string | null | undefined) => {
        if (!val) {
          return "Email is required.";
        }
        if (!val.includes("@") || !val.includes(".")) {
          return "Please enter a valid email address.";
        }
        return true;
      },
    },
    {
      name: "phone",
      type: "text",
      required: true,
      validate: (val: string | null | undefined) => {
        if (!val) {
          return "Phone number is required.";
        }
        if (!/^\d+$/.test(val)) {
          return "Phone number must contain only digits.";
        }
        if (val.length < 10) {
          return "Phone number must be at least 10 digits long.";
        }
        return true;
      },
    },
    {
      name: "linkedin",
      type: "text",
    },
    {
      name: "currentPosition",
      type: "text",
      required: true,
    },
    {
      name: "jobCategory",
      type: "text",
      required: true,
    },
    {
      name: "desiredEmploymentPercentage",
      type: "select",
      options: [
        { label: "Full-time (100%)", value: "Full_time_100" },
        { label: "Part-time (75%)", value: "Part_time_75" },
        { label: "Part-time (50%)", value: "Part_time_50" },
        { label: "Part-time (25%)", value: "Part_time_25" },
        { label: "Internship (20%)", value: "Internship_20" },
        { label: "Freelance / Contract (variable)", value: "Freelance_Contract_variable" },
      ],
      required: true,
      validate: (val: string | null | undefined) => {
        if (!val) {
          return "Desired employment percentage is required.";
        }
        return true;
      },
    },
    {
      name: "availabilityDate",
      type: "date",
      required: true,
      validate: (val: Date | null | undefined) => {
        if (!val) {
          return "Availability date is required.";
        }
        return true;
      },
    },
    {
      name: "primaryAssignment",
      type: "text",
      required: true,
    },
    {
      name: "secondaryAssignment",
      type: "text",
    },
    {
      name: "foundAd",
      type: "text",
      required: true,
    },
    {
      name: "takesAssignmentAbroad",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "cv",
      type: "upload",
      relationTo: "media",
      required: true,
    },
    {
      name: "coverLetter",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "message",
      type: "textarea",
    },
    {
      name: "consent",
      type: "checkbox",
      defaultValue: false,
      required: true,
      validate: (val: boolean | null | undefined) => {
        if (!val) {
          return "You must agree to the terms and conditions.";
        }
        return true;
      },
    },
  ],
  access: {
    create: () => true,
    update: ({ req: { user } }) => user?.roles === 'admin',
    delete: ({ req: { user } }) => user?.roles === 'admin',
    read: () => true,
  },
};

export default JobApplications;