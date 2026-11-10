export interface EditCvProps {
  cvItem: any
  onSave: (updatedCv: any) => void
  onCancel: () => void
}

export interface PersonalInformation {
  id: number | string;
  firstName: string;
  lastName: string;
  homeAddress?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  gender?: ('male' | 'female' | 'other') | null;
  companyType?: string | null;
  title?: string | null;
  professionalPresentation?: string | null;
  personalPresentation?: string | null;
  updatedAt?: string;
  createdAt?: string;
}

export interface FormData {
  title: string
  language: string
  status: 'New' | 'Draft' | 'Final'
  personalInfo: PersonalInformation
  skills: Skill[]
  languages: Language[]
  education: Education[]
  employers: Employer[]
  projects: Project[]
  certifications: Certification[]
  commitments: Commitment[]
  otherSkills: string[]
}

export interface Project {
  id: string
  role: string
  startDate: Date // ISO date string
  endDate?: Date // ISO date string
  isCurrent: boolean
  description: string
  skills?: string
  company?: string
  location?: string
  projectUrl?: string
}

export interface Education {
  id: string
  school: string
  program: string
  level: string
  place: string
  startDate: Date // ISO date string
  endDate?: Date // ISO date string
  ongoing?: boolean
  description: string
  link?: string
}

export interface Employer {
  id: string
  employer: string
  title: string
  startDate: Date // ISO date string
  ongoing?: boolean
  endDate?: Date // ISO date string
  description: string
  link?: string
}


export interface Certification {
  id: string
  type: 'certificate' | 'course'
  title: string
  startDate: Date | null // ISO date string
  validDate: Date | null // ISO date string
  code?: string
  issuer: string
  supplier?: string
  description?: string
  link?: string
}

export interface Language {
  id: string
  language: string
  level: string
}

export interface Skill {
  id: string
  skillName: string
  skillRating?: number
  skillYearsExperience?: number
  category?: string
}

export interface Commitment {
  id: string; 
  title: string
  startDate: Date | string
  endDate?: Date | string
  isOngoing: boolean
  description: string
}

export interface ProfileSection {
  title: string
  icon: string
}

export const profileSections: ProfileSection[] = [
  { title: 'Personal Information', icon: 'tabler:user' },
  { title: 'Skills', icon: 'tabler:code' },
  { title: 'Other Skills', icon: 'tabler:tools' },
  { title: 'Languages', icon: 'tabler:language' },
  { title: 'Education', icon: 'tabler:school' },
  { title: 'Employers', icon: 'tabler:building' },
  { title: 'Projects and Assignments', icon: 'tabler:clipboard-list' },
  { title: 'Certification and Courses', icon: 'tabler:certificate' },
  { title: 'Commitments/Publication', icon: 'tabler:news' },
]

export const formatDate = (date: Date | string | undefined): string => {
  if (!date) return 'N/A'
  const d = new Date(date)
  return isNaN(d.getTime())
    ? 'N/A'
    : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
}

export const getLanguageFlag = (language: string): string => {
  const flags: Record<string, string> = {
    English: 'twemoji:flag-for-flag-united-kingdom',
    French: 'twemoji:flag-for-flag-france',
    German: 'twemoji:flag-for-flag-germany',
    Spanish: 'twemoji:flag-for-flag-spain',
    Swedish: 'twemoji:flag-for-flag-sweden',
  }
  return flags[language] || 'twemoji:globe-showing-europe-africa'
}

export const getSkillCategoryByRating = (rating: number | undefined): string => {
  switch (rating) {
    case 5:
      return 'Expert'
    case 4:
      return 'High Competence'
    case 3:
      return 'Competent'
    case 2:
      return 'Basic Knowledge'
    case 1:
      return 'Beginner'
    default:
      return 'Other'
  }
}
