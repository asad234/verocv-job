"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { AlertCircle, Mail, ArrowLeft, CheckCircle, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useAuthTranslation } from "@/hooks/useAuthTranslation"

type Language = "en" | "sv"

interface Translations {
  en: {
    backToSignIn: string
    resetPassword: string
    resetDescription: string
    emailAddress: string
    emailPlaceholder: string
    sendResetLink: string
    sending: string
    rememberPassword: string
    signIn: string
    errorSendingEmail: string
    errorOccurred: string
    oauthUserMessage: string
    successMessage: string
    checkSpam: string
  }
  sv: {
    backToSignIn: string
    resetPassword: string
    resetDescription: string
    emailAddress: string
    emailPlaceholder: string
    sendResetLink: string
    sending: string
    rememberPassword: string
    signIn: string
    errorSendingEmail: string
    errorOccurred: string
    oauthUserMessage: string
    successMessage: string
    checkSpam: string
  }
}

const translations: Translations = {
  en: {
    backToSignIn: "Back to sign in",
    resetPassword: "Reset your password",
    resetDescription: "Enter your email address and we'll send you a link to reset your password.",
    emailAddress: "Email address",
    emailPlaceholder: "name@example.com",
    sendResetLink: "Send reset link",
    sending: "Sending...",
    rememberPassword: "Remember your password?",
    signIn: "Sign in",
    errorSendingEmail: "Failed to send reset email",
    errorOccurred: "An error occurred. Please try again.",
    oauthUserMessage: "You signed up using a social login (Google, GitHub, etc.). Please log in with your social account. If you've forgotten your password, reset it directly through your social provider.",
    successMessage: "If an account exists with that email, we've sent password reset instructions. Please check your inbox",
    checkSpam: "(and your spam/junk folder if you don't see it)."
  },
  sv: {
    backToSignIn: "Tillbaka till inloggning",
    resetPassword: "Återställ ditt lösenord",
    resetDescription: "Ange din e-postadress så skickar vi dig en länk för att återställa ditt lösenord.",
    emailAddress: "E-postadress",
    emailPlaceholder: "namn@exempel.se",
    sendResetLink: "Skicka återställningslänk",
    sending: "Skickar...",
    rememberPassword: "Kommer du ihåg ditt lösenord?",
    signIn: "Logga in",
    errorSendingEmail: "Misslyckades att skicka återställnings-e-post",
    errorOccurred: "Ett fel uppstod. Vänligen försök igen.",
    oauthUserMessage: "Du registrerade dig med social inloggning (Google, GitHub, etc.). Vänligen logga in med ditt sociala konto. Om du har glömt ditt lösenord, återställ det direkt via din sociala leverantör.",
    successMessage: "Om ett konto finns med den e-postadressen har vi skickat instruktioner för återställning av lösenord. Vänligen kontrollera din inkorg",
    checkSpam: "(och din skräppost/spam-mapp om du inte ser det)."
  }
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isOAuthUser, setIsOAuthUser] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { language } = useAuthTranslation('en')
  const t = translations[language]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess(false)
    setIsOAuthUser(false)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || t.errorSendingEmail)
      } else {
        if (data.isOAuth) {
          setIsOAuthUser(true)
        }
        setSuccess(true)
        setEmail("")
      }
    } catch (err) {
      console.error("Error requesting password reset:", err)
      setError(t.errorOccurred)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium transition-colors mb-4"
              style={{ color: 'rgb(5, 22, 80)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(15, 32, 90)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(5, 22, 80)'}
            >
              <ArrowLeft size={16} />
              {t.backToSignIn}
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t.resetPassword}</h1>
            <p className="text-slate-500">{t.resetDescription}</p>
          </div>

          {error && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && isOAuthUser && (
            <Alert className="rounded-xl border-blue-200 bg-blue-50 text-blue-900">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                {t.oauthUserMessage}
              </AlertDescription>
            </Alert>
          )}

          {success && !isOAuthUser && (
            <Alert className="rounded-xl border-green-200 bg-green-50 text-green-900">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                {t.successMessage} {t.checkSpam}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                {t.emailAddress}
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10 py-6 rounded-xl border-slate-200 transition-all duration-200 disabled:opacity-50"
                  style={{
                    borderColor: '#e2e8f0'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.2)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0'
                    e.currentTarget.style.boxShadow = ''
                  }}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-6 rounded-xl text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
              style={{ backgroundColor: 'rgb(5, 22, 80)' }}
              onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)')}
              onMouseLeave={(e) => !isLoading && (e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)')}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {t.sending}
                </>
              ) : (
                t.sendResetLink
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-slate-500">
            {t.rememberPassword}{" "}
            <Link
              href="/login"
              className="font-medium transition-colors"
              style={{ color: 'rgb(5, 22, 80)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(15, 32, 90)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(5, 22, 80)'}
            >
              {t.signIn}
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
