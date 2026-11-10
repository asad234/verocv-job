'use client'

import { create } from 'zustand'
import { persist, type PersistStorage, type StorageValue } from 'zustand/middleware'
import type { PersonalInformation, ProfileImage } from '@/types/payloadTypes'

/* ============================================================
   🔐 Secure UTF-8 + XOR + Base64 helpers
============================================================ */

const STORAGE_KEY = process.env.NEXT_PUBLIC_STORAGE_KEY!

if (!STORAGE_KEY) {
  throw new Error('NEXT_PUBLIC_STORAGE_KEY is not defined')
}

const xorCipher = (data: Uint8Array, key: Uint8Array): Uint8Array =>
  data.map((byte, i) => byte ^ key[i % key.length]!)

const encodeSecure = (value: StorageValue<PersonalInfoState>): string => {
  const json = JSON.stringify(value)

  const encoder = new TextEncoder()
  const data = encoder.encode(json)
  const key = encoder.encode(STORAGE_KEY)

  const encrypted = xorCipher(data, key)
  return btoa(String.fromCharCode(...encrypted))
}

const decodeSecure = (value: string): StorageValue<PersonalInfoState> => {
  const binary = Uint8Array.from(atob(value), (c) => c.charCodeAt(0))
  const key = new TextEncoder().encode(STORAGE_KEY)

  const decrypted = xorCipher(binary, key)
  const json = new TextDecoder().decode(decrypted)

  return JSON.parse(json)
}

/* ============================================================
   🔒 Typed secure PersistStorage
============================================================ */

const secureStorage: PersistStorage<PersonalInfoState> = {
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

interface PersonalInfoState {
  personalInfo: PersonalInformation | null | undefined
  isEditing: boolean
  hasChanges: boolean
  isInitialized: boolean

  initializeFromApi: (info: PersonalInformation | null | undefined) => void
  markAsInitialized: () => void
  resetChanges: () => void

  setPersonalInfo: (
    info: PersonalInformation | null | undefined,
    isUserEdit?: boolean,
  ) => void

  setIsEditing: (editing: boolean, isUserEdit?: boolean) => void
  setProfileImage: (image: ProfileImage, isUserEdit?: boolean) => void
}

export const usePersonalInfoStore = create<PersonalInfoState>()(
  persist(
    (set, get) => ({
      personalInfo: null,
      isEditing: false,
      hasChanges: false,
      isInitialized: false,

      initializeFromApi: (info) => {
        set({
          personalInfo: info,
          hasChanges: false,
          isInitialized: true,
        })
      },

      setProfileImage: (image, isUserEdit = false) => {
        const current = get().personalInfo
        if (!current) return

        set({
          personalInfo: {
            ...current,
            profileImage: image,
          },
          hasChanges: get().hasChanges || isUserEdit,
        })
      },

      markAsInitialized: () => set({ isInitialized: true }),
      resetChanges: () => set({ hasChanges: false }),

      setPersonalInfo: (info, isUserEdit = false) => {
        set({
          personalInfo: info,
          hasChanges: get().hasChanges || isUserEdit,
        })
      },

      setIsEditing: (editing, isUserEdit = false) => {
        set({
          isEditing: editing,
          hasChanges: get().hasChanges || isUserEdit,
        })
      },
    }),
    {
      name: 'personal-info-storage',
      storage: secureStorage,

      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) => !['hasChanges', 'isInitialized'].includes(key),
          ),
        ) as PersonalInfoState,
    },
  ),
)
