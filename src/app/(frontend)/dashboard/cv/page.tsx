// src/app/dashboard/cv/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export default function CVRouterPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkUserCVs = async () => {
      if (status === "loading") return

      if (status === "unauthenticated") {
        router.push("/login")
        return
      }

      if (!session?.user?.id) return

      try {
        // Check if user has any saved CVs
        const response = await fetch(`/api/cv?userId=${session.user.id}&limit=1`)
        const result = await response.json()

        if (response.ok && result.success) {
          // If user has CVs, redirect to manager page
          if (result.totalDocs > 0) {
            console.log(`User has ${result.totalDocs} CV(s), redirecting to manager`)
            router.replace("/dashboard/cvs")
          } else {
            // If no CVs exist, redirect to builder to create first CV
            console.log("User has no CVs, redirecting to builder")
            router.replace("/dashboard/cv/edit")
          }
        } else {
          console.error("Error fetching CVs:", result.error)
          // On error, default to builder
          router.replace("/dashboard/cv/edit")
        }
      } catch (error) {
        console.error("Error checking CVs:", error)
        // On error, default to builder
        router.replace("/dashboard/cv/edit")
      } finally {
        setIsChecking(false)
      }
    }

    checkUserCVs()
  }, [status, session?.user?.id, router])

  // Show loading state while checking
  return (
    <div className="container mx-auto py-8">
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-4 text-gray-500">Loading your CV workspace...</p>
      </div>
    </div>
  )
}
