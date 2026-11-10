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
import { Phone, MapPin, Briefcase, Calendar, ExternalLink } from "lucide-react"
import type { SectionVisibility } from "../cv-builder"
import Image from "next/image";

interface CVTemplateProps {
  data: CVData // Updated to use the comprehensive CVData type
  visibility: SectionVisibility
}

export function ClassicTemplate({ data, visibility }: CVTemplateProps) {
  // Format date for display
  const formatDate = (date: Date | undefined | null) => {
    if (!date) return ""
    return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short" })
  }

  // Alias data.personalInfo for cleaner access, corresponding to the new CVData structure
  const personalInfo = data.personalInfo;

  const getProfileImageUrl = () => {
    // Updated to use personalInfo
    if (!personalInfo?.profileImage) return null;

    const { profileImage } = personalInfo;

    // Case 1: new structure — direct image object (assuming url property exists on the top-level image object)
    // NOTE: This logic seems redundant if Case 2 is complex. Sticking to the most robust known pattern.

    // Case 2: check inside the old/nested structure 
    if (profileImage.uploadImage) {
      if (typeof profileImage.uploadImage === "object" && profileImage.uploadImage.url) {
        return profileImage.uploadImage.url;
      }
    }

    if (profileImage.staticImage) {
      return profileImage.staticImage;
    }

    return null;
  };


  // Get company logo URL
  const getCompanyLogoUrl = () => {
    // Updated to use personalInfo
    if (!personalInfo?.companyLogo) return null

    // Check for static image first (base64 or URL)
    if (personalInfo.companyLogo.staticImage) {
      return personalInfo.companyLogo.staticImage
    }

    // Check for uploaded logo
    if (personalInfo.companyLogo.uploadImage) {
      // If it's an object with url property
      if (typeof personalInfo.companyLogo.uploadImage !== "number" && personalInfo.companyLogo.uploadImage?.url) {
        return personalInfo.companyLogo.uploadImage.url
      }
      // If it's just an ID, construct the URL
      if (typeof personalInfo.companyLogo.uploadImage === "number") {
        return `${process.env.NEXT_PUBLIC_SERVER_URL}/api/media/${personalInfo.companyLogo.uploadImage}`
      }
    }

    return null
  }

  const profileImageUrl = getProfileImageUrl()
  const companyLogoUrl = getCompanyLogoUrl()

  return (
    <div className="h-full overflow-auto rounded-lg border bg-white p-8 shadow-sm">
      <div className="mx-auto max-w-[800px]">
        {/* Modern Header with Glass Effect */}
        {/* Updated to use personalInfo */}
        {visibility.personalInfo && personalInfo && (
          <div className="relative mb-12 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 shadow-2xl">
            {/* Animated background elements */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/20"></div>
            <div className="absolute -left-20 -bottom-20 h-32 w-32 rounded-full bg-white/10"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between">
                {/* Profile Section */}
                <div className="flex items-center space-x-6">
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

                  <div className="text-white">
                    <h1 className="text-4xl font-bold mb-2 tracking-tight">
                      {personalInfo.firstName} <span className="font-light">{personalInfo.lastName}</span>
                    </h1>
                    <p className="text-xl text-white/90 font-medium mb-4">{personalInfo.title}</p>

                    {/* Contact Info with Modern Icons */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      {personalInfo.phoneNumber && (
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                          <Phone className="h-4 w-4" />
                          <span>{personalInfo.phoneNumber}</span>
                        </div>
                      )}
                      {personalInfo.homeAddress && (
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                          <MapPin className="h-4 w-4" />
                          <span>{personalInfo.homeAddress}</span>
                        </div>
                      )}
                      {personalInfo.companyType && (
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                          <Briefcase className="h-4 w-4" />
                          <span>{personalInfo.companyType}</span>
                        </div>
                      )}
                      {/* Add email here, assuming personalInfo has a privateEmail field */}
                      {personalInfo.privateEmail && (
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                          <Briefcase className="h-4 w-4" /> {/* Or use Mail icon if available */}
                          <span>{personalInfo.privateEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Company Logo */}
                {companyLogoUrl && (
                  <div className="h-20 w-20 overflow-hidden rounded-xl border-2 border-white/30 bg-white/90 backdrop-blur-sm p-2 shadow-lg">
                    <img
                      src={companyLogoUrl || "/placeholder.svg"}
                      alt="Company Logo"
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Professional Summary with Modern Card */}
        {/* Updated to use personalInfo */}
        {visibility.personalInfo && personalInfo && personalInfo.professionalPresentation && (
          <div className="mb-8">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <h2 className="mb-4 flex items-center text-2xl font-bold text-gray-800">
                <div className="mr-3 h-1 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                Professional Summary
              </h2>
              <p className="text-gray-700 leading-relaxed">{personalInfo.professionalPresentation}</p>
            </div>
          </div>
        )}

        {/* Employment History with Timeline */}
        {/* Updated to use data.experience */}
        {visibility.employers && data.experience?.some((emp: Experience) => emp.visible) && (
          <div className="mb-8">
            <h2 className="mb-6 flex items-center text-2xl font-bold text-gray-800">
              <div className="mr-3 h-1 w-8 rounded-full bg-gradient-to-r from-green-500 to-teal-500"></div>
              Employment History
            </h2>
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-6 top-0 h-full w-0.5 bg-gradient-to-b from-blue-200 to-purple-200"></div>

              <div className="space-y-6">
                {data.experience
                  .filter((employer) => employer.visible)
                  .map((employer, index) => (
                    <div key={index} className="relative flex items-start gap-6">
                      {/* Timeline Dot */}
                      <div className="relative z-10 h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                        <Briefcase className="h-6 w-6 text-white" />
                      </div>

                      {/* Content Card */}
                      <div className="flex-1 rounded-2xl border border-gray-100 bg-white p-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-xl font-bold text-gray-800">{employer.title}</h3>
                          <div className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {formatDate(employer.startDate)} -{" "}
                              {employer.ongoing ? (
                                <span className="font-medium text-green-600">Present</span>
                              ) : (
                                formatDate(employer.endDate)
                              )}
                            </span>
                          </div>
                        </div>
                        <p className="text-lg font-semibold text-blue-600 mb-3">{employer.employer}</p>
                        <p className="text-gray-700 leading-relaxed">{employer.description}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Projects Section with Modern Cards */}
        {visibility.projects && data.projects?.some((project: ProjectDetails) => project.visible) && (
          <div className="mb-8">
            <h2 className="mb-6 flex items-center text-2xl font-bold text-gray-800">
              <div className="mr-3 h-1 w-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500"></div>
              Projects
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {data.projects
                .filter((project) => project.visible)
                .map((project, index) => (
                  <div
                    key={index}
                    className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                        {project.role}
                      </h3>
                      <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>

                    <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDate(project.startDate)} -{" "}
                        {project.isCurrent ? (
                          <span className="font-medium text-green-600">Present</span>
                        ) : (
                          formatDate(project.endDate)
                        )}
                      </span>
                    </div>

                    {project.company && <p className="text-lg font-semibold text-purple-600 mb-3">{project.company}</p>}

                    <p className="text-gray-700 leading-relaxed mb-4">{project.description}</p>

                    {project.skills && (
                      <div className="flex flex-wrap gap-2">
                        {project.skills.split(",").map((tech, techIndex) => (
                          <Badge
                            key={techIndex}
                            className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border-0 hover:from-blue-200 hover:to-purple-200 transition-all"
                          >
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

        {/* Education Section with Academic Style */}
        {visibility.education && data.education?.some((edu: Education) => edu.visible) && (
          <div className="mb-8">
            <h2 className="mb-6 flex items-center text-2xl font-bold text-gray-800">
              <div className="mr-3 h-1 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
              Education
            </h2>
            <div className="space-y-6">
              {data.education
                .filter((edu) => edu.visible)
                .map((edu, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold text-gray-800">
                        {edu.program} - <span className="text-indigo-600">{edu.level}</span>
                      </h3>
                      <div className="flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(edu.startDate)} -{" "}
                          {edu.ongoing ? (
                            <span className="font-medium text-green-600">Present</span>
                          ) : (
                            formatDate(edu.endDate)
                          )}
                        </span>
                      </div>
                    </div>
                    <p className="text-lg font-semibold text-purple-600 mb-3">
                      {edu.school}, {edu.place}
                    </p>
                    <p className="text-gray-700 leading-relaxed">{edu.description}</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Skills Section with Modern Pills */}
        {visibility.skills && data.skills?.some((skill: Skill) => skill.visible) && (
          <div className="mb-8">
            <h2 className="mb-6 flex items-center text-2xl font-bold text-gray-800">
              <div className="mr-3 h-1 w-8 rounded-full bg-gradient-to-r from-pink-500 to-rose-500"></div>
              Skills
            </h2>
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
              <div className="flex flex-wrap gap-3">
                {data.skills
                  .filter((skill) => skill.visible)
                  .map((skill, index) => (
                    <Badge
                      key={index}
                      className="text-sm px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 hover:from-pink-600 hover:to-rose-600 transition-all hover:scale-105 shadow-md"
                    >
                      {skill.skillName}
                    </Badge>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Languages Section with Progress Style */}
        {visibility.languages && data.languages?.some((language: Language) => language.visible) && (
          <div className="mb-8">
            <h2 className="mb-6 flex items-center text-2xl font-bold text-gray-800">
              <div className="mr-3 h-1 w-8 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500"></div>
              Languages
            </h2>
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.languages
                  .filter((language) => language.visible)
                  .map((language, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100"
                    >
                      <span className="font-semibold text-gray-800">{language.language}</span>
                      <span className="text-sm font-medium text-teal-600 bg-teal-100 px-3 py-1 rounded-full">
                        {language.level}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Certifications Section */}
        {visibility.certifications && data.certifications?.some((cert: Certification) => cert.visible) && (
          <div className="mb-8">
            <h2 className="mb-6 flex items-center text-2xl font-bold text-gray-800">
              <div className="mr-3 h-1 w-8 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500"></div>
              Certifications
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {data.certifications
                .filter((cert) => cert.visible)
                .map((cert, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <div className="font-bold text-gray-800">{cert.title}</div>
                    <div className="text-sm text-right">
                      <div className="font-medium text-orange-600">{cert.issuer}</div>
                      <div className="text-gray-500">{formatDate(cert.validDate)}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* References Section */}
        {visibility.references && data.references?.some((ref: Reference) => ref.visible) && (
          <div>
            <h2 className="mb-6 flex items-center text-2xl font-bold text-gray-800">
              <div className="mr-3 h-1 w-8 rounded-full bg-gradient-to-r from-emerald-500 to-green-500"></div>
              References
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {data.references
                .filter((ref) => ref.visible)
                .map((reference, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {reference.firstName} {reference.lastName}
                    </h3>
                    <p className="text-emerald-600 font-semibold mb-2">{reference.positionTitle}</p>
                    <p className="text-gray-600">{reference.email}</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}