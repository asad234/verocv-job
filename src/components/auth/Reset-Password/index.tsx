"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { AlertCircle, Lock, Eye, EyeOff, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useAuthTranslation } from "@/hooks/useAuthTranslation"

type Language = "en" | "sv"

interface Translations {
  en: {
    createNewPassword: string
    passwordDescription: string
    newPassword: string
    newPasswordPlaceholder: string
    confirmPassword: string
    confirmPasswordPlaceholder: string
    resetPasswordButton: string
    resettingPassword: string
    rememberPassword: string
    signIn: string
    requestNewLink: string
    passwordsDoNotMatch: string
    passwordTooShort: string
    invalidResetToken: string
    invalidResetLink: string
    failedToReset: string
    errorOccurred: string
    successMessage: string
    redirecting: string
  }
  sv: {
    createNewPassword: string
    passwordDescription: string
    newPassword: string
    newPasswordPlaceholder: string
    confirmPassword: string
    confirmPasswordPlaceholder: string
    resetPasswordButton: string
    resettingPassword: string
    rememberPassword: string
    signIn: string
    requestNewLink: string
    passwordsDoNotMatch: string
    passwordTooShort: string
    invalidResetToken: string
    invalidResetLink: string
    failedToReset: string
    errorOccurred: string
    successMessage: string
    redirecting: string
  }
}

const translations: Translations = {
  en: {
    createNewPassword: "Create new password",
    passwordDescription: "Enter your new password below. Make sure it's at least 8 characters long.",
    newPassword: "New Password",
    newPasswordPlaceholder: "Enter new password",
    confirmPassword: "Confirm Password",
    confirmPasswordPlaceholder: "Confirm new password",
    resetPasswordButton: "Reset password",
    resettingPassword: "Resetting password...",
    rememberPassword: "Remember your password?",
    signIn: "Sign in",
    requestNewLink: "Request a new reset link",
    passwordsDoNotMatch: "Passwords do not match",
    passwordTooShort: "Password must be at least 8 characters long",
    invalidResetToken: "Invalid reset token",
    invalidResetLink: "Invalid reset link. Please request a new password reset.",
    failedToReset: "Failed to reset password",
    errorOccurred: "An error occurred. Please try again.",
    successMessage: "Password reset successfully! Redirecting to sign in...",
    redirecting: "Redirecting..."
  },
  sv: {
    createNewPassword: "Skapa nytt lösenord",
    passwordDescription: "Ange ditt nya lösenord nedan. Se till att det är minst 8 tecken långt.",
    newPassword: "Nytt lösenord",
    newPasswordPlaceholder: "Ange nytt lösenord",
    confirmPassword: "Bekräfta lösenord",
    confirmPasswordPlaceholder: "Bekräfta nytt lösenord",
    resetPasswordButton: "Återställ lösenord",
    resettingPassword: "Återställer lösenord...",
    rememberPassword: "Kommer du ihåg ditt lösenord?",
    signIn: "Logga in",
    requestNewLink: "Begär en ny återställningslänk",
    passwordsDoNotMatch: "Lösenorden matchar inte",
    passwordTooShort: "Lösenordet måste vara minst 8 tecken långt",
    invalidResetToken: "Ogiltig återställningstoken",
    invalidResetLink: "Ogiltig återställningslänk. Vänligen begär en ny lösenordsåterställning.",
    failedToReset: "Misslyckades att återställa lösenord",
    errorOccurred: "Ett fel uppstod. Vänligen försök igen.",
    successMessage: "Lösenordet har återställts! Omdirigerar till inloggning...",
    redirecting: "Omdirigerar..."
  }
}

function ResetPasswordForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const { language } = useAuthTranslation('en')
  const t = translations[language]

  useEffect(() => {
    const tokenParam = searchParams.get("token")
    if (!tokenParam) {
      setError(t.invalidResetLink)
    } else {
      setToken(tokenParam)
    }
  }, [searchParams, t.invalidResetLink])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess(false)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError(t.passwordsDoNotMatch)
      setIsLoading(false)
      return
    }

    // Validate password strength
    if (password.length < 8) {
      setError(t.passwordTooShort)
      setIsLoading(false)
      return
    }

    if (!token) {
      setError(t.invalidResetToken)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || t.failedToReset)
      } else {
        setSuccess(true)
        // Redirect to sign in after 2 seconds
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      }
    } catch (err) {
      console.error("Error resetting password:", err)
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
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t.createNewPassword}</h1>
            <p className="text-slate-500">{t.passwordDescription}</p>
          </div>

          {error && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="rounded-xl border-green-200 bg-green-50 text-green-900">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>{t.successMessage}</AlertDescription>
            </Alert>
          )}

          {!success && token && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  {t.newPassword}
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t.newPasswordPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-10 pr-10 py-6 rounded-xl border-slate-200 transition-all duration-200 disabled:opacity-50"
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
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                  {t.confirmPassword}
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t.confirmPasswordPlaceholder}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-10 pr-10 py-6 rounded-xl border-slate-200 transition-all duration-200 disabled:opacity-50"
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
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
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
                    {t.resettingPassword}
                  </>
                ) : (
                  t.resetPasswordButton
                )}
              </Button>
            </form>
          )}

          {!token && (
            <div className="text-center">
              <Link
                href="/forgot-password"
                className="font-medium transition-colors"
                style={{ color: 'rgb(5, 22, 80)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(15, 32, 90)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(5, 22, 80)'}
              >
                {t.requestNewLink}
              </Link>
            </div>
          )}

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

export default function ResetPasswordPage() {
  const { language } = useAuthTranslation('en')
  const t = translations[language]

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'rgb(176, 196, 222)', borderTopColor: 'transparent' }}
          />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
