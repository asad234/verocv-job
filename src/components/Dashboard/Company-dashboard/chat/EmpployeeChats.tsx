"use client"

// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Chat/EmployeeChats.tsx   (NEW)
// WHAT IT DOES:   Chat page for the employee dashboard, in the dashboard's language.
// ══════════════════════════════════════════════════════════════════════
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"
import ChatPage from "./ChatPage"

export default function EmployeeChats() {
  const { language } = useDashboardTranslations() as { language?: string }
  return (
    <div className="w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6">
      <ChatPage language={language === "sv" ? "sv" : "en"} />
    </div>
  )
}
