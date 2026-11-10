"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { SessionProvider, useSession } from "next-auth/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { DashboardProvider } from "@/context/DashbordContext"
import { TooltipProvider } from "@/components/ui/tooltip"
import PreLoader from "@/components/Common/PreLoader"
import OnboardingProvider from "@/components/layout/onboarding-provider"

import { useProfileStore } from "@/utils/profileStore"
import { usePersonalInfoStore } from "@/hooks/personal-information/personalInformationStore"
import { useUserProfileData } from "@/hooks/profile/useProfileData"
import { useUserPersonalInformation } from "@/hooks/personal-information/usePersonalInfoData"
import { convertDatesToObjects } from "../utils/dateConverter"
import { initPostHog } from "@/utils/post-hog-provider"

// Create queryClient once
const queryClient = new QueryClient()

function SessionWrapper({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const { data: session, status } = useSession()
  const pathname = usePathname()

  const resetProfileStore = useProfileStore((state) => state.resetChanges)
  const resetPersonalInfoStore = usePersonalInfoStore((state) => state.resetChanges)
  const setProfile = useProfileStore((state) => state.setProfile)
  const setPersonalInfo = usePersonalInfoStore((state) => state.setPersonalInfo)

  const userId = session?.user?.id ?? null
  const userRole = session?.user?.roles as string | undefined
  // admin and client are the only roles that actually use personal-information
  // and profiles — client-admin/client-manager use business-admin-info/
  // manager-info instead, so fetching these for them is pointless (always
  // 404s on personal-info) and, worse, feeds `null` into global stores that
  // other components may read as "onboarding incomplete" regardless of role.
  const usesPersonalInfo = userRole === 'admin' || userRole === 'client'
  const effectiveUserId = usesPersonalInfo ? userId : null

  const { profile, mutate: mutateProfile } = useUserProfileData(effectiveUserId, {
    revalidateOnMount: true,
    revalidateOnFocus: true,
  })

  const { personalInformation, mutate: mutatePersonal } = useUserPersonalInformation(effectiveUserId, {
    revalidateOnMount: true,
    revalidateOnFocus: true,
  })
  useEffect(() => {
    initPostHog();
  }, []);
  useEffect(() => {
    if (status === "unauthenticated") {
      resetProfileStore()
      resetPersonalInfoStore()
    }
  }, [status, resetProfileStore, resetPersonalInfoStore])

  useEffect(() => {
    const isEditPage = pathname?.includes('/edit/')
    if (isEditPage) return  // ProfileCreation handles store on edit pages

    if (profile) {
      const profileWithDates = convertDatesToObjects(profile)
      setProfile(profileWithDates)
    }
    if (personalInformation) {
      const personalWithDates = convertDatesToObjects(personalInformation)
      setPersonalInfo(personalWithDates)
    }
  }, [profile, personalInformation, setProfile, setPersonalInfo, pathname])
  const wrappedMutateProfile = async () => {
    const data = await mutateProfile()
    const isEditPage = window.location.pathname.includes('/edit/')
    if (data && !isEditPage) {
      const profileWithDates = convertDatesToObjects(data)
      setProfile(profileWithDates)
    }
    return data
  }

  const wrappedMutatePersonal = async () => {
    const data = await mutatePersonal()
    if (data) {
      const personalWithDates = convertDatesToObjects(data)
      setPersonalInfo(personalWithDates)
    }
    return data
  }

  useEffect(() => {
    const isEditPage = pathname?.includes('/edit/')
    if (userId && !isEditPage) {
      wrappedMutateProfile()
      wrappedMutatePersonal()
    }
  }, [pathname, userId])

  // Force refresh profile data when navigating to dashboard
  useEffect(() => {
    const isEditPage = pathname?.includes('/edit/')
    if (pathname?.includes("/dashboard") && userId && !isEditPage) {
      console.log("Dashboard navigation detected, refreshing profile data...")
      wrappedMutateProfile()
      wrappedMutatePersonal()
    }
  }, [pathname, userId])

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timeout)
  }, [])

  if (loading) {
    return <PreLoader />
  }

  return <OnboardingProvider>{children}</OnboardingProvider>
}
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionWrapper>
        <QueryClientProvider client={queryClient}>
          <DashboardProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </DashboardProvider>
        </QueryClientProvider>
      </SessionWrapper>
    </SessionProvider>
  )
}
