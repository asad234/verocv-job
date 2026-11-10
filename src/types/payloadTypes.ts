// Types for PayloadCMS Profiles collection

import { Media } from '@/payload-types'
import { User } from 'payload'

export interface Language {
  id: string
  language: string
  level: string
  visible?: boolean
}
export type DateStatus = {
  date: string
  status: 'booked' | 'available' | 'vacation' | 'none'
}

export type availabilityInformation = {
  id?: string
  user: User
  dateStatus: DateStatus[]
  createdAt?: string
  updatedAt?: string
}

export interface ProjectDetail {
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

export interface Skill {
  id: string
  skillName: string
  skillRating?: number
  skillYearsExperience?: number
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
}

export type MightHaveSkill = {
  skillName: string
  reason: string
  relevance: 'preferred' | 'good_to_have' | 'complementary'
}

export interface Commitment {
  title: string
  startDate: Date | string
  endDate?: Date | string
  isOngoing: boolean
  description: string
}

export interface Certification {
  id: string
  type: 'certificate' | 'course'
  title: string
  startDate: Date // ISO date string
  validDate: Date | null // ISO date string
  code?: string
  issuer: string
  supplier?: string
  description?: string
  link?: string
  noExpiry?: boolean
}

export interface Employer {
  id: string
  employer: string
  title: string
  startDate: Date // ISO date string
  ongoing?: boolean
  endDate?: Date // ISO date string
  achievements?: string
  description: string
  link?: string
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

export interface LanguageSkill {
  id: string
  language: string
  level: string
}

export interface ProfileDetails {
  projectDetails?: ProjectDetail[]
  skills?: Skill[]
  references?: Reference[]
  certifications?: Certification[]
  employers?: Employer[]
  education?: Education[]
  languages?: LanguageSkill[]
  commitments?: Commitment[]
}

// PayloadCMS User type (simplified)
export interface PayloadUser {
  id: number
  name?: string
  email?: string
  roles?: 'admin' | 'client' | 'client-admin' | 'client-manager'
  [key: string]: any
}

export interface statusColors {
  available: string
  vacation: string
  locked: string
  [key: string]: string
}

export interface DetailInformation {
  employmentRate?: string
  canTravel?: string
  officeLocation?: string
  employmentDate?: string
  homeAddress?: string
  presenttitle?: string
  workArea?: string
  preferredLocation?: string
  secondaryLocation?: string
  assignmentAbroad?: string
}
export type ProfileImage = {
  uploadImage?: number | Media | null | undefined
  staticImage?: string | null | undefined
}

export type NotificationPreferences = {
  emailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
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

// ── business-admin-info collection ──

export type BusinessAdminCompanyInfo = {
  companyName?: string
  orgNumber?: string
  industry?: string
  companySize?: string
  companyEmail?: string
  companyPhone?: string
  companyWebsite?: string
  companyAddress?: string
  companyLogo?: {
    uploadImage?: number | Media | null
    staticImage?: string | null
  }
}

export type BusinessAdminNotificationPreferences = {
  emailNotif: boolean
  newManagerNotif: boolean
  placementAlert: boolean
  weeklyReport: boolean
}

export type BusinessAdminInfo = {
  id: string
  user: number
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  jobTitle?: string
  company?: BusinessAdminCompanyInfo
  notificationPreferences?: BusinessAdminNotificationPreferences
  twoFactorEnabled?: boolean
  createdAt: string
  updatedAt: string
}

// Body shape accepted by PUT /api/company/settings — every field optional
// since it's used for partial saves from each settings tab
export type BusinessAdminInfoRequest = Partial<
  Omit<BusinessAdminInfo, 'id' | 'user' | 'createdAt' | 'updatedAt'>
>

export interface BusinessAdminInfoResponse {
  data: BusinessAdminInfo | null
}

// ── manager-info collection ──

export type ManagerDepartmentInfo = {
  department?: string
  deptSize?: string
  deptFocus?: string
  managedSince?: string
  deptGoals?: string
}

export type ManagerNotificationPreferences = {
  emailNotif: boolean
  cvActivity: boolean
  placementAlert: boolean
  weeklyDigest: boolean
  scheduleReminders: boolean
}

export type ManagerPreferences = {
  timezone?: string
  dateFormat?: string
}

export type ManagerInfo = {
  id: string
  user: number
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  mobilePhone?: string
  jobTitle?: string
  professionalBio?: string
  department?: ManagerDepartmentInfo
  socialLinks?: SocialLinks
  notificationPreferences?: ManagerNotificationPreferences
  preferences?: ManagerPreferences
  twoFactorEnabled?: boolean
  createdAt: string
  updatedAt: string
}

// Body shape accepted by PUT /api/manager/settings — every field optional
// since it's used for partial saves from each settings tab
export type ManagerInfoRequest = Partial<
  Omit<ManagerInfo, 'id' | 'user' | 'createdAt' | 'updatedAt'>
>

export interface ManagerInfoResponse {
  data: ManagerInfo | null
}

// ── Fields read by the business-admin's manager list/edit UI ──
// Shape returned by GET /api/company/managers and consumed by PATCH
// /api/company/managers/[id] — a merge of Users fields (accessLevel, status)
// and manager-info fields (phone, department), not a raw collection type.
export type ManagerListItem = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  department: string
  accessLevel: string
  status: 'active' | 'inactive' | 'pending'
  employeeCount: number
  joinedAt: string
}

export interface ManagerListResponse {
  data: ManagerListItem[]
}

export type UpdateManagerRequest = Partial<{
  firstName: string
  lastName: string
  email: string
  phone: string
  department: string
  accessLevel: string
  status: 'active' | 'inactive' | 'pending'
}>

// ── employee-invitations collection ──

export type InvitationStatus = 'pending' | 'accepted' | 'declined'

export type EmployeeInvitation = {
  id: string
  manager: number
  employee: number
  bossName: string
  companyName?: string
  employeeEmail: string
  status: InvitationStatus
  respondedAt?: string | null
  createdAt: string
  updatedAt: string
}

// Body accepted by POST /api/manager/invitations
export interface SendInvitationRequest {
  email: string
}

// Shape returned by GET /api/manager/invitations (invitations a manager sent)
export type SentInvitationListItem = {
  id: string
  employeeEmail: string
  bossName: string
  companyName?: string
  status: InvitationStatus
  createdAt: string
  respondedAt: string | null
}

export interface SentInvitationListResponse {
  data: SentInvitationListItem[]
}

// Shape returned by GET /api/user/invitations (invitations addressed to the
// logged-in employee) — this is what NotificationBell renders
export type ReceivedInvitationListItem = {
  id: string
  bossName: string
  companyName?: string
  status: InvitationStatus
  createdAt: string
}

export interface ReceivedInvitationListResponse {
  data: ReceivedInvitationListItem[]
}

// Body accepted by PATCH /api/user/invitations/[id]
export interface RespondToInvitationRequest {
  action: 'accept' | 'decline'
}

// Shape returned by GET /api/manager/employees (employees who accepted this
// manager's invitation — a join across employee-invitations + Users, not a
// raw collection type)
export type AcceptedEmployeeListItem = {
  employeeId: string
  employeeName: string
  employeeEmail: string
  acceptedAt: string | null
}

export interface AcceptedEmployeeListResponse {
  data: AcceptedEmployeeListItem[]
}

// ── Read-only portfolio items as returned to a manager ──
// Mirrors the shape normaliseItem() produces in the portfolio API routes,
// not the raw 'portfolio' collection schema (media relationships are already
// resolved down to plain URLs here).

export type ManagerViewPortfolioItem = {
  id: string
  type: 'image' | 'video' | 'youtube' | 'link' | 'document'
  title: string
  description?: string
  tags?: string[]
  featured?: boolean
  imageUrl?: string
  videoUrl?: string
  videoThumbnailUrl?: string
  youtubeUrl?: string
  youtubeVideoId?: string
  youtubeThumbnailUrl?: string
  linkUrl?: string
  linkThumbnailUrl?: string
  documentUrl?: string
  documentName?: string
  documentSize?: number
  documentExt?: 'pdf' | 'docx' | 'doc' | 'pptx' | 'ppt'
  createdAt: string
}

// Shape returned by GET /api/manager/employees/[employeeId]/portfolio
export interface ManagerEmployeePortfolioResponse {
  employee: { id: string; name: string; email: string }
  items: ManagerViewPortfolioItem[]
}

// ── employee-hr-info collection ──
// Manager-editable HR fields, separate from the employee's own
// personal-information and cvs (which stay read-only in this feature).

export type EmploymentInfo = {
  jobTitle?: string
  department?: string
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'intern'
  startDate?: string
  status?: 'active' | 'on-leave' | 'terminated'
}

export type UpcomingEvent = {
  id?: string
  title: string
  date: string
  eventType?: 'meeting' | 'review' | 'training' | 'other'
  notes?: string
}

export type LeaveBalance = {
  vacationDaysTotal?: number
  vacationDaysUsed?: number
  sickDaysTotal?: number
  sickDaysUsed?: number
  otherLeaveDays?: number
}

export type EmployeeHrInfo = {
  id: string
  user: number
  employmentInfo?: EmploymentInfo
  workSummary?: string
  upcomingEvents?: UpcomingEvent[]
  leaveBalance?: LeaveBalance
  createdAt: string
  updatedAt: string
}

// Body accepted by PATCH /api/company/managers/employees/[employeeId]/hr-info
// — every field optional since each section (Employment Info, Work Summary,
// Events, Leave Balance) saves independently from its own Save button.
export type UpdateEmployeeHrInfoRequest = Partial<
  Omit<EmployeeHrInfo, 'id' | 'user' | 'createdAt' | 'updatedAt'>
>

export interface UpdateEmployeeHrInfoResponse {
  data: EmployeeHrInfo
}

// Read-only snapshot of the employee's own personal-information, as exposed
// through the manager's combined HR view — deliberately a subset (only the
// fields actually shown), not the full PersonalInformation collection type.
export type EmployeeAccountSettingsSummary = {
  firstName?: string
  lastName?: string
  phoneNumber?: string
  workPhoneNumber?: string
  workEmail?: string
  homeAddress?: string
  title?: string
}

// Read-only snapshot of the employee's most recent CV's first experience
// entry, as exposed through the manager's combined HR view.
export type EmployeeCvEmploymentSummary = {
  employer?: string
  title?: string
  startDate?: string
  ongoing?: boolean
}

// Shape returned by GET /api/company/managers/employees/[employeeId]/hr-info
// — a combined view: manager-editable HR record + two read-only summaries.
// Not a raw collection type.
export interface EmployeeHrInfoViewResponse {
  hrInfo: EmployeeHrInfo | null
  accountSettings: EmployeeAccountSettingsSummary | null
  cvEmployment: EmployeeCvEmploymentSummary | null
  cvName: string | null
}

export interface Profile {
  id: number // Note: In your data this is a number, not string
  createdAt: Date
  updatedAt: Date
  language: 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja'
  user: number // Simplified from your original { id: number, email?: string }
  personalInformation: PersonalInformation
  availabilityInformation?: availabilityInformation | null
  profileDetails: {
    personalInfo?: PersonalInformation
    skills: Skill[]
    experience: Employer[]
    employers: Employer[] // legacy alias if needed
    education: Education[]
    projects: ProjectDetail[]
    languages: Language[]
    certifications: Certification[]
    references: Reference[]
  }
}

// API response types
export interface ProfilesResponse {
  docs: Profile[] // Changed from Profile to Profile[]
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
export interface SingleProfileResponse extends Profile {}

// Request types - updated to match PayloadCMS expectations
export interface CreateProfileRequest {
  user: number // User ID as number
  language: 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja'
  profileDetails?: ProfileDetails
}

export interface UpdateProfileRequest {
  user?: number // User ID as number
  language?: 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja'
  profileDetails?: ProfileDetails
}

// Type for client-side use (converting between string and number IDs)
export interface ClientCreateProfileRequest {
  user: number // User ID as string for client-side
  language: 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja'
  profileDetails?: ProfileDetails
}

export interface ClientUpdateProfileRequest {
  user?: number // User ID as string for client-side
  language?: 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja'
  profileDetails?: ProfileDetails
}
