"use client"
import { Icon } from "@iconify/react";
import {
  formatDate,
  getLanguageFlag,
} from "./EditCvType";

export const CvPreview = ({ formData, cvItem }: { formData: any; cvItem: any }) => {
  const getSkillsByCategory = () => {
    const categories: Record<string, string[]> = {};

    formData.skills.forEach((skill: any) => {
      const category = skill.category || "Other";
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category]?.push(skill.skillName);
    });

    return categories;
  };

  //heeeeeeeeeeeeeeeeeeeeeeeeeeeej
  //Teeeeeeeeeeeeeeeeeeeeeeeeees

  return (
    <div id="cv-preview" className="bg-white shadow-md rounded-md p-4 md:p-6 max-w-[21cm] mx-auto" style={{ minHeight: "29.7cm" }}>
      {/* CV Header with and flags flag */}
      <div className="flex items-center justify-between mb-4 md:mb-6 pb-2 md:pb-4 border-b">
        {/* Add this block to display the photo */}
        {formData.personalInfo.photo && (
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300 flex-shrink-0">
            <img
              src={formData.personalInfo.photo}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div>
          <h1 className="text-xl md:text-2xl font-bold">{formData.title || "Untitled CV"}</h1>
          <div className="flex items-center mt-1">
            <span
              className={`px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-full text-xs ${formData.status === "New"
                ? "bg-blue-100 text-blue-700"
                : formData.status === "Draft"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700"
                }`}
            >
              {formData.status}
            </span>
          </div>
        </div>
        {formData.language && (
          <div className="w-6 h-6 md:w-8 md:h-8">
            <Icon icon={getLanguageFlag(formData.language)} className="w-6 h-6 md:w-8 md:h-8" />
          </div>
        )}
      </div>

      {/* Personal Information */}
      <div className="mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-bold mb-2 md:mb-3">
          {formData.personalInfo.firstName} {formData.personalInfo.lastName}
        </h2>
        <div className="text-gray-700 space-y-1 text-xs md:text-sm">
          <p>{formData.personalInfo.location}</p>
          <p>{formData.personalInfo.email}</p>
          <p>{formData.personalInfo.phone}</p>
        </div>
        <p className="mt-2 md:mt-3 text-gray-800 text-xs md:text-sm">{formData.personalInfo.summary}</p>
      </div>

      {/* Skills */}
      {formData.skills.length > 0 && (
        <div className="mb-4 md:mb-6">
          <h3 className="text-md md:text-lg font-semibold mb-1 md:mb-2 pb-1 border-b">Skills</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.entries(getSkillsByCategory()).map(([category, skills]) => (
              <div key={category} className="mb-2">
                <h4 className="font-medium text-sm">{category}</h4>
                <p className="text-sm text-gray-700">{skills.join(", ")}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Skills */}
      {formData.otherSkills.length > 0 && (
        <div className="mb-4 md:mb-6">
          <h3 className="text-md md:text-lg font-semibold mb-1 md:mb-2 pb-1 border-b">Other Skills</h3>
          <div className="flex flex-wrap gap-1 md:gap-2">
            {formData.otherSkills.map((skill: string, index: number) => (
              <span
                key={index}
                className="bg-gray-100 px-1.5 py-0.5 md:px-2 md:py-1 rounded text-xs md:text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      {formData.languages.length > 0 && (
        <div className="mb-4 md:mb-6">
          <h3 className="text-md md:text-lg font-semibold mb-1 md:mb-2 pb-1 border-b">Languages</h3>
          <div className="space-y-1 text-xs md:text-sm">
            {formData.languages.map((lang: any, index: number) => (
              <div key={index} className="flex items-center">
                <Icon icon={getLanguageFlag(lang.language)} className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span>
                  {lang.language} - <span className="text-gray-600">{lang.level}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experience - Employers */}
      {formData.employers.length > 0 && (
        <div className="mb-4 md:mb-6">
          <h3 className="text-md md:text-lg font-semibold mb-1 md:mb-2 pb-1 border-b">
            Professional Experience
          </h3>
          <div className="space-y-2 md:space-y-4 text-xs md:text-sm">
            {formData.employers.map((emp: any, index: number) => (
              <div key={index}>
                <div className="flex justify-between">
                  <h4 className="font-medium">{emp.title}</h4>
                  <span className="text-gray-600">
                    {formatDate(emp.startDate)} - {emp.isOngoing ? "Present" : formatDate(emp.endDate)}
                  </span>
                </div>
                <p className="text-gray-700">{emp.employer}</p>
                <p className="mt-0.5 md:mt-1">{emp.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {formData.projects.length > 0 && (
        <div className="mb-4 md:mb-6">
          <h3 className="text-md md:text-lg font-semibold mb-1 md:mb-2 pb-1 border-b">
            Projects & Assignments
          </h3>
          <div className="space-y-2 md:space-y-4 text-xs md:text-sm">
            {formData.projects.map((project: any, index: number) => (
              <div key={index}>
                <div className="flex justify-between">
                  <h4 className="font-medium">{project.role}</h4>
                  <span className="text-gray-600">
                    {formatDate(project.startDate)} -{" "}
                    {project.isOngoing ? "Present" : project.endDate ? formatDate(project.endDate) : "N/A"}
                  </span>
                </div>
                {project.company && <p className="text-gray-700">{project.company}</p>}
                <p className="mt-0.5 md:mt-1">{project.description}</p>
                {project.skills && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Array.isArray(project.skills) ? (
                      // Handle the case where project.skills is an array of objects
                      project.skills.map((skillObject: { id: string; skillName: string; skillRating: number }, i: number) => (
                        <span key={i} className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded-full text-xs">
                          {skillObject.skillName}
                        </span>
                      ))
                    ) : typeof project.skills === 'string' ? (
                      // Handle the case where project.skills is a comma-separated string
                      project.skills.split(',').map((skill: string, i: number) => (
                        <span key={i} className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded-full text-xs">
                          {skill.trim()} {/* Trim any extra whitespace */}
                        </span>
                      ))
                    ) : (
                      // Handle other cases (e.g., null, undefined, or unexpected types)
                      <span className="text-sm text-gray-700">No skills listed.</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {formData.education.length > 0 && (
        <div className="mb-4 md:mb-6">
          <h3 className="text-md md:text-lg font-semibold mb-1 md:mb-2 pb-1 border-b">Education</h3>
          <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
            {formData.education.map((edu: any, index: number) => (
              <div key={index}>
                <div className="flex justify-between">
                  <h4 className="font-medium">{edu.school}</h4>
                  <span className="text-gray-600">
                    {formatDate(edu.startDate)} - {edu.isOngoing ? "Present" : formatDate(edu.endDate)}
                  </span>
                </div>
                <p className="text-gray-700">
                  {edu.program} ({edu.level})
                </p>
                <p className="text-gray-600">{edu.place}</p>
                {edu.description && <p className="mt-0.5">{edu.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {formData.certificationsCourses.length > 0 && (
        <div className="mb-4 md:mb-6">
          <h3 className="text-md md:text-lg font-semibold mb-1 md:mb-2 pb-1 border-b">
            Certifications & Courses
          </h3>
          <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
            {formData.certificationsCourses.map((cert: any, index: number) => (
              <div key={index}>
                <div className="flex justify-between">
                  <h4 className="font-medium">{cert.title}</h4>
                  <span className="text-gray-600">Valid until: {formatDate(cert.validDate)}</span>
                </div>
                <p className="text-gray-700">
                  {cert.type} • {cert.issuer}
                </p>
                {cert.code && <p className="text-gray-600">Code: {cert.code}</p>}
                {cert.description && <p className="mt-0.5">{cert.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Commitments */}
      {formData.commitments.length > 0 && (
        <div className="mb-4 md:mb-6">
          <h3 className="text-md md:text-lg font-semibold mb-1 md:mb-2 pb-1 border-b">
            Commitments & Publications
          </h3>
          <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
            {formData.commitments.map((commitment: any, index: number) => (
              <div key={index}>
                <div className="flex justify-between">
                  <h4 className="font-medium">{commitment.title}</h4>
                  <span className="text-gray-600">
                    {formatDate(commitment.startDate)} -{" "}
                    {commitment.isOngoing ? "Present" : formatDate(commitment.endDate)}
                  </span>
                </div>
                {commitment.description && <p className="mt-0.5">{commitment.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 md:mt-8 pt-2 md:pt-4 border-t text-center text-gray-500 text-xs">
        <p>Last updated: {cvItem?.lastActivity || new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};
