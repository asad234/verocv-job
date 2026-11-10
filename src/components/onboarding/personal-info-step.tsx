"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { usePersonalInformationMutations } from "@/hooks/personal-information/personalInformationMutations"
import { usePersonalInfoStore } from "@/hooks/personal-information/personalInformationStore"
import type { PersonalInformation } from "@/types/payloadTypes"

interface PersonalInfoStepProps {
  userId: string
  onComplete: () => void
}

export default function PersonalInfoStep({ userId, onComplete }: PersonalInfoStepProps) {
  const { updatePersonalInformation } = usePersonalInformationMutations()
  const { setPersonalInfo } = usePersonalInfoStore()
  const [isLoading, setIsLoading] = useState(false)

  // Initialize with empty strings, never null/undefined
  const [formData, setFormData] = useState<Partial<PersonalInformation>>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    homeAddress: "",
    dateOfBirth: "",
    gender: "other",
    title: "",
    professionalPresentation: "",
    personalPresentation: "",
    privateEmail: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value || "", // Ensure never null/undefined
    }))
  }

  const handleGenderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      gender: e.target.value as "male" | "female" | "other",
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Clear any cached data first
      console.log("Submitting personal info for user:", userId)
      console.log("Form data:", formData)

      // Validate session before submitting
      const sessionCheck = await fetch("/api/auth/session")
      if (!sessionCheck.ok) {
        throw new Error("Session expired. Please log in again.")
      }

      // Ensure all values are strings, never null
      const cleanData = {
        firstName: formData.firstName || "",
        lastName: formData.lastName || "",
        phoneNumber: formData.phoneNumber || "",
        workPhoneNumber: "",
        homeAddress: formData.homeAddress || "",
        dateOfBirth: formData.dateOfBirth || null, // Only this can be null for date
        gender: formData.gender || "other",
        title: formData.title || "",
        professionalPresentation: formData.professionalPresentation || "",
        personalPresentation: formData.personalPresentation || "",
        privateEmail: formData.privateEmail || "",
        workEmail: "",
        recoveryEmail: "",
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
      }

      // Use your existing personal-information API
      const response = await fetch("/api/personal-information", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache", // Prevent caching issues
        },
        body: JSON.stringify(cleanData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("API Error:", errorData)
        throw new Error(errorData.message || errorData.error || "Failed to save personal information")
      }

      const result = await response.json()
      console.log("Success:", result)
      setPersonalInfo(result.created)
      toast.success("Personal information saved!")
      onComplete()
    } catch (error) {
      console.error("Error saving personal info:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save personal information")
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = !!(formData.firstName && formData.lastName && formData.privateEmail)

  // Add this before the form JSX
  const debugInfo = {
    userId,
    formValid: isFormValid,
    firstName: formData.firstName || "EMPTY",
    lastName: formData.lastName || "EMPTY",
    email: formData.privateEmail || "EMPTY",
  }

  console.log("Form debug info:", debugInfo)

  return (
    <>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>
          Tell us a bit about yourself. This information will help us personalize your experience.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName || ""} // Ensure never null
                onChange={handleInputChange}
                placeholder="Enter your first name"
                className="placeholder:text-gray-400"
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName || ""} // Ensure never null
                onChange={handleInputChange}
                placeholder="Enter your last name"
                className="placeholder:text-gray-400"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="privateEmail">Email Address *</Label>
              <Input
                id="privateEmail"
                name="privateEmail"
                type="email"
                value={formData.privateEmail || ""} // Ensure never null
                onChange={handleInputChange}
                placeholder="Enter your email address"
                className="placeholder:text-gray-400"
                required
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber || ""} // Ensure never null
                onChange={handleInputChange}
                placeholder="Phone number"
                className="placeholder:text-gray-400"
              />
            </div>
          </div>


          <div>
            <Label htmlFor="homeAddress">Home Address</Label>
            <Input
              id="homeAddress"
              name="homeAddress"
              value={formData.homeAddress || ""} // Ensure never null
              onChange={handleInputChange}
              placeholder="Enter your home address"
              className="placeholder:text-gray-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth || ""} // Ensure never null
                onChange={handleInputChange}
                className="placeholder:text-gray-400"
              />
            </div>
            <div>
              <Label>Gender</Label>
              <div className="flex gap-4 mt-2">
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
            <Label htmlFor="title">Professional Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title || ""} // Ensure never null
              onChange={handleInputChange}
              placeholder="e.g., Software Engineer, Marketing Manager"
              className="placeholder:text-gray-400"
            />
          </div>

          <div>
            <Label htmlFor="professionalPresentation">Professional Summary</Label>
            <Textarea
              id="professionalPresentation"
              name="professionalPresentation"
              value={formData.professionalPresentation || ""} // Ensure never null
              onChange={handleInputChange}
              placeholder="Brief description of your professional background and expertise"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="personalPresentation">Personal Bio</Label>
            <Textarea
              id="personalPresentation"
              name="personalPresentation"
              value={formData.personalPresentation || ""} // Ensure never null
              onChange={handleInputChange}
              placeholder="Tell us about your interests, hobbies, or anything you'd like to share"
              rows={3}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={!isFormValid || isLoading} className="w-full max-w-sm">
              {isLoading ? "Saving..." : "Continue"}
            </Button>
          </div>
        </form>
      </CardContent>
    </>
  )
}
