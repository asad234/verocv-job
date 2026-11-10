"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { usePersonalInformationMutations } from "@/hooks/personal-information/personalInformationMutations"
import { usePersonalInfoStore } from "@/hooks/personal-information/personalInformationStore"
import type { PersonalInformation, SocialLinks, NotificationPreferences } from "@/types/payloadTypes"



// Fixed interface name and added onCanProceed prop
interface PersonalInfoModalProps {
  userId: string
  onComplete: () => void
  onCanProceed: (canProceed: boolean) => void
}

export default function PersonalInfoModal({ userId, onComplete, onCanProceed }: PersonalInfoModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Use the same hooks as your account settings
  const { personalInfo, setPersonalInfo } = usePersonalInfoStore()
  const { createPersonalInformation, updatePersonalInformation, isCreating, isUpdating } =
    usePersonalInformationMutations()

  // Initialize form data exactly like your account settings
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
    recoveryEmail: "",
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

  // Initialize form data when personalInfo is available (same as account settings)
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
        personalPresentation: personalInfo.personalPresentation || "", // Declared variable here
        privateEmail: personalInfo.privateEmail || "",
        workEmail: personalInfo.workEmail || "",
        recoveryEmail: personalInfo.recoveryEmail || "",
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
    }
  }, [personalInfo, userId])

  // Same input handlers as account settings
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleGenderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, gender: e.target.value as "male" | "female" | "other" })
  }

  const handleSocialLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSocialLinks({ ...socialLinks, [name]: value })
  }

  const handleNotificationPrefChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setNotificationPrefs({ ...notificationPrefs, [name]: checked })
  }

  // Check if required fields are filled
  const isFormValid = !!(formData.firstName && formData.lastName && formData.privateEmail)

  // Call onCanProceed when form validity changes
  useEffect(() => {
    onCanProceed(isFormValid)
  }, [isFormValid, onCanProceed])

  // Save function exactly like your account settings
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    setIsLoading(true)
    const toastId = toast.loading("Saving personal information...")

    try {
      // Combine all data like in account settings
      const updatedInfo = {
        ...formData,
        user: Number.parseInt(userId, 10),
        socialLinks: socialLinks,
        notificationPreferences: notificationPrefs,
      }

      console.log("Saving personal information:", updatedInfo)

      let response
      if (personalInfo?.id) {
        // Update existing (like account settings)
        response = await updatePersonalInformation(updatedInfo)
      } else {
        // Create new
        response = await createPersonalInformation(updatedInfo)
      }

      if (response) {
        // Update store like account settings
        if (response.updated) {
          setPersonalInfo(response.updated)
        } else if (response.created) {
          setPersonalInfo(response.created)
        } else {
          setPersonalInfo(response)
        }

        toast.success("Personal information saved successfully!", { id: toastId })
        onComplete()
      } else {
        toast.error("Failed to save personal information", { id: toastId })
      }
    } catch (error) {
      console.error("Error saving personal info:", error)
      toast.error("Failed to save personal information. Please try again.", { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }

  const loading = isLoading || isCreating || isUpdating

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Personal Information</h2>
        <p className="text-gray-600">Please fill in your basic information. Fields marked with * are required.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information - same layout as account settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="Enter your first name"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Enter your last name"
              required
              className="mt-1"
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="privateEmail">Private Email *</Label>
            <Input
              id="privateEmail"
              name="privateEmail"
              type="email"
              value={formData.privateEmail}
              onChange={handleInputChange}
              placeholder="your.email@example.com"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="workEmail">Work Email</Label>
            <Input
              id="workEmail"
              name="workEmail"
              type="email"
              value={formData.workEmail}
              onChange={handleInputChange}
              placeholder="work.email@company.com"
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder="+46 70 123 45 67"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="workPhoneNumber">Work Phone</Label>
            <Input
              id="workPhoneNumber"
              name="workPhoneNumber"
              type="tel"
              value={formData.workPhoneNumber}
              onChange={handleInputChange}
              placeholder="+46 8 123 45 67"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="recoveryEmail">Recovery Email</Label>
          <Input
            id="recoveryEmail"
            name="recoveryEmail"
            type="email"
            value={formData.recoveryEmail}
            onChange={handleInputChange}
            placeholder="recovery@example.com"
            className="mt-1"
          />
        </div>

        {/* Personal Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Gender</Label>
            <div className="flex gap-6 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === "male"}
                  onChange={handleGenderChange}
                  className="text-blue-600"
                />
                Male
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === "female"}
                  onChange={handleGenderChange}
                  className="text-blue-600"
                />
                Female
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="gender"
                  value="other"
                  checked={formData.gender === "other"}
                  onChange={handleGenderChange}
                  className="text-blue-600"
                />
                Other
              </label>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="homeAddress">Home Address</Label>
          <Input
            id="homeAddress"
            name="homeAddress"
            value={formData.homeAddress}
            onChange={handleInputChange}
            placeholder="Storgatan 1, 111 22 Stockholm"
            className="mt-1"
          />
        </div>

        {/* Professional Information */}
        <div>
          <Label htmlFor="title">Professional Title</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g., Software Engineer, Marketing Manager"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="professionalPresentation">Professional Summary</Label>
          <Textarea
            id="professionalPresentation"
            name="professionalPresentation"
            value={formData.professionalPresentation}
            onChange={handleInputChange}
            placeholder="Brief description of your professional background and expertise"
            rows={3}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="personalPresentation">Personal Bio</Label>
          <Textarea
            id="personalPresentation"
            name="personalPresentation"
            value={formData.personalPresentation}
            onChange={handleInputChange}
            placeholder="Tell us about your interests, hobbies, or anything you'd like to share"
            rows={3}
            className="mt-1"
          />
        </div>

        {/* Social Links */}
        <div>
          <Label className="text-base font-medium">Social Links</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <Label htmlFor="linkedIn" className="text-sm">
                LinkedIn
              </Label>
              <Input
                id="linkedIn"
                name="linkedIn"
                value={socialLinks.linkedIn}
                onChange={handleSocialLinkChange}
                placeholder="https://linkedin.com/in/yourprofile"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="gitHub" className="text-sm">
                GitHub
              </Label>
              <Input
                id="gitHub"
                name="gitHub"
                value={socialLinks.gitHub}
                onChange={handleSocialLinkChange}
                placeholder="https://github.com/yourusername"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="x" className="text-sm">
                X (Twitter)
              </Label>
              <Input
                id="x"
                name="x"
                value={socialLinks.x}
                onChange={handleSocialLinkChange}
                placeholder="https://x.com/yourusername"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="website" className="text-sm">
                Website
              </Label>
              <Input
                id="website"
                name="website"
                value={socialLinks.website}
                onChange={handleSocialLinkChange}
                placeholder="https://yourwebsite.com"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div>
          <Label className="text-base font-medium">Notification Preferences</Label>
          <div className="space-y-3 mt-2">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="emailNotifications"
                checked={notificationPrefs.emailNotifications}
                onChange={handleNotificationPrefChange}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Email notifications</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="pushNotifications"
                checked={notificationPrefs.pushNotifications}
                onChange={handleNotificationPrefChange}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Push notifications</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="smsNotifications"
                checked={notificationPrefs.smsNotifications}
                onChange={handleNotificationPrefChange}
                className="rounded border-gray-300"
              />
              <span className="text-sm">SMS notifications</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t">
          <Button type="submit" disabled={!isFormValid || loading} size="lg" className="min-w-32">
            {loading ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </form>
    </div>
  )
}
