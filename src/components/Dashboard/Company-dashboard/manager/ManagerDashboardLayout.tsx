"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import clsx from "clsx"
import { Icon } from "@iconify/react"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import ManagerSidebar from "./ManagerSidebar"
import ManagerNotificationBell from "./ManagerNotificationBell"
import { useManagerDashboard } from "./ManagerDashboardContext"
import { useManagerTranslations } from "@/utils/Managertranslations"
import { useChatUnread } from "@/utils/chat"

const ManagerDashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isProfileOpen, setProfileOpen] = useState(false)
  const [isLangOpen, setLangOpen] = useState(false)

  const profileRef = useRef<HTMLDivElement>(null)
  const langRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { data: session } = useSession()

  /* view only from context */
  const { view, setView, openChat } = useManagerDashboard()
  const unreadChats = useChatUnread()

  /* language + t from the manager translations hook */
  const { t, language, setLanguage } = useManagerTranslations()

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (isProfileOpen && profileRef.current && !profileRef.current.contains(e.target as Node) && !(e.target as HTMLElement).closest("#mgr-avatar-btn")) setProfileOpen(false)
      if (isLangOpen && langRef.current && !langRef.current.contains(e.target as Node) && !(e.target as HTMLElement).closest("#mgr-lang-btn")) setLangOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [isProfileOpen, isLangOpen])

  const handleLogout = async () => {
    localStorage.removeItem("cv-data"); localStorage.removeItem("profile-storage")
    localStorage.removeItem("personal-info-storage"); localStorage.removeItem("employment-details-storage-331")
    await signOut({ redirect: false }); router.replace("/")
  }

  const goToProfile = () => {
    setProfileOpen(false)
    setView("account")
  }

  const userInitials = session?.user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) ?? "GR"

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className={clsx("fixed inset-0 z-40 bg-black/50 transition-opacity sm:hidden", isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none")} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar — no language prop, reads from hook internally */}
      <ManagerSidebar
        isOpen={isSidebarOpen} setOpen={setSidebarOpen}
        isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed}
        currentView={view} onViewChange={setView}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <nav className="bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(v => !v)} className="sm:hidden text-gray-500 hover:text-gray-700 focus:outline-none mr-3" aria-label="Open sidebar">
            <Icon icon="tabler:menu-2" className="w-6 h-6" />
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full border tracking-widest uppercase"
              style={{ color: "rgb(5,22,80)", backgroundColor: "rgb(239,246,255)", borderColor: "rgb(191,219,254)" }}>
              {t.manager}
            </span>
          </div>

          <div className="flex items-center gap-3 ml-auto">

            {/* Chats */}
            <button
              onClick={() => openChat(null)}
              className={clsx("relative rounded-full p-2 hover:bg-gray-100 focus:outline-none", view === "chat" ? "text-blue-900" : "text-gray-400 hover:text-gray-500")}
              aria-label={language === "sv" ? `Chattar${unreadChats ? `, ${unreadChats} olästa` : ""}` : `Chats${unreadChats ? `, ${unreadChats} unread` : ""}`}
              title={language === "sv" ? "Chattar" : "Chats"}
            >
              <Icon icon="tabler:message-circle" className="w-5 h-5" />
              {unreadChats > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                  {unreadChats > 99 ? "99+" : unreadChats}
                </span>
              )}
            </button>

            {/* Notification bell */}
            <ManagerNotificationBell language={language} />

            {/* Language toggle */}
            <div className="relative">
              <button id="mgr-lang-btn" onClick={() => setLangOpen(v => !v)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none">
                <Icon icon={language === "en" ? "circle-flags:gb" : "circle-flags:se"} className="w-5 h-5" />
              </button>
              <div ref={langRef} className={clsx("absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-md z-10", isLangOpen ? "block" : "hidden")}>
                <div className="py-1">
                  {(["en", "sv"] as const).map(lang => (
                    <button key={lang} onClick={() => { setLanguage(lang); setLangOpen(false) }}
                      className={clsx("flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100", language === lang ? "bg-indigo-50 text-indigo-600" : "text-gray-700")}>
                      <Icon icon={lang === "en" ? "circle-flags:gb" : "circle-flags:se"} className="w-4 h-4 mr-3" />
                      {lang === "en" ? "English" : "Svenska"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Profile menu — just Profile + Logout */}
            <div className="relative">
              <button id="mgr-avatar-btn" onClick={() => setProfileOpen(v => !v)}
                className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: "rgb(5,22,80)" }}>
                  {userInitials}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700 hidden sm:block">
                  {session?.user?.name ?? "Manager"}
                </span>
              </button>
              <div ref={profileRef} className={clsx("absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-md shadow-md z-10", isProfileOpen ? "block" : "hidden")}>
                <div className="py-1">
                  <button onClick={goToProfile} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    {t.profile}
                  </button>
                </div>
                <div className="border-t border-gray-100 py-1">
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    {t.signOut}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

export default ManagerDashboardLayout
