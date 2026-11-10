"use client"
//Using as main onboarding modal
import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, FileText, CheckCircle } from "lucide-react"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import PersonalInfoModal from "./personal-info-modal-safe"
import ProfileCreationModal from "./profile-creation-step"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"
import { onboardingTranslations } from "@/utils/Onboardingtranslations"
interface OnboardingModalProps {
  isOpen: boolean
  onComplete: () => void
}

type OnboardingStep = "personal-info" | "profile-creation" | "complete"

export default function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const { data: session } = useSession()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("personal-info")

  const { t } = useDashboardTranslations() // or useDashboardTranslations()

  const userId = session?.user?.id

  const steps = [
    { id: "personal-info", title: "Personal Information", icon: User },
    { id: "profile-creation", title: "Create Profile", icon: FileText },
  ]

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep)

  const getProgress = () => {
    switch (currentStep) {
      case "personal-info":
        return 50 // 50% at personal info (step 1 of 2)
      case "profile-creation":
        return 100 // 100% at profile creation (step 2 of 2)
      case "complete":
        return 100 // 100% when complete
      default:
        return 0
    }
  }

  const progress = getProgress()

  const handlePersonalInfoComplete = () => {
    setCurrentStep("profile-creation")
  }

  const handleProfileComplete = () => {
    setCurrentStep("complete")
    toast.success("Profile created successfully!")
    setTimeout(() => {
      handleFinalComplete()
    }, 2000)
  }

  const handleFinalComplete = () => {
    toast.success("Welcome! Your account is nows set up.")
    onComplete()
  }

  const handleBack = () => {
    if (currentStep === "profile-creation") {
      setCurrentStep("personal-info")
    }
  }

  const getDialogTitle = () => {
    switch (currentStep) {
      case "personal-info":
        return "Personal Information Setup"
      case "profile-creation":
        return "Profile Creation"
      case "complete":
        return "Onboarding Complete"
      default:
        return "Account Setup"
    }
  }

  if (!userId) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => { }}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden p-0 gap-0 [&>[data-radix-dialog-close]]:hidden">
        <VisuallyHidden>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
        </VisuallyHidden>

        <div className="flex flex-col h-full max-h-[95vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 shrink-0">
            <div className="flex items-center space-x-4">
              {currentStep === "profile-creation" && (
                <Button variant="ghost" size="sm" onClick={handleBack} className="flex items-center">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t.onboardingWelcome}</h1>
                <p className="text-gray-600">
                  {currentStep === "complete"
                    ? "Setup Complete!"
                    : `Step ${currentStepIndex + 1} of ${steps.length}: ${steps[currentStepIndex]?.title}`}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4 bg-gray-50 border-b shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-500">{Math.round(progress)}% complete</span>
            </div>

            {/* Custom Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
              <div
                className="h-full bg-[rgb(5,22,80)] rounded-full transition-all duration-500 ease-in-out"
                style={{
                  width: `${progress}%`,
                  backgroundColor: 'rgb(5, 22, 80)',
                }}
              />
            </div>

            {/* Step indicators */}
            {currentStep !== "complete" && (
              <div className="flex justify-between mt-4">
                {steps.map((step, index) => {
                  const StepIcon = step.icon
                  const isActive = step.id === currentStep
                  const isCompleted = index < currentStepIndex

                  return (
                    <div key={step.id} className="flex flex-col items-center">
                      <div
                        className={`
                          w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-colors
                          ${isCompleted
                            ? "bg-green-500 text-white"
                            : isActive
                              ? "bg-[rgb(156,177,202)] text-white"
                              : "bg-gray-200 text-gray-500"
                          }
                        `}
                      >
                        <StepIcon className="w-4 h-4 text-[rgb(5,22,80)]" />
                      </div>
                      <span className={`text-xs font-medium ${isActive ? "text-[rgb(5,22,80)]" : "text-gray-500"}`}>
                        {step.title}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {currentStep === "personal-info" && (
              <PersonalInfoModal userId={userId} onComplete={handlePersonalInfoComplete} />
            )}

            {currentStep === "profile-creation" && (
              <ProfileCreationModal userId={userId} onComplete={handleProfileComplete} />
            )}

            {currentStep === "complete" && (
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to VeroCV! 🎉</h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Your account is now ready. You can always update your information and profile from your dashboard.
                </p>
                <Button onClick={handleFinalComplete} size="lg" className="w-full max-w-sm">
                  Go to Dashboard
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
