"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card } from "@/components/ui/card"
import { AlertCircle, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { signIn } from "next-auth/react"
import Image from "next/image"
import { useAuthTranslation } from "@/hooks/useAuthTranslation"

/* ─── Role → dashboard path ─── */
/* These values match the 'roles' select options in the Users collection:
   admin | client-admin | client-manager | client */
const ROLE_REDIRECT: Record<string, string> = {
  admin: "/admin",
  "client-admin": "/companies/company-dashboard/business-admin",
  "client-manager": "/companies/company-dashboard/admin-dashboard",
  client: "/dashboard",
}

interface SignInFormProps {
  onSwitchToSignUp?: () => void
}

export const AdminSignInForm = ({ onSwitchToSignUp }: SignInFormProps) => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const [logoLoaded, setLogoLoaded] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useAuthTranslation()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    try {
      const response = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })
      if (response?.error) {
        setError(response.error)
      } else if (response?.ok) {
        /* ── Read the role from the session, then redirect by role ── */
        const sessionRes = await fetch("/api/auth/session")
        const sessionData = await sessionRes.json()
        const role = sessionData?.user?.roles

        const explicitCallback = searchParams.get("callbackUrl")
        const destination =
          explicitCallback ||
          (typeof role === "string" ? ROLE_REDIRECT[role] : undefined) ||
          "/dashboard"

        router.push(destination)
      } else {
        setError(t.loginFailed)
      }
    } catch (err) {
      setError(t.invalidCredentials)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialSignIn = async (provider: string) => {
    try {
      setSocialLoading(provider)
      setError("")
      const result = await signIn(provider, {
        callbackUrl: "/dashboard",
        redirect: true,
      })
      if (result?.error) {
        setError(t.socialSignInFailed.replace("{provider}", provider))
        setSocialLoading(null)
      }
    } catch (error) {
      setError(t.socialSignInFailed.replace("{provider}", provider))
      setSocialLoading(null)
    }
  }

  const isAnySocialLoading = socialLoading !== null
  const isAnyLoading = isLoading || isAnySocialLoading

  return (
    <div className="relative flex flex-col items-center">
      {/* Logo circle — overlaps the card below */}
      <div className="relative z-10 mb-[-36px]">
        <div className="w-20 h-20 rounded-full bg-white shadow-lg border-2 border-slate-100 flex items-center justify-center">
          <Image
            src="/logo/logovero.svg"
            alt="VeroCV Logo"
            width={52}
            height={52}
            priority
            className={`transition-opacity duration-200 ${logoLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setLogoLoaded(true)}
          />
          {!logoLoaded && (
            <div className="absolute w-10 h-10 bg-slate-200 animate-pulse rounded-full" />
          )}
        </div>
      </div>

      <Card className="w-full max-w-lg border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
        <div className="p-8 pt-14 space-y-6">
          {/* Header */}
          <div className="space-y-1 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t.welcomeBack}</h1>
            <p className="text-sm text-slate-500">{t.signInToContinueAdmin}</p>
          </div>

          {error && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSignIn} className="space-y-5">
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
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isAnyLoading}
                  className="pl-10 py-6 rounded-xl border-slate-200 transition-all duration-200 disabled:opacity-50"
                  style={{ borderColor: "#e2e8f0" }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgb(176, 196, 222)"
                    e.currentTarget.style.boxShadow = "0 0 0 2px rgba(176, 196, 222, 0.2)"
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0"
                    e.currentTarget.style.boxShadow = ""
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  {t.password}
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium transition-colors"
                  style={{ color: "rgb(5, 22, 80)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "rgb(15, 32, 90)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgb(5, 22, 80)")}
                >
                  {t.forgotPassword}
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isAnyLoading}
                  className="pl-10 pr-10 py-6 rounded-xl border-slate-200 transition-all duration-200 disabled:opacity-50"
                  style={{ borderColor: "#e2e8f0" }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgb(176, 196, 222)"
                    e.currentTarget.style.boxShadow = "0 0 0 2px rgba(176, 196, 222, 0.2)"
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0"
                    e.currentTarget.style.boxShadow = ""
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isAnyLoading}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-6 rounded-xl text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isAnyLoading}
              style={{ backgroundColor: "rgb(5, 22, 80)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgb(15, 32, 90)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgb(5, 22, 80)")}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t.signingIn}
                </>
              ) : (
                <>
                  {t.signIn}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}

export default AdminSignInForm
