// hooks/profile/useProfileById.ts
// Fetches a single profile by its ID — used in the edit flow to ensure
// the correct profile is loaded regardless of how many profiles the user has.

'use client'

import useSWR from 'swr'
import { useCallback } from 'react'
import { convertDatesToObjects } from '@/utils/dateConverter'
import type { SingleProfileResponse } from '@/types/payloadTypes'

const fetchProfileById = async (url: string): Promise<SingleProfileResponse | null> => {
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  return convertDatesToObjects(data)
}

export const useProfileById = (profileId: string | number | null | undefined, options?: any) => {
  // Fetch the specific profile by ID using the PATCH route's id param pattern,
  // or a dedicated GET /api/profile/[id] if you have one.
  // Here we use the existing GET route with a where filter on id.
  const key = profileId ? `/api/profile/${profileId}` : null

  const { data, error, isLoading, mutate } = useSWR<SingleProfileResponse | null>(
    key,
    fetchProfileById,
    {
      dedupingInterval: 10000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
      refreshInterval: 0,
      ...options,
    },
  )

  return {
    profile: data ?? null,
    isLoading,
    error: error ?? null,
    mutate,
  }
}
