"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { usePersonalInformationMutations } from "@/hooks/personal-information/personalInformationMutations"
import { usePersonalInfoStore } from "@/hooks/personal-information/personalInformationStore"
import { useSession } from "next-auth/react"
import { useAuthTranslation } from "@/hooks/useAuthTranslation"
import { onboardingTranslations } from "@/utils/Onboardingtranslations"
import type { PersonalInformation, SocialLinks, NotificationPreferences } from "@/types/payloadTypes"

interface PersonalInfoModalProps {
  userId: string
  onComplete: () => void
}

export default function PersonalInfoModal({ userId, onComplete }: PersonalInfoModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { data: session } = useSession()
  const { language } = useAuthTranslation('sv')
  const t = onboardingTranslations[language]

  // Use the same hooks as your account settings
  const { personalInfo, setPersonalInfo } = usePersonalInfoStore()
  const { createPersonalInformation, updatePersonalInformation, isCreating, isUpdating } =
    usePersonalInformationMutations()

  // Get the user's registration email from session
  const registrationEmail = session?.user?.email || ""

  // Initialize form data with empty strings, never null/undefined
  const [formData, setFormData] = useState<PersonalInformation>({
    id: "",
    user: Number.parseInt(userId, 10) || 0,
    firstName: "",
    lastName: "",
    phoneNumber: "",
    workPhoneNumber: "",
    homeAddress: "",
    dateOfBirth: "",
    gender: "other",
    title: "",
    professionalPresentation: "",
    personalPresentation: "",
    privateEmail: "",
    workEmail: "",
    recoveryEmail: registrationEmail,
    createdAt: "",
    updatedAt: "",
    socialLinks: {
      linkedIn: "",
      x: "",
      gitHub: "",
      website: "",
    },
    notificationPreferences: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
    },
  })

  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    linkedIn: "",
    x: "",
    gitHub: "",
    website: "",
  })

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
  })

  // Initialize form data when personalInfo is available - ensure no null values
  useEffect(() => {
    if (personalInfo) {
      setFormData({
        id: personalInfo.id || "",
        user: personalInfo.user || Number.parseInt(userId, 10) || 0,
        firstName: personalInfo.firstName || "",
        lastName: personalInfo.lastName || "",
        phoneNumber: personalInfo.phoneNumber || "",
        workPhoneNumber: personalInfo.workPhoneNumber || "",
        homeAddress: personalInfo.homeAddress || "",
        dateOfBirth: personalInfo.dateOfBirth || "",
        gender: personalInfo.gender || "other",
        title: personalInfo.title || "",
        professionalPresentation: personalInfo.professionalPresentation || "",
        personalPresentation: personalInfo.personalPresentation || "",
        privateEmail: personalInfo.privateEmail || "",
        workEmail: personalInfo.workEmail || "",
        recoveryEmail: personalInfo.recoveryEmail || registrationEmail,
        createdAt: personalInfo.createdAt || "",
        updatedAt: personalInfo.updatedAt || "",
        socialLinks: personalInfo.socialLinks || {
          linkedIn: "",
          x: "",
          gitHub: "",
          website: "",
        },
        notificationPreferences: personalInfo.notificationPreferences || {
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
        },
      })

      setSocialLinks(
        personalInfo.socialLinks || {
          linkedIn: "",
          x: "",
          gitHub: "",
          website: "",
        },
      )

      setNotificationPrefs(
        personalInfo.notificationPreferences || {
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
        },
      )
    } else {
      setFormData((prev) => ({
        ...prev,
        recoveryEmail: registrationEmail,
      }))
    }
  }, [personalInfo, userId, registrationEmail])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === "recoveryEmail") return
    setFormData({ ...formData, [name]: value || "" })
  }

  const handleGenderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, gender: e.target.value as "male" | "female" | "other" })
  }

  const handleSocialLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSocialLinks({ ...socialLinks, [name]: value || "" })
  }

  const handleNotificationPrefChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setNotificationPrefs({ ...notificationPrefs, [name]: checked })
  }

  const isFormValid = !!(formData.firstName && formData.lastName && formData.privateEmail)

  const sendVerificationEmails = async () => {
    try {
      console.log('Sending verification emails...')
      const response = await fetch('/api/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        console.log('✅ Verification emails sent successfully')
        toast.success(
          language === 'en'
            ? 'Verification emails sent! Please check your inbox.'
            : 'Verifieringsmejl skickade! Kontrollera din inkorg.',
        )
      } else {
        console.error('Failed to send verification emails')
      }
    } catch (error) {
      console.error('Error sending verification emails:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    setIsLoading(true)
    const toastId = toast.loading(t.saving)

    try {
      const updatedInfo = {
        ...formData,
        user: Number.parseInt(userId, 10),
        socialLinks: socialLinks,
        notificationPreferences: notificationPrefs,
        firstName: formData.firstName || "",
        lastName: formData.lastName || "",
        phoneNumber: formData.phoneNumber || "",
        workPhoneNumber: formData.workPhoneNumber || "",
        homeAddress: formData.homeAddress || "",
        title: formData.title || "",
        professionalPresentation: formData.professionalPresentation || "",
        personalPresentation: formData.personalPresentation || "",
        privateEmail: formData.privateEmail || "",
        workEmail: formData.workEmail || "",
        recoveryEmail: registrationEmail,
      }

      console.log("Saving personal information:", updatedInfo)

      let response
      if (personalInfo?.id) {
        response = await updatePersonalInformation(updatedInfo)
      } else {
        response = await createPersonalInformation(updatedInfo)
      }

      if (response) {
        if (response.updated) {
          setPersonalInfo(response.updated)
        } else if (response.created) {
          setPersonalInfo(response.created)
        } else {
          setPersonalInfo(response)
        }

        toast.success(language === 'en' ? "Personal information saved successfully!" : "Personlig information sparad framgångsrikt!", { id: toastId })

        // Send verification emails after successful save
        await sendVerificationEmails()

        onComplete()
      } else {
        toast.error(language === 'en' ? "Failed to save personal information" : "Misslyckades att spara personlig information", { id: toastId })
      }
    } catch (error) {
      console.error("Error saving personal info:", error)
      toast.error(language === 'en' ? "Failed to save personal information. Please try again." : "Misslyckades att spara personlig information. Försök igen.", { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }

  const loading = isLoading || isCreating || isUpdating

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{t.personalInformation}</h2>
        <p className="text-gray-600">
          {t.fillBasicInfo} <span className="text-red-700">*</span> {t.areRequired}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">{t.firstName} <span className="text-red-500">*</span></Label>
            <Input
              id="firstName"
              name="firstName"
              value={formData.firstName || ""}
              onChange={handleInputChange}
              placeholder={t.firstNamePlaceholder}
              required
              className="mt-1 placeholder:text-gray-400"
            />
          </div>
          <div>
            <Label htmlFor="lastName">{t.lastName} <span className="text-red-500">*</span></Label>
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName || ""}
              onChange={handleInputChange}
              placeholder={t.lastNamePlaceholder}
              required
              className="mt-1 placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="privateEmail">{t.privateEmail} <span className="text-red-500">*</span></Label>
            <Input
              id="privateEmail"
              name="privateEmail"
              type="email"
              value={formData.privateEmail || ""}
              onChange={handleInputChange}
              placeholder={t.privateEmailPlaceholder}
              required
              className="mt-1 placeholder:text-gray-400"
            />
          </div>
          <div>
            <Label htmlFor="phoneNumber">{t.phoneNumber}</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber || ""}
              onChange={handleInputChange}
              placeholder={t.phoneNumberPlaceholder}
              className="mt-1 placeholder:text-gray-400"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="recoveryEmail">{t.recoveryEmail}</Label>
          <Input
            id="recoveryEmail"
            name="recoveryEmail"
            type="email"
            value={registrationEmail}
            disabled={true}
            className="mt-1 bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed"
            placeholder={registrationEmail}
          />
          <p className="text-xs text-gray-500 mt-1">
            {t.recoveryEmailNote}
          </p>
        </div>

        <div className="flex justify-end pt-6 border-t">
          <Button type="submit" disabled={!isFormValid || loading} size="lg" className="min-w-32">
            {loading ? t.saving : t.saveContinue}
          </Button>
        </div>
      </form>
    </div>
  )
}
