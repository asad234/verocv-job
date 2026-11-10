"use client"

import { createContext, useCallback, useContext, useState } from "react"
import type { ReactNode } from "react"

/* ─────────────────────────────────────────────
   VIEW TYPES
───────────────────────────────────────────── */
export type ManagerView =
  | "home"
  | "employee_profiles"
  | "cv_creator"
  | "manager_cv_creator"
  | "availability"
  | "portfolios"
  | "administration"
  | "interviews"
  | "reports"
  | "chat"
  | "account"
  | "feature_request"
  | "help"
  | "invitation"
  | "contracts"
  | "contract_editor"
  | "contract_templates"
  | "manager_profile"
  | "manager_edit"
  | "my_contracts"
  | "my_availability"



/* ─────────────────────────────────────────────
   CONTEXT TYPE
───────────────────────────────────────────── */
interface ManagerDashboardContextType {
  view: ManagerView
  setView: (view: ManagerView) => void
  selectedEmployeeId: string | null
  setSelectedEmployeeId: (id: string | null) => void
  selectedContractId: string | null
  setSelectedContractId: (id: string | null) => void
  /** Who the Chats view should open with (null = just the list). */
  chatWithUserId: string | null
  /** Jump to Chats — optionally straight into the chat with this user. */
  openChat: (userId?: string | null) => void
  language: "en" | "sv"
  setLanguage: (lang: "en" | "sv") => void
}

const ManagerDashboardContext = createContext<ManagerDashboardContextType | null>(null)

export const ManagerDashboardProvider = ({ children }: { children: ReactNode }) => {
  const [view, setView] = useState<ManagerView>("home")
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null)
  const [chatWithUserId, setChatWithUserId] = useState<string | null>(null)
  const [language, setLanguage] = useState<"en" | "sv">("sv")

  const openChat = useCallback((userId?: string | null) => {
    setChatWithUserId(userId ?? null)
    setView("chat")
  }, [])

  return (
    <ManagerDashboardContext.Provider
      value={{
        view, setView,
        selectedEmployeeId, setSelectedEmployeeId,
        selectedContractId, setSelectedContractId,
        chatWithUserId, openChat,
        language, setLanguage,
      }}
    >
      {children}
    </ManagerDashboardContext.Provider>
  )
}

export const useManagerDashboard = (): ManagerDashboardContextType => {
  const ctx = useContext(ManagerDashboardContext)
  if (!ctx) {
    throw new Error("useManagerDashboard must be used inside <ManagerDashboardProvider>")
  }
  return ctx
}
