import { Icon } from "@iconify/react";
import {
  ProfileSection,
  formatDate,
  getLanguageFlag,
  profileSections,
} from "./EditCvType";
import Button from "../ReUsable/Button";
import EducationForm from "../ReUsable/EducationForm";
import EmployerForm from "../ReUsable/Employers";
import ProjectForm from "../ReUsable/ProjectForm";
import CertificationCourseForm from "../ReUsable/Certification";
import LanguageForm from "../ReUsable/Languageform";
import SkillForm from "../ReUsable/SkillForm";
import CommitmentsForm from "../ReUsable/Commitments";
import OtherSkills from "../ReUsable/OtherSkills";
import React, { useState, useRef, ChangeEvent } from 'react';


interface PhotoUploadComponentProps {
  photo?: string;
  onPhotoChange: (base64: string) => void;
}





const PhotoUploadComponent: React.FC<PhotoUploadComponentProps> = ({ photo, onPhotoChange }) => {
  const [previewUrl, setPreviewUrl] = useState(photo || "");
  const fileInputRef = useRef<HTMLInputElement>(null); // Type the ref

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; // Use optional chaining as e.target.files can be null
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string; // Type assertion for reader.result
        setPreviewUrl(base64String);
        onPhotoChange(base64String);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleRemovePhoto = () => {
    setPreviewUrl("");
    onPhotoChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full flex flex-col items-center space-y-2">
      <div className="w-32 h-32 relative rounded-full overflow-hidden border-2 border-gray-300">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <Icon icon="tabler:user" className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>

      <div className="flex space-x-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        <Button
          type="button"
          onClick={triggerFileInput}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 flex items-center gap-1"
        >
          <Icon icon="tabler:upload" className="w-4 h-4" />
          <span>Upload</span>
        </Button>

        {previewUrl && (
          <Button
            type="button"
            onClick={handleRemovePhoto}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 flex items-center gap-1"
          >
            <Icon icon="tabler:trash" className="w-4 h-4" />
            <span>Remove</span>
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Upload a professional photo (max 2MB)
      </p>
    </div>
  );
};


// Updated PersonalInfoSection
export const PersonalInfoSection = ({
  formData,
  handlePersonalInfoChange,
}: {
  formData: any;
  handlePersonalInfoChange: (e: any) => void;
}) => {
  const handlePhotoChange = (photoData: string) => {
    handlePersonalInfoChange({
      target: {
        name: "photo",
        value: photoData,
      },
    });
  };

  return (
    <div className="space-y-3">
      {/* Photo upload component */}
      <PhotoUploadComponent
        photo={formData.personalInfo.photo}
        onPhotoChange={handlePhotoChange}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="firstName" className="block text-xs md:text-sm font-medium text-gray-700">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.personalInfo.firstName}
            onChange={handlePersonalInfoChange}
            className="w-full px-2 py-1 md:px-3 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-xs md:text-sm font-medium text-gray-700">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.personalInfo.lastName}
            onChange={handlePersonalInfoChange}
            className="w-full px-2 py-1 md:px-3 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm"
          />
        </div>
      </div>
      <div>
        <label htmlFor="email" className="block text-xs md:text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.personalInfo.email}
          onChange={handlePersonalInfoChange}
          className="w-full px-2 py-1 md:px-3 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm"
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-xs md:text-sm font-medium text-gray-700">
          Phone
        </label>
        <input
          type="text"
          id="phone"
          name="phone"
          value={formData.personalInfo.phone}
          onChange={handlePersonalInfoChange}
          className="w-full px-2 py-1 md:px-3 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm"
        />
      </div>
      <div>
        <label htmlFor="location" className="block text-xs md:text-sm font-medium text-gray-700">
          Location
        </label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.personalInfo.location}
          onChange={handlePersonalInfoChange}
          className="w-full px-2 py-1 md:px-3 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm"
        />
      </div>
      <div>
        <label htmlFor="summary" className="block text-xs md:text-sm font-medium text-gray-700">
          Professional Summary
        </label>
        <textarea
          id="summary"
          name="summary"
          value={formData.personalInfo.summary}
          onChange={handlePersonalInfoChange}
          rows={3}
          className="w-full px-2 py-1 md:px-3 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm"
        />
      </div>


    </div>
  );
};


export const SkillsSection = ({
  formData,
  showSkillForm,
  editingSkill,
  handleAddSkill,
  handleEditSkill,
  handleRemoveSkill,
  setShowSkillForm,
  handleSaveSkill,
}: {
  formData: any;
  showSkillForm: boolean;
  editingSkill: any;
  handleAddSkill: () => void;
  handleEditSkill: (index: number) => void;
  handleRemoveSkill: (index: number) => void;
  setShowSkillForm: (show: boolean) => void;
  handleSaveSkill: (skill: any) => void;
}) => (
  <div className="space-y-3">
    {showSkillForm ? (
      <SkillForm
        onSave={handleSaveSkill}
        onCancel={() => {
          setShowSkillForm(false);
        }}
        initialData={editingSkill}
      />
    ) : (
      <>
        {formData.skills.length === 0 ? (
          <div className="text-center py-3 text-gray-500 text-sm">
            No skills added yet. Add your professional skills below.
          </div>
        ) : (
          <div className="space-y-2">
            {formData.skills.map((skill: any, index: number) => (
              <div
                key={index}
                className="flex justify-between items-center p-2 bg-gray-50 rounded-md"
              >
                <div>
                  <span className="font-medium">{skill.skillName}</span>
                  <div className="flex mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Icon
                        key={star}
                        icon={star <= skill.skillRating ? "tabler:star-filled" : "tabler:star"}
                        className={`w-4 h-4 ${star <= skill.skillRating ? "text-yellow-500" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditSkill(index)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Icon icon="tabler:edit" className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Icon icon="tabler:trash" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={handleAddSkill}
          className="w-full px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
        >
          Add Skill
        </button>
      </>
    )}
  </div>
);

export const OtherSkillsSection = ({
  formData,
  showOtherSkillsForm,
  setShowOtherSkillsForm,
  handleSaveOtherSkills,
  handleRemoveOtherSkill,
}: {
  formData: any;
  showOtherSkillsForm: boolean;
  setShowOtherSkillsForm: (show: boolean) => void;
  handleSaveOtherSkills: (skills: string[]) => void;
  handleRemoveOtherSkill: (index: number) => void;
}) => (
  <div className="space-y-3">
    {showOtherSkillsForm ? (
      <OtherSkills
        onSave={handleSaveOtherSkills}
        onCancel={() => {
          setShowOtherSkillsForm(false);
        }}
        initialData={undefined}
      />
    ) : (
      <>
        <div className="flex gap-2">
          <input
            type="text"
            id="newOtherSkill"
            placeholder="Add other skill"
            className="flex-1 px-2 py-1 md:px-3 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const input = e.target as HTMLInputElement;
                if (input.value.trim()) {
                  handleSaveOtherSkills([input.value.trim()]);
                  input.value = "";
                }
              }
            }}
          />
          <button
            type="button"
            className="px-2 py-1 md:px-3 md:py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs md:text-sm"
            onClick={() => {
              const input = document.getElementById("newOtherSkill") as HTMLInputElement;
              if (input.value.trim()) {
                handleSaveOtherSkills([input.value.trim()]);
                input.value = "";
              }
            }}
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-1 md:gap-2 mt-1 md:mt-2">
          {formData.otherSkills.map((skill: string, index: number) => (
            <div
              key={index}
              className="bg-purple-100 text-purple-800 px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-xs md:text-sm flex items-center"
            >
              {skill}
              <button
                type="button"
                className="ml-0.5 text-purple-600 hover:text-purple-800"
                onClick={() => handleRemoveOtherSkill(index)}
              >
                <Icon icon="tabler:x" className="w-3 h-3 md:w-4 md:h-4" />
              </button>
            </div>
          ))}
        </div>
      </>
    )}
  </div>
);

export const LanguagesSection = ({
  formData,
  showLanguageForm,
  editingLanguage,
  handleAddLanguage,
  handleEditLanguage,
  handleRemoveLanguage,
  setShowLanguageForm,
  handleSaveLanguage,
}: {
  formData: any;
  showLanguageForm: boolean;
  editingLanguage: any;
  handleAddLanguage: () => void;
  handleEditLanguage: (index: number) => void;
  handleRemoveLanguage: (index: number) => void;
  setShowLanguageForm: (show: boolean) => void;
  handleSaveLanguage: (language: any) => void;
}) => (
  <div className="space-y-3">
    {showLanguageForm ? (
      <LanguageForm
        onSave={handleSaveLanguage}
        onCancel={() => {
          setShowLanguageForm(false);
        }}
        initialData={editingLanguage}
      />
    ) : (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="sm:col-span-2">
            <input
              type="text"
              id="newLanguage"
              placeholder="Language"
              className="w-full px-2 py-1 md:px-3 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm"
            />
          </div>
          <div>
            <select
              id="newLanguageLevel"
              className="w-full px-2 py-1 md:px-3 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm"
            >
              <option value="Native">Native</option>
              <option value="Fluent">Fluent</option>
              <option value="Advanced">Advanced</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Basic">Basic</option>
            </select>
          </div>
        </div>
        <button
          type="button"
          className="px-2 py-1 md:px-3 md:py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs md:text-sm w-full"
          onClick={() => {
            const langInput = document.getElementById("newLanguage") as HTMLInputElement;
            const levelSelect = document.getElementById("newLanguageLevel") as HTMLSelectElement;
            if (langInput.value.trim()) {
              handleSaveLanguage({
                language: langInput.value.trim(),
                level: levelSelect.value,
              });
              langInput.value = "";
            }
          }}
        >
          Add Language
        </button>
        <div className="space-y-1 md:space-y-2 mt-1 md:mt-2">
          {formData.languages.map((lang: any, index: number) => (
            <div
              key={index}
              className="flex justify-between items-center p-1.5 md:p-2 bg-gray-50 rounded-md"
            >
              <div className="flex items-center">
                <Icon
                  icon={getLanguageFlag(lang.language)}
                  className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2"
                />
                <span className="text-xs md:text-sm">
                  {lang.language} - {lang.level}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleEditLanguage(index)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Icon icon="tabler:edit" className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveLanguage(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Icon icon="tabler:trash" className="w-3 h-3 md:w-4 md:h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </>
    )}
  </div>
);

export const EducationSection = ({
  formData,
  showEducationForm,
  editingEducation,
  handleAddEducation,
  handleEditEducation,
  handleRemoveEducation,
  setShowEducationForm,
  handleSaveEducation,
}: {
  formData: any;
  showEducationForm: boolean;
  editingEducation: any;
  handleAddEducation: () => void;
  handleEditEducation: (index: number) => void;
  handleRemoveEducation: (index: number) => void;
  setShowEducationForm: (show: boolean) => void;
  handleSaveEducation: (education: any) => void;
}) => (
  <div className="space-y-3">
    {showEducationForm ? (
      <EducationForm
        onSave={handleSaveEducation}
        onCancel={() => {
          setShowEducationForm(false);
        }}
        initialData={editingEducation}
      />
    ) : (
      <>
        {formData.education.length === 0 ? (
          <div className="text-center py-3 text-gray-500 text-sm">
            No education entries added yet.
          </div>
        ) : (
          <div className="space-y-2">
            {formData.education.map((edu: any, index: number) => (
              <div key={index} className="p-2 md:p-3 border border-gray-200 rounded-md">
                <div className="font-medium text-sm md:text-base">{edu.school}</div>
                <div className="text-gray-600 text-xs md:text-sm">
                  {edu.program} ({edu.level})
                </div>
                <div className="text-gray-600 text-xs md:text-sm">{edu.place}</div>
                <div className="text-gray-600 text-xs md:text-sm">
                  {formatDate(edu.startDate)} -{" "}
                  {edu.isOngoing ? "Present" : formatDate(edu.endDate)}
                </div>
                <div className="text-xs md:text-sm mt-1">{edu.description}</div>
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => handleEditEducation(index)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Icon icon="tabler:edit" className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveEducation(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Icon icon="tabler:trash" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={handleAddEducation}
          className="w-full px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
        >
          Add Education
        </button>
      </>
    )}
  </div>
);

export const EmployersSection = ({
  formData,
  showEmployerForm,
  editingEmployer,
  handleAddEmployer,
  handleEditEmployer,
  handleRemoveEmployer,
  setShowEmployerForm,
  handleSaveEmployer,
}: {
  formData: any;
  showEmployerForm: boolean;
  editingEmployer: any;
  handleAddEmployer: () => void;
  handleEditEmployer: (index: number) => void;
  handleRemoveEmployer: (index: number) => void;
  setShowEmployerForm: (show: boolean) => void;
  handleSaveEmployer: (employer: any) => void;
}) => (
  <div className="space-y-3">
    {showEmployerForm ? (
      <EmployerForm
        onSave={handleSaveEmployer}
        onCancel={() => {
          setShowEmployerForm(false);
        }}
        initialData={editingEmployer}
      />
    ) : (
      <>
        {formData.employers.length === 0 ? (
          <div className="text-center py-3 text-gray-500 text-sm">No employers added yet.</div>
        ) : (
          <div className="space-y-2">
            {formData.employers.map((emp: any, index: number) => (
              <div key={index} className="p-2 md:p-3 border border-gray-200 rounded-md">
                <div className="font-medium text-sm md:text-base">{emp.employer}</div>
                <div className="text-gray-600 text-xs md:text-sm">{emp.title}</div>
                <div className="text-gray-600 text-xs md:text-sm">
                  {formatDate(emp.startDate)} -{" "}
                  {emp.isOngoing ? "Present" : formatDate(emp.endDate)}
                </div>
                <div className="text-xs md:text-sm mt-1">{emp.description}</div>
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => handleEditEmployer(index)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Icon icon="tabler:edit" className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveEmployer(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Icon icon="tabler:trash" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={handleAddEmployer}
          className="w-full px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
        >
          Add Employer
        </button>
      </>
    )}
  </div>
);

export const ProjectsSection = ({
  formData,
  showProjectForm,
  editingProject,
  handleAddProject,
  handleEditProject,
  handleRemoveProject,
  setShowProjectForm,
  handleSaveProject,
}: {
  formData: any;
  showProjectForm: boolean;
  editingProject: any;
  handleAddProject: () => void;
  handleEditProject: (index: number) => void;
  handleRemoveProject: (index: number) => void;
  setShowProjectForm: (show: boolean) => void;
  handleSaveProject: (projects: any[]) => void;
}) => (
  <div className="space-y-3">
    {showProjectForm ? (
      <ProjectForm
        projects={formData.projects}
        onSave={handleSaveProject}
        onCancel={() => {
          setShowProjectForm(false);
        }}
        projectToEdit={editingProject}
      />
    ) : (
      <>
        {formData.projects.length === 0 ? (
          <div className="text-center py-3 text-gray-500 text-sm">No projects added yet.</div>
        ) : (
          <div className="space-y-2">
            {formData.projects.map((project: any, index: number) => (
              <div key={index} className="p-2 md:p-3 border border-gray-200 rounded-md">
                <div className="font-medium text-sm md:text-base">{project.role}</div>
                {project.company && (
                  <div className="text-gray-600 text-xs md:text-sm">{project.company}</div>
                )}
                <div className="text-gray-600 text-xs md:text-sm">
                  {formatDate(project.startDate)} -{" "}
                  {project.isOngoing
                    ? "Present"
                    : project.endDate
                      ? formatDate(project.endDate)
                      : "N/A"}
                </div>
                <div className="text-xs md:text-sm mt-1">{project.description}</div>
                {project.skills && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {project.skills.split(',').map((skill: string, i: number) => (
                      <span
                        key={i}
                        className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full text-xs"
                      >
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => handleEditProject(index)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Icon icon="tabler:edit" className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveProject(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Icon icon="tabler:trash" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={handleAddProject}
          className="w-full px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
        >
          Add Project
        </button>
      </>
    )}
  </div>
);

export const CertificationsSection = ({
  formData,
  showCertificationForm,
  editingCertification,
  handleAddCertification,
  handleEditCertification,
  handleRemoveCertification,
  setShowCertificationForm,
  handleSaveCertification,
}: {
  formData: any;
  showCertificationForm: boolean;
  editingCertification: any;
  handleAddCertification: () => void;
  handleEditCertification: (index: number) => void;
  handleRemoveCertification: (index: number) => void;
  setShowCertificationForm: (show: boolean) => void;
  handleSaveCertification: (certification: any) => void;
}) => (
  <div className="space-y-3">
    {showCertificationForm ? (
      <CertificationCourseForm
        onSave={handleSaveCertification}
        onCancel={() => {
          setShowCertificationForm(false);
        }}
        initialData={editingCertification}
      />
    ) : (
      <>
        {formData.certificationsCourses.length === 0 ? (
          <div className="text-center py-3 text-gray-500 text-sm">
            No certifications or courses added yet.
          </div>
        ) : (
          <div className="space-y-2">
            {formData.certificationsCourses.map((cert: any, index: number) => (
              <div key={index} className="p-2 md:p-3 border border-gray-200 rounded-md">
                <div className="font-medium text-sm md:text-base">{cert.title}</div>
                <div className="text-gray-600 text-xs md:text-sm">Type: {cert.type}</div>
                <div className="text-gray-600 text-xs md:text-sm">Issuer: {cert.issuer}</div>
                <div className="text-gray-600 text-xs md:text-sm">Code: {cert.code}</div>
                <div className="text-gray-600 text-xs md:text-sm">
                  Valid until: {formatDate(cert.validDate)}
                </div>
                <div className="text-xs md:text-sm mt-1">{cert.description}</div>
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => handleEditCertification(index)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Icon icon="tabler:edit" className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveCertification(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Icon icon="tabler:trash" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={handleAddCertification}
          className="w-full px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
        >
          Add Certification/Course
        </button>
      </>
    )}
  </div>
);

export const CommitmentsSection = ({
  formData,
  showCommitmentForm,
  editingCommitment,
  handleAddCommitment,
  handleEditCommitment,
  handleRemoveCommitment,
  setShowCommitmentForm,
  handleSaveCommitment,
}: {
  formData: any;
  showCommitmentForm: boolean;
  editingCommitment: any;
  handleAddCommitment: () => void;
  handleEditCommitment: (index: number) => void;
  handleRemoveCommitment: (index: number) => void;
  setShowCommitmentForm: (show: boolean) => void;
  handleSaveCommitment: (commitment: any) => void;
}) => (
  <div className="space-y-3">
    {showCommitmentForm ? (
      <CommitmentsForm
        onSave={handleSaveCommitment}
        onCancel={() => {
          setShowCommitmentForm(false);
        }}
        initialData={editingCommitment}
      />
    ) : (
      <>
        {formData.commitments.length === 0 ? (
          <div className="text-center py-3 text-gray-500 text-sm">
            No commitments or publications added yet.
          </div>
        ) : (
          <div className="space-y-2">
            {formData.commitments.map((commitment: any, index: number) => (
              <div key={index} className="p-2 md:p-3 border border-gray-200 rounded-md">
                <div className="font-medium text-sm md:text-base">{commitment.title}</div>
                <div className="text-gray-600 text-xs md:text-sm">
                  {formatDate(commitment.startDate)} -{" "}
                  {commitment.isOngoing ? "Present" : formatDate(commitment.endDate)}
                </div>
                <div className="text-xs md:text-sm mt-1">{commitment.description}</div>
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => handleEditCommitment(index)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Icon icon="tabler:edit" className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveCommitment(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Icon icon="tabler:trash" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={handleAddCommitment}
          className="w-full px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
        >
          Add Commitment/Publication
        </button>
      </>
    )}
  </div>
);
