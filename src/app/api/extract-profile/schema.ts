import { z } from "zod"

export const languageLevels = ["Native", "Fluent", "Advanced", "Intermediate", "Basic"] as const

// ── OpenAI-compatible schema (no z.preprocess, no .strict) ───────────────────

export const OpenAIResumeSchema = z.object({
  personalInfo: z.object({
    firstName:                z.string(),
    lastName:                 z.string(),
    homeAddress:              z.string().optional(),
    phoneNumber:              z.string().optional(),
    privateEmail:             z.string().optional(),
    workEmail:                z.string().optional(),
    dateOfBirth:              z.string().optional(),
    gender:                   z.enum(["male", "female", "other"]).optional(),
    title:                    z.string().optional(),
    professionalPresentation: z.string().optional(),
    personalPresentation:     z.string().optional(),
    companyType:              z.string().optional(),
  }).optional(),

  projects: z.array(z.object({
    role:        z.string(),
    description: z.string(),
    startDate:   z.string().optional(),
    endDate:     z.string().optional(),
    isCurrent:   z.boolean(),
    skills:      z.string().optional(),
    company:     z.string().optional(),
    location:    z.string().optional(),
    projectUrl:  z.string().optional(),
  })).optional(),

  skills: z.array(z.object({
    skillName:            z.string(),
    skillRating:          z.number().optional(),
    skillYearsExperience: z.number().optional(),
  })).optional(),

  references: z.array(z.object({
    firstName:     z.string(),
    lastName:      z.string(),
    email:         z.string(),
    phoneNumber:   z.string(),
    company:       z.string().optional(),
    positionTitle: z.string(),
    relationship:  z.string(),
  })).optional(),

  certifications: z.array(z.object({
    type:        z.enum(["certificate", "course"]),
    title:       z.string(),
    startDate:   z.string().optional(),
    validDate:   z.string().optional(),
    code:        z.string().optional(),
    issuer:      z.string(),
    supplier:    z.string().optional(),
    description: z.string().optional(),
    link:        z.string().optional(),
    noExpiry:    z.boolean().optional(),
  })).optional(),

  experience: z.array(z.object({
    employer:     z.string(),
    title:        z.string(),
    startDate:    z.string().optional(),
    endDate:      z.string().optional(),
    ongoing:      z.boolean().optional(),
    description:  z.string(),
    link:         z.string().optional(),
    achievements: z.string().optional(),
  })).optional(),

  education: z.array(z.object({
    school:      z.string(),
    program:     z.string(),
    level: z.enum([
  "High School",
  "Associate's Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "Doctorate",
  "Certificate",
  "Diploma",
]),
    place:       z.string(),
    startDate:   z.string().optional(),
    endDate:     z.string().optional(),
    ongoing:     z.boolean().optional(),
    description: z.string(),
    link:        z.string().optional(),
  })).optional(),

  languages: z.array(z.object({
    language: z.string(),
    level:    z.enum(languageLevels),
  })).optional(),
})

export type OpenAIResumeData = z.infer<typeof OpenAIResumeSchema>

// ── Full app schema with date coercion ────────────────────────────────────────

const dateSchema = z.preprocess((val) => {
  if (val instanceof Date) return val
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val)
    if (!isNaN(d.getTime())) return d
  }
  return val
}, z.date())

const nullableDateSchema = dateSchema.nullable().optional()

export const ProjectSchema = z.object({
  id:          z.string(),
  role:        z.string(),
  startDate:   dateSchema.optional(),
  endDate:     dateSchema.optional(),
  isCurrent:   z.boolean(),
  description: z.string(),
  skills:      z.string().optional(),
  company:     z.string().optional(),
  location:    z.string().optional(),
  projectUrl:  z.string().optional(),
})

export const SkillSchema = z.object({
  id:                   z.string(),
  skillName:            z.string(),
  skillRating:          z.number().optional(),
  skillYearsExperience: z.number().optional(),
})

export const ReferenceSchema = z.object({
  id:            z.string(),
  firstName:     z.string(),
  lastName:      z.string(),
  email:         z.string(),
  phoneNumber:   z.string(),
  company:       z.string().optional(),
  positionTitle: z.string(),
  relationship:  z.string(),
})

export const CertificationSchema = z.object({
  id:          z.string(),
  type:        z.enum(["certificate", "course"]),
  title:       z.string(),
  startDate:   nullableDateSchema,
  validDate:   nullableDateSchema,
  code:        z.string().optional(),
  issuer:      z.string(),
  supplier:    z.string().optional(),
  description: z.string().optional(),
  link:        z.string().optional(),
  noExpiry:    z.boolean().optional(),
})

export const ExperienceSchema = z.object({
  id:           z.string(),
  employer:     z.string(),
  title:        z.string(),
  startDate:    dateSchema.optional(),
  ongoing:      z.boolean().optional(),
  endDate:      dateSchema.optional(),
  description:  z.string(),
  link:         z.string().optional(),
  achievements: z.string().optional(),
})

export const EducationSchema = z.object({
  id:          z.string(),
  school:      z.string(),
  program:     z.string(),
  level:       z.string(),
  place:       z.string(),
  startDate:   dateSchema.optional(),
  endDate:     dateSchema.optional(),
  ongoing:     z.boolean().optional(),
  description: z.string(),
  link:        z.string().optional(),
})

export const LanguageSchema = z.object({
  id:       z.string(),
  language: z.string(),
  level:    z.enum(languageLevels),
})

export const ResumeSchema = z.object({
  personalInfo:   z.object({
    firstName:                z.string(),
    lastName:                 z.string(),
    homeAddress:              z.string().optional(),
    phoneNumber:              z.string().optional(),
    privateEmail:             z.string().optional(),
    workEmail:                z.string().optional(),
    dateOfBirth:              z.string().optional(),
    gender:                   z.enum(["male", "female", "other"]).optional(),
    title:                    z.string().optional(),
    professionalPresentation: z.string().optional(),
    personalPresentation:     z.string().optional(),
    companyType:              z.string().optional(),
  }).optional(),
  projects:       z.array(ProjectSchema).optional(),
  skills:         z.array(SkillSchema).optional(),
  references:     z.array(ReferenceSchema).optional(),
  certifications: z.array(CertificationSchema).optional(),
  experience:     z.array(ExperienceSchema).optional(),
  employers:      z.array(ExperienceSchema).optional(),
  education:      z.array(EducationSchema).optional(),
  languages:      z.array(LanguageSchema).optional(),
})

export type ResumeData    = z.infer<typeof ResumeSchema>
export type PersonalInfo  = z.infer<typeof ResumeSchema>["personalInfo"]
export type Project       = z.infer<typeof ProjectSchema>
export type Skill         = z.infer<typeof SkillSchema>
export type Reference     = z.infer<typeof ReferenceSchema>
export type Certification = z.infer<typeof CertificationSchema>
export type Experience    = z.infer<typeof ExperienceSchema>
export type Education     = z.infer<typeof EducationSchema>
export type Language      = z.infer<typeof LanguageSchema>