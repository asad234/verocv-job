'use client'

// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  same place as your current useEmploymentDetails hook (replace it)
// WHAT IT DOES:   Same hook, same return values ({ details, isLoading, isError,
//                 saveDetails, mutate, updateField, clearDetails }) — now using
//                 /api/user/employment-details (GET / PUT / DELETE) instead of
//                 Payload's /api/employment-details, which is locked down.
//                 Shares its SWR cache with useUserEmploymentDetails.
// ══════════════════════════════════════════════════════════════════════

import useSWR from 'swr'
import { toast } from 'sonner'
import type { EmploymentDetails } from '@/types/detailtsType'
import { useEmploymentDetailsStore } from '@/utils/employmentDetailtsStore'
import { useAuth } from '../auth'
import {
  EMPLOYMENT_DETAILS_KEY,
  fetchEmploymentDetails,
  toEmploymentRecord,
} from './useUserEmploymentDetails'

const FIELD_ERROR_TEXT: Record<string, string> = {
  required: 'is required',
  invalid: 'is not a valid date',
  number: 'must be a number',
  endBeforeStart: "can't be before the start date",
}

const showFieldErrors = (errors: Record<string, string>) => {
  Object.entries(errors).forEach(([field, code]) => {
    toast.error(`${field} ${FIELD_ERROR_TEXT[code] ?? code}`)
  })
}

export const useEmploymentDetails = (_user?: string) => {
  const { session } = useAuth()
  const userId = session?.user?.id

  const {
    details: storeDetails,
    isLoading: storeLoading,
    isError: storeError,
    setDetails,
    setLoading,
    setError,
    updateLastFetched,
    updateField,
  } = useEmploymentDetailsStore(userId)

  const { data, error, mutate } = useSWR<EmploymentDetails | null>(
    userId ? EMPLOYMENT_DETAILS_KEY : null,
    async (url: string) => toEmploymentRecord(await fetchEmploymentDetails(url), userId),
    {
      onSuccess: (doc) => {
        setDetails(doc ?? null)
        updateLastFetched()
        setLoading(false)
      },
      onError: (err) => {
        setError(true)
        setLoading(false)
        toast.error(err instanceof Error ? err.message : 'Failed to load employment details')
      },
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      dedupingInterval: 10000,
    },
  )

  const details = data ?? storeDetails ?? null
  const isLoading = (!error && data === undefined) || storeLoading
  const isError = Boolean(error) || storeError

  const saveDetails = async (
    detailsToSave: Partial<EmploymentDetails>,
  ): Promise<EmploymentDetails | null> => {
    if (!userId) {
      const errorMsg = 'User ID is required to save employment details'
      toast.error(errorMsg)
      throw new Error(errorMsg)
    }

    setLoading(true)
    setError(false)

    try {
      // The server works out the user from the login — no id/user needed.
      const {
        id: _id,
        user: _u,
        createdAt: _c,
        updatedAt: _up,
        ...fields
      } = { ...(details ?? {}), ...detailsToSave } as any

      const response = await fetch(EMPLOYMENT_DETAILS_KEY, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(fields),
      })
      const body = await response.json().catch(() => ({}))

      if (!response.ok) {
        const errorMessage = body.message || 'Failed to save employment details'
        if (body.errors && typeof body.errors === 'object') showFieldErrors(body.errors)
        else toast.error(errorMessage)
        throw new Error(errorMessage)
      }

      const completeData = toEmploymentRecord(body, userId)
      await mutate(completeData, false)
      setDetails(completeData)
      updateLastFetched()

      toast.success('Employment details saved successfully')
      return completeData
    } catch (err) {
      setError(true)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const clearDetails = async () => {
    if (!userId) return

    setLoading(true)
    setError(false)

    try {
      const response = await fetch(EMPLOYMENT_DETAILS_KEY, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to clear employment details')

      await mutate(null, false)
      setDetails(null)
      updateLastFetched()
      toast.success('Employment details cleared')
    } catch (err) {
      setError(true)
      toast.error(err instanceof Error ? err.message : 'Failed to clear employment details')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    details,
    isLoading,
    isError,
    saveDetails,
    mutate,
    updateField,
    clearDetails,
  }
}
