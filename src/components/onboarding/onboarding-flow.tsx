"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, User, FileText } from "lucide-react"
import PersonalInfoStep from "./personal-info-step"
import ProfileCreationStep from "./profile-creation-step"
import { toast } from "sonner"
import { useAuthTranslation } from "@/hooks/useAuthTranslation"
import { onboardingTranslations } from "@/utils/Onboardingtranslations"

interface OnboardingFlowProps {
  userId: string
}

type OnboardingStep = "welcome" | "personal-info" | "profile-creation" | "complete"

export default function OnboardingFlow({ userId }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome")
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const router = useRouter()
  const { language } = useAuthTranslation('sv')
  const t = onboardingTranslations[language]

  const steps = [
    { id: "welcome", title: t.welcomeStep, icon: User },
    { id: "personal-info", title: t.personalInfoStep, icon: User },
    { id: "profile-creation", title: t.profileCreationStep, icon: FileText },
  ] as const

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep)

  const getProgress = () => {
    switch (currentStep) {
      case "welcome":
        return 0 // 0% at welcome
      case "personal-info":
        return 50 // 50% at personal info (step 1 of 2 actual steps)
      case "profile-creation":
        return 100 // 100% at profile creation (step 2 of 2 actual steps)
      case "complete":
        return 100 // 100% when complete
      default:
        return 0
    }
  }

  const progress = getProgress()

  const getProgressLabel = () => {
    switch (currentStep) {
      case "welcome":
        return `${t.gettingStarted} (0%)`
      case "personal-info":
        return `${t.step1of2} (50%)`
      case "profile-creation":
        return `${t.step2of2} (100%)`
      case "complete":
        return `${t.complete} (100%)`
      default:
        return `${t.gettingStarted} (0%)`
    }
  }

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps((prev) => new Set([...prev, stepId]))

    // Move to next step with proper null checking
    const currentIndex = steps.findIndex((step) => step.id === stepId)
    if (currentIndex !== -1 && currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1]
      if (nextStep) {
        setCurrentStep(nextStep.id as OnboardingStep)
      }
    } else if (currentIndex === steps.length - 1) {
      // If this is the last step, move to complete
      setCurrentStep("complete")
    }
  }

  const handleCompleteOnboarding = async () => {
    try {
      // Mark user as onboarded
      const response = await fetch("/api/user/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        throw new Error(t.failedToCompleteOnboarding)
      }

      toast.success(t.welcomeAccountSetup)
      router.push("/dashboard")
    } catch (error) {
      console.error("Error completing onboarding:", error)
      toast.error(t.somethingWentWrong)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{t.welcomeSetupAccount}</h1>
            <span className="text-sm text-gray-600">
              {getProgressLabel()}
            </span>
          </div>

          {/* Custom Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
            <div
              className="h-full bg-[rgb(5,22,80)] rounded-full transition-all duration-700 ease-in-out"
              style={{
                width: `${progress}%`,
                backgroundColor: 'rgb(5, 22, 80)',
              }}
            />
          </div>

          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              const isActive = step.id === currentStep
              const isCompleted = completedSteps.has(step.id)

              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`
                    w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors
                    ${isCompleted
                        ? "bg-green-500 text-white"
                        : isActive
                          ? "bg-[rgb(5,22,80)] text-white"
                          : "bg-gray-200 text-gray-500"
                      }
                  `}
                  >
                    <StepIcon className="w-5 h-5  bg-[rgb(5,22,80)]" />
                  </div>
                  <span className={`text-xs font-medium ${isActive ? "text-blue-600" : "text-gray-500"}`}>
                    {step.title}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card className="shadow-xl">
          {currentStep === "welcome" && (
            <CardContent className="p-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.welcomeToPlatform}</h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {t.getStartedDescription}
                </p>
                <div className="space-y-4">
                  <Button onClick={() => handleStepComplete("welcome")} className="w-full max-w-sm" size="lg">
                    {t.getStarted}
                  </Button>
                  <p className="text-sm text-gray-500">{t.onlyFewMinutes}</p>
                </div>
              </div>
            </CardContent>
          )}

          {currentStep === "personal-info" && (
            <PersonalInfoStep userId={userId} onComplete={() => handleStepComplete("personal-info")} />
          )}

          {currentStep === "profile-creation" && (
            <ProfileCreationStep userId={userId} onComplete={() => handleStepComplete("profile-creation")} />
          )}

          {currentStep === "complete" && (
            <CardContent className="p-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.allSet}</h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {t.accountReady}
                </p>
                <Button onClick={handleCompleteOnboarding} className="w-full max-w-sm" size="lg">
                  {t.goToDashboard}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
