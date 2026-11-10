"use client";

import { useState, useEffect } from "react";
import { useProfileStore } from "@/utils/profileStore";
import type { ProjectDetail } from "@/types/payloadTypes";
import { Calendar, Link } from "lucide-react";
import { formatDate } from "@/utils/formatDate";
import { useChangesStore } from "@/utils/changesStore";
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation";

interface ProjectFormProps {
  projectId: string | null;
  onCancel: () => void;
  onComplete: () => void;
}

export default function ProjectForm({ projectId, onCancel, onComplete }: ProjectFormProps) {
  const { projectDetails: storedProjects, setProjectDetails } = useProfileStore();
  const { addChange, editChange } = useChangesStore();
  const { t } = useDashboardTranslations();

  const [formData, setFormData] = useState<Partial<ProjectDetail>>({
    role: "",
    startDate: new Date(),
    endDate: undefined,
    isCurrent: false,
    description: "",
    skills: "",
    company: "",
    location: "",
    projectUrl: "",
  });
  const [newSkill, setNewSkill] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (projectId) {
      const project = storedProjects?.find((p) => p.id === projectId);
      if (project) {
        setFormData({
          role: project.role,
          startDate: project.startDate instanceof Date ? project.startDate : new Date(project.startDate),
          endDate: project.endDate ? (project.endDate instanceof Date ? project.endDate : new Date(project.endDate)) : undefined,
          isCurrent: project.isCurrent,
          description: project.description,
          skills: project.skills || "",
          company: project.company,
          location: project.location,
          projectUrl: project.projectUrl,
        });
      } else {
        resetForm();
      }
    } else {
      resetForm();
    }
  }, [projectId, storedProjects]);

  const resetForm = () => {
    setFormData({
      role: "",
      startDate: new Date(),
      endDate: undefined,
      isCurrent: false,
      description: "",
      skills: "",
      company: "",
      location: "",
      projectUrl: "",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleDateChange = (name: string, value: string) => {
    const date = value ? new Date(value) : undefined;

    if (name === "endDate" && date && formData.startDate) {
      const startDate = formData.startDate instanceof Date
        ? formData.startDate
        : new Date(formData.startDate);

      if (date < startDate) {
        setErrors(prev => ({ ...prev, endDate: t.endDateCannotBeBeforeStartDate }));
        return;
      }
    }

    if (name === "startDate" && date && formData.endDate && !formData.isCurrent) {
      const endDate = formData.endDate instanceof Date
        ? formData.endDate
        : new Date(formData.endDate);

      if (date > endDate) {
        setErrors(prev => ({ ...prev, startDate: t.endDateCannotBeBeforeStartDate }));
        return;
      }
    }

    setFormData((prev) => ({ ...prev, [name]: date }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked, ...(checked ? { endDate: undefined } : {}) }));

    if (checked && errors.endDate) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.endDate;
        return newErrors;
      });
    }
  };

  const handleNewSkillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewSkill(e.target.value);

    if (errors.skills) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.skills;
        return newErrors;
      });
    }
  };

  const isSkillDuplicate = (skill: string): boolean => {
    const currentSkills = formData.skills ? formData.skills.split(", ").map(s => s.toLowerCase()) : [];
    return currentSkills.includes(skill.toLowerCase());
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;

    const skillsToAdd = newSkill
      .split(",")
      .map(skill => skill.trim())
      .filter(skill => skill !== "");

    if (skillsToAdd.length === 0) return;

    const uniqueSkills = [...new Set(skillsToAdd)];
    if (uniqueSkills.length < skillsToAdd.length) {
      setErrors((prev) => ({ ...prev, skills: t.duplicateSkillsDetected }));
      return;
    }

    const skillsToActuallyAdd = uniqueSkills.filter(skill => !isSkillDuplicate(skill));

    if (skillsToActuallyAdd.length === 0) {
      setErrors((prev) => ({ ...prev, skills: t.duplicateSkillsMessage }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      skills: prev.skills
        ? `${prev.skills}, ${skillsToActuallyAdd.join(", ")}`
        : skillsToActuallyAdd.join(", "),
    }));

    setNewSkill("");
  };

  const handleSkillInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills!
        .split(", ")
        .filter((skill) => skill !== skillToRemove)
        .join(", "),
    }));
  };

  const handleSubmit = () => {
    try {
      const validationErrors: Record<string, string> = {};
      if (!formData.role) validationErrors.role = t.fieldRequired;
      if (!formData.startDate) validationErrors.startDate = t.startDateRequired;
      if (!formData.description) validationErrors.description = t.descriptionRequired;

      if (formData.startDate && formData.endDate && !formData.isCurrent) {
        const startDate = formData.startDate instanceof Date
          ? formData.startDate
          : new Date(formData.startDate);
        const endDate = formData.endDate instanceof Date
          ? formData.endDate
          : new Date(formData.endDate);

        if (endDate < startDate) {
          validationErrors.endDate = t.endDateCannotBeBeforeStartDate;
        }
      }

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      if (projectId) {
        const updatedProjects = storedProjects?.map((p) =>
          p.id === projectId ? { ...p, ...formData } as ProjectDetail : p
        ) || [];
        setProjectDetails(updatedProjects, true);
        editChange('projectDetails', projectId);
      } else {
        const newProject: ProjectDetail = {
          id: Math.random().toString(36).substring(2, 15),
          ...formData,
        } as ProjectDetail;
        setProjectDetails([...(storedProjects || []), newProject], true);
        addChange('projectDetails', newProject.id);
      }

      onComplete();
    } catch (error) {
      console.error("Error submitting project:", error);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-800">
        {projectId ? t.editProject : t.addNewProject}
      </h3>

      {/* Role */}
      <div>
        <label className="block text-gray-700 mb-1">
          {t.presentTitleLabel} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="role"
          value={formData.role}
          onChange={handleChange}
          placeholder={t.presentTitlePlaceholder}
          className={`w-full p-2 border ${errors.role ? "border-red-500" : "border-blue-200/60"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
          style={!errors.role ? { borderColor: 'rgb(176, 196, 222)' } : {}}
        />
        {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 mb-1">
            {t.startDate} <span className="text-red-500">*</span>
          </label>
          <div className="relative" onClick={() => {
            const input = document.getElementById('startDateInput');
            if (input instanceof HTMLInputElement) input.showPicker();
          }}>
            <input
              id="startDateInput"
              type="date"
              name="startDate"
              value={formData.startDate ?
                (formData.startDate instanceof Date ?
                  formatDate(formData.startDate.toISOString(), false) :
                  formatDate(new Date(formData.startDate).toISOString(), false)) :
                ""}
              onChange={(e) => handleDateChange("startDate", e.target.value)}
              className={`w-full p-2 pl-10 border ${errors.startDate ? "border-red-500" : "border-blue-200/60"} rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
              style={!errors.startDate ? { borderColor: 'rgb(176, 196, 222)' } : {}}
            />
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
          {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
        </div>

        {!formData.isCurrent && (
          <div>
            <label className="block text-gray-700 mb-1">{t.endDate}</label>
            <div className="relative" onClick={() => {
              const input = document.getElementById('endDateInput');
              if (input instanceof HTMLInputElement) input.showPicker();
            }}>
              <input
                id="endDateInput"
                type="date"
                name="endDate"
                value={formData.endDate && !formData.isCurrent ?
                  (formData.endDate instanceof Date ?
                    formatDate(formData.endDate.toISOString(), false) :
                    formatDate(new Date(formData.endDate).toISOString(), false)) :
                  ""}
                onChange={(e) => handleDateChange("endDate", e.target.value)}
                className={`w-full p-2 pl-10 border ${errors.endDate ? "border-red-500" : "border-blue-200/60"} rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
                style={!errors.endDate ? { borderColor: 'rgb(176, 196, 222)' } : {}}
                min={formData.startDate instanceof Date ?
                  formatDate(formData.startDate.toISOString(), false) :
                  formatDate(new Date(formData.startDate || "").toISOString(), false)}
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
            {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
          </div>
        )}
      </div>

      {/* Ongoing */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isCurrent"
          name="isCurrent"
          checked={formData.isCurrent}
          onChange={handleCheckboxChange}
          className="mr-2"
        />
        <label htmlFor="isCurrent" className="text-gray-700">
          {t.ongoing}
        </label>
      </div>

      {/* Description */}
      <div>
        <label className="block text-gray-700 mb-1">
          {t.description} <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder={t.featureDescriptionPlaceholder}
          rows={4}
          className={`w-full p-2 border ${errors.description ? "border-red-500" : "border-blue-200/60"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
          style={!errors.description ? { borderColor: 'rgb(176, 196, 222)' } : {}}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      {/* Skills */}
      <div>
        <label className="block text-gray-700 mb-2">{t.skills}</label>
        <div className="flex items-center mb-2">
          <input
            type="text"
            placeholder={t.technicalSkills}
            value={newSkill}
            onChange={handleNewSkillChange}
            onKeyDown={handleSkillInputKeyDown}
            className={`flex-grow p-2 border ${errors.skills ? "border-red-500" : "border-blue-200/60"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
            style={!errors.skills ? { borderColor: 'rgb(176, 196, 222)' } : {}}
          />
          <button
            type="button"
            onClick={handleAddSkill}
            className="ml-2 text-white font-medium py-2 px-4 rounded-md transition-all duration-300 hover:shadow-lg focus:outline-none"
            style={{ backgroundColor: 'rgb(5, 22, 80)' }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            {t.addSkill}
          </button>
        </div>
        {errors.skills && <p className="text-red-500 text-sm mb-1">{errors.skills}</p>}
        <p className="text-gray-500 text-sm mb-1">{t.noSkillsAdded}</p>
        {formData.skills && formData.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.skills.split(", ").map((skill: string, index: number) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm"
                style={{ backgroundColor: 'rgb(176, 196, 222)', color: 'rgb(5, 22, 80)' }}
              >
                {skill}
                <button
                  onClick={() => handleRemoveSkill(skill)}
                  className="ml-1 hover:opacity-80 focus:outline-none"
                  style={{ color: 'rgb(5, 22, 80)' }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 fill-current"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Company */}
      <div>
        <label className="block text-gray-700 mb-1">{t.companyName}</label>
        <input
          type="text"
          name="company"
          value={formData.company || ""}
          onChange={handleChange}
          placeholder={t.companyNamePlaceholder}
          className="w-full p-2 border border-blue-200/60 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40"
          style={{ borderColor: 'rgb(176, 196, 222)' }}
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-gray-700 mb-1">{t.officeLocationLabel}</label>
        <input
          type="text"
          name="location"
          value={formData.location || ""}
          onChange={handleChange}
          placeholder={t.cityCountry}
          className="w-full p-2 border border-blue-200/60 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40"
          style={{ borderColor: 'rgb(176, 196, 222)' }}
        />
      </div>

      {/* Project URL */}
      <div>
        <label className="block text-gray-700 mb-1">{t.website}</label>
        <div className="relative">
          <input
            type="text"
            name="projectUrl"
            value={formData.projectUrl || ""}
            onChange={handleChange}
            placeholder={t.linkPlaceholder}
            className="w-full p-2 pl-10 border border-blue-200/60 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40"
            style={{ borderColor: 'rgb(176, 196, 222)' }}
          />
          <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors focus:outline-none"
        >
          {t.cancel}
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 text-white font-medium py-2 px-4 rounded-md transition-all duration-300 hover:shadow-lg focus:outline-none"
          style={{ backgroundColor: 'rgb(5, 22, 80)' }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          {projectId ? t.saveChanges : t.addProject}
        </button>
      </div>
    </div>
  );
}
