"use client"
import { Button } from "@/components/ui/button"
import { generateMagicLink, generateToken } from "@/lib/magic-link"
import type React from "react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"

interface Invitation {
  id: string
  email: string
  firstName: string
  lastName: string
  status: "pending" | "accepted" | "declined" | "expired"
  dateSent: string
  token?: string
}

const Invitations = () => {
  const { t } = useDashboardTranslations()
  const [invitationForm, setInvitationForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
  })
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvitations()
  }, [])

  const fetchInvitations = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/invitations")
      if (response.ok) {
        const data = await response.json()
        setInvitations(data)
      } else {
        console.error("Failed to fetch invitations")
      }
    } catch (error) {
      console.error("Error fetching invitations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvitationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setInvitationForm({ ...invitationForm, [name]: value })
  }

  const sendInvitation = async () => {
    const toastId = toast.loading(t.sendingInvitation)
    try {
      // Generate a unique token for the magic link
      const token = generateToken()
      const magicLink = generateMagicLink(token)
      console.log("🚀 Starting invitation process:", {
        email: invitationForm.email,
        firstName: invitationForm.firstName,
        magicLink,
      })

      // Send via HTTP API
      console.log("📝 Creating invitation...")
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...invitationForm,
          token, // Include the token in the invitation
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error("❌ Invitation API error:", response.status, errorData)
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`)
      }

      const newInvitation = await response.json()
      console.log("✅ Invitation created:", newInvitation)

      // Send magic link email
      console.log("📧 Sending magic link email...")
      const emailResponse = await fetch("/api/send-magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: invitationForm.email,
          firstName: invitationForm.firstName,
          magicLink,
        }),
      })

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json().catch(() => ({ error: "Unknown error" }))
        console.error("❌ Email API error:", emailResponse.status, errorData)
        throw new Error(`Failed to send magic link email: ${errorData.error || "Unknown error"}`)
      }

      const emailResult = await emailResponse.json()
      console.log("✅ Email sent:", emailResult)

      // Refresh the invitation list instead of manually updating state
      await fetchInvitations()

      // Clear the form
      setInvitationForm({
        email: "",
        firstName: "",
        lastName: "",
      })

      toast.success(t.invitationSentSuccess, { id: toastId })
    } catch (error) {
      console.error("❌ Error sending invitation:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      toast.error(`${t.invitationSentError}: ${errorMessage}`, { id: toastId })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800"
      case "declined":
        return "bg-red-100 text-red-800"
      case "expired":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return t.statusPending
      case "accepted":
        return t.statusAccepted
      case "declined":
        return t.statusDeclined
      case "expired":
        return t.statusExpired
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">{t.sendInvitations}</h2>
        </div>

        {/* Invitation Form */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-4">{t.addInvite}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.emailLabel}</label>
              <input
                type="email"
                name="email"
                value={invitationForm.email}
                onChange={handleInvitationChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none transition-colors"
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                  e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = ''
                  e.currentTarget.style.borderColor = ''
                }}
                placeholder={t.emailPlaceholder}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.firstNameLabel}</label>
              <input
                type="text"
                name="firstName"
                value={invitationForm.firstName}
                onChange={handleInvitationChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none transition-colors"
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                  e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = ''
                  e.currentTarget.style.borderColor = ''
                }}
                placeholder={t.firstNamePlaceholder}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.lastNameLabel}</label>
              <input
                type="text"
                name="lastName"
                value={invitationForm.lastName}
                onChange={handleInvitationChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none transition-colors"
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                  e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = ''
                  e.currentTarget.style.borderColor = ''
                }}
                placeholder={t.lastNamePlaceholder}
              />
            </div>
          </div>
          <div className="mt-6">
            <button
              className="px-6 py-2 text-white transition-colors rounded-xl disabled:cursor-not-allowed"
              style={{
                backgroundColor: invitationForm.email.trim() ? 'rgb(5, 22, 80)' : 'rgba(5, 22, 80, 0.5)'
              }}
              onMouseEnter={(e) => {
                if (invitationForm.email.trim()) {
                  e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'
                }
              }}
              onMouseLeave={(e) => {
                if (invitationForm.email.trim()) {
                  e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'
                }
              }}
              onClick={sendInvitation}
              disabled={!invitationForm.email.trim()}
            >
              {t.sendInvitation}
            </button>
          </div>
        </div>

        {/* List of Sent Invitations */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-4">{t.recentInvitations}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {t.emailColumn}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {t.nameColumn}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {t.statusColumn}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {t.dateSentColumn}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      {t.loadingInvitations}
                    </td>
                  </tr>
                ) : invitations.length > 0 ? (
                  invitations.map((invitation) => (
                    <tr key={invitation.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invitation.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invitation.firstName} {invitation.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(invitation.status)}`}
                        >
                          {getStatusText(invitation.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invitation.dateSent).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      {t.noInvitationsSent}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Invitations
