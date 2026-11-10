"use client"

// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Chat/AdminChats.tsx
// WHAT IT DOES:   Business admin → Others → Chats. The same chat page managers
//                 and employees use, in the admin dashboard's language.
//                 Render it where the admin dashboard shows its views:
//                   const { view, chatWithUserId } = useBusinessAdmin()
//                   {view === "chat" && <AdminChats startWithUserId={chatWithUserId} />}
// ══════════════════════════════════════════════════════════════════════

import ChatPage from "./ChatPage"
import { useBusinessAdminTranslations } from "@/utils/Businessadmintranslations"

export default function AdminChats({ startWithUserId }: { startWithUserId?: string | null }) {
  const { language } = useBusinessAdminTranslations()
  return <ChatPage language={language === "en" ? "en" : "sv"} startWithUserId={startWithUserId} />
}
