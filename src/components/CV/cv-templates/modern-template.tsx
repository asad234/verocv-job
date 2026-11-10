import type {
  Certification,
  Education,
  Experience,
  Language,
  CVData, // Using the new comprehensive type
  ProjectDetails,
  Reference,
  Skill,
} from "@/utils/types"
import type { SectionVisibility } from "../cv-builder"
import { Badge } from "@/components/ui/badge"
import { Phone, MapPin, Briefcase } from "lucide-react"
import Image from "next/image";

// Update the interface to use the provided CVData type
interface CVTemplateProps {
  data: CVData
  visibility: SectionVisibility
}

export function ModernTemplate({ data, visibility }: CVTemplateProps) {
  // Format date for display
  console.log(data);
  const formatDate = (date: Date | undefined | null) => {
    if (!date) return ""
    return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short" })
  }

  // Define the Personal Information variable for cleaner access
  const personalInfo = data.personalInfo;

  const getProfileImageUrl = () => {
    if (!personalInfo?.profileImage) return null;

    const { profileImage } = personalInfo;

    // Case 1: new structure — direct image object (assuming url is directly on profileImage if it's the newer structure)
    // Based on your provided types, the image URL needs to be found within nested objects.

    // Check if uploadImage exists and has a URL property (assuming Media type has 'url')
    if (typeof profileImage.uploadImage === "object" && profileImage.uploadImage && 'url' in profileImage.uploadImage) {
      return profileImage.uploadImage.url;
    }

    // Check for staticImage
    if (profileImage.staticImage) {
      return profileImage.staticImage;
    }

    return null;
  };

  const getCompanyLogoUrl = () => {
    if (!personalInfo?.companyLogo) return null

    // Check for static image first (base64 or URL)
    if (personalInfo.companyLogo.staticImage) {
      return personalInfo.companyLogo.staticImage
    }

    // Check for uploaded logo
    if (personalInfo.companyLogo.uploadImage) {
      // It's an object with url property
      if (typeof personalInfo.companyLogo.uploadImage !== "number" && personalInfo.companyLogo.uploadImage?.url) {
        return personalInfo.companyLogo.uploadImage.url
      }
    }

    return null
  }

  const profileImageUrl = getProfileImageUrl()
  const companyLogoUrl = getCompanyLogoUrl()

  return (
    <div className="h-full overflow-auto rounded-lg border bg-white p-8 shadow-sm">
      <div className="mx-auto max-w-[800px]">
        {/* Header Section with Gradient Background */}
        {visibility.personalInfo && personalInfo && (
          <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6 text-white">
            {/* Company Logo - Top Right */}
            {companyLogoUrl && (
              <div className="absolute right-6 top-6 h-16 w-16 overflow-hidden rounded-lg border-2 border-white bg-white p-1 shadow-lg">
                {/* Updated img tag */}
                <img
                  src={companyLogoUrl || "/placeholder.svg"}
                  alt="Company Logo"
                  className="h-full w-full object-contain"
                />
              </div>
            )}

            <div className="flex flex-col items-start gap-4 sm:flex-row">
              {/* Profile Image */}
              {profileImageUrl && (
                <div className="relative">
                  <div className="h-28 w-28 overflow-hidden rounded-full shadow-xl">
                    <Image
                      src={profileImageUrl || "/placeholder.svg"}
                      alt={`${personalInfo.firstName} ${personalInfo.lastName}`}
                      className="object-cover"
                      width={112}
                      height={112}
                      priority
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full bg-green-400 border-2 border-white"></div>
                </div>
              )}

              <div className={`flex-1 ${profileImageUrl ? "pt-2" : ""}`}>
                <h1 className="text-4xl font-bold text-white drop-shadow-md">
                  {personalInfo.firstName} {personalInfo.lastName}
                </h1>
                <p className="text-xl text-blue-100 drop-shadow-sm">{personalInfo.title}</p>

                {/* Contact Info */}
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white">
                  {personalInfo.phoneNumber && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{personalInfo.phoneNumber}</span>
                    </div>
                  )}
                  {personalInfo.homeAddress && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{personalInfo.homeAddress}</span>
                    </div>
                  )}
                  {personalInfo.companyType && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <span>{personalInfo.companyType}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Professional Presentation */}
        {visibility.personalInfo && personalInfo?.professionalPresentation && (
          <div className="border-b border-gray-200 bg-gray-50 px-8 py-4">
            <h2 className="mb-2 text-lg font-semibold text-gray-800">Personal Profile (Strengths)</h2>
            <div className="text-gray-700">{personalInfo.professionalPresentation}</div>
          </div>
        )}

        <div className="grid gap-0 md:grid-cols-3">
          {/* Left column - Skills, Languages, Certifications */}
          <div className="space-y-6 bg-gray-50 p-6 md:col-span-1">
            {/* Skills Section */}
            {/* Updated data source: data.skills */}
            {visibility.skills && data.skills && data.skills.some((skill: Skill) => skill.visible) && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 border-b-2 border-orange-500 pb-2">Skills</h2>
                <div className="space-y-3">
                  {data.skills
                    .filter((skill: Skill) => skill.visible)
                    .map((skill: Skill, index: number) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-800">{skill.skillName}</span>
                          <span className="text-xs text-gray-600">{skill.skillYearsExperience}+ years</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-300">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-red-300 to-blue-500"
                            style={{ width: `${(skill.skillRating || 0) * 20}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Languages Section */}
            {/* Updated data source: data.languages */}
            {visibility.languages &&
              data.languages &&
              data.languages.some((language: Language) => language.visible) && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2">Language</h2>
                  <div className="space-y-3">
                    {data.languages
                      .filter((language: Language) => language.visible)
                      .map((language: Language, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="font-semibold text-gray-800">{language.language}</span>
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`h-2 w-4 rounded-sm ${i <
                                  (
                                    language.level === "Native"
                                      ? 5
                                      : language.level === "Fluent"
                                        ? 4
                                        : language.level === "Intermediate"
                                          ? 3
                                          : 2
                                  )
                                  ? "bg-gradient-to-r from-blue-500 to-purple-500"
                                  : "bg-gray-300"
                                  }`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            {/* Certifications Section */}
            {/* Updated data source: data.certifications */}
            {visibility.certifications &&
              data.certifications &&
              data.certifications.some((cert: Certification) => cert.visible) && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2">Certifications</h2>
                  <div className="space-y-3">
                    {data.certifications
                      .filter((cert: Certification) => cert.visible)
                      .map((cert: Certification, index: number) => (
                        <div key={index} className="space-y-1">
                          <div className="font-semibold text-gray-800">{cert.title}</div>
                          <div className="text-sm text-gray-600">
                            {cert.issuer} • {formatDate(cert.validDate)}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
          </div>

          {/* Right column - Experience, Projects, Education, References */}
          <div className="space-y-6 p-6 md:col-span-2">
            {/* Employment History */}
            {/* Updated data source: data.experience (formerly data.employers) */}
            {visibility.employers &&
              data.experience &&
              data.experience.some((employer: Experience) => employer.visible) && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2">Experience</h2>
                  {data.experience // Use data.experience
                    .filter((employer: Experience) => employer.visible)
                    .map((employer: Experience, index: number) => (
                      <div key={index} className="space-y-2 border-l-4 border-blue-500 bg-white pl-4 py-3 shadow-sm">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-gray-800">{employer.title}</h3>
                          <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {formatDate(employer.startDate)} -{" "}
                            {employer.ongoing ? "Present" : formatDate(employer.endDate)}
                          </span>
                        </div>
                        <p className="font-semibold text-blue-600">{employer.employer}</p>
                        <p className="text-gray-700 leading-relaxed">{employer.description}</p>
                      </div>
                    ))}
                </div>
              )}

            {/* Projects Section */}
            {/* Updated data source: data.projects */}
            {visibility.projects &&
              data.projects &&
              data.projects.some((project: ProjectDetails) => project.visible) && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2">Projects</h2>
                  {data.projects
                    .filter((project: ProjectDetails) => project.visible)
                    .map((project: ProjectDetails, index: number) => (
                      <div key={index} className="space-y-2 border-l-4 border-blue-500 bg-white pl-4 py-3 shadow-sm">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-gray-800">{project.role}</h3>
                          <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {formatDate(project.startDate)} -{" "}
                            {project.isCurrent ? "Present" : formatDate(project.endDate)}
                          </span>
                        </div>
                        {project.company && <p className="font-semibold text-blue-600">{project.company}</p>}
                        <p className="text-gray-700 leading-relaxed">{project.description}</p>
                        {project.skills && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {project.skills.split(",").map((tech, techIndex) => (
                              <Badge
                                key={techIndex}
                                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
                              >
                                {tech.trim()}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}

            {/* Education Section */}
            {/* Updated data source: data.education */}
            {visibility.education && data.education && data.education.some((edu: Education) => edu.visible) && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2">
                  Educational background
                </h2>
                {data.education
                  .filter((edu: Education) => edu.visible)
                  .map((edu: Education, index: number) => (
                    <div key={index} className="space-y-2 border-l-4 border-blue-500 bg-white pl-4 py-3 shadow-sm">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-800">
                          {edu.program} - {edu.level}
                        </h3>
                        <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {formatDate(edu.startDate)} - {edu.ongoing ? "Present" : formatDate(edu.endDate)}
                        </span>
                      </div>
                      <p className="font-semibold text-blue-600">
                        {edu.school}, {edu.place}
                      </p>
                      <p className="text-gray-700 leading-relaxed">{edu.description}</p>
                    </div>
                  ))}
              </div>
            )}

            {/* References Section */}
            {/* Updated data source: data.references */}
            {visibility.references &&
              data.references &&
              data.references.some((reference: Reference) => reference.visible) && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2">Referenser</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {data.references
                      .filter((reference: Reference) => reference.visible)
                      .map((reference: Reference, index: number) => (
                        <div key={index} className="border-l-4 border-blue-500 bg-white pl-4 py-3 shadow-sm">
                          <h3 className="font-bold text-gray-800">
                            {reference.firstName} {reference.lastName}
                          </h3>
                          <p className="text-sm text-blue-600 font-medium">{reference.positionTitle}</p>
                          <p className="text-sm text-gray-600">{reference.email}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  )
}