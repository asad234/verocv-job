"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, FileText } from "lucide-react"
import { toast } from "sonner"
import { usePersonalInfoStore } from "@/hooks/personal-information/personalInformationStore"
import dynamic from "next/dynamic";

const ProfilePdfUploader = dynamic(
  () => import("@/components/onboarding/profileFileUploaderAi"),
  { ssr: false }
);

interface ProfileCreationModalProps {
  userId: string
  onComplete: () => void
}

export default function ProfileCreationModal({ userId, onComplete }: ProfileCreationModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<"upload" | "manual" | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingMessage, setProcessingMessage] = useState("")
  const { setPersonalInfo } = usePersonalInfoStore()

  const handleAIProfileFilled = async (profileData: any) => {
    try {
      setIsProcessing(true)
      setProcessingMessage("Saving your profile...")

      // Set personal information from the extracted data
      if (profileData.firstName || profileData.lastName || profileData.title) {
        setPersonalInfo({
          firstName: profileData.firstName || "",
          lastName: profileData.lastName || "",
          title: profileData.title || "",
          user: Number.parseInt(userId, 10),
          id: "",
          createdAt: "",
          updatedAt: "",
          professionalPresentation: profileData.professionalPresentation || "",
          personalPresentation: profileData.personalPresentation || "",
        })
      }

      // Clean and validate the profile data
      const cleanProfileData = {
        language: profileData.language || "en",
        user: Number.parseInt(userId, 10),
        personalInformation: {
          firstName: profileData.firstName || "",
          lastName: profileData.lastName || "",
          title: profileData.title || "",
          professionalPresentation: profileData.professionalPresentation || "",
          personalPresentation: profileData.personalPresentation || "",
          user: Number.parseInt(userId, 10),
        },
        profileDetails: {
          projectDetails: (profileData.projects || []).map((project: any) => ({
            ...project,
            role: project.role || "Untitled Role",
            description: project.description || "No description provided",
            company: project.company || "",
            location: project.location || "",
            skills: project.skills || "",
            projectUrl: project.projectUrl || "",
            isCurrent: project.isCurrent || false,
            startDate: project.startDate || new Date(),
            endDate: project.endDate || null,
          })),
          skills: (profileData.skills || []).map((skill: any) => ({
            ...skill,
            skillName: skill.skillName || skill.name || "Unknown Skill",
            skillRating: skill.skillRating || skill.rating || 3,
            skillYearsExperience: skill.skillYearsExperience || skill.experience || 1,
          })),
          languages: (profileData.languages || []).map((lang: any) => ({
            ...lang,
            language: lang.language || lang.name || "Unknown Language",
            level: lang.level || "Intermediate",
          })),
          references: (profileData.references || []).map((ref: any) => ({
            ...ref,
            firstName: ref.firstName || "Unknown",
            lastName: ref.lastName || "Reference",
            email: ref.email || "no-email@example.com",
            phoneNumber: ref.phoneNumber || "N/A",
            company: ref.company || "",
            positionTitle: ref.positionTitle || "Unknown Position",
            relationship: ref.relationship || "Professional Contact",
          })),
          certifications: (profileData.certifications || []).map((cert: any) => ({
            ...cert,
            type: cert.type || "certificate",
            title: cert.title || "Untitled Certification",
            issuer: cert.issuer || "Unknown Issuer",
            supplier: cert.supplier || "",
            description: cert.description || "",
            code: cert.code || "",
            link: cert.link || "",
            startDate: cert.startDate || new Date(),
            validDate: cert.validDate || null,
          })),
          employers: (profileData.employers || []).map((employer: any) => ({
            ...employer,
            employer: employer.employer || employer.company || "Unknown Company",
            title: employer.title || employer.position || "Unknown Position",
            description: employer.description || "No description provided",
            link: employer.link || "",
            ongoing: employer.ongoing || employer.isCurrent || false,
            startDate: employer.startDate || new Date(),
            endDate: employer.endDate || null,
          })),
          education: (profileData.education || []).map((edu: any) => ({
            ...edu,
            school: edu.school || edu.institution || "Unknown Institution",
            program: edu.program || edu.degree || edu.field || "Unknown Program",
            level: edu.level || "Bachelor's Degree",
            place: edu.place || edu.location || "Unknown Location",
            description: edu.description || "No description provided",
            link: edu.link || "",
            ongoing: edu.ongoing || edu.isCurrent || false,
            startDate: edu.startDate || new Date(),
            endDate: edu.endDate || null,
          })),
        },
      }

      console.log("Cleaned profile data:", cleanProfileData)

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanProfileData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Profile creation error:", errorData)
        throw new Error("Failed to save profile to database")
      }

      const result = await response.json()
      console.log("Profile created successfully:", result)

      toast.success("CV processed successfully! Redirecting to your profile...")

      // Complete onboarding first
      onComplete()

      // Then redirect to profile page after a short delay
      setTimeout(() => {
        window.location.href = "/dashboard/profile"
      }, 1500)
    } catch (error) {
      console.error("Error saving profile:", error)
      toast.error("Profile processed but failed to save. Please try again.")
      setIsProcessing(false)
    }
  }

  const handleManualCreation = async () => {
    try {
      // First complete the onboarding in the database
      const response = await fetch("/api/user/complete-onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to complete onboarding")
      }

      toast.success("Redirecting to profile page to build your profile manually...")

      // Call onComplete to update the UI state
      onComplete()

      // Redirect to profile page
      setTimeout(() => {
        window.location.href = "/dashboard/profile"
      }, 1000)
    } catch (error) {
      console.error("Error completing onboarding:", error)
      toast.error("Something went wrong. Please try again.")
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Create Your Profile</h2>
        <p className="text-gray-600">
          Choose how you&apos;d like to create your professional profile. You can upload your CV for AI assistance or
          create it manually.
        </p>
      </div>

      {!selectedMethod && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors"
            onClick={() => setSelectedMethod("upload")}
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Upload CV/Resume</h3>
            <p className="text-sm text-gray-600">Let our AI analyze your CV and create your profile automatically</p>
          </div>

          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 hover:bg-green-50 cursor-pointer transition-colors"
            onClick={() => setSelectedMethod("manual")}
          >
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Create Manually</h3>
            <p className="text-sm text-gray-600">Build your profile step by step with our guided form</p>
          </div>
        </div>
      )}

      {selectedMethod === "upload" && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-2">Upload Your CV</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Upload your CV in PDF format and our AI will extract your information to create a comprehensive profile.
            </p>
          </div>
          <ProfilePdfUploader onProfileFilled={handleAIProfileFilled} />
          <div className="text-center">
            <Button variant="outline" onClick={() => setSelectedMethod(null)} className="w-full max-w-sm">
              Back to Options
            </Button>
          </div>
        </div>
      )}

      {selectedMethod === "manual" && (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Manual Profile Creation</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              We&apos;ll guide you through creating your profile step by step. You can always come back and edit it
              later.
            </p>
          </div>
          <div className="space-y-3">
            <Button onClick={handleManualCreation} size="lg" className="w-full max-w-sm">
              Start Manual Creation
            </Button>
            <Button variant="outline" onClick={() => setSelectedMethod(null)} className="w-full max-w-sm">
              Back to Options
            </Button>
          </div>
        </div>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[9999]">
          <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-sm w-full relative">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-dashed border-t-blue-500 border-r-blue-500 animate-spin"></div>
              <div className="absolute inset-0 rounded-full border-4 border-dotted border-b-green-400 border-l-green-400 animate-spin-reverse"></div>
            </div>
            <p className="text-xl font-bold text-gray-800 mb-2">{processingMessage}</p>
            <p className="text-gray-600 text-sm">Please wait while we create your profile from your CV.</p>
          </div>
        </div>
      )}
    </div>
  )
}
