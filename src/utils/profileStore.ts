'use client'

import { create } from 'zustand'
import { persist, type PersistStorage, type StorageValue } from 'zustand/middleware'
import type { SectionType, PersonalInformation, Profile } from '@/utils/types'
import { availabilityInformation } from '@/types/payloadTypes'

/* ============================================================
   🔐 Secure UTF-8 + XOR + Base64 helpers
============================================================ */

const STORAGE_KEY = process.env.NEXT_PUBLIC_STORAGE_KEY!

if (!STORAGE_KEY) {
  throw new Error('NEXT_PUBLIC_STORAGE_KEY is not defined')
}

const xorCipher = (data: Uint8Array, key: Uint8Array): Uint8Array =>
  data.map((byte, i) => byte ^ key[i % key.length]!)

const encodeSecure = (value: StorageValue<ProfileState>): string => {
  const json = JSON.stringify(value)
  const encoder = new TextEncoder()

  const data = encoder.encode(json)
  const key = encoder.encode(STORAGE_KEY)

  const encrypted = xorCipher(data, key)
  return btoa(String.fromCharCode(...encrypted))
}

const decodeSecure = (value: string): StorageValue<ProfileState> => {
  const binary = Uint8Array.from(atob(value), (c) => c.charCodeAt(0))
  const key = new TextEncoder().encode(STORAGE_KEY)

  const decrypted = xorCipher(binary, key)
  const json = new TextDecoder().decode(decrypted)

  return JSON.parse(json)
}

/* ============================================================
   🔒 Typed secure PersistStorage
============================================================ */

const secureStorage: PersistStorage<ProfileState> = {
  getItem: (name) => {
    const stored = localStorage.getItem(name)
    if (!stored) return null

    try {
      return decodeSecure(stored)
    } catch {
      return null
    }
  },

  setItem: (name, value) => {
    const encoded = encodeSecure(value)
    localStorage.setItem(name, encoded)
  },

  removeItem: (name) => {
    localStorage.removeItem(name)
  },
}

/* ============================================================
   🧠 Zustand Store (LOGIC UNCHANGED)
============================================================ */

interface ProfileState {
  currentProfile: Profile | null
  isEditing: boolean

  projectDetails: Profile['profileDetails']['projects']
  skills: Profile['profileDetails']['skills']
  references: Profile['profileDetails']['references']
  certifications: Profile['profileDetails']['certifications']
  employers: Profile['profileDetails']['employers']
  education: Profile['profileDetails']['education']
  languages: Profile['profileDetails']['languages']
  personalInformation: PersonalInformation | null
  availabilityInformation: Profile['availabilityInformation'] | null
  profileLanguage: string | null

  hasChanges: boolean
  isInitialized: boolean
  setResumeFile: null

  initializeFromApi: (profile: Profile | null) => void
  markAsInitialized: () => void
  resetChanges: () => void

  setProfile: (profile: Profile | null, isUserEdit?: boolean) => void
  setIsEditing: (editing: boolean, isUserEdit?: boolean) => void
  setProjectDetails: (
    details: Profile['profileDetails']['projects'],
    isUserEdit?: boolean,
  ) => void
  setSkills: (skills: Profile['profileDetails']['skills'], isUserEdit?: boolean) => void
  setReferences: (
    references: Profile['profileDetails']['references'],
    isUserEdit?: boolean,
  ) => void
  setCertifications: (
    certifications: Profile['profileDetails']['certifications'],
    isUserEdit?: boolean,
  ) => void
  setEmployers: (
    employers: Profile['profileDetails']['employers'],
    isUserEdit?: boolean,
  ) => void
  setEducation: (
    education: Profile['profileDetails']['education'],
    isUserEdit?: boolean,
  ) => void
  setLanguages: (
    languages: Profile['profileDetails']['languages'],
    isUserEdit?: boolean,
  ) => void
  setPersonalInformation: (info: PersonalInformation | null, isUserEdit?: boolean) => void
  setProfileLanguage: (language: string | null, isUserEdit?: boolean) => void

  removeItem: (type: SectionType, id: string, isUserEdit?: boolean) => void
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      setResumeFile: null,
      currentProfile: null,
      isEditing: false,
      hasChanges: false,
      isInitialized: false,

      projectDetails: [],
      skills: [],
      references: [],
      certifications: [],
      employers: [],
      education: [],
      languages: [],
      personalInformation: null,
      profileLanguage: null,
      availabilityInformation: null,

      initializeFromApi: (profile) => {
        set({
          currentProfile: profile,
          projectDetails: profile?.profileDetails?.projects || [],
          skills: profile?.profileDetails?.skills || [],
          references: profile?.profileDetails?.references || [],
          certifications: profile?.profileDetails?.certifications || [],
          employers: profile?.profileDetails?.employers || [],
          education: profile?.profileDetails?.education || [],
          languages: profile?.profileDetails?.languages || [],
          personalInformation: profile?.personalInformation || null,
          profileLanguage: profile?.language || null,
          availabilityInformation: profile?.availabilityInformation || null,
          hasChanges: false,
          isInitialized: true,
        })
      },

      markAsInitialized: () => set({ isInitialized: true }),
      resetChanges: () => set({ hasChanges: false }),

      setProfile: (profile, isUserEdit = false) => {
        set({
          currentProfile: profile,
          projectDetails: profile?.profileDetails?.projects || [],
          skills: profile?.profileDetails?.skills || [],
          references: profile?.profileDetails?.references || [],
          certifications: profile?.profileDetails?.certifications || [],
          employers: profile?.profileDetails?.employers || [],
          education: profile?.profileDetails?.education || [],
          languages: profile?.profileDetails?.languages || [],
          personalInformation: profile?.personalInformation || null,
          availabilityInformation: profile?.availabilityInformation || null,
          profileLanguage: profile?.language || null,
          hasChanges: get().hasChanges || isUserEdit,
          isInitialized: true,
        })
      },

      setIsEditing: (editing, isUserEdit = false) => {
        set({
          isEditing: editing,
          hasChanges: get().hasChanges || isUserEdit,
        })
      },

      setProjectDetails: (details, isUserEdit = false) => {
        set({
          projectDetails: [...details],
          hasChanges: get().hasChanges || isUserEdit,
        })
      },

      setSkills: (skills, isUserEdit = false) => {
        set({
          skills: [...skills],
          hasChanges: get().hasChanges || isUserEdit,
        })
      },

      setReferences: (references, isUserEdit = false) => {
        set({
          references: [...references],
          hasChanges: get().hasChanges || isUserEdit,
        })
      },

      setCertifications: (certifications, isUserEdit = false) => {
        set({
          certifications: [...certifications],
          hasChanges: get().hasChanges || isUserEdit,
        })
      },

      setEmployers: (employers, isUserEdit = false) => {
        set({
          employers: [...employers],
          hasChanges: get().hasChanges || isUserEdit,
        })
      },

      setEducation: (education, isUserEdit = false) => {
        set({
          education: [...education],
          hasChanges: get().hasChanges || isUserEdit,
        })
      },

      setLanguages: (languages, isUserEdit = false) => {
        set({
          languages: [...languages],
          hasChanges: get().hasChanges || isUserEdit,
        })
      },

      setPersonalInformation: (info, isUserEdit = false) => {
        set({
          personalInformation: info,
          hasChanges: get().hasChanges || isUserEdit,
        })
      },

      setProfileLanguage: (language, isUserEdit = false) => {
        set({
          profileLanguage: language,
          hasChanges: get().hasChanges || isUserEdit,
        })
      },

      removeItem: (type, id, isUserEdit = false) => {
        set((state) => {
          const newState = { ...state }

          switch (type) {
            case 'projectDetails':
              newState.projectDetails = state.projectDetails.filter((i) => i.id !== id)
              break
            case 'skills':
              newState.skills = state.skills.filter((i) => i.id !== id)
              break
            case 'references':
              newState.references = state.references.filter((i) => i.id !== id)
              break
            case 'certifications':
              newState.certifications = state.certifications.filter((i) => i.id !== id)
              break
            case 'employers':
              newState.employers = state.employers.filter((i) => i.id !== id)
              break
            case 'education':
              newState.education = state.education.filter((i) => i.id !== id)
              break
            case 'languages':
              newState.languages = state.languages.filter((i) => i.id !== id)
              break
          }

          return {
            ...newState,
            hasChanges: state.hasChanges || isUserEdit,
          }
        })
      },
    }),
    {
      name: 'profile-storage',
      storage: secureStorage,
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) => !['hasChanges', 'isInitialized'].includes(key),
          ),
        ) as ProfileState,
    },
  ),
)
