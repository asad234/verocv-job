'use client'

import useSWR from 'swr'
import { profilesApi } from '@/lib/api'
import type { SingleProfileResponse } from '@/types/payloadTypes'
import { useCallback } from 'react'
import { convertDatesToObjects } from '@/utils/dateConverter'

export const useUserProfileData = (userId: string | null, options?: any) => {
  const fetchUserProfile = useCallback(
    async (url: string) => {
      // Don't throw error for missing userId, just return null
      if (!userId) {
        console.log('useUserProfileData: No userId provided')
        return null
      }

      try {
        console.log('useUserProfileData: Fetching profile for user:', userId)
        const data = await profilesApi.getUserProfile(userId)

        if (!data) {
          console.log('useUserProfileData: No profile found for user:', userId)
          return null
        }

        const convertedData = convertDatesToObjects(data)
        console.log('useUserProfileData: Profile data converted successfully')
        return convertedData
      } catch (error) {
        console.error('useUserProfileData: Error fetching profile:', error)
        // Return null instead of throwing to prevent crashes
        return null
      }
    },
    [userId],
  )

  // Only create SWR key if userId exists
  const key = userId ? `/api/profile?where[user][equals]=${userId}&limit=1` : null

  const {
    data: profile,
    error,
    isLoading,
    mutate,
  } = useSWR<SingleProfileResponse | null>(key, fetchUserProfile, {
    dedupingInterval: 10000,
    revalidateOnFocus: false, // Reduce unnecessary requests
    revalidateOnReconnect: false,
    shouldRetryOnError: false, // Don't retry on errors
    refreshInterval: 0,
    ...options,
  })

  const wrappedMutate = useCallback(
    async (data?: any, shouldRevalidate = true) => {
      try {
        let result

        if (data) {
          const dataWithDates = convertDatesToObjects(data)
          result = await mutate(dataWithDates, shouldRevalidate)
        } else {
          result = await mutate()
        }

        return convertDatesToObjects(result)
      } catch (error) {
        console.error('useUserProfileData: Error in wrappedMutate:', error)
        return null
      }
    },
    [mutate],
  )

  return {
    profile,
    isLoading,
    error: error || null, // Ensure error is always defined
    mutate: wrappedMutate,
  }
}
