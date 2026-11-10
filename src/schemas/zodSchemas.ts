// src/schemas/profileSchemas.ts
import { z } from 'zod';

export const ProjectDetailsSchema = z.object({
  role: z.string().min(1, "Role is required"),
  startDate: z.date({
    required_error: "Start date is required",
    invalid_type_error: "Start date must be a valid date"
  }),
  endDate: z.date().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().min(1, "Description is required"),
  skills: z.array(z.string()).optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  projectUrl: z.string().url("Invalid URL format").optional(),
});

export const CompanyOrganisationDetailsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  location: z.string().min(1, 'Location is required'),
  companyLink: z.string().url().optional(),
});

export const SkillSchema = z.object({
  skillName: z.string().min(1, 'Skill name is required'),
  skillRating: z.number().optional(),
});

export const ReferenceSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  company: z.string().optional(),
  positionTitle: z.string().min(1, 'Position title is required'),
  relationship: z.string().min(1, 'Relationship is required'),
});

export const CertificationSchema = z.object({
  type: z.enum(['certificate', 'course']),
  title: z.string().min(1, 'Title is required'),
  startDate: z.date(),
  validDate: z.date(),
  code: z.string().optional(),
  issuer: z.string().min(1, 'Issuer is required'),
  supplier: z.string().optional(),
  description: z.string().optional(),
  link: z.string().url().optional(),
});

export const EmployerSchema = z.object({
  employer: z.string().min(1, 'Employer is required'),
  title: z.string().min(1, 'Title is required'),
  startDate: z.date(),
  ongoing: z.boolean().optional(),
  endDate: z.date().optional(),
  description: z.string().min(1, 'Description is required'),
  link: z.string().url().optional(),
});

export const EducationSchema = z.object({
  school: z.string().min(1, 'School is required'),
  program: z.string().min(1, 'Program is required'),
  level: z.string().min(1, 'Level is required'),
  place: z.string().min(1, 'Place is required'),
  startDate: z.date(),
  endDate: z.date().optional(),
  ongoing: z.boolean().optional(),
  description: z.string().min(1, 'Description is required'),
  link: z.string().url().optional(),
});

export const LanguageSchema = z.object({
  language: z.string().min(1, 'Language is required'),
  level: z.string().min(1, 'Level is required'),
});

export const ProfileSchema = z.object({
  user: z.string(),
  profileDetails: z.object({
    projectDetails: z.array(ProjectDetailsSchema),
    companyOrganisationDetails: CompanyOrganisationDetailsSchema,
    skills: z.array(SkillSchema),
    references: z.array(ReferenceSchema),
    certifications: z.array(CertificationSchema),
    employers: z.array(EmployerSchema),
    education: z.array(EducationSchema),
    languages: z.array(LanguageSchema),
  }),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Profile = z.infer<typeof ProfileSchema>;
export type ProjectDetails = z.infer<typeof ProjectDetailsSchema>;