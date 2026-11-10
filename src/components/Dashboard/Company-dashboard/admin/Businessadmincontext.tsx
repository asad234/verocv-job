"use client"

import { createContext, useCallback, useContext, useState } from "react"
import type { ReactNode } from "react"

export type BusinessAdminView =
  | "home"
  | "create_manager"
  | "managers_list"
  | "manager_profile" // one manager's profile page (selectedManagerId)
  | "manager_edit" // edit that manager (selectedManagerId)
  | "manager_contracts" // Managers → Contracts (contracts you send to managers)
  | "availability"
  | "chat" // Others → Chats (components/Chat/AdminChats)
  | "interviews" // Others → Interviews (interview managers you want to hire)
  | "employees"
  | "employee_profile" // one employee's page (selectedEmployeeId)
  | "reports"
  | "account"
  | "help"
  | "feature_request"

interface BusinessAdminContextType {
  view: BusinessAdminView
  setView: (view: BusinessAdminView) => void
  language: "en" | "sv"
  setLanguage: (lang: "en" | "sv") => void
  /** Who the Chats view should open with (null = just the list). */
  chatWithUserId: string | null
  /** Jump to Chats — optionally straight into the chat with this user (manager or employee). */
  openChat: (userId?: string | null) => void
  /** The manager shown on the profile / edit pages. */
  selectedManagerId: string | null
  openManagerProfile: (id: string) => void
  openManagerEdit: (id: string) => void
  /** The employee shown on the employee page. */
  selectedEmployeeId: string | null
  openEmployeeProfile: (id: string) => void
  /** A contract to open on Managers → Contracts (e.g. from the bell: "sign now"). */
  contractToOpen: string | null
  openManagerContract: (id: string) => void
  clearContractToOpen: () => void
}

const BusinessAdminContext = createContext<BusinessAdminContextType | null>(null)

export const BusinessAdminProvider = ({ children }: { children: ReactNode }) => {
  const [view, setView] = useState<BusinessAdminView>("home")
  const [language, setLanguage] = useState<"en" | "sv">("sv")
  const [chatWithUserId, setChatWithUserId] = useState<string | null>(null)
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [contractToOpen, setContractToOpen] = useState<string | null>(null)

  const openChat = useCallback((userId?: string | null) => {
    setChatWithUserId(userId ?? null)
    setView("chat")
  }, [])
  const openManagerProfile = useCallback((id: string) => {
    setSelectedManagerId(id)
    setView("manager_profile")
  }, [])
  const openManagerEdit = useCallback((id: string) => {
    setSelectedManagerId(id)
    setView("manager_edit")
  }, [])
  const openEmployeeProfile = useCallback((id: string) => {
    setSelectedEmployeeId(id)
    setView("employee_profile")
  }, [])

  const openManagerContract = useCallback((id: string) => {
    setContractToOpen(id)
    setView("manager_contracts")
  }, [])
  const clearContractToOpen = useCallback(() => setContractToOpen(null), [])

  return (
    <BusinessAdminContext.Provider
      value={{
        view, setView, language, setLanguage,
        chatWithUserId, openChat,
        selectedManagerId, openManagerProfile, openManagerEdit,
        selectedEmployeeId, openEmployeeProfile,
        contractToOpen, openManagerContract, clearContractToOpen,
      }}
    >
      {children}
    </BusinessAdminContext.Provider>
  )
}

export const useBusinessAdmin = (): BusinessAdminContextType => {
  const ctx = useContext(BusinessAdminContext)
  if (!ctx) throw new Error("useBusinessAdmin must be used inside <BusinessAdminProvider>")
  return ctx
}
