"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import clsx from "clsx"
import { Icon } from "@iconify/react"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { useAuth } from "@/hooks/auth"
import Link from "next/link"
import SidebarMenu from "./SidebarMenu"
import { useProfileStore } from "@/utils/profileStore"
import { usePersonalInfoStore } from "@/hooks/personal-information/personalInformationStore"
import Avatar from "./avatar"
import { useDashboardTranslations, type DashboardLanguage } from "@/hooks/useDashboardTranslation"
import NotificationBell from "../Common/notification-bell"
import { useManagerAccess } from "@/hooks/useManagerAccess"
import { useChatUnread } from "@/utils/chat"

export type ViewType =
  | "home"
  | "profile"
  | "Availability"
  | "portfolios"
  | "details"
  | "cv"
  | "employees"
  | "teams"
  | "overview"
  | "settings"
  | "help"
  | "invitation"
  | "request"
  | "landing"
  | "cvlandingpage"
  | "page"
  | "landingpage"
  | "cvtest"
  | "contracts"
  | "interviews"
  | "chats"

const languageIconMap: Record<string, string> = {
  en: "circle-flags:gb",
  sv: "circle-flags:se",
}

const DEFAULT_AVATAR = "https://cdn.flyonui.com/fy-assets/avatar/avatar-1.png"

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false)
  const [isLanguageMenuOpen, setLanguageMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const languageMenuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { session, status } = useAuth()
  const { currentProfile } = useProfileStore()
  const { setProfile } = useProfileStore()
  const { setPersonalInfo } = usePersonalInfoStore()
  const personalInfo = usePersonalInfoStore((state) => state.personalInfo)
  const { language, setLanguage, t } = useDashboardTranslations()
  // Chats live under Others, which is only for employees connected to a manager.
  const { hasAccess: hasManagerAccess } = useManagerAccess()
  const unreadChats = useChatUnread()

  const currentLanguageCode = language
  const languageIcon = languageIconMap[currentLanguageCode] || "circle-flags:gb"

  const toggleSidebar = () => setSidebarOpen((prev) => !prev)
  const toggleProfileMenu = () => setProfileMenuOpen((prev) => !prev)
  const toggleLanguageMenu = () => setLanguageMenuOpen((prev) => !prev)
  const toggleSidebarCollapse = () => setSidebarCollapsed(!isSidebarCollapsed)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isProfileMenuOpen &&
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest("#avatar-button")
      ) {
        setProfileMenuOpen(false)
      }

      if (
        isLanguageMenuOpen &&
        languageMenuRef.current &&
        !languageMenuRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest("#language-button")
      ) {
        setLanguageMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isProfileMenuOpen, isLanguageMenuOpen])

  const handleLogout = async () => {
    try {
      // 1. Clear persisted client state
      localStorage.removeItem("cv-data")
      localStorage.removeItem("profile-storage")
      localStorage.removeItem("personal-info-storage")
      localStorage.removeItem("employment-details-storage-331")

      // If you use Zustand persist with a custom key
      localStorage.removeItem("zustand-store")

      // 2. Clear in-memory state
      setProfile(null)
      setPersonalInfo(null)

      // 3. End NextAuth session
      await signOut({ redirect: false })

      // 4. Redirect
      router.replace("/")
    } catch (err) {
      console.error("Logout failed:", err)
    }
  }


  const handleLanguageChange = (newLanguage: DashboardLanguage) => {
    setLanguage(newLanguage)
    setLanguageMenuOpen(false)
  }

  const getProfileImageUrl = () => {
    if (!personalInfo?.profileImage) return DEFAULT_AVATAR
    if ("uploadImage" in personalInfo.profileImage) {
      return personalInfo.profileImage.uploadImage || DEFAULT_AVATAR
    }
    if ("staticImage" in personalInfo.profileImage) {
      return personalInfo.profileImage.staticImage || DEFAULT_AVATAR
    }
    return DEFAULT_AVATAR
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      <div
        className={clsx(
          "fixed inset-0 z-40 bg-black/50 transition-opacity",
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none",
          "sm:hidden",
        )}
        onClick={toggleSidebar}
      />

      {/* Sidebar */}
      <SidebarMenu
        isOpen={isSidebarOpen}
        setOpen={setSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        pathname={pathname}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Navbar */}
        <nav className="bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-30">
          {/* Mobile Menu Button */}
          <button
            onClick={toggleSidebar}
            className="sm:hidden text-gray-500 hover:text-gray-700 focus:outline-none mr-3"
            aria-label="Open sidebar"
          >
            <Icon icon="tabler:menu-2" className="w-6 h-6" />
          </button>
          <div className="hidden sm:flex items-center"></div>
          <div className="flex items-center gap-3">
            {/* Chats (only with manager access) */}
            {hasManagerAccess && (
              <Link
                href="/dashboard/others/chats"
                className={clsx(
                  "relative rounded-full p-2 hover:bg-gray-100 focus:outline-none",
                  pathname?.startsWith("/dashboard/others/chats") ? "text-blue-900" : "text-gray-400 hover:text-gray-500",
                )}
                aria-label={language === "sv" ? `Chattar${unreadChats ? `, ${unreadChats} olästa` : ""}` : `Chats${unreadChats ? `, ${unreadChats} unread` : ""}`}
                title={language === "sv" ? "Chattar" : "Chats"}
              >
                <Icon icon="tabler:message-circle" className="w-5 h-5" />
                {unreadChats > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    {unreadChats > 99 ? "99+" : unreadChats}
                  </span>
                )}
              </Link>
            )}

            {/* Notification Bell - NOW WITH LANGUAGE PROP! */}
            {session?.user?.id && (
              <NotificationBell
                userId={session.user.id}
                language={language}  //← THIS IS THE ONLY CHANGE! */}
              />
            )}
            {/* Language Selector */}
            <div className="relative">
              <button
                id="language-button"
                onClick={toggleLanguageMenu}
                className="relative rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                aria-label={`${t.profileLanguage}: ${language === "en" ? "English" : "Svenska"}`}
                title={`${t.profileLanguage}: ${language === "en" ? "English" : "Svenska"}`}
              >
                <Icon icon={languageIcon} className="w-5 h-5" />
              </button>

              {/* Language Dropdown */}
              <div
                ref={languageMenuRef}
                className={clsx(
                  "absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-md origin-top-right z-10",
                  isLanguageMenuOpen ? "block" : "hidden",
                )}
              >
                <div className="py-1">
                  <button
                    onClick={() => handleLanguageChange("en")}
                    className={clsx(
                      "flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100",
                      language === "en" ? "bg-indigo-50 text-indigo-600" : "text-gray-700",
                    )}
                  >
                    <Icon icon="circle-flags:gb" className="w-4 h-4 mr-3" />
                    English
                  </button>
                  <button
                    onClick={() => handleLanguageChange("sv")}
                    className={clsx(
                      "flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100",
                      language === "sv" ? "bg-indigo-50 text-indigo-600" : "text-gray-700",
                    )}
                  >
                    <Icon icon="circle-flags:se" className="w-4 h-4 mr-3" />
                    Svenska
                  </button>
                </div>
              </div>
            </div>

            <div className="relative">
              <button
                id="avatar-button"
                className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="User menu"
                aria-expanded={isProfileMenuOpen}
                onClick={toggleProfileMenu}
              >
                <Avatar personalInformation={personalInfo}></Avatar>
                <span className="ml-2 text-sm font-medium text-gray-700 hidden sm:block">
                  {personalInfo?.firstName} {personalInfo?.lastName}
                </span>
              </button>
              <div
                ref={profileMenuRef}
                className={clsx(
                  "absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-md origin-top-right z-10",
                  isProfileMenuOpen ? "block" : "hidden",
                )}
              >
                <div className="py-1">
                  <Link
                    href="/dashboard/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    {t.profile}
                  </Link>
                </div>
                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {t.signOut}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

export default DashboardLayout
