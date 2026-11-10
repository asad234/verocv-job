import { Availability, Media } from '@/payload-types'
import { availabilityInformation } from '@/types/payloadTypes'
//types used in Cv builder
// Types inferred from PayloadCMS collection
export type NotificationPreferences = {
  emailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
}

export type ProfileImage = {
  uploadImage?: number | Media | null | undefined
  staticImage?: string | null | undefined
}

export type SocialLinks = {
  linkedIn?: string
  x?: string
  gitHub?: string
  website?: string
}
export type PersonalInformation = {
  id: string
  user: number
  firstName: string
  lastName: string
  homeAddress?: string
  phoneNumber?: string
  workPhoneNumber?: string
  privateEmail?: string
  workEmail?: string
  recoveryEmail?: string
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'other'
  title?: string
  professionalPresentation?: string
  personalPresentation?: string
  companyType?: string
  profileImage?: ProfileImage
  companyLogo?: {
    uploadImage?: {
      id: number
      url: string
    } | null
    staticImage?: string | null
  }
  socialLinks?: SocialLinks
  notificationPreferences?: NotificationPreferences
  createdAt: string
  updatedAt: string
}

export interface ProjectDetails {
  id: string
  role: string
  startDate: Date
  endDate?: Date
  isCurrent: boolean
  description: string
  skills?: string
  company?: string
  location?: string
  projectUrl?: string
  visible?: boolean
}

export interface Skill {
  id: string
  skillName: string
  skillRating?: number
  skillYearsExperience?: number
  visible?: boolean
}

export interface Reference {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  company?: string
  positionTitle: string
  relationship: string
  visible?: boolean
}

export interface Certification {
  id: string
  type: 'certificate' | 'course'
  title: string
  startDate: Date | null
  validDate: Date | null
  code?: string
  issuer: string
  supplier?: string
  description?: string
  link?: string
  noExpiry?: boolean
  visible?: boolean
}

export interface Experience {
  id: string
  employer: string
  title: string
  startDate: Date
  ongoing?: boolean
  endDate?: Date
  description: string
  link?: string
  visible?: boolean
  achievements?: string
}

export interface Education {
  id: string
  school: string
  program: string
  level: string
  place: string
  startDate: Date
  endDate?: Date
  ongoing?: boolean
  description: string
  link?: string
  visible?: boolean
}

export interface Language {
  id: string
  language: string
  level: string
  visible?: boolean
}

export interface SectionVisibility {
  portfolios?: boolean
  personalInfo: boolean
  skills: boolean
  languages: boolean
  projects: boolean
  references: boolean
  certifications: boolean
  experience?: boolean
  employers?: boolean
  education: boolean
}

export interface CoverLetter {
  id: string
  content: string
  jobTitle?: string
  companyName?: string
  jobDescription?: string
  tone?: 'professional' | 'enthusiastic' | 'formal' | 'casual'
  createdAt: string
}
export interface PortfolioItem {
  id: string
  type: 'image' | 'video' | 'youtube' | 'link' | 'document'
  title: string
  description?: string
  imageUrl?: string
  videoUrl?: string
  youtubeUrl?: string
  youtubeVideoId?: string
  linkUrl?: string
  documentUrl?: string
  documentName?: string
}

export interface CVData {
  portfolioItems?: PortfolioItem[]
  id?: string
  name?: string
  url?: string
  createdAt?: string
  updatedAt?: string
  isPublic?: boolean
  hidden?: boolean
  template?: string
  profile?: Profile
  personalInfo?: PersonalInformation
  skills?: Skill[]
  experience?: Experience[]
  employers?: Experience[] // legacy alias if needed
  education?: Education[]
  projects?: ProjectDetails[]
  languages?: Language[]
  certifications?: Certification[]
  references?: Reference[]
  visibility?: any
  otherSkills?: string // if you used it in ProfileData
  // ── Style preferences ──
  accentColor?: string
  headingFontId?: string
  bodyFontId?: string
}

export interface ProfileDetails {
  personalInfo?: PersonalInformation
  skills?: Skill[]
  experience?: Experience[]
  employers?: Experience[] // legacy alias if needed
  education?: Education[]
  projects?: ProjectDetails[]
  languages?: Language[]
  certifications?: Certification[]
  references?: Reference[]
}

export interface Profile {
  id: number // Note: In your data this is a number, not string
  createdAt: Date
  updatedAt: Date
  language: string
  user: number // Simplified from your original { id: number, email?: string }
  personalInformation: PersonalInformation
  availabilityInformation?: availabilityInformation | null
  profileDetails: {
    personalInfo?: PersonalInformation
    skills: Skill[]
    experience: Experience[]
    employers: Experience[] // legacy alias if needed
    education: Education[]
    projects: ProjectDetails[]
    languages: Language[]
    certifications: Certification[]
    references: Reference[]
  }
}

// Types for tracking changes
export type SectionType =
  | 'personalInfo'
  | 'projects'
  | 'projectDetails' // legacy
  | 'skills'
  | 'references'
  | 'certifications'
  | 'experience'
  | 'employers' // legacy
  | 'education'
  | 'languages'

export interface ChangesState {
  added: Record<SectionType, string[]>
  edited: Record<SectionType, string[]>
  deleted: Record<SectionType, string[]>
}

export interface ProfileData {
  profile?: any
  projects?: ProjectDetails[]
  skills?: Skill[]
  otherSkills?: string
  languages?: Language[]
  references?: Reference[]
  certifications?: Certification[]
  employers?: Experience[]
  education?: Education[]
  personalInfo?: PersonalInformation
}

export interface APIResponse<T> {
  docs: T[]
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage: number | null
  nextPage: number | null
}
