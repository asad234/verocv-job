"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import PreLoader from "@/components/Common/PreLoader"
import OnboardingModal from "@/components/onboarding/onboarding-modal-simple"

export default function OnboardingPage() {
    const { data: session, status, update } = useSession()
    const router = useRouter()
    const [showOnboarding, setShowOnboarding] = useState(false)
    const [checking, setChecking] = useState(true)

    useEffect(() => {
        if (status === "loading") return

        if (!session) {
            router.push("/auth/signin")
            return
        }

        const checkOnboardingStatus = async () => {
            try {
                const response = await fetch("/api/user/onboarding-status")
                if (!response.ok) {
                    console.error("Failed to fetch onboarding status")
                    setChecking(false)
                    return
                }

                const data = await response.json()
                if (data.completed) {
                    router.push("/dashboard")
                } else {
                    setShowOnboarding(true)
                }
            } catch (error) {
                console.error("Error checking onboarding status:", error)
            } finally {
                setChecking(false)
            }
        }

        checkOnboardingStatus()
    }, [session, status, router])

    const handleOnboardingComplete = async () => {
        try {
            const response = await fetch("/api/user/complete-onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            })

            if (response.ok) {
                // Update session to clear isNewUser flag
                await update?.()
                router.push("/dashboard")
            } else {
                console.error("Failed to mark onboarding as complete")
            }
        } catch (error) {
            console.error("Error completing onboarding:", error)
        }
    }

    if (status === "loading" || checking) {
        return <PreLoader />
    }

    if (!session) {
        return null
    }

    return (
        <OnboardingModal
            isOpen={showOnboarding}
            onComplete={handleOnboardingComplete}
        />
    )
}
