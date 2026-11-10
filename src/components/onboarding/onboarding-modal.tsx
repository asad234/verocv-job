"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, User, FileText, CheckCircle } from "lucide-react"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import PersonalInfoModal from "./personal-info-modal-safe"
import ProfileCreationModal from "./profile-creation-step"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

interface OnboardingOldModalProps {
  isOpen: boolean
  onComplete: () => void
}

type OnboardingStep = "personal-info" | "profile-creation" | "complete"

export default function OnboardingOldModal({ isOpen, onComplete }: OnboardingOldModalProps) {
  const { data: session } = useSession()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("personal-info")

  const userId = session?.user?.id

  if (!userId) {
    return null
  }

  const steps = [
    { id: "personal-info", title: "Personal Information", icon: User },
    { id: "profile-creation", title: "Create Profile", icon: FileText },
  ]

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep)
  const progress = currentStep === "complete" ? 100 : ((currentStepIndex + 1) / steps.length) * 100

  const handlePersonalInfoComplete = () => {
    console.log("Personal info completed")
    setCurrentStep("profile-creation")
  }

  const handleProfileComplete = () => {
    console.log("Profile creation completed")
    setCurrentStep("complete")
    toast.success("Profile created successfully!")
    setTimeout(() => {
      handleFinalComplete()
    }, 2000)
  }

  const handleFinalComplete = () => {
    console.log("Final completion")
    toast.success("Welcome! Your account is now set up.")
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
                <h1 className="text-2xl font-bold text-gray-900">Welcome to VeroCV! 👋</h1>
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
            <Progress value={progress} className="h-2" />

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
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-500"
                          }
                        `}
                      >
                        <StepIcon className="w-4 h-4" />
                      </div>
                      <span className={`text-xs font-medium ${isActive ? "text-blue-600" : "text-gray-500"}`}>
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
