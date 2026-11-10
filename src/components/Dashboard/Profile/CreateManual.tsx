import React, { useState } from "react";
import { Icon } from "@iconify/react";
import Button from "../ReUsable/Button";
import ProjectForm from "../ReUsable/ProjectForm";
import References from "@/components/Dashboard/ReUsable/References";
import OtherSkills from "../ReUsable/OtherSkills";
import EducationForm from "../ReUsable/EducationForm";
import EmployerForm from "../ReUsable/Employers";
import CertificationCourseForm from "../ReUsable/Certification";
import LanguageForm from "../ReUsable/Languageform";
import SkillForm from "../ReUsable/SkillForm";
import CommitmentsForm from "../ReUsable/Commitments";
import Availability from "../ReUsable/Availability";
import CancelPopUp from "../ReUsable/CancelPopUp";

// ===== TYPE DEFINITIONS =====
type Project = {
  id?: string;
  role: string;
  startDate: Date;
  endDate?: Date | null;
  isOngoing: boolean;
  description: string;
  skills: string[];
  company?: string;
  location?: string;
  link?: string;
};

interface Section {
  title: string;
  icon: string;
}

interface ReferenceData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  position?: string;
  relationship?: string;
}

interface Education {
  school: string;
  program: string;
  level: string;
  place: string;
  startDate: Date;
  endDate: Date;
  isOngoing: boolean;
  description: string;
  link: string;
}

interface Employer {
  employer: string;
  title: string;
  startDate: Date;
  endDate: Date;
  isOngoing: boolean;
  description: string;
  link: string;
}

interface CertificationCourse {
  title: string;
  type: string;
  startDate: Date;
  validDate: Date;
  code: string;
  issuer: string;
  supplier: string;
  description: string;
  link: string;
}

interface Language {
  language: string;
  level: string;
}

interface Skill {
  skillName: string;
  skillRating: number;
}

interface Commitment {
  title: string;
  startDate: Date;
  endDate: Date;
  isOngoing: boolean;
  description: string;
  link: string;
}

interface AvailabilityData {
  status: string;
  startDate: Date;
  endDate: Date;
  isOngoing: boolean;
}

interface ProfileData {
  projects: Project[];
  references: ReferenceData[];
  otherSkills: string[];
  education: Education[];
  employers: Employer[];
  certificationsCourses: CertificationCourse[];
  languages: Language[];
  skills: Skill[];
  commitments: Commitment[];
  availabilities: AvailabilityData[];
}

// ===== MAIN COMPONENT =====
const CreateManual: React.FC = () => {
  // ===== STATE MANAGEMENT =====
  const [profileData, setProfileData] = useState<ProfileData>({
    projects: [],
    references: [],
    otherSkills: [],
    education: [],
    employers: [],
    certificationsCourses: [],
    languages: [],
    skills: [],
    commitments: [],
    availabilities: [],
  });

  const [changes, setChanges] = useState<Partial<ProfileData>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Form visibility states
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showReferencesForm, setShowReferencesForm] = useState(false);
  const [showOtherSkillsForm, setShowOtherSkillsForm] = useState(false);
  const [showEducationForm, setShowEducationForm] = useState(false);
  const [showEmployerForm, setShowEmployerForm] = useState(false);
  const [showCertificationCourseForm, setShowCertificationCourseForm] = useState(false);
  const [showLanguageForm, setShowLanguageForm] = useState(false);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [showCommitmentForm, setShowCommitmentForm] = useState(false);
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);

  // Editing states
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [editingReferenceIndex, setEditingReferenceIndex] = useState<number | null>(null);
  const [editingOtherSkillsIndex, setEditingOtherSkillsIndex] = useState<number | null>(null);
  const [editingEducationIndex, setEditingEducationIndex] = useState<number | null>(null);
  const [editingEmployerIndex, setEditingEmployerIndex] = useState<number | null>(null);
  const [editingCertificationCourseIndex, setEditingCertificationCourseIndex] = useState<number | null>(null);
  const [editingLanguageIndex, setEditingLanguageIndex] = useState<number | null>(null);
  const [editingSkillIndex, setEditingSkillIndex] = useState<number | null>(null);
  const [editingCommitmentIndex, setEditingCommitmentIndex] = useState<number | null>(null);
  const [editingAvailabilityIndex, setEditingAvailabilityIndex] = useState<number | null>(null);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ index: number, type: keyof ProfileData } | null>(null);

  // ===== UTILITY FUNCTIONS =====
  const trackChange = <K extends keyof ProfileData>(
    key: K,
    value: ProfileData[K]
  ) => {
    setProfileData(prev => {
      const newProfileData = { ...prev, [key]: value };

      setChanges(prevChanges => {
        // Compare with initial data to determine if this is a real change
        const isChanged = JSON.stringify(value) !== JSON.stringify(initialProfileData[key]);

        return {
          ...prevChanges,
          [key]: isChanged ? value : undefined
        };
      });

      return newProfileData;
    });
  };

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const formatDate = (dateInput: string | Date | undefined) => {
    // Handle undefined/null cases
    if (!dateInput) return 'Present';

    // If it's already a Date object, use it directly
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);

    // Validate the date
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateInput);
      return 'Invalid date';
    }

    return date.toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // ===== HANDLERS FOR EACH SECTION =====
  // Projects
  const handleSaveProject = (updatedProjects: Project[]) => {
    trackChange('projects', updatedProjects);
    setShowProjectForm(false);
    setEditingProject(undefined);
  };

  const handleAddProject = () => {
    setEditingProject(undefined);
    setShowProjectForm(true);
  };

  const handleEditProject = (index: number) => {
    setEditingProject(profileData.projects[index]);
    setShowProjectForm(true);
  };

  // References
  const handleSaveReference = (reference: ReferenceData) => {
    const updatedReferences = editingReferenceIndex !== null
      ? profileData.references.map((ref, i) => i === editingReferenceIndex ? reference : ref)
      : [...profileData.references, reference];

    trackChange('references', updatedReferences);
    setShowReferencesForm(false);
    setEditingReferenceIndex(null);
  };

  const handleAddReference = () => {
    setEditingReferenceIndex(null);
    setShowReferencesForm(true);
  };

  const handleEditReference = (index: number) => {
    setEditingReferenceIndex(index);
    setShowReferencesForm(true);
  };

  // Other Skills
  const handleSaveOtherSkills = (skills: string[]) => {
    const updatedOtherSkills = editingOtherSkillsIndex !== null
      ? profileData.otherSkills.map((item, i) => i === editingOtherSkillsIndex ? skills.join(", ") : item)
      : [...profileData.otherSkills, skills.join(", ")];

    trackChange('otherSkills', updatedOtherSkills);
    setShowOtherSkillsForm(false);
    setEditingOtherSkillsIndex(null);
  };

  const handleAddOtherSkills = () => {
    setEditingOtherSkillsIndex(null);
    setShowOtherSkillsForm(true);
  };

  const handleEditOtherSkills = (index: number) => {
    setEditingOtherSkillsIndex(index);
    setShowOtherSkillsForm(true);
  };

  // Education
  const handleSaveEducation = (educationData: Education) => {
    const updatedEducation = editingEducationIndex !== null
      ? profileData.education.map((edu, i) => i === editingEducationIndex ? educationData : edu)
      : [...profileData.education, educationData];

    trackChange('education', updatedEducation);
    setShowEducationForm(false);
    setEditingEducationIndex(null);
  };

  const handleAddEducation = () => {
    setEditingEducationIndex(null);
    setShowEducationForm(true);
  };

  const handleEditEducation = (index: number) => {
    setEditingEducationIndex(index);
    setShowEducationForm(true);
  };

  // Employers
  const handleSaveEmployer = (employerData: Employer) => {
    const updatedEmployers = editingEmployerIndex !== null
      ? profileData.employers.map((emp, i) => i === editingEmployerIndex ? employerData : emp)
      : [...profileData.employers, employerData];

    trackChange('employers', updatedEmployers);
    setShowEmployerForm(false);
    setEditingEmployerIndex(null);
  };

  const handleAddEmployer = () => {
    setEditingEmployerIndex(null);
    setShowEmployerForm(true);
  };

  const handleEditEmployer = (index: number) => {
    setEditingEmployerIndex(index);
    setShowEmployerForm(true);
  };

  // Certifications
  const handleSaveCertificationCourse = (data: CertificationCourse) => {
    const updatedCertifications = editingCertificationCourseIndex !== null
      ? profileData.certificationsCourses.map((cert, i) => i === editingCertificationCourseIndex ? data : cert)
      : [...profileData.certificationsCourses, data];

    trackChange('certificationsCourses', updatedCertifications);
    setShowCertificationCourseForm(false);
    setEditingCertificationCourseIndex(null);
  };

  const handleAddCertificationCourse = () => {
    setEditingCertificationCourseIndex(null);
    setShowCertificationCourseForm(true);
  };

  const handleEditCertificationCourse = (index: number) => {
    setEditingCertificationCourseIndex(index);
    setShowCertificationCourseForm(true);
  };

  // Languages
  const handleSaveLanguage = (languageData: Language) => {
    const updatedLanguages = editingLanguageIndex !== null
      ? profileData.languages.map((lang, i) => i === editingLanguageIndex ? languageData : lang)
      : [...profileData.languages, languageData];

    trackChange('languages', updatedLanguages);
    setShowLanguageForm(false);
    setEditingLanguageIndex(null);
  };

  const handleAddLanguage = () => {
    setEditingLanguageIndex(null);
    setShowLanguageForm(true);
  };

  const handleEditLanguage = (index: number) => {
    setEditingLanguageIndex(index);
    setShowLanguageForm(true);
  };

  // Skills
  const handleSaveSkill = (skill: Skill) => {
    const updatedSkills = editingSkillIndex !== null
      ? profileData.skills.map((sk, i) => i === editingSkillIndex ? skill : sk)
      : [...profileData.skills, skill];

    trackChange('skills', updatedSkills);
    setShowSkillForm(false);
    setEditingSkillIndex(null);
  };

  const handleAddSkill = () => {
    setEditingSkillIndex(null);
    setShowSkillForm(true);
  };

  const handleEditSkill = (index: number) => {
    setEditingSkillIndex(index);
    setShowSkillForm(true);
  };

  // Commitments
  const handleSaveCommitment = (commitment: Commitment) => {
    const updatedCommitments = editingCommitmentIndex !== null
      ? profileData.commitments.map((com, i) => i === editingCommitmentIndex ? commitment : com)
      : [...profileData.commitments, commitment];

    trackChange('commitments', updatedCommitments);
    setShowCommitmentForm(false);
    setEditingCommitmentIndex(null);
  };

  const handleAddCommitment = () => {
    setEditingCommitmentIndex(null);
    setShowCommitmentForm(true);
  };

  const handleEditCommitment = (index: number) => {
    setEditingCommitmentIndex(index);
    setShowCommitmentForm(true);
  };
  //Edit button handler
  const handleEditItem = (type: keyof ProfileData, index: number) => {
    const editHandlers = {
      projects: handleEditProject,
      references: handleEditReference,
      otherSkills: handleEditOtherSkills,
      education: handleEditEducation,
      employers: handleEditEmployer,
      certificationsCourses: handleEditCertificationCourse,
      languages: handleEditLanguage,
      skills: handleEditSkill,
      commitments: handleEditCommitment,
      availabilities: handleEditAvailability,
    };

    const handler = editHandlers[type];
    if (handler) {
      handler(index);
    } else {
      console.warn(`No edit handler for type: ${type}`);
    }
  };

  // Availability
  const handleSaveAvailability = (availability: AvailabilityData) => {
    const updatedAvailabilities = editingAvailabilityIndex !== null
      ? profileData.availabilities.map((avail, i) => i === editingAvailabilityIndex ? availability : avail)
      : [...profileData.availabilities, availability];

    trackChange('availabilities', updatedAvailabilities);
    setShowAvailabilityForm(false);
    setEditingAvailabilityIndex(null);
  };

  const handleAddAvailability = () => {
    setEditingAvailabilityIndex(null);
    setShowAvailabilityForm(true);
  };

  const handleEditAvailability = (index: number) => {
    setEditingAvailabilityIndex(index);
    setShowAvailabilityForm(true);
  };

  // ===== DELETE HANDLERS =====
  const handleDeleteClick = (index: number, type: keyof ProfileData) => {
    setItemToDelete({ index, type });
    setShowDeleteConfirm(true);
  };

  const [isDeleting, setIsDeleting] = useState(false);
  const [initialProfileData] = useState<ProfileData>({ ...profileData });

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      const { index, type } = itemToDelete;

      // Type-safe way to handle each array type
      switch (type) {
        case 'projects':
          trackChange('projects', profileData.projects.filter((_, i) => i !== index));
          break;
        case 'references':
          trackChange('references', profileData.references.filter((_, i) => i !== index));
          break;
        case 'otherSkills':
          trackChange('otherSkills', profileData.otherSkills.filter((_, i) => i !== index));
          break;
        case 'education':
          trackChange('education', profileData.education.filter((_, i) => i !== index));
          break;
        case 'employers':
          trackChange('employers', profileData.employers.filter((_, i) => i !== index));
          break;
        case 'certificationsCourses':
          trackChange('certificationsCourses', profileData.certificationsCourses.filter((_, i) => i !== index));
          break;
        case 'languages':
          trackChange('languages', profileData.languages.filter((_, i) => i !== index));
          break;
        case 'skills':
          trackChange('skills', profileData.skills.filter((_, i) => i !== index));
          break;
        case 'commitments':
          trackChange('commitments', profileData.commitments.filter((_, i) => i !== index));
          break;
        case 'availabilities':
          trackChange('availabilities', profileData.availabilities.filter((_, i) => i !== index));
          break;
        default:
          const _exhaustiveCheck: never = type;
          return _exhaustiveCheck;
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  // ===== SAVE FUNCTION =====
  const saveToPayloadCMS = async () => {
    if (Object.keys(changes).length === 0) {
      setSaveStatus({ success: false, message: "No changes to save" });
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    try {
      // Replace with your actual API endpoint
      console.log(changes);
      const response = await fetch('/api/update-profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${yourAuthToken}`
        },
        body: JSON.stringify({
          ...changes,
          // id: profileId
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setSaveStatus({ success: true, message: "Changes saved successfully!" });
      setChanges({});
    } catch (error) {
      setSaveStatus({
        success: false,
        message: error instanceof Error ? error.message : "Failed to save changes"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ===== RENDER FUNCTIONS =====
  const renderSaveStatus = () => {
    if (!saveStatus) return null;

    return (
      <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg ${saveStatus.success ? 'bg-green-500' : 'bg-red-500'
        } text-white flex items-center`}>
        {saveStatus.message}
        <button
          onClick={() => setSaveStatus(null)}
          className="ml-2 focus:outline-none"
        >
          <Icon icon="tabler:x" className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const renderSectionItems = <K extends keyof ProfileData>(
    items: any[],
    type: K,
    renderItem: (item: any, index: number) => React.ReactNode,
    addButtonText: string,
    onAdd: () => void
  ) => {
    return (
      <div className="flex flex-col gap-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4">
            <p className="text-gray-600 text-sm text-center">
              You have not added any {type} yet.
            </p>
          </div>
        ) : (
          items.map((item, index) => (
            <div key={index} className="border p-4 rounded-lg">
              {renderItem(item, index)}
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => handleEditItem(type, index)}
                  className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                >
                  <Icon icon="tabler:pencil" className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeleteClick(index, type)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Icon icon="tabler:x" className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
        <Button onClick={onAdd}>{addButtonText}</Button>
      </div>
    );
  };

  // ===== SECTION CONFIGURATION =====
  const sections: Section[] = [
    { title: "Projects and Assignments", icon: "tabler:briefcase" },
    { title: "Skills", icon: "tabler:tools" },
    { title: "Other Skills", icon: "tabler:sparkles" },
    { title: "References", icon: "tabler:user-check" },
    { title: "Certification and Courses", icon: "tabler:certificate" },
    { title: "Employers", icon: "tabler:building-skyscraper" },
    { title: "Education", icon: "tabler:school" },
    { title: "Languages", icon: "tabler:language" },
    { title: "Commitments/Publication", icon: "tabler:file-text" },
    { title: "Availability Calendar", icon: "tabler:calendar" },
  ];

  // ===== MAIN RENDER =====
  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Save button and status */}
      <div className="flex justify-end gap-4 items-center sticky top-0 bg-white p-4 z-10 shadow-sm">
        {Object.keys(changes).length > 0 && (
          <span className="text-sm text-gray-500">
            {Object.keys(changes).length} unsaved {Object.keys(changes).length === 1 ? 'change' : 'changes'}
          </span>
        )}
        <Button
          onClick={saveToPayloadCMS}
          disabled={isSaving || Object.keys(changes).length === 0}
          loading={isSaving}
          className="min-w-[120px]"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <div key={section.title} className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-medium text-gray-800">
              <Icon icon={section.icon} className="w-6 h-6 text-blue-600" />
              <h2>{section.title}</h2>
            </div>
            <button
              onClick={() => toggleSection(section.title)}
              className="focus:outline-none"
            >
              <Icon
                icon={expandedSections[section.title] ? "tabler:chevron-up" : "tabler:chevron-down"}
                className="w-6 h-6 text-gray-600"
              />
            </button>
          </div>

          {expandedSections[section.title] && (
            <div className="mt-4">
              {/* Projects Section */}
              {section.title === "Projects and Assignments" && (
                <>
                  {showProjectForm ? (
                    <ProjectForm
                      projects={profileData.projects}
                      onSave={(updatedProjects) => {
                        trackChange('projects', updatedProjects);
                        setShowProjectForm(false);
                        setEditingProject(undefined);
                      }}
                      onCancel={() => {
                        setShowProjectForm(false);
                        setEditingProject(undefined);
                      }}
                      projectToEdit={editingProject}
                    />
                  ) : renderSectionItems(
                    profileData.projects,
                    'projects',
                    (project, index) => (
                      <>
                        <h3 className="font-bold">{project.role}</h3>
                        {project.company && <p className="text-gray-600">{project.company}</p>}
                        <p className="text-gray-600">
                          {formatDate(project.startDate)} - {project.isOngoing ? 'Present' : project.endDate ? formatDate(project.endDate) : 'N/A'}
                        </p>
                        <p className="text-gray-600">{project.description}</p>
                        {project.skills?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {project.skills.map((skill: string, i: React.Key | null | undefined) => (
                              <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                                {skill.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    ),
                    "Add New Project",
                    handleAddProject
                  )}
                </>
              )}

              {/* References Section */}
              {section.title === "References" && (
                <>
                  {showReferencesForm ? (
                    <References
                      onSave={handleSaveReference}
                      onCancel={() => setShowReferencesForm(false)}
                      initialData={editingReferenceIndex !== null ? profileData.references[editingReferenceIndex] : undefined}
                    />
                  ) : renderSectionItems(
                    profileData.references,
                    'references',
                    (reference, index) => (
                      <>
                        <h3 className="font-bold">{reference.firstName} {reference.lastName}</h3>
                        <p className="text-gray-600">{reference.position} at {reference.company}</p>
                        <p className="text-gray-600">{reference.email}</p>
                        <p className="text-gray-600">{reference.phone}</p>
                        <p className="text-gray-600">Relationship: {reference.relationship}</p>
                      </>
                    ),
                    "Add New Reference",
                    handleAddReference
                  )}
                </>
              )}

              {/* Other Skills Section */}
              {section.title === "Other Skills" && (
                <>
                  {showOtherSkillsForm ? (
                    <OtherSkills
                      onSave={handleSaveOtherSkills}
                      onCancel={() => setShowOtherSkillsForm(false)}
                      initialData={
                        editingOtherSkillsIndex !== null
                          ? profileData.otherSkills[editingOtherSkillsIndex]?.split(/,\s*|\s+/) ?? []
                          : undefined
                      }
                    />
                  ) : renderSectionItems(
                    profileData.otherSkills,
                    'otherSkills',
                    (skills, index) => (
                      <div className="flex flex-wrap gap-2">
                        {skills.split(", ").map((skill: string, i: number) => (
                          <span key={i} className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    ),
                    "Add Other Skills",
                    handleAddOtherSkills
                  )}
                </>
              )}

              {/* Education Section */}
              {section.title === "Education" && (
                <>
                  {showEducationForm ? (
                    <EducationForm
                      onSave={handleSaveEducation}
                      onCancel={() => setShowEducationForm(false)}
                      initialData={editingEducationIndex !== null ? profileData.education[editingEducationIndex] : undefined}
                    />
                  ) : renderSectionItems(
                    profileData.education,
                    'education',
                    (education, index) => (
                      <>
                        <h3 className="font-bold">{education.school}</h3>
                        <p className="text-gray-600">{education.program} ({education.level})</p>
                        <p className="text-gray-600">{education.place}</p>
                        <p className="text-gray-600">
                          {formatDate(education.startDate)} - {education.isOngoing ? 'Present' : formatDate(education.endDate)}
                        </p>
                        <p className="text-gray-600">{education.description}</p>
                        {education.link && (
                          <a href={education.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            View Certificate
                          </a>
                        )}
                      </>
                    ),
                    "Add Education",
                    handleAddEducation
                  )}
                </>
              )}

              {/* Employers Section */}
              {section.title === "Employers" && (
                <>
                  {showEmployerForm ? (
                    <EmployerForm
                      onSave={handleSaveEmployer}
                      onCancel={() => setShowEmployerForm(false)}
                      initialData={editingEmployerIndex !== null ? profileData.employers[editingEmployerIndex] : undefined}
                    />
                  ) : renderSectionItems(
                    profileData.employers,
                    'employers',
                    (employer, index) => (
                      <>
                        <h3 className="font-bold">{employer.employer}</h3>
                        <p className="text-gray-600">{employer.title}</p>
                        <p className="text-gray-600">
                          {formatDate(employer.startDate)} - {employer.isOngoing ? 'Present' : formatDate(employer.endDate)}
                        </p>
                        <p className="text-gray-600">{employer.description}</p>
                        {employer.link && (
                          <a href={employer.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Company Website
                          </a>
                        )}
                      </>
                    ),
                    "Add Employer",
                    handleAddEmployer
                  )}
                </>
              )}

              {/* Certifications Section */}
              {section.title === "Certification and Courses" && (
                <>
                  {showCertificationCourseForm ? (
                    <CertificationCourseForm
                      onSave={handleSaveCertificationCourse}
                      onCancel={() => setShowCertificationCourseForm(false)}
                      initialData={editingCertificationCourseIndex !== null ? profileData.certificationsCourses[editingCertificationCourseIndex] : undefined}
                    />
                  ) : renderSectionItems(
                    profileData.certificationsCourses,
                    'certificationsCourses',
                    (cert, index) => (
                      <>
                        <h3 className="font-bold">{cert.title}</h3>
                        <p className="text-gray-600">Type: {cert.type}</p>
                        <p className="text-gray-600">Issuer: {cert.issuer}</p>
                        <p className="text-gray-600">Code: {cert.code}</p>
                        <p className="text-gray-600">
                          Valid until: {formatDate(cert.validDate)}
                        </p>
                        <p className="text-gray-600">{cert.description}</p>
                        {cert.link && (
                          <a href={cert.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            View Certificate
                          </a>
                        )}
                      </>
                    ),
                    "Add Certification",
                    handleAddCertificationCourse
                  )}
                </>
              )}

              {/* Languages Section */}
              {section.title === "Languages" && (
                <>
                  {showLanguageForm ? (
                    <LanguageForm
                      onSave={handleSaveLanguage}
                      onCancel={() => setShowLanguageForm(false)}
                      initialData={editingLanguageIndex !== null ? profileData.languages[editingLanguageIndex] : undefined}
                    />
                  ) : renderSectionItems(
                    profileData.languages,
                    'languages',
                    (language, index) => (
                      <>
                        <h3 className="font-bold">{language.language}</h3>
                        <p className="text-gray-600">Proficiency: {language.level}</p>
                      </>
                    ),
                    "Add Language",
                    handleAddLanguage
                  )}
                </>
              )}

              {/* Skills Section */}
              {section.title === "Skills" && (
                <>
                  {showSkillForm ? (
                    <SkillForm
                      onSave={handleSaveSkill}
                      onCancel={() => setShowSkillForm(false)}
                      initialData={editingSkillIndex !== null ? profileData.skills[editingSkillIndex] : undefined}
                    />
                  ) : renderSectionItems(
                    profileData.skills,
                    'skills',
                    (skill, index) => (
                      <>
                        <h3 className="font-bold">{skill.skillName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Icon
                                key={star}
                                icon={star <= skill.skillRating ? "tabler:star-filled" : "tabler:star"}
                                className={`w-5 h-5 ${star <= skill.skillRating ? 'text-yellow-500' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">({skill.skillRating}/5)</span>
                        </div>
                      </>
                    ),
                    "Add Skill",
                    handleAddSkill
                  )}
                </>
              )}
              {/* Commitments Section */}
              {section.title === "Commitments/Publication" && (
                <>
                  {showCommitmentForm ? (
                    <CommitmentsForm
                      onSave={handleSaveCommitment}
                      onCancel={() => setShowCommitmentForm(false)}
                      initialData={editingCommitmentIndex !== null ? profileData.commitments[editingCommitmentIndex] : undefined}
                    />
                  ) : renderSectionItems(
                    profileData.commitments,
                    'commitments',
                    (commitment, index) => (
                      <>
                        <h3 className="font-bold">{commitment.title}</h3>
                        <p className="text-gray-600">
                          {formatDate(commitment.startDate)} - {commitment.isOngoing ? 'Present' : formatDate(commitment.endDate)}
                        </p>
                        <p className="text-gray-600">{commitment.description}</p>
                        {commitment.link && (
                          <a href={commitment.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            View Publication
                          </a>
                        )}
                      </>
                    ),
                    "Add Commitment/Publication",
                    handleAddCommitment
                  )}
                </>
              )}

              {/* Availability Section */}
              {section.title === "Availability Calendar" && (
                <>
                  {showAvailabilityForm ? (
                    <Availability
                      onSave={handleSaveAvailability}
                      onCancel={() => setShowAvailabilityForm(false)}
                      initialData={editingAvailabilityIndex !== null ? profileData.availabilities[editingAvailabilityIndex] : undefined}
                    />
                  ) : renderSectionItems(
                    profileData.availabilities,
                    'availabilities',
                    (availability, index) => (
                      <>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${availability.status === "Available" ? "bg-green-500" :
                            availability.status === "Vacation" ? "bg-blue-500" : "bg-red-500"
                            }`}></div>
                          <h3 className="font-bold">{availability.status}</h3>
                        </div>
                        <p className="text-gray-600">
                          {formatDate(availability.startDate)} - {availability.isOngoing ? 'Indefinite' : formatDate(availability.endDate)}
                        </p>
                      </>
                    ),
                    "Add Availability",
                    handleAddAvailability
                  )}
                </>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && itemToDelete && (
        <CancelPopUp
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          itemName={
            itemToDelete.type === 'projects' ? 'this project' :
              itemToDelete.type === 'references' ? 'this reference' :
                itemToDelete.type === 'education' ? 'this education entry' :
                  itemToDelete.type === 'employers' ? 'this employer' :
                    itemToDelete.type === 'certificationsCourses' ? 'this certification' :
                      itemToDelete.type === 'languages' ? 'this language' :
                        itemToDelete.type === 'skills' ? 'this skill' :
                          itemToDelete.type === 'commitments' ? 'this commitment' :
                            itemToDelete.type === 'availabilities' ? 'this availability period' :
                              'this item'
          }
        />
      )}

      {/* Save status notification */}
      {renderSaveStatus()}
    </div>
  );
};

export default CreateManual;
