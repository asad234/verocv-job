"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import OnboardingModal from "@/components/onboarding/onboarding-modal-simple"

interface OnboardingProviderProps {
  children: React.ReactNode
}

export default function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { data: session, status, update } = useSession()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)
  const pathname = usePathname()
  const checkingRef = useRef(false)

  // Don't show onboarding on auth pages or admin pages
  const isAuthPage =
    pathname?.startsWith("/auth") ||
    pathname === "/register" ||
    pathname === "/login" ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/api")

  useEffect(() => {
    // Skip if loading, on auth pages, or already checked
    if (status === "loading" || isAuthPage || hasChecked) {
      return
    }

    // Check for new user flags from URL or session
    const urlParams = new URLSearchParams(window.location.search)
    const isNewUserFromUrl = urlParams.has("newUser") || urlParams.has("socialSignUp")
    const isNewUserFromSession = session?.user?.isNewUser

    console.log("OnboardingProvider: Checking conditions:", {
      isNewUserFromUrl,
      isNewUserFromSession,
      sessionExists: !!session,
      userId: session?.user?.id,
    })

    if (isNewUserFromUrl || isNewUserFromSession) {
      console.log("OnboardingProvider: New user detected - checking onboarding status")
      checkOnboardingStatus()
      // Clean up URL params
      const newUrl = window.location.pathname
      window.history.replaceState({}, "", newUrl)
      return
    }

    // For existing users, check onboarding status
    if (session?.user?.id && !isNewUserFromSession) {
      checkOnboardingStatus()
    } else {
      setHasChecked(true)
    }
  }, [session, status, isAuthPage, hasChecked, pathname])

  const checkOnboardingStatus = async () => {
    if (checkingRef.current) return

    try {
      checkingRef.current = true
      console.log("OnboardingProvider: Checking onboarding status for user:", session?.user?.id)

      // Add cache busting for testing
      const response = await fetch(
        "/api/user/onboarding-status?" +
        new URLSearchParams({
          t: Date.now().toString(), // Cache buster
          userId: session?.user?.id || "",
        }),
        {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      )

      if (!response.ok) {
        console.error("OnboardingProvider: Failed to check onboarding status:", response.status)
        return
      }

      const data = await response.json()
      console.log("OnboardingProvider: Onboarding status:", data)

      // Only show onboarding if user hasn't completed it
      if (!data.completed) {
        console.log("OnboardingProvider: User needs onboarding - showing modal")
        setShowOnboarding(true)
      } else {
        console.log("OnboardingProvider: User has completed onboarding")
        setShowOnboarding(false)
      }
    } catch (error) {
      console.error("OnboardingProvider: Error checking onboarding:", error)
    } finally {
      setHasChecked(true)
      checkingRef.current = false
    }
  }

  const handleOnboardingComplete = async () => {
    try {
      console.log("OnboardingProvider: Completing onboarding...")

      const response = await fetch("/api/user/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        const result = await response.json()
        console.log("OnboardingProvider: Onboarding completed successfully:", result)

        setShowOnboarding(false)

        // Update the session to clear the isNewUser flag
        await update()

        console.log("OnboardingProvider: Session updated to clear isNewUser flag")
      } else {
        console.error("OnboardingProvider: Failed to complete onboarding")
      }
    } catch (error) {
      console.error("OnboardingProvider: Error completing onboarding:", error)
    }
  }

  return (
    <>
      {children}
      {showOnboarding && <OnboardingModal isOpen={showOnboarding} onComplete={handleOnboardingComplete} />}
    </>
  )
}
