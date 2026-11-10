"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Mail, AlertCircle, Loader2, Shield } from "lucide-react"
import { toast } from "sonner"

interface VerificationDialogProps {
  isOpen: boolean
  onClose: () => void
  verificationStatus: {
    recoveryEmailVerified: boolean
    hasPersonalInfo: boolean
    recoveryEmail?: string
    authType?: string
    requiresVerification?: boolean
  } | null
  onVerificationSent: () => void
  language?: "en" | "sv"
  userId: string
}

const translations = {
  en: {
    completeProfileTitle: "Complete Your Profile First",
    completeProfileDesc: "Please complete your personal information in the onboarding process before verifying your email address.",
    close: "Close",
    noEmailTitle: "No Email Address",
    noEmailDesc: "Please add your email address in your profile settings before verifying it.",
    emailVerification: "Email Verification",
    allVerifiedDesc: "Your email address is verified!",
    verifyEmailDesc: "Verify your email address to secure your account",
    allVerifiedSuccess: "Your email address has been verified successfully!",
    verificationAlert: "Please verify your email address to ensure account security and receive important notifications.",
    recoveryEmail: "Recovery Email",
    pending: "Pending",
    sendVerificationEmail: "Send Verification Email",
    sending: "Sending...",
    verificationEmailNote: "A verification email will be sent to your recovery email address",
    laterButton: "I'll do this later",
    sendingToast: "Sending verification email...",
    successToast: "Verification email sent successfully! Please check your inbox.",
    errorToast: "Failed to send verification email. Please try again.",
    oauthTitle: "OAuth Account - No Verification Needed",
    oauthDesc: "You signed up using {provider} authentication. Email verification is only required for email/password accounts.",
    oauthInfo: "Your account is already verified through {provider}.",
  },
  sv: {
    completeProfileTitle: "Slutför Din Profil Först",
    completeProfileDesc: "Vänligen slutför din personliga information i registreringsprocessen innan du verifierar din e-postadress.",
    close: "Stäng",
    noEmailTitle: "Ingen E-postadress",
    noEmailDesc: "Vänligen lägg till din e-postadress i dina profilinställningar innan du verifierar den.",
    emailVerification: "E-postverifiering",
    allVerifiedDesc: "Din e-postadress är verifierad!",
    verifyEmailDesc: "Verifiera din e-postadress för att säkra ditt konto",
    allVerifiedSuccess: "Din e-postadress har verifierats framgångsrikt!",
    verificationAlert: "Vänligen verifiera din e-postadress för att säkerställa kontosäkerhet och ta emot viktiga meddelanden.",
    recoveryEmail: "Återställnings-e-post",
    pending: "Väntande",
    sendVerificationEmail: "Skicka Verifieringsmejl",
    sending: "Skickar...",
    verificationEmailNote: "Ett verifieringsmejl kommer att skickas till din återställnings-e-postadress",
    laterButton: "Jag gör detta senare",
    sendingToast: "Skickar verifieringsmejl...",
    successToast: "Verifieringsmejl skickat! Vänligen kolla din inkorg.",
    errorToast: "Misslyckades att skicka verifieringsmejl. Vänligen försök igen.",
    oauthTitle: "OAuth-konto - Ingen Verifiering Krävs",
    oauthDesc: "Du registrerade dig med {provider}-autentisering. E-postverifiering krävs endast för e-post/lösenordskonton.",
    oauthInfo: "Ditt konto är redan verifierat via {provider}.",
  },
}

export default function VerificationDialog({
  isOpen,
  onClose,
  verificationStatus,
  onVerificationSent,
  language = "en",
  userId,
}: VerificationDialogProps) {
  const [isSending, setIsSending] = useState(false)
  const t = translations[language]

  const handleSendVerification = async () => {
    try {
      setIsSending(true)
      const toastId = toast.loading(t.sendingToast)

      console.log('📧 Requesting verification email for user:', userId)

      const response = await fetch("/api/send-verification-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Failed to send verification email:', errorData)
        throw new Error(errorData.error || t.errorToast)
      }

      const data = await response.json()
      console.log('✅ Verification email sent:', data)

      toast.success(t.successToast, {
        id: toastId,
      })

      onVerificationSent()
    } catch (error) {
      console.error("Error sending verification email:", error)
      toast.error(error instanceof Error ? error.message : t.errorToast)
    } finally {
      setIsSending(false)
    }
  }

  // Get provider name for OAuth users
  const getProviderName = (authType?: string) => {
    if (!authType || authType === 'credentials') return null

    const providers: Record<string, string> = {
      google: 'Google',
      linkedin: 'LinkedIn',
      github: 'GitHub',
    }

    return providers[authType] || authType
  }

  if (!verificationStatus?.hasPersonalInfo) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.completeProfileTitle}</DialogTitle>
            <DialogDescription>
              {t.completeProfileDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={onClose}>{t.close}</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Check if this is an OAuth user (doesn't require verification)
  if (!verificationStatus.requiresVerification) {
    const providerName = getProviderName(verificationStatus.authType)

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              {t.oauthTitle}
            </DialogTitle>
            <DialogDescription>
              {t.oauthDesc.replace('{provider}', providerName || 'OAuth')}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {t.oauthInfo.replace('{provider}', providerName || 'OAuth')}
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex justify-end">
            <Button onClick={onClose}>{t.close}</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Check if email exists
  const hasRecoveryEmail = verificationStatus.recoveryEmail && verificationStatus.recoveryEmail.trim() !== ''
  const recoveryEmailVerified = verificationStatus.recoveryEmailVerified === true

  if (!hasRecoveryEmail) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.noEmailTitle}</DialogTitle>
            <DialogDescription>
              {t.noEmailDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={onClose}>{t.close}</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t.emailVerification}
          </DialogTitle>
          <DialogDescription>
            {recoveryEmailVerified
              ? t.allVerifiedDesc
              : t.verifyEmailDesc}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {recoveryEmailVerified ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {t.allVerifiedSuccess}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  {t.verificationAlert}
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">{t.recoveryEmail}</p>
                      <p className="text-xs text-gray-500">{verificationStatus.recoveryEmail}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    {t.pending}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleSendVerification}
                  disabled={isSending}
                  className="w-full"
                  size="lg"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t.sending}
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      {t.sendVerificationEmail}
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {t.verificationEmailNote}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            {recoveryEmailVerified ? t.close : t.laterButton}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
