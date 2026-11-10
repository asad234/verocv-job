"use client"
import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card } from "@/components/ui/card"
import { AlertCircle, Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signIn } from "next-auth/react"
import { useAuthTranslation } from "@/hooks/useAuthTranslation"
import Link from "next/link"

interface SignUpFormProps {
  onSwitchToSignIn: () => void
}

export const SignUpForm = ({ onSwitchToSignIn }: SignUpFormProps) => {
  const { language, setLanguage, t } = useAuthTranslation()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [logoLoaded, setLogoLoaded] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: boolean
    lastName?: boolean
    email?: boolean
    password?: boolean
    confirmPassword?: boolean
  }>({})
  const router = useRouter()

  const validateFields = () => {
    const errors: typeof fieldErrors = {}

    if (!firstName.trim()) errors.firstName = true
    if (!lastName.trim()) errors.lastName = true
    if (!email.trim()) errors.email = true
    if (!password) errors.password = true
    if (!confirmPassword) errors.confirmPassword = true
    if (password && confirmPassword && password !== confirmPassword) {
      errors.password = true
      errors.confirmPassword = true
    }
    if (password && password.length < 6) errors.password = true

    return errors
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setFieldErrors({})

    const validationErrors = validateFields()

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      if (validationErrors.firstName || validationErrors.lastName) {
        setError(`${t.firstName} and ${t.lastName} are required`)
      } else if (validationErrors.email) {
        setError(`${t.email} is required`)
      } else if (validationErrors.password && validationErrors.confirmPassword && password !== confirmPassword) {
        setError(t.passwordsDontMatch)
      } else if (validationErrors.password && password.length < 6) {
        setError(t.passwordTooShort)
      }
      setIsLoading(false)
      return
    }

    // Basic validation
    if (password !== confirmPassword) {
      setError(t.passwordsDontMatch)
      setFieldErrors({ password: true, confirmPassword: true })
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError(t.passwordTooShort)
      setFieldErrors({ password: true })
      setIsLoading(false)
      return
    }

    try {
      console.log("🚀 Starting user registration process...")
      // Call your API to register the user with separate first and last name
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific API errors and highlight relevant fields
        if (data.error?.includes("email")) {
          setFieldErrors({ email: true })
        }
        throw new Error(data.error || t.registrationFailed)
      }

      console.log("✅ User registration successful:", data)

      // After successful registration, automatically sign in the user
      console.log("🔐 Auto-signing in new user...")
      const signInResult = await signIn("credentials", {
        email,
        password,
        callbackUrl: "/dashboard?newUser=true",
        redirect: true,
      })

      if (signInResult?.error) {
        console.error("❌ Auto sign-in failed:", signInResult.error)
        setError(t.autoSignInFailed)
        setIsLoading(false)
        return
      }

      console.log("✅ Auto sign-in successful, redirecting to dashboard...")

    } catch (err) {
      console.error("❌ Registration error:", err)
      setError(err instanceof Error ? err.message : t.registrationFailed)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialSignUp = async (provider: string) => {
    try {
      console.log(`🔗 Initiating ${provider} sign-up`)
      setIsLoading(true)
      // For social sign-up, NextAuth will handle the redirect automatically
      const result = await signIn(provider, {
        callbackUrl: "/dashboard?socialSignUp=true",
      })

      // Note: signIn with OAuth providers typically redirects immediately,
      // so this code may not execute. The redirect logic is handled in authOptions.ts
      if (result?.error) {
        console.error(`Social sign-in error:`, result.error)
        setError(t.socialSignInFailed.replace('{provider}', provider))
        setIsLoading(false)
      }
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error)
      setError(t.socialSignInFailed.replace('{provider}', provider))
      setIsLoading(false)
    }
  }

  const getInputClassName = (fieldName: keyof typeof fieldErrors) => {
    const baseClasses = "pl-10 py-6 rounded-xl transition-all duration-200"
    const errorClasses = fieldErrors[fieldName]
      ? "border-red-500 bg-red-50"
      : "border-slate-200"

    return `${baseClasses} ${errorClasses}`
  }

  const getPasswordInputClassName = (fieldName: keyof typeof fieldErrors) => {
    const baseClasses = "pl-10 pr-10 py-6 rounded-xl transition-all duration-200"
    const errorClasses = fieldErrors[fieldName]
      ? "border-red-500 bg-red-50"
      : "border-slate-200"

    return `${baseClasses} ${errorClasses}`
  }

  const handleLanguageChange = (newLanguage: 'en' | 'sv') => {
    setLanguage(newLanguage)
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
      <div className="p-8 space-y-6">

        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t.createAccount}</h1>
          <div className="flex items-center justify-center">
            <p className="text-slate-500 mr-2">{t.signUpToGetStarted}</p>
            <div className="relative h-6 w-auto">
              <Image
                src="/logo/logovero.svg"
                alt="VeroCV Logo"
                width={120}
                height={24}
                priority={true}
                className={`h-6 w-auto transition-opacity duration-200 ${logoLoaded ? "opacity-100" : "opacity-0"}`}
                onLoad={() => setLogoLoaded(true)}
              />
              {!logoLoaded && <div className="absolute inset-0 bg-slate-200 animate-pulse rounded h-6 w-20" />}
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            type="button"
            onClick={() => handleSocialSignUp("google")}
            disabled={isLoading}
            className="rounded-xl h-12 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66 2.84.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          </Button>
          <div className="relative">
            <Button
              variant="outline"
              type="button"
              disabled={true}
              className="rounded-xl h-12 border-slate-200 transition-all duration-200 opacity-40 cursor-not-allowed relative bg-transparent"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                <path
                  fill="#0A66C2"
                  d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                />
              </svg>
            </Button>
            <div className="absolute inset-0 bg-slate-100/80 rounded-xl flex items-center justify-center">
              <span className="text-xs text-slate-500 font-medium">{t.soon}</span>
            </div>
          </div>
          <Button
            variant="outline"
            type="button"
            onClick={() => handleSocialSignUp("github")}
            disabled={isLoading}
            className="rounded-xl h-12 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="#000000"
                d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
              />
            </svg>
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setShowEmailForm(true)}
              disabled={isLoading}
              className="bg-white px-4 py-2 text-slate-500 rounded-full hover:text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 text-xs uppercase font-medium border border-slate-200 shadow-sm"
            >
              {t.orContinueWithEmail}
            </Button>
          </div>
        </div>

        <div
          className={`transition-all duration-500 ease-out overflow-hidden ${showEmailForm
            ? "max-h-[800px] opacity-100 transform translate-y-0"
            : "max-h-0 opacity-0 transform translate-y-4"
            }`}
        >
          <form onSubmit={handleSignUp} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">
                  {t.firstName}
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <User size={18} />
                  </div>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder={t.firstNamePlaceholder}
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value)
                      if (fieldErrors.firstName) {
                        setFieldErrors(prev => ({ ...prev, firstName: false }))
                      }
                    }}
                    required
                    disabled={isLoading}
                    className={getInputClassName('firstName')}
                    style={{
                      borderColor: fieldErrors.firstName ? '#ef4444' : '#e2e8f0'
                    }}
                    onFocus={(e) => {
                      if (!fieldErrors.firstName) {
                        e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.2)'
                      }
                    }}
                    onBlur={(e) => {
                      if (!fieldErrors.firstName) {
                        e.currentTarget.style.borderColor = '#e2e8f0'
                        e.currentTarget.style.boxShadow = ''
                      }
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">
                  {t.lastName}
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <User size={18} />
                  </div>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder={t.lastNamePlaceholder}
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value)
                      if (fieldErrors.lastName) {
                        setFieldErrors(prev => ({ ...prev, lastName: false }))
                      }
                    }}
                    required
                    disabled={isLoading}
                    className={getInputClassName('lastName')}
                    style={{
                      borderColor: fieldErrors.lastName ? '#ef4444' : '#e2e8f0'
                    }}
                    onFocus={(e) => {
                      if (!fieldErrors.lastName) {
                        e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.2)'
                      }
                    }}
                    onBlur={(e) => {
                      if (!fieldErrors.lastName) {
                        e.currentTarget.style.borderColor = '#e2e8f0'
                        e.currentTarget.style.boxShadow = ''
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                {t.email}
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
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (fieldErrors.email) {
                      setFieldErrors(prev => ({ ...prev, email: false }))
                    }
                  }}
                  required
                  disabled={isLoading}
                  className={getInputClassName('email')}
                  style={{
                    borderColor: fieldErrors.email ? '#ef4444' : '#e2e8f0'
                  }}
                  onFocus={(e) => {
                    if (!fieldErrors.email) {
                      e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.2)'
                    }
                  }}
                  onBlur={(e) => {
                    if (!fieldErrors.email) {
                      e.currentTarget.style.borderColor = '#e2e8f0'
                      e.currentTarget.style.boxShadow = ''
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                {t.password}
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t.passwordPlaceholder}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (fieldErrors.password) {
                      setFieldErrors(prev => ({ ...prev, password: false }))
                    }
                  }}
                  required
                  disabled={isLoading}
                  className={getPasswordInputClassName('password')}
                  style={{
                    borderColor: fieldErrors.password ? '#ef4444' : '#e2e8f0'
                  }}
                  onFocus={(e) => {
                    if (!fieldErrors.password) {
                      e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.2)'
                    }
                  }}
                  onBlur={(e) => {
                    if (!fieldErrors.password) {
                      e.currentTarget.style.borderColor = '#e2e8f0'
                      e.currentTarget.style.boxShadow = ''
                    }
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
                  placeholder={t.passwordPlaceholder}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (fieldErrors.confirmPassword) {
                      setFieldErrors(prev => ({ ...prev, confirmPassword: false }))
                    }
                  }}
                  required
                  disabled={isLoading}
                  className={getPasswordInputClassName('confirmPassword')}
                  style={{
                    borderColor: fieldErrors.confirmPassword ? '#ef4444' : '#e2e8f0'
                  }}
                  onFocus={(e) => {
                    if (!fieldErrors.confirmPassword) {
                      e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.2)'
                    }
                  }}
                  onBlur={(e) => {
                    if (!fieldErrors.confirmPassword) {
                      e.currentTarget.style.borderColor = '#e2e8f0'
                      e.currentTarget.style.boxShadow = ''
                    }
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

            <div className="flex items-start space-x-2">
              <div className="flex items-center h-5 mt-1">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  disabled={isLoading}
                  className="w-4 h-4 border border-slate-300 rounded bg-slate-50 focus:ring-3"
                  style={{
                    accentColor: 'rgb(5, 22, 80)'
                  }}
                />
              </div>
              <Label htmlFor="terms" className="text-sm text-slate-600">
                {t.acceptTerms}{" "}
                <Link
                  href="/terms"
                  className="font-medium transition-colors"
                  style={{ color: 'rgb(5, 22, 80)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(15, 32, 90)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(5, 22, 80)'}
                >
                  {t.termsOfService}
                </Link>
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full py-6 rounded-xl text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
              style={{ backgroundColor: 'rgb(5, 22, 80)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t.creatingAccount}
                </>
              ) : (
                <>
                  {t.createAccountBtn}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        </div>

        <div className="text-center">
          <p className="text-sm text-slate-500">
            {t.alreadyHaveAccount}{" "}
            <button
              onClick={onSwitchToSignIn}
              disabled={isLoading}
              className="font-medium transition-colors disabled:opacity-50"
              style={{ color: 'rgb(5, 22, 80)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(15, 32, 90)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(5, 22, 80)'}
            >
              {t.signInBtn}
            </button>
          </p>
        </div>
      </div>
    </Card>
  )
}

export default SignUpForm
