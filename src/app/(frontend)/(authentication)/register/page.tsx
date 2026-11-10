"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
//import RegisterForm from "@/components/Register"
import PreLoader from "@/components/Common/PreLoader"
import { useAuth } from "@/hooks/auth"
import AuthForms from "@/components/auth/authForms"

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function RegisterPage() {
  const { session, status } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return
    if (session) {
      router.push("/dashboard")
    }
  }, [session, status, router])

  if (status === "loading") {
    return <PreLoader></PreLoader>
  }

  return <AuthForms defaultForm='signup' />
}
