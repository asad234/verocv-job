import { create } from 'zustand'

// Types for tracking changes
export type SectionType =
  | 'personalInfo'
  | 'projects'
  | 'projectDetails' // legacy
  | 'skills'
  | 'references'
  | 'certifications'
  | 'experience'
  | 'employers' // legacy
  | 'education'
  | 'languages'

interface ChangesState {
  added: Record<SectionType, string[]>
  edited: Record<SectionType, string[]>
  deleted: Record<SectionType, string[]>
}

interface ChangesStoreState {
  changes: ChangesState
  hasUnsavedChanges: boolean
  setHasUnsavedChanges: (value: boolean) => void
  markItemAsAdded: (section: SectionType, id: string) => void
  addChange: (section: SectionType, id: string) => void
  editChange: (section: SectionType, id: string) => void
  deleteChange: (section: SectionType, id: string) => void
  removeChange: (section: SectionType, id: string) => void
  resetChanges: () => void
  resetAllChanges: () => void
}

// Create a deep clone function for the initial state
const getInitialChangesState = (): ChangesState => ({
  added: {
    personalInfo: [],
    projectDetails: [],
    skills: [],
    references: [],
    certifications: [],
    employers: [],
    education: [],
    languages: [],
    projects: [],
    experience: [],
  },
  edited: {
    personalInfo: [],
    projectDetails: [],
    skills: [],
    references: [],
    certifications: [],
    employers: [],
    education: [],
    languages: [],
    projects: [],
    experience: [],
  },
  deleted: {
    personalInfo: [],
    projectDetails: [],
    skills: [],
    references: [],
    certifications: [],
    employers: [],
    education: [],
    languages: [],
    projects: [],
    experience: [],
  },
})

export const useChangesStore = create<ChangesStoreState>((set, get) => ({
  changes: getInitialChangesState(),
  hasUnsavedChanges: false,

  setHasUnsavedChanges: (value) => {
    set({ hasUnsavedChanges: value })
  },

  // Alias for addChange - marks an item as newly added
  markItemAsAdded: (section: SectionType, id: string) => {
    get().addChange(section, id)
  },

  addChange: (section, id) => {
    set((state) => {
      const newChanges = { ...state.changes }
      newChanges.added[section] = [...newChanges.added[section]] // Ensure array is new reference
      if (!newChanges.added[section].includes(id)) {
        newChanges.added[section].push(id)
      }
      const hasChanges =
        Object.values(newChanges.added).some((arr) => arr.length > 0) ||
        Object.values(newChanges.edited).some((arr) => arr.length > 0) ||
        Object.values(newChanges.deleted).some((arr) => arr.length > 0)
      return { changes: newChanges, hasUnsavedChanges: hasChanges }
    })
  },

  editChange: (section, id) => {
    set((state) => {
      const newChanges = { ...state.changes }
      newChanges.edited[section] = [...newChanges.edited[section]] // Ensure array is new reference
      if (!newChanges.added[section].includes(id) && !newChanges.edited[section].includes(id)) {
        newChanges.edited[section].push(id)
      }
      const hasChanges =
        Object.values(newChanges.added).some((arr) => arr.length > 0) ||
        Object.values(newChanges.edited).some((arr) => arr.length > 0) ||
        Object.values(newChanges.deleted).some((arr) => arr.length > 0)
      return { changes: newChanges, hasUnsavedChanges: hasChanges }
    })
  },

  deleteChange: (section, id) => {
    set((state) => {
      const newChanges = { ...state.changes }

      // Create new arrays to ensure state updates
      newChanges.added[section] = [...newChanges.added[section]]
      newChanges.edited[section] = [...newChanges.edited[section]]
      newChanges.deleted[section] = [...newChanges.deleted[section]]

      const addedIndex = newChanges.added[section].indexOf(id)
      if (addedIndex !== -1) {
        newChanges.added[section].splice(addedIndex, 1)
      } else {
        const editedIndex = newChanges.edited[section].indexOf(id)
        if (editedIndex !== -1) {
          newChanges.edited[section].splice(editedIndex, 1)
        }
        if (!newChanges.deleted[section].includes(id)) {
          newChanges.deleted[section].push(id)
        }
      }

      const hasChanges =
        Object.values(newChanges.added).some((arr) => arr.length > 0) ||
        Object.values(newChanges.edited).some((arr) => arr.length > 0) ||
        Object.values(newChanges.deleted).some((arr) => arr.length > 0)

      return { changes: newChanges, hasUnsavedChanges: hasChanges }
    })
  },

  removeChange: (section, id) => {
    set((state) => {
      const newChanges = { ...state.changes }

      // Create new arrays to ensure state updates
      newChanges.added[section] = [...newChanges.added[section]]
      newChanges.edited[section] = [...newChanges.edited[section]]
      newChanges.deleted[section] = [...newChanges.deleted[section]]

      const addedIndex = newChanges.added[section].indexOf(id)
      if (addedIndex !== -1) newChanges.added[section].splice(addedIndex, 1)

      const editedIndex = newChanges.edited[section].indexOf(id)
      if (editedIndex !== -1) newChanges.edited[section].splice(editedIndex, 1)

      const deletedIndex = newChanges.deleted[section].indexOf(id)
      if (deletedIndex !== -1) newChanges.deleted[section].splice(deletedIndex, 1)

      const hasChanges =
        Object.values(newChanges.added).some((arr) => arr.length > 0) ||
        Object.values(newChanges.edited).some((arr) => arr.length > 0) ||
        Object.values(newChanges.deleted).some((arr) => arr.length > 0)

      return { changes: newChanges, hasUnsavedChanges: hasChanges }
    })
  },

  resetChanges: () => {
    set({
      changes: getInitialChangesState(),
      hasUnsavedChanges: false,
    })
  },

  resetAllChanges: () => {
    set({
      changes: getInitialChangesState(),
      hasUnsavedChanges: false,
    })
  },
}))

// Helper selectors remain the same
export const useAddedChanges = (section: SectionType) =>
  useChangesStore((state) => state.changes.added[section] || [])
export const useEditedChanges = (section: SectionType) =>
  useChangesStore((state) => state.changes.edited[section] || [])
export const useDeletedChanges = (section: SectionType) =>
  useChangesStore((state) => state.changes.deleted[section] || [])
export const useHasUnsavedChanges = () => useChangesStore((state) => state.hasUnsavedChanges)

// UI State Store
interface UIState {
  expandedSections: Record<SectionType, boolean>
  toggleSection: (section: SectionType) => void
  setAllSectionsCollapsed: () => void
  setAllSectionsExpanded: () => void
}

export const useUIStore = create<UIState>((set) => ({
  expandedSections: {
    personalInfo: false,
    projectDetails: false,
    skills: false,
    references: false,
    certifications: false,
    employers: false,
    education: false,
    languages: false,
    projects: false,
    experience: false,
  },
  toggleSection: (section) =>
    set((state) => ({
      expandedSections: {
        ...state.expandedSections,
        [section]: !state.expandedSections[section],
      },
    })),
  setAllSectionsCollapsed: () =>
    set({
      expandedSections: {
        personalInfo: false,
        projectDetails: false,
        skills: false,
        references: false,
        certifications: false,
        employers: false,
        education: false,
        languages: false,
        projects: false,
        experience: false,
      },
    }),
  setAllSectionsExpanded: () =>
    set({
      expandedSections: {
        personalInfo: false,
        projectDetails: false,
        skills: false,
        references: false,
        certifications: false,
        employers: false,
        education: false,
        languages: false,
        projects: false,
        experience: false,
      },
    }),
}))
