'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useUserPersonalInformation } from '@/hooks/personal-information/usePersonalInfoData'
import { useUserProfileData } from '@/hooks/profile/useProfileData'

interface OnboardingStatus {
  completed: boolean
  hasPersonalInfo: boolean
  hasProfile: boolean
  isLoading: boolean
}

export function useOnboardingStatus() {
  const { data: session, status } = useSession()
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>({
    completed: true, // Default to true to prevent flash
    hasPersonalInfo: false,
    hasProfile: false,
    isLoading: true,
  })

  // Use your existing hooks to check data
  const { personalInformation, isLoading: personalInfoLoading } = useUserPersonalInformation(
    session?.user?.id || null,
  )
  const { profile, isLoading: profileLoading } = useUserProfileData(session?.user?.id || null)

  useEffect(() => {
    if (status === 'loading' || !session?.user?.id) {
      setOnboardingStatus((prev) => ({ ...prev, isLoading: true }))
      return
    }

    if (personalInfoLoading || profileLoading) {
      return
    }

    // Check if user has completed onboarding by checking the API
    const checkOnboardingStatus = async () => {
      try {
        const response = await fetch('/api/user/onboarding-status')
        if (response.ok) {
          const data = await response.json()
          console.log('Onboarding API response:', data)

          setOnboardingStatus({
            completed: data.completed,
            hasPersonalInfo: data.hasPersonalInfo,
            hasProfile: data.hasProfile,
            isLoading: false,
          })
          return
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
      }

      // Fallback to local data check
      const hasPersonalInfo =
        !!personalInformation && !!personalInformation.firstName && !!personalInformation.lastName
      const hasProfile = !!profile && !!profile.id
      const completed = hasPersonalInfo // Only require personal info for now

      console.log('Onboarding status check (fallback):', {
        hasPersonalInfo,
        hasProfile,
        completed,
        personalInformation: personalInformation ? 'exists' : 'missing',
        profile: profile ? 'exists' : 'missing',
      })

      setOnboardingStatus({
        completed,
        hasPersonalInfo,
        hasProfile,
        isLoading: false,
      })
    }

    checkOnboardingStatus()
  }, [session, status, personalInformation, profile, personalInfoLoading, profileLoading])

  return onboardingStatus
}
