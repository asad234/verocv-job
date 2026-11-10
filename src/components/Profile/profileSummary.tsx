"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Briefcase,
  Plus,
  Globe,
  Building,
  UserCheck,
  Award,
  GraduationCap,
  User,
  Code,
  CheckCircle,
  AlertCircle,
  Icon,
} from "lucide-react"
import { z } from "zod"
import { useUIStore } from "@/utils/changesStore"
import ProjectForm from "@/components/Dashboard/Forms/projectForm"
import SkillForm from "@/components/Dashboard/Forms/skillsForm"
import EmployerForm from "@/components/Dashboard/Forms/employerForm"
import EducationForm from "@/components/Dashboard/Forms/educationForm"
import LanguageForm from "@/components/Dashboard/Forms/languageForm"
import CertificationForm from "@/components/Dashboard/Forms/certificationForm"
import ReferenceForm from "@/components/Dashboard/Forms/referenceForm"
import type { SectionType } from "@/utils/types"
import { useProfileStore } from "@/utils/profileStore"
import { useDeleteConfirmation } from "../Common/DeleteConfirmationPopUp"
import PersonalInformationForm from "../Dashboard/Forms/personalInformationForm"
import { useHasUnsavedChanges } from "@/utils/changesStore"
import { usePersonalInfoStore } from "@/hooks/personal-information/personalInformationStore"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { useDashboardTranslation } from "@/hooks/useDashboardTranslation"
import { Link as LinkIcon } from "lucide-react";
import ProfileDocumentUploader from "./ProfileDocumentUploader"

const languageLevels = ["Native", "Fluent", "Advanced", "Intermediate", "Basic"] as const

const educationLevels = [
  "High School",
  "Associate's Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "Doctorate",
  "Certificate",
  "Diploma",
] as const

// Date string schema: accepts Date or string, converts Date to "YYYY-MM-DD", validates format
const dateStringSchema = z
  .date({
    required_error: "Date is required",
    invalid_type_error: "Must be a valid Date object",
  })
  .transform((val) => {
    const yyyy = val.getFullYear()
    const mm = String(val.getMonth() + 1).padStart(2, "0")
    const dd = String(val.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  })

const ProjectDetailSchema = z.object({
  role: z.string().nonempty("Role is required"),
  startDate: dateStringSchema,
  endDate: dateStringSchema.optional().nullable(),
  isCurrent: z.boolean(),
  description: z.string().nonempty("Description is required"),
  skills: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  projectUrl: z.string().optional().nullable(),
})

const SkillSchema = z.object({
  skillName: z.string().nonempty("Skill name is required"),
  skillRating: z
    .number({ invalid_type_error: "Skill rating must be a number" })
    .min(1, "Skill rating must be at least 1")
    .max(5, "Skill rating cannot exceed 5"),
  skillYearsExperience: z
    .number({ invalid_type_error: "Years of experience must be a number" })
    .min(0, "Years of experience cannot be negative"),
})

const ReferenceSchema = z.object({
  firstName: z.string().nonempty("First name is required"),
  lastName: z.string().nonempty("Last name is required"),
  email: z.string().email("Invalid email"),
  phoneNumber: z.string().nonempty("Phone number is required"),
  company: z.string().optional().nullable(),
  positionTitle: z.string().nonempty("Position title is required"),
  relationship: z.string().nonempty("Relationship is required"),
})

const CommitmentSchema = z.object({
  title: z.string().nonempty("Title is required"),
  startDate: dateStringSchema,
  endDate: dateStringSchema.optional().nullable(),
  isOngoing: z.boolean(),
  description: z.string().nonempty("Description is required"),
})

const CertificationSchema = z.object({
  type: z.enum(["certificate", "course"]),
  title: z.string().nonempty("Title is required"),
  startDate: dateStringSchema,
  validDate: dateStringSchema.optional().nullable(),
  code: z.string().optional().nullable(),
  issuer: z.string().nonempty("Issuer is required"),
  supplier: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  link: z.string().optional().nullable(),
  noExpiry: z.boolean().optional(),
})

const EmployerSchema = z.object({
  employer: z.string().nonempty("Employer is required"),
  title: z.string().nonempty("Title is required"),
  startDate: dateStringSchema,
  ongoing: z.boolean().optional(),
  endDate: dateStringSchema.optional().nullable(),
  description: z.string().nonempty("Description is required"),
  link: z.string().optional().nullable(),
})

const EducationSchema = z.object({
  school: z.string().nonempty("School is required"),
  program: z.string().nonempty("Program is required"),
  level: z.enum(educationLevels),
  place: z.string().nonempty("Place is required"),
  startDate: dateStringSchema,
  endDate: dateStringSchema.optional().nullable(),
  ongoing: z.boolean().optional(),
  description: z.string().nonempty("Description is required"),
  link: z.string().optional().nullable(),
})

const LanguageSkillSchema = z.object({
  language: z.string().nonempty("Language is required"),
  level: z.enum(languageLevels),
})

interface ProfileSummaryProps {
  onComplete: () => void
  mode?: "create" | "edit"
}

export default function ProfileSummary({ onComplete, mode = "create" }: ProfileSummaryProps) {
  const { t } = useDashboardTranslation()

  const { isDeleteDialogOpen, itemToDelete, openDeleteDialog, closeDeleteDialog, DeleteConfirmationModalComponent } =
    useDeleteConfirmation()

  // Store access
  const projects = useProfileStore((state) => state.projectDetails)
  const personalInformation = usePersonalInfoStore((state) => state.personalInfo)
  const skills = useProfileStore((state) => state.skills)
  const languages = useProfileStore((state) => state.languages)
  const references = useProfileStore((state) => state.references)
  const certifications = useProfileStore((state) => state.certifications)
  const employers = useProfileStore((state) => state.employers)
  const education = useProfileStore((state) => state.education)
  const { expandedSections, toggleSection } = useUIStore()
  const currentProfile = useProfileStore((state) => state.currentProfile)
  const removeItemFromStore = useProfileStore((state) => state.removeItem)


  const sortByDate = <
    T extends {
      startDate: Date | string | null
      endDate?: Date | string | null
      validDate?: Date | string | null
      isCurrent?: boolean
      ongoing?: boolean
      noExpiry?: boolean
    }
  >(
    items: T[]
  ): T[] => {
    return [...items].sort((a, b) => {
      const aStart = a.startDate ? new Date(a.startDate).getTime() : 0
      const bStart = b.startDate ? new Date(b.startDate).getTime() : 0

      // Sort by start date (most recent first)
      if (bStart !== aStart) {
        return bStart - aStart
      }

      // If start dates are equal, ongoing/current items come first
      const aIsOngoing = !!(a.isCurrent || a.ongoing)
      const bIsOngoing = !!(b.isCurrent || b.ongoing)

      if (aIsOngoing && !bIsOngoing) return -1
      if (!aIsOngoing && bIsOngoing) return 1

      // If both have end dates, sort by end date (most recent first)
      if (a.endDate && b.endDate) {
        const aEnd = new Date(a.endDate).getTime()
        const bEnd = new Date(b.endDate).getTime()
        return bEnd - aEnd
      }

      return 0
    })
  }

  // Create sorted arrays
  const sortedProjects = sortByDate(projects)
  const sortedEmployers = sortByDate(employers)
  const sortedEducation = sortByDate(education)
  const sortedCertifications = sortByDate(certifications)

  // Form states
  const [editingProject, setEditingProject] = useState<string | null>(null)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [editingSkill, setEditingSkill] = useState<string | null>(null)
  const [showSkillForm, setShowSkillForm] = useState(false)
  const [editingLanguage, setEditingLanguage] = useState<string | null>(null)
  const [showLanguageForm, setShowLanguageForm] = useState(false)
  const [showPersonalInfoForm, setShowPersonalInfoForm] = useState(false)
  const [editingReference, setEditingReference] = useState<string | null>(null)
  const [showReferenceForm, setShowReferenceForm] = useState(false)
  const [editingCertification, setEditingCertification] = useState<string | null>(null)
  const [showCertificationForm, setShowCertificationForm] = useState(false)
  const [editingEmployer, setEditingEmployer] = useState<string | null>(null)
  const [showEmployerForm, setShowEmployerForm] = useState(false)
  const [editingEducation, setEditingEducation] = useState<string | null>(null)
  const [showEducationForm, setShowEducationForm] = useState(false)
  const hasUnsavedChanges = useHasUnsavedChanges()

  useEffect(() => {
    if (itemToDelete?.id && !isDeleteDialogOpen) {
      removeItemFromStore(itemToDelete.type!, itemToDelete.id)
    }
  }, [isDeleteDialogOpen, itemToDelete, removeItemFromStore])

  // Validation functions
  const validateWithSchema = (schema: z.ZodSchema, data: any) => {
    const result = schema.safeParse(data)
    return result.success
  }

  const validatePersonalInfo = (info: any) => {
    return info?.firstName && info?.lastName && info?.title
  }

  const validateProject = (project: any) => validateWithSchema(ProjectDetailSchema, project)

  const validateEmployer = (employer: any) => validateWithSchema(EmployerSchema, employer)

  const validateSkill = (skill: any) => validateWithSchema(SkillSchema, skill)

  const validateEducation = (education: any) => validateWithSchema(EducationSchema, education)

  const validateCertification = (cert: any) => validateWithSchema(CertificationSchema, cert)

  const validateLanguage = (lang: any) => validateWithSchema(LanguageSkillSchema, lang)

  const validateReference = (ref: any) => validateWithSchema(ReferenceSchema, ref)

  const getValidationStatus = (section: SectionType) => {
    switch (section) {
      case "projectDetails":
        return projects.length > 0 && projects.every(validateProject)
      case "employers":
        return employers.length > 0 && employers.every(validateEmployer)
      case "skills":
        return skills.length > 0 && skills.every(validateSkill)
      case "education":
        return education.length > 0 && education.every(validateEducation)
      case "certifications":
        return certifications.length > 0 && certifications.every(validateCertification)
      case "languages":
        return languages.length > 0 && languages.every(validateLanguage)
      case "references":
        return references.length > 0 && references.every(validateReference)
      default:
        return false
    }
  }

  const ValidationIndicator = ({
    isValid,
    section,
    item,
  }: {
    isValid: boolean
    section: SectionType
    item?: any
  }) => {
    const getValidationErrors = () => {
      if (isValid) return []

      try {
        switch (section) {
          case "projectDetails":
            ProjectDetailSchema.parse(item)
            break
          case "employers":
            EmployerSchema.parse(item)
            break
          case "skills":
            SkillSchema.parse(item)
            break
          case "education":
            EducationSchema.parse(item)
            break
          case "certifications":
            CertificationSchema.parse(item)
            break
          case "languages":
            LanguageSkillSchema.parse(item)
            break
          case "references":
            ReferenceSchema.parse(item)
            break
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          return error.errors.map((e) => e.message)
        }
        return [t.invalidDataStructure]
      }
      return [t.missingRequiredFields]
    }

    const errors = getValidationErrors()

    const tooltipText = isValid
      ? t.allRequiredFieldsComplete
      : errors.length > 0
        ? errors.join(", ")
        : t.thisSectionNeedsAttention

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`ml-2 p-1 rounded-full ${isValid ? "text-green-500" : "text-yellow-500"}`}>
              {isValid ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            </span>
          </TooltipTrigger>
          <TooltipContent>{tooltipText}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const isProfileComplete = () => {
    const sections: SectionType[] = [
      "projectDetails",
      "employers",
      "skills",
      "education",
      "certifications",
      "languages",
      "references",
    ]

    return sections.every((section) => getValidationStatus(section))
  }

  const ValidationSummary = () => {
    const sections = [
      { id: "projectDetails", name: t.projects, icon: Briefcase },
      { id: "employers", name: t.employment, icon: Building },
      { id: "skills", name: t.skills, icon: Code },
      { id: "education", name: t.education, icon: GraduationCap },
      { id: "certifications", name: t.certifications, icon: Award },
      { id: "languages", name: t.languages, icon: Globe },
      { id: "references", name: t.references, icon: UserCheck },
    ] as const

    return (
      <div className="mb-8 p-6 bg-gray-50 rounded-xl">
        <h3 className="text-lg font-semibold mb-4">{t.profileCompletion}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map(({ id, name, icon: Icon }) => {
            const isValid = getValidationStatus(id as SectionType)
            return (
              <div key={id} className="flex items-center">
                <Icon className={`w-5 h-5 mr-3 ${isValid ? "text-green-500" : "text-yellow-500"}`} />
                <span className="flex-grow">{name}</span>
                <ValidationIndicator isValid={isValid} section={id as SectionType} />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return ""
    const parsedDate = new Date(date)
    return isNaN(parsedDate.getTime()) ? "" : parsedDate.toLocaleDateString()
  }

  if (!currentProfile) {
    return <p>{t.loadingProfile}</p>
  }

  const handleDeleteClick = (type: SectionType, id: string) => {
    openDeleteDialog(type, id)
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">
        {mode === "create" ? t.createYourProfile : t.editYourProfile}
      </h2>

      <ProfileDocumentUploader onProfileUpdated={(data) => console.log("Profile updated:", data)} />

      <ValidationSummary />

      {/* Personal Information */}
      <div className="mb-6 rounded-xl shadow-md overflow-hidden bg-white p-6">
        <div className="flex items-center mb-4">
          <User className="w-6 h-6 mr-4" style={{ color: 'rgb(5, 22, 80)' }} />
          <h3 className="font-semibold text-xl">{t.personalInformation}</h3>
        </div>

        {showPersonalInfoForm ? (
          <PersonalInformationForm
            onCancel={() => setShowPersonalInfoForm(false)}
            onComplete={() => setShowPersonalInfoForm(false)}
          />
        ) : (
          <>
            {personalInformation ? (
              <div className="p-6 bg-gray-50 rounded-lg shadow-sm relative">
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setShowPersonalInfoForm(true)}
                    className="transition-colors"
                    style={{ color: 'rgb(5, 22, 80)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(176, 196, 222)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(5, 22, 80)'}
                    aria-label={t.editPersonalInformation}
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                </div>
                <h4 className="font-semibold text-xl mb-2">
                  {personalInformation?.firstName} {personalInformation?.lastName}
                </h4>
                <p className="text-gray-600 mb-4">{personalInformation?.title}</p>
                {personalInformation?.professionalPresentation && (
                  <div className="mt-4">
                    <h5 className="font-medium text-gray-700 mb-2">{t.professionalSummary}</h5>
                    <p className="text-gray-600">{personalInformation?.professionalPresentation}</p>
                  </div>
                )}
                {personalInformation?.personalPresentation && (
                  <div className="mt-4">
                    <h5 className="font-medium text-gray-700 mb-2">{t.personalSummary}</h5>
                    <p className="text-gray-600">{personalInformation?.personalPresentation}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-5">{t.noPersonalInformationAdded}</p>
                <button
                  onClick={() => setShowPersonalInfoForm(true)}
                  className="flex items-center justify-center mx-auto text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-md"
                  style={{ backgroundColor: 'rgb(5, 22, 80)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  {t.addPersonalInformation}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Projects Section */}
      <div className="mb-6 rounded-xl shadow-md overflow-hidden bg-white">
        <div
          className="flex items-center justify-between cursor-pointer p-6 bg-gray-50 hover:bg-gray-100 transition-colors"
          onClick={() => toggleSection("projectDetails")}
        >
          <div className="flex items-center">
            <Briefcase className="w-6 h-6 mr-4" style={{ color: 'rgb(5, 22, 80)' }} />
            <h3 className="font-semibold text-xl flex items-center gap-2">
              {t.projectsAndAssignments}
              <span className="w-6 h-6 rounded-full bg-secondary text-white text-sm flex items-center justify-center">
                {projects.length}
              </span>
            </h3>
            <ValidationIndicator isValid={getValidationStatus("projectDetails")} section="projectDetails" />
          </div>
          <div className="flex items-center">
            {expandedSections.projectDetails ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </div>
        </div>

        {expandedSections.projectDetails && (
          <div className="p-6">
            {showProjectForm ? (
              <ProjectForm
                projectId={editingProject}
                onCancel={() => setShowProjectForm(false)}
                onComplete={() => setShowProjectForm(false)}
              />
            ) : (
              <>
                {sortedProjects.length > 0 ? (
                  <div className="space-y-5">
                    {sortedProjects.map((project) => {
                      const isValid = validateProject(project)
                      return (
                        <div key={project.id} className="p-6 bg-gray-50 rounded-lg shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-xl">{project.role}</h4>
                            <div className="flex items-center space-x-3">
                              <ValidationIndicator isValid={isValid} section="projectDetails" item={project} />
                              <button
                                onClick={() => {
                                  setEditingProject(project.id)
                                  setShowProjectForm(true)
                                }}
                                className="transition-colors"
                                style={{ color: 'rgb(5, 22, 80)' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(176, 196, 222)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(5, 22, 80)'}
                                aria-label={t.editProject}
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick("projectDetails", project.id)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                                aria-label={t.deleteProject}
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-gray-600 mb-4">
                            {project.company && `${project.company} • `}
                            {formatDate(project.startDate)} -{" "}
                            {project.isCurrent ? t.present : formatDate(project.endDate!)}
                          </p>

                          <p className="mb-4">{project.description}</p>

                          {project.skills && project.skills.split(",").length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-3">
                              {project.skills.split(",").map((skill, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1.5 rounded-full text-sm"
                                  style={{
                                    backgroundColor: 'rgb(176, 196, 222, 0.2)',
                                    color: 'rgb(5, 22, 80)',
                                  }}
                                >
                                  {skill.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center mb-5">{t.noProjectsAddedYet}</p>
                )}

                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => {
                      setEditingProject(null)
                      setShowProjectForm(true)
                    }}
                    className="flex items-center text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-md"
                    style={{ backgroundColor: 'rgb(5, 22, 80)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    {t.addNewProject}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Employers Section */}
      <div className="mb-6 rounded-xl shadow-md overflow-hidden bg-white">
        <div
          className="flex items-center justify-between cursor-pointer p-6 bg-gray-50 hover:bg-gray-100 transition-colors"
          onClick={() => toggleSection("employers")}
        >
          <div className="flex items-center">
            <Building className="w-6 h-6 mr-4" style={{ color: 'rgb(5, 22, 80)' }} />
            <h3 className="font-semibold text-xl flex items-center gap-2">
              {t.employmentHistory}
              <span className="w-6 h-6 rounded-full bg-secondary text-white text-sm flex items-center justify-center">
                {employers.length}
              </span>
            </h3>
            <ValidationIndicator isValid={getValidationStatus("employers")} section="employers" />
          </div>
          <div className="flex items-center">
            {expandedSections.employers ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </div>
        </div>

        {expandedSections.employers && (
          <div className="p-6">
            {showEmployerForm ? (
              <EmployerForm
                employerId={editingEmployer}
                onCancel={() => setShowEmployerForm(false)}
                onComplete={() => setShowEmployerForm(false)}
              />
            ) : (
              <>
                {sortedEmployers.length > 0 ? (
                  <div className="space-y-5">
                    {sortedEmployers.map((employer) => {
                      const isValid = validateEmployer(employer)
                      return (
                        <div key={employer.id} className="p-6 bg-gray-50 rounded-lg shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-xl">{employer.title}</h4>
                              <p className="text-gray-600">{employer.employer}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <ValidationIndicator isValid={isValid} section="employers" item={employer} />
                              <button
                                onClick={() => {
                                  setEditingEmployer(employer.id)
                                  setShowEmployerForm(true)
                                }}
                                className="transition-colors"
                                style={{ color: 'rgb(5, 22, 80)' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(176, 196, 222)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(5, 22, 80)'}
                                aria-label={t.editEmployer}
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick("employers", employer.id)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                                aria-label={t.deleteEmployer}
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-gray-600 mb-4">
                            {formatDate(employer.startDate)} -{" "}
                            {employer.ongoing ? t.present : formatDate(employer.endDate!)}
                          </p>
                          <p className="mb-4">{employer.description}</p>

                          {employer.link && (
                            <p className="mt-3">
                              <a
                                href={employer.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline flex items-center transition-colors"
                                style={{ color: 'rgb(5, 22, 80)' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(176, 196, 222)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(5, 22, 80)'}
                              >
                                <LinkIcon className="w-5 h-5 mr-2" />
                                {t.companyWebsite}
                              </a>
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center mb-5">{t.noEmploymentHistoryAdded}</p>
                )}
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => {
                      setEditingEmployer(null)
                      setShowEmployerForm(true)
                    }}
                    className="flex items-center text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-md"
                    style={{ backgroundColor: 'rgb(5, 22, 80)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    {t.addNewEmployer}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Skills Section */}
      <div className="mb-6 rounded-xl shadow-md overflow-hidden bg-white">
        <div
          className="flex items-center justify-between cursor-pointer p-6 bg-gray-50 hover:bg-gray-100 transition-colors"
          onClick={() => toggleSection("skills")}
        >
          <div className="flex items-center">
            <Code className="w-6 h-6 mr-4" style={{ color: 'rgb(5, 22, 80)' }} />
            <h3 className="font-semibold text-xl flex items-center gap-2">
              {t.skills}
              <span className="w-6 h-6 rounded-full bg-secondary text-white text-sm flex items-center justify-center">
                {skills.length}
              </span>
            </h3>
            <ValidationIndicator isValid={getValidationStatus("skills")} section="skills" />
          </div>
          <div className="flex items-center">
            {expandedSections.skills ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </div>
        </div>

        {expandedSections.skills && (
          <div className="p-6">
            {showSkillForm ? (
              <SkillForm
                skillId={editingSkill}
                onCancel={() => setShowSkillForm(false)}
                onComplete={() => setShowSkillForm(false)}
              />
            ) : (
              <>
                {skills.length > 0 ? (
                  <div className="space-y-4">
                    {skills.map((skill) => {
                      const isValid = validateSkill(skill)
                      return (
                        <div
                          key={skill.id}
                          className="p-5 bg-gray-50 rounded-lg shadow-sm flex justify-between items-center"
                        >
                          <div className="flex items-center space-x-4">
                            <ValidationIndicator isValid={isValid} section="skills" item={skill} />
                            <span className="font-medium text-lg">{skill.skillName}</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            {skill.skillRating && (
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span
                                    key={star}
                                    className={`w-6 h-6 ${star <= skill.skillRating! ? "text-yellow-500" : "text-gray-300"}`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            )}
                            {skill.skillYearsExperience && (
                              <div
                                className="px-3 py-1 rounded-full text-sm"
                                style={{
                                  backgroundColor: 'rgb(176, 196, 222, 0.2)',
                                  color: 'rgb(5, 22, 80)',
                                }}
                              >
                                {skill.skillYearsExperience === 5 ? "5+" : skill.skillYearsExperience}{" "}
                                {skill.skillYearsExperience === 1 ? t.year : t.years}
                              </div>
                            )}
                            <div className="flex space-x-3">
                              <button
                                onClick={() => {
                                  setEditingSkill(skill.id)
                                  setShowSkillForm(true)
                                }}
                                className="transition-colors"
                                style={{ color: 'rgb(5, 22, 80)' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(176, 196, 222)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(5, 22, 80)'}
                                aria-label={t.editSkill}
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick("skills", skill.id)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                                aria-label={t.deleteSkill}
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center mb-5">{t.noSkillsAddedYet}</p>
                )}
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => {
                      setEditingSkill(null)
                      setShowSkillForm(true)
                    }}
                    className="flex items-center text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-md"
                    style={{ backgroundColor: 'rgb(5, 22, 80)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    {t.addNewSkill}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Education Section */}
      <div className="mb-6 rounded-xl shadow-md overflow-hidden bg-white">
        <div
          className="flex items-center justify-between cursor-pointer p-6 bg-gray-50 hover:bg-gray-100 transition-colors"
          onClick={() => toggleSection("education")}
        >
          <div className="flex items-center">
            <GraduationCap className="w-6 h-6 mr-4" style={{ color: 'rgb(5, 22, 80)' }} />
            <h3 className="font-semibold text-xl flex items-center gap-2">
              {t.education}
              <span className="w-6 h-6 rounded-full bg-secondary text-white text-sm flex items-center justify-center">
                {education.length}
              </span>
            </h3>
            <ValidationIndicator isValid={getValidationStatus("education")} section="education" />
          </div>
          <div className="flex items-center">
            {expandedSections.education ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </div>
        </div>

        {expandedSections.education && (
          <div className="p-6">
            {showEducationForm ? (
              <EducationForm
                educationId={editingEducation}
                onCancel={() => setShowEducationForm(false)}
                onComplete={() => setShowEducationForm(false)}
              />
            ) : (
              <>
                {sortedEducation.length > 0 ? (
                  <div className="space-y-5">
                    {sortedEducation.map((edu) => {
                      const isValid = validateEducation(edu)
                      return (
                        <div key={edu.id} className="p-6 bg-gray-50 rounded-lg shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-xl">{edu.program}</h4>
                              <p className="text-gray-600">
                                {edu.school} • {edu.level}
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <ValidationIndicator isValid={isValid} section="education" item={edu} />
                              <button
                                onClick={() => {
                                  setEditingEducation(edu.id)
                                  setShowEducationForm(true)
                                }}
                                className="transition-colors"
                                style={{ color: 'rgb(5, 22, 80)' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(176, 196, 222)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(5, 22, 80)'}
                                aria-label={t.editEducation}
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick("education", edu.id)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                                aria-label={t.deleteEducation}
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-gray-600 mb-4">
                            {formatDate(edu.startDate)} - {edu.ongoing ? t.present : formatDate(edu.endDate!)}
                          </p>

                          <p className="mb-4">{edu.description}</p>

                          {edu.link && (
                            <p className="mt-3">
                              <a
                                href={edu.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline flex items-center transition-colors"
                                style={{ color: 'rgb(5, 22, 80)' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(176, 196, 222)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(5, 22, 80)'}
                              >
                                <LinkIcon className="w-5 h-5 mr-2" />
                                {t.schoolWebsite}
                              </a>
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center mb-5">{t.noEducationAddedYet}</p>
                )}
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => {
                      setEditingEducation(null)
                      setShowEducationForm(true)
                    }}
                    className="flex items-center text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-md"
                    style={{ backgroundColor: 'rgb(5, 22, 80)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    {t.addNewEducation}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Languages Section */}
      <div className="mb-6 rounded-xl shadow-md overflow-hidden bg-white">
        <div
          className="flex items-center justify-between cursor-pointer p-6 bg-gray-50 hover:bg-gray-100 transition-colors"
          onClick={() => toggleSection("languages")}
        >
          <div className="flex items-center">
            <Globe className="w-6 h-6 mr-4" style={{ color: 'rgb(5, 22, 80)' }} />
            <h3 className="font-semibold text-xl flex items-center gap-2">
              {t.languages}
              <span className="w-6 h-6 rounded-full bg-secondary text-white text-sm flex items-center justify-center">
                {languages.length}
              </span>
            </h3>
            <ValidationIndicator isValid={getValidationStatus("languages")} section="languages" />
          </div>
          <div className="flex items-center">
            {expandedSections.languages ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </div>
        </div>

        {expandedSections.languages && (
          <div className="p-6">
            {showLanguageForm ? (
              <LanguageForm
                languageId={editingLanguage}
                onCancel={() => setShowLanguageForm(false)}
                onComplete={() => setShowLanguageForm(false)}
              />
            ) : (
              <>
                {languages.length > 0 ? (
                  <div className="space-y-4">
                    {languages.map((lang) => {
                      const isValid = validateLanguage(lang)
                      return (
                        <div
                          key={lang.id}
                          className="p-5 bg-gray-50 rounded-lg shadow-sm flex justify-between items-center"
                        >
                          <div className="flex items-center space-x-4">
                            <ValidationIndicator isValid={isValid} section="languages" item={lang} />
                            <span className="font-medium text-lg">{lang.language}</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span
                              className="px-3 py-1.5 rounded-full text-sm"
                              style={{
                                backgroundColor: 'rgb(176, 196, 222, 0.2)',
                                color: 'rgb(5, 22, 80)',
                              }}
                            >
                              {lang.level}
                            </span>
                            <div className="flex space-x-3">
                              <button
                                onClick={() => {
                                  setEditingLanguage(lang.id)
                                  setShowLanguageForm(true)
                                }}
                                className="transition-colors"
                                style={{ color: 'rgb(5, 22, 80)' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(176, 196, 222)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(5, 22, 80)'}
                                aria-label={t.editLanguage}
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick("languages", lang.id)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                                aria-label={t.deleteLanguage}
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center mb-5">{t.noLanguagesAddedYet}</p>
                )}
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => {
                      setEditingLanguage(null)
                      setShowLanguageForm(true)
                    }}
                    className="flex items-center text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-md"
                    style={{ backgroundColor: 'rgb(5, 22, 80)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    {t.addNewLanguage}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Certifications Section */}
      <div className="mb-6 rounded-xl shadow-md overflow-hidden bg-white">
        <div
          className="flex items-center justify-between cursor-pointer p-6 bg-gray-50 hover:bg-gray-100 transition-colors"
          onClick={() => toggleSection("certifications")}
        >
          <div className="flex items-center">
            <Award className="w-6 h-6 mr-4" style={{ color: 'rgb(5, 22, 80)' }} />
            <h3 className="font-semibold text-xl flex items-center gap-2">
              {t.certifications}
              <span className="w-6 h-6 rounded-full bg-secondary text-white text-sm flex items-center justify-center">
                {certifications.length}
              </span>
            </h3>
            <ValidationIndicator
              isValid={getValidationStatus("certifications")}
              section="certifications"
            />
          </div>
          <div className="flex items-center">
            {expandedSections.certifications ? (
              <ChevronUp className="w-6 h-6" />
            ) : (
              <ChevronDown className="w-6 h-6" />
            )}
          </div>
        </div>

        {expandedSections.certifications && (
          <div className="p-6">
            {showCertificationForm ? (
              <CertificationForm
                certificationId={editingCertification}
                onCancel={() => setShowCertificationForm(false)}
                onComplete={() => setShowCertificationForm(false)}
              />
            ) : (
              <>
                {sortedCertifications.length > 0 ? (
                  <div className="space-y-5">
                    {sortedCertifications.map((cert) => {
                      const isValid = validateCertification(cert)
                      return (
                        <div
                          key={cert.id}
                          className="p-6 bg-gray-50 rounded-lg shadow-sm"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-3">
                              <span
                                className="px-3 py-1.5 rounded-full text-sm"
                                style={{
                                  backgroundColor: 'rgb(176, 196, 222, 0.2)',
                                  color: 'rgb(5, 22, 80)',
                                }}
                              >
                                {cert.type === "certificate"
                                  ? t.certificate
                                  : t.course}
                              </span>
                              <h4 className="font-semibold text-xl">
                                {cert.title}
                              </h4>
                            </div>
                            <div className="flex items-center space-x-3">
                              <ValidationIndicator
                                isValid={isValid}
                                section="certifications"
                                item={cert}
                              />
                              <button
                                onClick={() => {
                                  setEditingCertification(cert.id)
                                  setShowCertificationForm(true)
                                }}
                                className="transition-colors"
                                style={{ color: 'rgb(5, 22, 80)' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(176, 196, 222)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(5, 22, 80)'}
                                aria-label={t.editCertification}
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteClick("certifications", cert.id)
                                }
                                className="text-red-500 hover:text-red-700 transition-colors"
                                aria-label={t.deleteCertification}
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-gray-600 mb-2">
                            {cert.issuer}{" "}
                            {cert.supplier && `• ${cert.supplier}`}
                          </p>

                          <p className="text-gray-600 mb-4">
                            {cert.noExpiry ? (
                              <>
                                {t.startDate}: {formatDate(cert.startDate)}{" "}
                                <span className="text-gray-500 italic">
                                  ({t.noExpiry})
                                </span>
                              </>
                            ) : (
                              <>
                                {formatDate(cert.startDate)} - {t.validUntil}{" "}
                                {formatDate(cert.validDate)}
                              </>
                            )}
                          </p>

                          {cert.code && (
                            <p className="mb-3">
                              <span className="text-gray-500">{t.code}:</span>{" "}
                              {cert.code}
                            </p>
                          )}
                          {cert.description && (
                            <p className="mb-4">{cert.description}</p>
                          )}
                          {cert.link && (
                            <p className="mt-3">
                              <a
                                href={cert.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline flex items-center transition-colors"
                                style={{ color: 'rgb(5, 22, 80)' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(176, 196, 222)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(5, 22, 80)'}
                              >
                                <LinkIcon className="w-5 h-5 mr-2" />
                                {t.viewCertificate}
                              </a>
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center mb-5">
                    {t.noCertificationsAddedYet}
                  </p>
                )}
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => {
                      setEditingCertification(null)
                      setShowCertificationForm(true)
                    }}
                    className="flex items-center text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-md"
                    style={{ backgroundColor: 'rgb(5, 22, 80)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    {t.addNewCertification}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>


      {/* References Section */}
      <div className="mb-6 rounded-xl shadow-md overflow-hidden bg-white">
        <div
          className="flex items-center justify-between cursor-pointer p-6 bg-gray-50 hover:bg-gray-100 transition-colors"
          onClick={() => toggleSection("references")}
        >
          <div className="flex items-center">
            <UserCheck className="w-6 h-6 mr-4" style={{ color: 'rgb(5, 22, 80)' }} />
            <h3 className="font-semibold text-xl flex items-center gap-2">
              {t.references}
              <span className="w-6 h-6 rounded-full bg-secondary text-white text-sm flex items-center justify-center">
                {references.length}
              </span>
            </h3>
            <ValidationIndicator isValid={getValidationStatus("references")} section="references" />
          </div>
          <div className="flex items-center">
            {expandedSections.references ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </div>
        </div>

        {expandedSections.references && (
          <div className="p-6">
            {showReferenceForm ? (
              <ReferenceForm
                referenceId={editingReference}
                onCancel={() => setShowReferenceForm(false)}
                onComplete={() => setShowReferenceForm(false)}
              />
            ) : (
              <>
                {references.length > 0 ? (
                  <div className="space-y-5">
                    {references.map((ref) => {
                      const isValid = validateReference(ref)
                      return (
                        <div key={ref.id} className="p-6 bg-gray-50 rounded-lg shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-xl">
                                {ref.firstName} {ref.lastName}
                              </h4>
                              <p className="text-gray-600">{ref.positionTitle}</p>
                              {ref.company && <p className="text-gray-600">{ref.company}</p>}
                            </div>
                            <div className="flex items-center space-x-3">
                              <ValidationIndicator isValid={isValid} section="references" item={ref} />
                              <button
                                onClick={() => {
                                  setEditingReference(ref.id)
                                  setShowReferenceForm(true)
                                }}
                                className="transition-colors"
                                style={{ color: 'rgb(5, 22, 80)' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(176, 196, 222)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(5, 22, 80)'}
                                aria-label={t.editReference}
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick("references", ref.id)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                                aria-label={t.deleteReference}
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-gray-600">
                              <span className="font-medium">{t.relationship}:</span> {ref.relationship}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-medium">{t.email}:</span> {ref.email}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-medium">{t.phone}:</span> {ref.phoneNumber}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center mb-5">{t.noReferencesAddedYet}</p>
                )}
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => {
                      setEditingReference(null)
                      setShowReferenceForm(true)
                    }}
                    className="flex items-center text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-md"
                    style={{ backgroundColor: 'rgb(5, 22, 80)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    {t.addNewReference}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModalComponent
        itemToDelete={itemToDelete}
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
      />
    </div>
  )
}
