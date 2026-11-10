import { Badge } from "@/components/ui/badge"
import type {
  CVData,
  PersonalInformation,
  Skill,
  Language,
  Experience,
  ProjectDetails,
  Education,
  Certification,
  Reference
} from "@/utils/types"
import type { SectionVisibility } from "../cv-builder"
import Image from "next/image";

interface CVTemplateProps {
  data: CVData // Using the comprehensive CVData type
  visibility: SectionVisibility
}

export function ClassicSidebarTemplate({ data, visibility }: CVTemplateProps) {
  // Format date for display
  const formatDate = (date: Date | undefined | null) => {
    if (!date) return ""
    return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short" })
  }

  // Alias data.personalInfo for cleaner access, corresponding to the new CVData structure
  const personalInfo = data.personalInfo;

  // Get profile image URL
  const getProfileImageUrl = () => {
    if (!personalInfo?.profileImage) return null;
    const { profileImage } = personalInfo;
    if (typeof profileImage.uploadImage === "object" && profileImage.uploadImage && 'url' in profileImage.uploadImage) {
      return profileImage.uploadImage.url;
    }
    if (profileImage.staticImage) {
      return profileImage.staticImage;
    }
    return null;
  };

  // Get company logo URL
  const getCompanyLogoUrl = () => {
    if (!personalInfo?.companyLogo) return null
    if (personalInfo.companyLogo.staticImage) {
      return personalInfo.companyLogo.staticImage
    }
    if (personalInfo.companyLogo.uploadImage) {
      if (typeof personalInfo.companyLogo.uploadImage !== "number" && personalInfo.companyLogo.uploadImage?.url) {
        return personalInfo.companyLogo.uploadImage.url
      }
      if (typeof personalInfo.companyLogo.uploadImage === "number") {
        return `${process.env.NEXT_PUBLIC_SERVER_URL}/api/media/${personalInfo.companyLogo.uploadImage}`
      }
    }
    return null
  }

  const profileImageUrl = getProfileImageUrl()
  const companyLogoUrl = getCompanyLogoUrl()

  return (
    // 1. Outer Container: Sets the gray background for the entire viewing area
    // and allows the page to scroll if content exceeds the screen height.
    <div className="h-full overflow-auto bg-gray-100 p-6 md:p-10">

      {/* 2. Centering Wrapper: Centers the content, sets a max width for the CV, 
            and gives it a shadow for the 'document' look. */}
      <div className="mx-auto max-w-[850px] shadow-2xl">

        {/* 3. Main Flex Container: Holds the sidebar and the main content. */}
        <div className="flex min-h-full bg-white">

          {/* Left Sidebar - Dark Theme */}
          <div className="w-80 bg-slate-700 text-white p-8 flex-shrink-0">

            {/* Profile Section */}
            {visibility.personalInfo && personalInfo && (
              <div className="mb-8">
                {/* Profile Image */}
                {profileImageUrl && (
                  <div className="mb-6 flex justify-center">
                    <div className="relative">
                      <div className="h-32 w-32 overflow-hidden rounded-full shadow-xl">
                        <Image
                          src={profileImageUrl || "/placeholder.svg"}
                          alt={`${personalInfo.firstName} ${personalInfo.lastName}`}
                          className="object-cover"
                          width={128}
                          height={128}
                          priority
                        />
                      </div>
                      <div className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full bg-green-400 border-2 border-white"></div>
                    </div>
                  </div>
                )}

                {/* Name */}
                <div className="text-center mb-6">
                  <h1 className="text-3xl font-bold mb-2">{personalInfo.firstName}</h1>
                  <h1 className="text-3xl font-bold mb-3">{personalInfo.lastName}</h1>
                  <div className="h-0.5 w-16 bg-white mx-auto"></div>
                </div>

                {/* Contact Details */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4 border-b border-slate-600 pb-2">Details</h2>
                  <div className="space-y-3 text-sm">
                    {personalInfo.homeAddress && (
                      <div>
                        <p className="leading-relaxed">{personalInfo.homeAddress}</p>
                      </div>
                    )}
                    {personalInfo.phoneNumber && (
                      <div>
                        <p>{personalInfo.phoneNumber}</p>
                      </div>
                    )}
                    {personalInfo.privateEmail && (
                      <div>
                        <p>{personalInfo.privateEmail}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Skills Section in Sidebar */}
            {visibility.skills && data.skills?.some((skill) => skill.visible) && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 border-b border-slate-600 pb-2">Skills</h2>
                <div className="space-y-3">
                  {data.skills
                    .filter((skill: Skill) => skill.visible)
                    .map((skill, index) => (
                      <div key={index}>
                        <div className="text-sm mb-1">{skill.skillName}</div>
                        <div className="w-full bg-slate-600 rounded-full h-1">
                          <div
                            className="bg-white h-1 rounded-full"
                            style={{ width: `${(skill.skillRating || 0) * 20}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Languages Section in Sidebar */}
            {visibility.languages && data.languages?.some((language) => language.visible) && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 border-b border-slate-600 pb-2">Languages</h2>
                <div className="space-y-3">
                  {data.languages
                    .filter((language: Language) => language.visible)
                    .map((language, index) => (
                      <div key={index}>
                        <div className="text-sm mb-1">{language.language}</div>
                        <div className="w-full bg-slate-600 rounded-full h-1">
                          <div
                            className="bg-white h-1 rounded-full"
                            style={{
                              width:
                                language.level === "Native"
                                  ? "100%"
                                  : language.level === "Fluent"
                                    ? "90%"
                                    : language.level === "Advanced"
                                      ? "80%"
                                      : language.level === "Intermediate"
                                        ? "70%"
                                        : "60%",
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Company Logo in Sidebar */}
            {companyLogoUrl && (
              <div className="mt-8">
                <div className="h-16 w-16 overflow-hidden rounded-md border border-white/20 bg-white p-2">
                  <img
                    src={companyLogoUrl || "/placeholder.svg"}
                    alt="Company Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Content Area - Light Theme */}
          <div className="flex-1 p-8 bg-gray-50">
            {/* Removed the max-w-4xl wrapper here since the main outer div already controls the overall width */}
            <div className="w-full">

              {/* Profile Summary */}
              {visibility.personalInfo && personalInfo && (
                <div className="mb-8">
                  {personalInfo.title && <p className="text-xl text-gray-600 mb-4">{personalInfo.title}</p>}

                  {personalInfo.professionalPresentation && (
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-1">Profile</h2>
                      <p className="text-gray-700 leading-relaxed">{personalInfo.professionalPresentation}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Employment History */}
              {visibility.employers && data.experience?.some((emp: Experience) => emp.visible) && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-gray-300 pb-1">Employment History</h2>
                  <div className="space-y-6">
                    {data.experience
                      .filter((employer) => employer.visible)
                      .map((employer, index) => (
                        <div key={index}>
                          <div className="mb-2">
                            <h3 className="text-lg font-bold text-gray-800">
                              {employer.title}, {employer.employer}
                            </h3>
                            <p className="text-sm text-gray-500 uppercase tracking-wide">
                              {formatDate(employer.startDate)} —{" "}
                              {employer.ongoing ? "PRESENT" : formatDate(employer.endDate)?.toUpperCase()}
                            </p>
                          </div>
                          <p className="text-gray-700 leading-relaxed">{employer.description}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Projects Section */}
              {visibility.projects && data.projects?.some((project: ProjectDetails) => project.visible) && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-gray-300 pb-1">Projects</h2>
                  <div className="space-y-6">
                    {data.projects
                      .filter((project) => project.visible)
                      .map((project, index) => (
                        <div key={index}>
                          <div className="mb-2">
                            <h3 className="text-lg font-bold text-gray-800">
                              {project.role}
                              {project.company && `, ${project.company}`}
                            </h3>
                            <p className="text-sm text-gray-500 uppercase tracking-wide">
                              {formatDate(project.startDate)} —{" "}
                              {project.isCurrent ? "PRESENT" : formatDate(project.endDate)?.toUpperCase()}
                            </p>
                          </div>
                          <p className="text-gray-700 leading-relaxed mb-3">{project.description}</p>
                          {project.skills && (
                            <div className="flex flex-wrap gap-2">
                              {project.skills.split(",").map((tech, techIndex) => (
                                <Badge key={techIndex} variant="outline" className="text-xs">
                                  {tech.trim()}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Education Section */}
              {visibility.education && data.education?.some((edu: Education) => edu.visible) && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-gray-300 pb-1">Education</h2>
                  <div className="space-y-4">
                    {data.education
                      .filter((edu) => edu.visible)
                      .map((edu, index) => (
                        <div key={index}>
                          <h3 className="text-lg font-bold text-gray-800">
                            {edu.program}, {edu.school}
                          </h3>
                          <p className="text-sm text-gray-500 uppercase tracking-wide">
                            {formatDate(edu.startDate)} —{" "}
                            {edu.ongoing ? "PRESENT" : formatDate(edu.endDate)?.toUpperCase()}
                          </p>
                          {edu.description && <p className="text-gray-700 leading-relaxed mt-1">{edu.description}</p>}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Certifications Section */}
              {visibility.certifications && data.certifications?.some((cert: Certification) => cert.visible) && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-gray-300 pb-1">Certifications</h2>
                  <div className="space-y-4">
                    {data.certifications
                      .filter((cert) => cert.visible)
                      .map((cert, index) => (
                        <div key={index}>
                          <h3 className="text-lg font-bold text-gray-800">{cert.title}</h3>
                          <p className="text-sm text-gray-500 uppercase tracking-wide">
                            {cert.issuer} • {formatDate(cert.validDate)?.toUpperCase()}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* References Section */}
              {visibility.references && data.references?.some((ref: Reference) => ref.visible) && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-gray-300 pb-1">References</h2>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {data.references
                      .filter((ref) => ref.visible)
                      .map((reference, index) => (
                        <div key={index}>
                          <h3 className="text-lg font-bold text-gray-800">
                            {reference.firstName} {reference.lastName}
                          </h3>
                          <p className="text-gray-700">{reference.positionTitle}</p>
                          <p className="text-gray-600 text-sm">{reference.email}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}