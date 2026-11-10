"use client"

import type { ReactNode } from "react"
import { ManagerDashboardProvider } from "@/components/Dashboard/Company-dashboard/manager/ManagerDashboardContext"
import ManagerDashboardLayout from "@/components/Dashboard/Company-dashboard/manager/ManagerDashboardLayout"

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ManagerDashboardProvider>
      <ManagerDashboardLayout>
        {children}
      </ManagerDashboardLayout>
    </ManagerDashboardProvider>
  )
}
