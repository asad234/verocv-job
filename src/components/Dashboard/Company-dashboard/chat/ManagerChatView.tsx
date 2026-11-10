"use client"

// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Chat/ManagerChatView.tsx   (NEW)
// WHAT IT DOES:   The manager dashboard's "Chats" view (Others → Chats).
//                 Render it where your dashboard switches on `view`:
//                   {view === "chat" && <ManagerChatView />}
//                 Anywhere in the manager dashboard you can open a chat with
//                 someone:  const { openChat } = useManagerDashboard(); openChat(employeeId)
// ══════════════════════════════════════════════════════════════════════

import { useManagerTranslations } from "@/utils/Managertranslations"
import { useManagerDashboard } from "@/components/Dashboard/Company-dashboard/manager/ManagerDashboardContext"
import ChatPage from "./ChatPage"

export default function ManagerChatView() {
  const { language } = useManagerTranslations()
  const { chatWithUserId } = useManagerDashboard()
  return <ChatPage language={language} startWithUserId={chatWithUserId} />
}
