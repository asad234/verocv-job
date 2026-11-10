import type { EmploymentDetails } from '@/types/detailtsType'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type State = {
  id: string | undefined
  details: EmploymentDetails | null
  isLoading: boolean
  isError: boolean
  lastFetched: number | null
}

type Actions = {
  setDetails: (details: EmploymentDetails | null) => void
  updateDetails: (partial: Partial<EmploymentDetails>) => void // allow partial updates
  setLoading: (isLoading: boolean) => void
  setError: (isError: boolean) => void
  updateLastFetched: () => void
  clear: () => void
  updateField: <K extends keyof EmploymentDetails>(field: K, value: EmploymentDetails[K]) => void
}

const initialState: State = {
  id: undefined,
  details: null,
  isLoading: false,
  isError: false,
  lastFetched: null,
}

export const createEmploymentDetailsStore = (userId: string | null) =>
  create<State & Actions>()(
    persist(
      (set, get) => ({
        ...initialState,

        setDetails: (details) => set({ details, id: details?.id || undefined }),

        updateDetails: (partial) =>
          set((state) => {
            const updatedDetails = state.details
              ? { ...state.details, ...partial }
              : ({ ...partial } as EmploymentDetails)
            return {
              details: updatedDetails,
              id: updatedDetails.id || undefined,
            }
          }),

        setLoading: (isLoading) => set({ isLoading }),

        setError: (isError) => set({ isError }),

        updateLastFetched: () => set({ lastFetched: Date.now() }),

        clear: () => set(initialState),

        updateField: (field, value) => {
          const currentDetails = get().details
          if (currentDetails) {
            const updatedDetails = {
              ...currentDetails,
              [field]: value,
            }
            set({
              details: updatedDetails,
              id: updatedDetails.id || undefined,
            })
          } else {
            const newDetails = { user: '', [field]: value } as EmploymentDetails
            set({
              details: newDetails,
              id: newDetails.id || undefined,
            })
          }
        },
      }),
      {
        name: userId ? `employment-details-storage-${userId}` : 'employment-details-storage-guest',
        partialize: (state) => ({
          id: state.id,
          details: state.details,
          lastFetched: state.lastFetched,
        }),
      },
    ),
  )

const storeInstances = new Map<string, ReturnType<typeof createEmploymentDetailsStore>>()

export const useEmploymentDetailsStore = (userId?: string | null) => {
  const storeKey = userId || 'guest'

  if (!storeInstances.has(storeKey)) {
    storeInstances.set(storeKey, createEmploymentDetailsStore(userId || null))
  }

  return storeInstances.get(storeKey)!()
}
