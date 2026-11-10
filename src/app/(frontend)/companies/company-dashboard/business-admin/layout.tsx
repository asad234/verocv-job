"use client"

import { BusinessAdminProvider } from "@/components/Dashboard/Company-dashboard/admin/Businessadmincontext"
import BusinessAdminLayout from "@/components/Dashboard/Company-dashboard/admin/Businessadminlayout"
import type { ReactNode } from "react"
export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <BusinessAdminProvider>
      <BusinessAdminLayout>
        {children}
      </BusinessAdminLayout>
    </BusinessAdminProvider>


  )
}
