"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/auth"
import OnboardingFlow from "@/components/onboarding/onboarding-flow"
import PreLoader from "@/components/Common/PreLoader"

export default function OnboardingPage() {
  const { session, status } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    // Check if user has already completed onboarding
    const checkOnboardingStatus = async () => {
      try {
        const response = await fetch("/api/user/onboarding-status")
        if (!response.ok) return

        const data = await response.json()
        if (data.completed) {
          router.push("/dashboard")
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error)
      }
    }

    checkOnboardingStatus()
  }, [session, status, router])

  if (status === "loading") {
    return <PreLoader />
  }

  if (!session?.user?.id) {
    return null
  }

  return <OnboardingFlow userId={session.user.id} />
}
