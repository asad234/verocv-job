export type FormLanguage = 'en' | 'sv'

export const formTranslations = {
  en: {
    // Project & Assignments Section
    projectsAssignments: 'Projects & Assignments',
    projectsAndAssignments: 'Projects & Assignments',
    at: 'at',
    present: 'Present',
    addProject: 'Add Project',
    hideProject: 'Hide Project',
    showProject: 'Show Project',
    editProject: 'Edit project',
    deleteProject: 'Delete project',
    noProjectsAddedYet: 'No projects added yet.',
    addNewProject: 'Add New Project',

    // Project Form Fields
    roleLabel: 'Role',
    rolePlaceholder: 'Select or enter your role',
    projectDescriptionLabel: 'Project Description',
    projectDescriptionPlaceholder: 'Describe the project and your contributions',
    describeRoleAndResponsibilities: 'Describe your role and responsibilities in this project',
    companyLabel: 'Company',
    companyPlaceholder: 'Company name',
    locationLabel: 'Location',
    locationPlaceholder: 'Project location',
    projectUrlLabel: 'Project URL',
    projectUrlPlaceholder: 'https://project-website.com',
    skillsLabel: 'Skills Used',
    skillsPlaceholder: 'e.g. React, TypeScript, Node.js',
    addSkillButton: 'Add Skill',
    removeSkill: 'Remove skill',

    // Role Options
    softwareDeveloper: 'Software Developer',
    projectManager: 'Project Manager',
    designer: 'Designer',
    analyst: 'Analyst',
    consultant: 'Consultant',
    architect: 'Architect',
    engineer: 'Engineer',
    developer: 'Developer',

    // Actions
    updateProject: 'Update Project',

    // Success Messages
    projectUpdated: 'Project Updated',
    projectUpdatedDesc: 'has been updated successfully',
    projectAdded: 'Project Added',
    projectAddedDesc: 'has been added to your CV',
  },
  sv: {
    // Project & Assignments Section
    projectsAssignments: 'Projekt & Uppdrag',
    projectsAndAssignments: 'Projekt & Uppdrag',
    at: 'på',
    present: 'Nuvarande',
    addProject: 'Lägg till projekt',
    hideProject: 'Dölj projekt',
    showProject: 'Visa projekt',
    editProject: 'Redigera projekt',
    deleteProject: 'Ta bort projekt',
    noProjectsAddedYet: 'Inga projekt tillagda än.',
    addNewProject: 'Lägg Till Nytt Projekt',

    // Project Form Fields
    roleLabel: 'Roll',
    rolePlaceholder: 'Välj eller ange din roll',
    projectDescriptionLabel: 'Projektbeskrivning',
    projectDescriptionPlaceholder: 'Beskriv projektet och dina bidrag',
    describeRoleAndResponsibilities: 'Beskriv din roll och dina ansvarsområden i detta projekt',
    companyLabel: 'Företag',
    companyPlaceholder: 'Företagsnamn',
    locationLabel: 'Plats',
    locationPlaceholder: 'Projektplats',
    projectUrlLabel: 'Projekt-URL',
    projectUrlPlaceholder: 'https://projekt-webbplats.com',
    skillsLabel: 'Använda färdigheter',
    skillsPlaceholder: 't.ex. React, TypeScript, Node.js',
    addSkillButton: 'Lägg till färdighet',
    removeSkill: 'Ta bort färdighet',

    // Role Options
    softwareDeveloper: 'Mjukvaruutvecklare',
    projectManager: 'Projektledare',
    designer: 'Designer',
    analyst: 'Analytiker',
    consultant: 'Konsult',
    architect: 'Arkitekt',
    engineer: 'Ingenjör',
    developer: 'Utvecklare',

    // Actions
    updateProject: 'Uppdatera projekt',

    // Success Messages
    projectUpdated: 'Projekt uppdaterat',
    projectUpdatedDesc: 'har uppdaterats framgångsrikt',
    projectAdded: 'Projekt tillagt',
    projectAddedDesc: 'har lagts till i ditt CV',
  },
}

export const useFormTranslations = (language: FormLanguage = 'en') => {
  return formTranslations[language]
}
