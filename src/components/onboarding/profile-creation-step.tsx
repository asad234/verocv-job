"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText } from "lucide-react"
import ProfilePdfUploader from "@/components/onboarding/profileFileUploaderAi"
import { usePersonalInfoStore } from "@/hooks/personal-information/personalInformationStore"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useAuthTranslation } from "@/hooks/useAuthTranslation"
import { onboardingTranslations } from "@/utils/Onboardingtranslations"

interface ProfileCreationStepProps {
  userId: string
  onComplete: () => void
}

// ── Detect language of parsed CV text ────────────────────────────────────────
// Builds a single text sample from the most text-rich fields of the parsed data,
// then asks the /api/profile/detect-language endpoint to classify it.
async function detectCVLanguage(profileData: any): Promise<'sv' | 'en'> {
  try {
    // Collect a representative sample from the parsed profile
    const parts: string[] = []

    if (profileData.personalInfo?.professionalPresentation)
      parts.push(profileData.personalInfo.professionalPresentation)
    if (profileData.personalInfo?.personalPresentation)
      parts.push(profileData.personalInfo.personalPresentation)
    if (profileData.personalInfo?.title)
      parts.push(profileData.personalInfo.title)

    // Add first employer description
    const firstEmployer = (profileData.experience ?? profileData.employers ?? [])[0]
    if (firstEmployer?.description) parts.push(firstEmployer.description)

    // Add first project description
    const firstProject = (profileData.projects ?? [])[0]
    if (firstProject?.description) parts.push(firstProject.description)

    // Add first education description
    const firstEdu = (profileData.education ?? [])[0]
    if (firstEdu?.description) parts.push(firstEdu.description)

    const sample = parts.join(' ').slice(0, 600)
    if (!sample.trim()) return 'sv' // no text → default Swedish

    const res = await fetch('/api/profile/detect-language', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: sample }),
    })

    const data = await res.json()
    return data.language === 'en' ? 'en' : 'sv'
  } catch {
    return 'sv' // safe default on any error
  }
}

export default function ProfileCreationStep({ userId, onComplete }: ProfileCreationStepProps) {
  const [selectedMethod, setSelectedMethod] = useState<"upload" | "manual" | null>(null)
  const { setPersonalInfo } = usePersonalInfoStore()
  const router = useRouter()
  const { language } = useAuthTranslation('sv')
  const t = onboardingTranslations[language]

  const handleAIProfileFilled = async (profileData: any) => {
    try {
      if (profileData.firstName || profileData.lastName || profileData.title) {
        setPersonalInfo({
          firstName: profileData.firstName || "",
          lastName: profileData.lastName || "",
          title: profileData.title || "",
          user: Number(userId),
          id: "",
          createdAt: "",
          updatedAt: "",
          professionalPresentation: profileData.professionalPresentation || "",
          personalPresentation: profileData.personalPresentation || "",
        })
      }

      // ── Detect CV language before creating the profile ────────────────────
      toast.loading("Detecting CV language…", { id: "lang-detect" })
      const detectedLanguage = await detectCVLanguage(profileData)
      toast.dismiss("lang-detect")

      const cleanProfileData = {
        language: detectedLanguage,   // ← was hardcoded "en", now detected
        user: Number.parseInt(userId!, 10),
        personalInformation: {
          firstName: profileData.firstName || "",
          lastName: profileData.lastName || "",
          title: profileData.title || "",
          professionalPresentation: profileData.professionalPresentation || "",
          personalPresentation: profileData.personalPresentation || "",
          user: Number.parseInt(userId!, 10),
        },
        profileDetails: {
          projectDetails: (profileData.projects ?? []).map((project: any) => ({
            ...project,
            role: project.role || project.title || "Untitled Role",
            description: project.description || "No description provided",
            company: project.company || "",
            location: project.location || "",
            skills: project.skills || "",
            projectUrl: project.projectUrl || "",
            isCurrent: project.isCurrent || false,
            startDate: project.startDate || new Date(),
            endDate: project.endDate || null,
          })),
          skills: (profileData.skills ?? []).map((skill: any) => ({
            skillName: skill.skillName || skill.name || "Unknown Skill",
            skillRating: skill.skillRating || skill.rating || 3,
            skillYearsExperience: skill.skillYearsExperience || skill.experience || 1,
          })),
          languages: (profileData.languages ?? []).map((lang: any) => ({
            language: lang.language || lang.name || "Unknown Language",
            level: lang.level || "Intermediate",
          })),
          references: (profileData.references ?? []).map((ref: any) => ({
            firstName: ref.firstName || "Unknown",
            lastName: ref.lastName || "Reference",
            email: ref.email || "no-email@example.com",
            phoneNumber: ref.phoneNumber || "N/A",
            company: ref.company || "",
            positionTitle: ref.positionTitle || "Unknown Position",
            relationship: ref.relationship || "Professional Contact",
          })),
          certifications: (profileData.certifications ?? []).map((cert: any) => ({
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
          employers: (profileData.employers ?? profileData.experience ?? []).map((employer: any) => ({
            employer: employer.employer || employer.company || "Unknown Company",
            title: employer.title || employer.position || "Unknown Position",
            description: employer.description || "No description provided",
            link: employer.link || "",
            ongoing: employer.ongoing || employer.isCurrent || false,
            startDate: employer.startDate || new Date(),
            endDate: employer.endDate || null,
          })),
          education: (profileData.education ?? []).map((edu: any) => ({
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

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanProfileData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to save profile: ${errorData.error || response.statusText}`)
      }

      toast.success(
        `${t.profileCreatedSuccess} (${detectedLanguage === 'sv' ? 'Swedish' : 'English'} profile)`
      )
      onComplete()
      setTimeout(() => { window.location.href = "/dashboard/profile" }, 1500)

    } catch (error) {
      console.error("Error saving profile:", error)
      toast.error(`${t.profileProcessedFailed}: ${error instanceof Error ? error.message : t.somethingWentWrong}`)
    }
  }

  const handleManualCreation = async () => {
    try {
      const response = await fetch("/api/user/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (!response.ok) throw new Error(t.failedToCompleteOnboarding)
      toast.success(t.redirectingToProfile)
      onComplete()
      setTimeout(() => { window.location.href = "/dashboard/profile" }, 1000)
    } catch (error) {
      console.error("Error completing onboarding:", error)
      toast.error(t.somethingWentWrong)
    }
  }

  return (
    <div className="space-y-6">
      <CardHeader>
        <CardTitle>{t.createYourProfile}</CardTitle>
        <CardDescription>{t.chooseCreationMethod}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {!selectedMethod && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors"
              onClick={() => setSelectedMethod("upload")}
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t.uploadCVResume}</h3>
              <p className="text-sm text-gray-600">{t.uploadCVDescription}</p>
            </div>

            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 hover:bg-green-50 cursor-pointer transition-colors"
              onClick={() => setSelectedMethod("manual")}
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t.createManually}</h3>
              <p className="text-sm text-gray-600">{t.createManuallyDescription}</p>
            </div>
          </div>
        )}

        {selectedMethod === "upload" && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2">{t.uploadYourCV}</h3>
              <p className="text-gray-600 max-w-md mx-auto">{t.uploadCVInstructions}</p>
              {/* Language detection notice */}
              <p className="text-xs text-gray-400 mt-2">
                The language of your CV will be detected automatically (Swedish or English).
              </p>
            </div>
            <ProfilePdfUploader onProfileFilled={handleAIProfileFilled} />
            <div className="text-center">
              <Button variant="outline" onClick={() => setSelectedMethod(null)} className="w-full max-w-sm">
                {t.back}
              </Button>
            </div>
          </div>
        )}

        {selectedMethod === "manual" && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">{t.manualProfileCreation}</h3>
            <p className="text-gray-600 max-w-md mx-auto">{t.manualCreationInstructions}</p>
            <div className="space-y-3">
              <Button onClick={handleManualCreation} className="w-full max-w-sm" size="lg">
                {t.startManualCreation}
              </Button>
              <Button variant="outline" onClick={() => setSelectedMethod(null)} className="w-full max-w-sm">
                {t.back}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <div className="flex justify-between">
        <div className="text-sm text-muted-foreground">{t.stepOf}</div>
      </div>
    </div>
  )
}
