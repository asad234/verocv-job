"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

const AcceptInvitationPage = () => {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState<string>("")
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const token = searchParams.get("token")

    if (!token) {
      setStatus("error")
      setMessage("Invalid invitation link.")
      return
    }

    setStatus("loading")

    const validateToken = async () => {
      try {
        // Add a small delay to show loading state
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // Call the API to accept the invitation
        const response = await fetch("/api/invitations/accept", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (response.ok) {
          setStatus("success")
          setMessage(data.message || "Invitation accepted successfully! You can now access the platform.")
        } else {
          setStatus("error")
          setMessage(data.error || "Failed to process invitation. Please try again or contact support.")
        }
      } catch (error) {
        console.error("Error validating token:", error)
        setStatus("error")
        setMessage("Failed to process invitation. Please try again or contact support.")
      }
    }

    validateToken()
  }, [searchParams])

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl mb-4">Accept Invitation</h2>
        {status === "loading" && <p>Loading...</p>}
        {status === "success" && (
          <>
            <p className="text-green-500">{message}</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Go to Homepage
            </button>
          </>
        )}
        {status === "error" && <p className="text-red-500">{message}</p>}
      </div>
    </div>
  )
}

export default AcceptInvitationPage
