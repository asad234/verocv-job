import { useState } from 'react'
import {
  FormData,
  Project,
  Education,
  Employer,
  Certification,
  Language,
  Skill,
  Commitment,
  getSkillCategoryByRating,
} from './EditCvType'

export const useEditCvHandlers = (initialFormData: FormData) => {
  const [formData, setFormData] = useState<FormData>(initialFormData)

  const handleInputChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePersonalInfoChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [name]: value,
      },
    }))
  }

  const handleSubmit = () => {
    const now = new Date()
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate(),
    ).padStart(
      2,
      '0',
    )} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    return {
      ...formData,
      lastActivity: formattedDate,
      lastActivityBy: 'Abdullahi Asad',
    }
  }

  // Skills handlers
  const handleSaveSkill = (skill: Skill) => {
    if (!skill.category) {
      skill.category = getSkillCategoryByRating(skill.skillRating)
    }

    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.some((s) => s.skillName === skill.skillName)
        ? prev.skills.map((s) => (s.skillName === skill.skillName ? skill : s))
        : [...prev.skills, skill],
    }))
  }

  const handleRemoveSkill = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }))
  }

  // Other Skills handlers
  const handleSaveOtherSkills = (skills: string[]) => {
    setFormData((prev) => ({
      ...prev,
      otherSkills: [...prev.otherSkills, ...skills.filter((s) => s.trim() !== '')],
    }))
  }

  const handleRemoveOtherSkill = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      otherSkills: prev.otherSkills.filter((_, i) => i !== index),
    }))
  }

  // Languages handlers
  const handleSaveLanguage = (language: Language) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.some((l) => l.language === language.language)
        ? prev.languages.map((l) => (l.language === language.language ? language : l))
        : [...prev.languages, language],
    }))
  }

  const handleRemoveLanguage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index),
    }))
  }

  // Education handlers
  const handleSaveEducation = (education: Education) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.some(
        (e) => e.school === education.school && e.program === education.program,
      )
        ? prev.education.map((e) =>
            e.school === education.school && e.program === education.program ? education : e,
          )
        : [...prev.education, education],
    }))
  }

  const handleRemoveEducation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }))
  }

  // Employers handlers
  const handleSaveEmployer = (employer: Employer) => {
    setFormData((prev) => ({
      ...prev,
      employers: prev.employers.some(
        (e) => e.employer === employer.employer && e.title === employer.title,
      )
        ? prev.employers.map((e) =>
            e.employer === employer.employer && e.title === employer.title ? employer : e,
          )
        : [...prev.employers, employer],
    }))
  }

  const handleRemoveEmployer = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      employers: prev.employers.filter((_, i) => i !== index),
    }))
  }

  // Projects handlers
  const handleSaveProject = (projects: Project[]) => {
    const updatedProjects = projects.map((project) => ({
      ...project,
      startDate:
        project.startDate instanceof Date
          ? project.startDate
          : project.startDate
            ? new Date(project.startDate)
            : new Date(),
      endDate:
        project.endDate instanceof Date || project.endDate === null
          ? project.endDate
          : project.endDate
            ? new Date(project.endDate)
            : undefined,
    }))
    setFormData((prev) => ({
      ...prev,
      projects: updatedProjects,
    }))
  }

  const handleRemoveProject = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }))
  }

  // Certifications handlers
  const handleSaveCertification = (certification: Certification) => {
    setFormData((prev) => ({
      ...prev,
      certificationsCourses: prev.certifications.some((c) => c.title === certification.title)
        ? prev.certifications.map((c) =>
            c.title === certification.title ? certification : c,
          )
        : [...prev.certifications, certification],
    }))
  }

  const handleRemoveCertification = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      certificationsCourses: prev.certifications.filter((_, i) => i !== index),
    }))
  }

  // Commitments handlers
  const handleSaveCommitment = (commitment: Commitment) => {
    setFormData((prev) => ({
      ...prev,
      commitments: prev.commitments.some((c) => c.title === commitment.title)
        ? prev.commitments.map((c) => (c.title === commitment.title ? commitment : c))
        : [...prev.commitments, commitment],
    }))
  }

  const handleRemoveCommitment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      commitments: prev.commitments.filter((_, i) => i !== index),
    }))
  }

  return {
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
  }
}
