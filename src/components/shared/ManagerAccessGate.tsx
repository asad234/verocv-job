// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/shared/ManagerAccessGate.tsx   (REPLACE — adds `full`)
// WHAT IT DOES:   Wraps the pages under "Others" (Contracts, Interviews).
//                 Only employees with an accepted manager invitation get in;
//                 everyone else — and anyone whose access is revoked while the
//                 page is open — is sent back to /dashboard.
//                 <ManagerAccessGate full> also needs FULL access (Availability).
// ══════════════════════════════════════════════════════════════════════

"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useManagerAccess } from "@/hooks/useManagerAccess"

export default function ManagerAccessGate({
  children,
  redirectTo = "/dashboard",
  full = false,
}: {
  children: React.ReactNode
  redirectTo?: string
  /** Require an accepted invitation with FULL access (not only CVs / portfolio) */
  full?: boolean
}) {
  const access = useManagerAccess()
  const loading = access.loading
  const hasAccess = full ? access.hasFullAccess : access.hasAccess
  const router = useRouter()

  useEffect(() => {
    if (!loading && !hasAccess) router.replace(redirectTo)
  }, [loading, hasAccess, redirectTo, router])

  if (loading || !hasAccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  return <>{children}</>
}
