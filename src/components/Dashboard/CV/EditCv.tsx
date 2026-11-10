"use client";

import { useState, useEffect, useRef } from "react";
import Card from "../ReUsable/Card";
import Button from "../ReUsable/Button";
import { Icon } from "@iconify/react";
import { useEditCvHandlers } from "./EditCv-handlers";
import {
  PersonalInfoSection,
  SkillsSection,
  OtherSkillsSection,
  LanguagesSection,
  EducationSection,
  EmployersSection,
  ProjectsSection,
  CertificationsSection,
  CommitmentsSection,
} from "./EditCv-section";
import { CvPreview } from "./EditCv-preview";
import { EditCvProps, FormData, profileSections } from "./EditCvType";
import { useProfileStore } from "@/utils/profileStore";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const EditCv = ({ cvItem, onSave, onCancel }: EditCvProps) => {

  const initialFormData: FormData = {
    title: "",
    language: "",
    status: "New",
    personalInfo: {
      id: 0,
      firstName: "",
      lastName: "",
      updatedAt: "",
      createdAt: ""
    },
    skills: [],
    languages: [],
    education: [],
    employers: [],
    projects: [],
    certifications: [],
    commitments: [],
    otherSkills: [],
  };

  const {
    formData,
    setFormData,
    handleInputChange,
    handlePersonalInfoChange,
    handleSubmit,
    handleSaveSkill,
    handleRemoveSkill,
    handleSaveOtherSkills,
    handleRemoveOtherSkill,
    handleSaveLanguage,
    handleRemoveLanguage,
    handleSaveEducation,
    handleRemoveEducation,
    handleSaveEmployer,
    handleRemoveEmployer,
    handleSaveProject,
    handleRemoveProject,
    handleSaveCertification,
    handleRemoveCertification,
    handleSaveCommitment,
    handleRemoveCommitment,
  } = useEditCvHandlers(initialFormData);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    profileSections.reduce((acc, section) => {
      acc[section.title] = section.title === "Personal Information";
      return acc;
    }, {} as Record<string, boolean>)
  );

  const [isMobile, setIsMobile] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Form visibility states
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showEducationForm, setShowEducationForm] = useState(false);
  const [showEmployerForm, setShowEmployerForm] = useState(false);
  const [showCertificationForm, setShowCertificationForm] = useState(false);
  const [showLanguageForm, setShowLanguageForm] = useState(false);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [showCommitmentForm, setShowCommitmentForm] = useState(false);
  const [showOtherSkillsForm, setShowOtherSkillsForm] = useState(false);

  // Editing states
  const [editingProject, setEditingProject] = useState<any>(undefined);
  const [editingEducation, setEditingEducation] = useState<any>(undefined);
  const [editingEmployer, setEditingEmployer] = useState<any>(undefined);
  const [editingCertification, setEditingCertification] = useState<any>(undefined);
  const [editingLanguage, setEditingLanguage] = useState<any>(undefined);
  const [editingSkill, setEditingSkill] = useState<any>(undefined);
  const [editingCommitment, setEditingCommitment] = useState<any>(undefined);
  const [editingOtherSkills, setEditingOtherSkills] = useState<string[] | undefined>(undefined);
  //Data reuse
  const skills = useProfileStore((state) => state.skills);
  const personalInformation = useProfileStore((state) => state.personalInformation);
  const projects = useProfileStore((state) => state.projectDetails);
  const languages = useProfileStore((state) => state.languages);
  const references = useProfileStore((state) => state.references);
  const certifications = useProfileStore((state) => state.certifications);
  const employers = useProfileStore((state) => state.employers);
  const education = useProfileStore((state) => state.education);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (cvItem) {
      setFormData({
        title: cvItem.title,
        language: cvItem.language,
        status: cvItem.status,
        personalInfo: personalInformation || { id: 0, firstName: "", lastName: "" },
        skills: skills || [],
        languages: languages || [],
        education: education || [],
        employers: employers || [],
        projects: projects || [],
        certifications: certifications || [],
        commitments: cvItem.commitments || [],
        otherSkills: cvItem.otherSkills || [],
      });
    }
  }, [cvItem, setFormData]);

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [title]: !(prev[title] ?? false),
    }));
  };

  const handleAddSkill = () => {
    setEditingSkill(undefined);
    setShowSkillForm(true);
  };

  const handleEditSkill = (index: number) => {
    setEditingSkill(formData.skills[index]);
    setShowSkillForm(true);
  };

  const handleAddOtherSkills = () => {
    setEditingOtherSkills(undefined);
    setShowOtherSkillsForm(true);
  };

  const handleAddLanguage = () => {
    setEditingLanguage(undefined);
    setShowLanguageForm(true);
  };

  const handleEditLanguage = (index: number) => {
    setEditingLanguage(formData.languages[index]);
    setShowLanguageForm(true);
  };

  const handleAddEducation = () => {
    setEditingEducation(undefined);
    setShowEducationForm(true);
  };

  const handleEditEducation = (index: number) => {
    setEditingEducation(formData.education[index]);
    setShowEducationForm(true);
  };

  const handleAddEmployer = () => {
    setEditingEmployer(undefined);
    setShowEmployerForm(true);
  };

  const handleEditEmployer = (index: number) => {
    setEditingEmployer(formData.employers[index]);
    setShowEmployerForm(true);
  };

  const handleAddProject = () => {
    setEditingProject(undefined);
    setShowProjectForm(true);
  };

  const handleEditProject = (index: number) => {
    setEditingProject(formData.projects[index]);
    setShowProjectForm(true);
  };


  const handleAddCertification = () => {
    setEditingCertification(undefined);
    setShowCertificationForm(true);
  };

  const handleEditCertification = (index: number) => {
    setEditingCertification(formData.certifications[index]);
    setShowCertificationForm(true);
  };

  const handleAddCommitment = () => {
    setEditingCommitment(undefined);
    setShowCommitmentForm(true);
  };

  const handleEditCommitment = (index: number) => {
    setEditingCommitment(formData.commitments[index]);
    setShowCommitmentForm(true);
  };

  //download function
  const handleDownloadPdf = async () => {
    const element = document.getElementById('cv-preview');
    if (!element) return;

    try {
      // Show loading indicator
      setIsDownloading(true);

      // Get the height of the content to determine how many pages we need
      const elementHeight = element.scrollHeight;
      const elementWidth = element.scrollWidth;

      // Calculate the scale to fit the content width to A4
      // A4 dimensions: 794px x 1123px
      const a4Width = 794;
      const a4Height = 1123;

      // Cap scale at 2 for quality
      const scale = Math.min(a4Width / elementWidth, 2);

      // Create a canvas that fits the content
      const canvas = await html2canvas(element, {
        scale: scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: false
      });

      // Create new PDF instance
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      // PDF dimensions in px
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Calculate how many pages we need
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      // Add the first page
      let heightLeft = imgHeight;
      let position = 0; // Current position in the PDF
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);

      // Add additional pages as needed
      while (heightLeft > pdfHeight) {
        position = position - pdfHeight; // Move position up by one page height
        heightLeft -= pdfHeight;

        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      }

      // Generate file name
      const fileName = `${formData.title || 'CV'}_${formData.personalInfo?.firstName || ''}_${formData.personalInfo?.lastName || ''}.pdf`.replace(/\s+/g, '_');

      // Save the PDF
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      // Optionally show an error toast
    } finally {
      setIsDownloading(false);
    }
  };
  // state to track when downloading is in progress
  const [isDownloading, setIsDownloading] = useState(false);




  const isFormValid = formData.title.trim() !== "" && formData.language !== "";

  return (
    <Card className="mt-4 md:mt-8 border-t-4 border-blue-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Icon icon="tabler:edit" className="w-6 h-6 md:w-8 md:h-8 text-blue-500 mr-2" />
          <h2 className="text-lg font-semibold">Edit CV</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-green-500"
          >
            {isDownloading ? (
              <>
                <Icon icon="tabler:loader" className="w-4 h-4 animate-spin" />
                <span className="hidden md:inline">Generating...</span>
              </>
            ) : (
              <>
                <Icon icon="tabler:download" className="w-4 h-4" />
                <span className="hidden md:inline">Download</span>
              </>
            )}
          </Button>
          {isMobile && (
            <Button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm"
            >
              {showPreview ? "Show Form" : "Show Preview"}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Left Column - Edit Form */}
        {(!isMobile || !showPreview) && (
          <div
            className={`${isMobile ? "w-full" : "w-full md:w-1/2"} overflow-y-auto pr-2 md:pr-4`}
            style={{ maxHeight: "calc(100vh - 180px)" }}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700">
                  CV Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="edit-title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-language" className="block text-sm font-medium text-gray-700">
                  CV Language <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="edit-language"
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-sm md:text-base"
                    required
                  >
                    <option value="">Select a language</option>
                    <option value="English">English</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Spanish">Spanish</option>
                    <option value="Swedish">Swedish</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <Icon icon="tabler:chevron-down" className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <div className="relative">
                  <select
                    id="edit-status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-sm md:text-base"
                  >
                    <option value="New">New</option>
                    <option value="Draft">Draft</option>
                    <option value="Final">Final</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <Icon icon="tabler:chevron-down" className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                  </div>
                </div>
              </div>

              {/* Profile Sections */}
              {profileSections.map((section) => (
                <div key={section.title} className="bg-white p-3 md:p-4 rounded-lg border border-gray-200">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleSection(section.title)}
                  >
                    <div className="flex items-center gap-2 text-sm md:text-md font-medium text-gray-800">
                      <Icon icon={section.icon} className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                      <h3>{section.title}</h3>
                    </div>
                    <Icon
                      icon={expandedSections[section.title] ? "tabler:chevron-up" : "tabler:chevron-down"}
                      className="w-4 h-4 md:w-5 md:h-5 text-gray-600"
                    />
                  </div>

                  {expandedSections[section.title] && (
                    <div className="mt-3 md:mt-4 space-y-3 md:space-y-4">
                      {section.title === "Personal Information" && (
                        <PersonalInfoSection
                          formData={formData}
                          handlePersonalInfoChange={handlePersonalInfoChange}
                        />
                      )}

                      {section.title === "Skills" && (
                        <SkillsSection
                          formData={formData}
                          showSkillForm={showSkillForm}
                          editingSkill={editingSkill}
                          handleAddSkill={handleAddSkill}
                          handleEditSkill={handleEditSkill}
                          handleRemoveSkill={handleRemoveSkill}
                          setShowSkillForm={setShowSkillForm}
                          handleSaveSkill={handleSaveSkill}
                        />
                      )}

                      {section.title === "Other Skills" && (
                        <OtherSkillsSection
                          formData={formData}
                          showOtherSkillsForm={showOtherSkillsForm}
                          setShowOtherSkillsForm={setShowOtherSkillsForm}
                          handleSaveOtherSkills={handleSaveOtherSkills}
                          handleRemoveOtherSkill={handleRemoveOtherSkill}
                        />
                      )}

                      {section.title === "Languages" && (
                        <LanguagesSection
                          formData={formData}
                          showLanguageForm={showLanguageForm}
                          editingLanguage={editingLanguage}
                          handleAddLanguage={handleAddLanguage}
                          handleEditLanguage={handleEditLanguage}
                          handleRemoveLanguage={handleRemoveLanguage}
                          setShowLanguageForm={setShowLanguageForm}
                          handleSaveLanguage={handleSaveLanguage}
                        />
                      )}

                      {section.title === "Education" && (
                        <EducationSection
                          formData={formData}
                          showEducationForm={showEducationForm}
                          editingEducation={editingEducation}
                          handleAddEducation={handleAddEducation}
                          handleEditEducation={handleEditEducation}
                          handleRemoveEducation={handleRemoveEducation}
                          setShowEducationForm={setShowEducationForm}
                          handleSaveEducation={handleSaveEducation}
                        />
                      )}

                      {section.title === "Employers" && (
                        <EmployersSection
                          formData={formData}
                          showEmployerForm={showEmployerForm}
                          editingEmployer={editingEmployer}
                          handleAddEmployer={handleAddEmployer}
                          handleEditEmployer={handleEditEmployer}
                          handleRemoveEmployer={handleRemoveEmployer}
                          setShowEmployerForm={setShowEmployerForm}
                          handleSaveEmployer={handleSaveEmployer}
                        />
                      )}

                      {section.title === "Projects and Assignments" && (
                        <ProjectsSection
                          formData={formData}
                          showProjectForm={showProjectForm}
                          editingProject={editingProject}
                          handleAddProject={handleAddProject}
                          handleEditProject={handleEditProject}
                          handleRemoveProject={handleRemoveProject}
                          setShowProjectForm={setShowProjectForm}
                          handleSaveProject={handleSaveProject}
                        />
                      )}

                      {section.title === "Certification and Courses" && (
                        <CertificationsSection
                          formData={formData}
                          showCertificationForm={showCertificationForm}
                          editingCertification={editingCertification}
                          handleAddCertification={handleAddCertification}
                          handleEditCertification={handleEditCertification}
                          handleRemoveCertification={handleRemoveCertification}
                          setShowCertificationForm={setShowCertificationForm}
                          handleSaveCertification={handleSaveCertification}
                        />
                      )}

                      {section.title === "Commitments/Publication" && (
                        <CommitmentsSection
                          formData={formData}
                          showCommitmentForm={showCommitmentForm}
                          editingCommitment={editingCommitment}
                          handleAddCommitment={handleAddCommitment}
                          handleEditCommitment={handleEditCommitment}
                          handleRemoveCommitment={handleRemoveCommitment}
                          setShowCommitmentForm={setShowCommitmentForm}
                          handleSaveCommitment={handleSaveCommitment}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 md:gap-4 mt-4 md:mt-6">
              <Button
                type="button"
                onClick={() => onSave(handleSubmit())}
                className={`px-3 py-1 md:px-4 md:py-2 text-xs md:text-sm font-medium rounded ${isFormValid
                  ? "bg-blue-500 hover:bg-green-500 text-white border-green-500"
                  : "bg-blue-100 text-white cursor-not-allowed"
                  }`}
                disabled={!isFormValid}
              >
                Save Changes
              </Button>
              <Button
                type="button"
                onClick={onCancel}
                className="bg-blue-100 border border-red-400 text-gray-700 hover:bg-red-400 px-3 py-1 md:px-4 md:py-2 text-xs md:text-sm font-medium rounded"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Right Column - Live Preview */}
        {(!isMobile || showPreview) && (
          <div
            className={`${isMobile ? "w-full" : "w-full md:w-1/2"} bg-gray-100 rounded-lg p-3 md:p-6 overflow-y-auto`}
            style={{ maxHeight: "calc(100vh - 180px)" }}
          >
            <CvPreview formData={formData} cvItem={cvItem} />
          </div>
        )}
      </div>
    </Card>
  );
};

export default EditCv;
