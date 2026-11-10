"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import clsx from "clsx"
import { Icon } from "@iconify/react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import type { ManagerView } from "./ManagerDashboardContext"
import { useManagerTranslations } from "@/utils/Managertranslations"
import { useChatUnread } from "@/utils/chat"
import { useMyContractsToSign } from "@/utils/myManagerContractsApi"
import { useUpcomingInterviewsWithMe } from "@/utils/interviewsWithMeApi"
import { useMyTimeOffUpdates } from "@/utils/myAvailabilityApi"

const BASE_PATH = "/companies/company-dashboard/manager"

interface ManagerSidebarProps {
  isOpen: boolean; setOpen: (v: boolean) => void
  isCollapsed: boolean; setCollapsed: (v: boolean) => void
  currentView: ManagerView; onViewChange: (view: ManagerView) => void
  unreadMessages?: number
  /* language prop removed — hook is single source of truth */
}

type MenuLeaf =
  | { kind: "view"; view: ManagerView; label: string; badge?: number }
  | { kind: "link"; path: string; label: string; badge?: number }

interface MenuItem {
  id: string; label: string; icon: string
  path?: string; view?: ManagerView
  badge?: string; subItems?: MenuLeaf[]
}

const ManagerSidebar: React.FC<ManagerSidebarProps> = ({
  isOpen, setOpen, isCollapsed, setCollapsed, currentView, onViewChange,
}) => {
  const { t, language } = useManagerTranslations()
  const isSv = language === "sv"
  const unreadChats = useChatUnread()
  const contractsToSign = useMyContractsToSign() // contracts from the admin waiting for my signature
  const interviewsWithMe = useUpcomingInterviewsWithMe() // upcoming interviews the admin booked with me
  const timeOffUpdates = useMyTimeOffUpdates() // days-off requests the admin has answered (not seen yet)
  const router = useRouter()
  const pathname = usePathname()

  const [expandedMobile, setExpandedMobile] = useState<Record<string, boolean>>({ employees: true })
  const [expandedDesktop, setExpandedDesktop] = useState<string | null>("employees")
  const [isAnimating, setIsAnimating] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const menuItems: MenuItem[] = [
    {
      id: "home", label: t.home, icon: "tabler:home",
      subItems: [{ kind: "view", view: "home", label: t.dashboard }],
    },
    {
      id: "employees", label: t.employees, icon: "tabler:users",
      subItems: [
        // Invite an employee / create an account for them (first, like "Create manager" for admins)
        { kind: "view", view: "invitation", label: t.sendInvitation },
        { kind: "view", view: "employee_profiles", label: t.employeeProfiles },
        { kind: "view", view: "cv_creator", label: t.cvs },
        { kind: "view", view: "availability", label: t.employeeAvailability },
        { kind: "view", view: "portfolios", label: t.employeePortfolios },
        { kind: "view", view: "contracts", label: t.employeeContracts ?? "Contracts" },
        { kind: "view", view: "administration", label: t.employeeAdmin },
      ],
    },
    { id: "request", label: t.featureRequest, icon: "tabler:bulb", view: "feature_request" as const },
    {
      // Others → Interviews, Reports, Chats, My contracts (grouped like Settings → Help, Account)
      id: "others", label: (t as any).others ?? (isSv ? "Övrigt" : "Others"), icon: "tabler:category",
      subItems: [
        { kind: "view", view: "interviews" as const, label: t.interviews, badge: interviewsWithMe },
        { kind: "view", view: "reports" as const, label: t.reports },
        { kind: "view", view: "chat" as const, label: (t as any).chats ?? (isSv ? "Chattar" : "Chats"), badge: unreadChats },
        { kind: "view", view: "my_contracts" as const, label: (t as any).myContracts ?? (isSv ? "Mina kontrakt" : "My contracts"), badge: contractsToSign },
        { kind: "view", view: "my_availability" as const, label: (t as any).myAvailability ?? (isSv ? "Min tillgänglighet" : "My availability"), badge: timeOffUpdates },
      ],
    },
    {
      id: "settings", label: t.settings, icon: "tabler:settings",
      subItems: [
        { kind: "view", view: "help" as const, label: t.helpSupport },
        { kind: "view", view: "account" as const, label: t.accountSettings },
      ],
    },
  ]

  // Open the group that holds the current view (e.g. header chat icon → Others).
  useEffect(() => {
    const owner = menuItems.find(m => m.subItems?.some(s => s.kind === "view" && s.view === currentView))
    if (!owner) return
    setExpandedDesktop(owner.id)
    setExpandedMobile(p => (p[owner.id] ? p : { ...p, [owner.id]: true }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView])

  const toggleMobile = (id: string) => { if (isAnimating) return; setIsAnimating(true); setExpandedMobile(p => ({ ...p, [id]: !p[id] })); setTimeout(() => setIsAnimating(false), 300) }
  const toggleDesktop = (id: string) => { if (isAnimating) return; setIsAnimating(true); setExpandedDesktop(p => p === id ? null : id); setTimeout(() => setIsAnimating(false), 300) }

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (window.innerWidth < 640 && isOpen && sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest("button[aria-label='Open sidebar']"))
        setOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [isOpen, setOpen])

  const isMenuActive = (item: MenuItem) => {
    if (item.view && currentView === item.view) return true
    return item.subItems?.some(s => s.kind === "view" && s.view === currentView) ?? false
  }
  const isSubActive = (leaf: MenuLeaf) => leaf.kind === "view" ? currentView === leaf.view : false
  const isExp = (id: string) => window.innerWidth < 640 ? !!expandedMobile[id] : expandedDesktop === id

  /* Only redirect to base if we're currently on a settings/link subroute.
     View-based navigation is handled by context — no redirect needed. */
  const LINK_SUBROUTES = [`${BASE_PATH}/settings`, `${BASE_PATH}/invitation`]
  const isOnSubroute = LINK_SUBROUTES.some(sub => pathname.startsWith(sub))

  const switchView = (view: ManagerView) => {
    onViewChange(view)
    if (isOnSubroute) router.push(BASE_PATH)
    if (window.innerWidth < 640) setOpen(false)
  }

  const handleMain = (item: MenuItem) => {
    if (item.path) return
    if (item.view) { switchView(item.view); return }
    if (window.innerWidth < 640) toggleMobile(item.id)
    else if (isCollapsed) { setCollapsed(false); setExpandedDesktop(item.id) }
    else toggleDesktop(item.id)
  }
  const handleSub = (leaf: MenuLeaf) => { if (leaf.kind === "view") switchView(leaf.view) }

  return (
    <aside ref={sidebarRef} className={clsx(
      "fixed sm:sticky top-0 transform transition-all duration-300 ease-in-out z-50 sm:z-0",
      "bg-white border-r border-gray-200 flex-shrink-0 h-screen flex flex-col",
      isOpen ? "translate-x-0" : "-translate-x-full", "sm:translate-x-0",
      isCollapsed ? "sm:w-20" : "sm:w-64", "w-64",
    )}>

      {/* Logo */}
      <div className={clsx("p-4 flex items-center flex-shrink-0 border-b border-gray-100",
        isCollapsed ? "sm:justify-center" : "sm:justify-between", "justify-between")}>
        <div className="flex items-center gap-2">
          <Image src="/logo/logovero.svg" alt="VeroCV" width={310} height={150}
            className={clsx("object-contain", isCollapsed ? "w-8" : "w-32")} />
          {!isCollapsed && (
            <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border"
              style={{ color: "rgb(5,22,80)", backgroundColor: "rgb(239,246,255)", borderColor: "rgb(191,219,254)" }}>
              {t.manager}
            </span>
          )}
        </div>
        <button onClick={() => setOpen(false)} className="sm:hidden text-gray-500 hover:text-gray-700 p-2 -mr-2" aria-label="Close sidebar">
          <Icon icon="tabler:x" className="w-6 h-6" />
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map(item => {
            const active = isMenuActive(item)
            return (
              <li key={item.id}>
                <div className="relative">
                  {item.path && !item.subItems ? (
                    <Link href={item.path} className={clsx(
                      "w-full text-left p-3 flex items-center rounded-md transition-all duration-200 focus:outline-none relative",
                      isCollapsed ? "sm:justify-center" : "sm:justify-start", "justify-start",
                      active ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    )}>
                      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-800 rounded-r-full" />}
                      <Icon icon={item.icon} className={clsx("w-5 h-5 flex-shrink-0", active && "ml-2")} />
                      {!isCollapsed && <span className="ml-2">{item.label}</span>}
                    </Link>
                  ) : (
                    <button onClick={() => handleMain(item)} className={clsx(
                      "w-full text-left p-3 flex items-center rounded-md transition-all duration-200 focus:outline-none relative",
                      isCollapsed ? "sm:justify-center" : "sm:justify-between", "justify-between",
                      active ? "bg-indigo-50 text-blue-900 font-medium" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    )} aria-expanded={isExp(item.id)}>
                      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-800 rounded-r-full" />}
                      <div className="flex items-center gap-2 relative">
                        <Icon icon={item.icon} className={clsx("w-5 h-5 flex-shrink-0", active && "ml-2")} />
                        {!isCollapsed && <span>{item.label}</span>}
                        {(() => {
                          const n = item.subItems?.reduce((a, s) => a + (s.badge ?? 0), 0) ?? 0
                          if (!n || (isExp(item.id) && !isCollapsed)) return null
                          return isCollapsed
                            ? <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" aria-label={`${n}`} />
                            : <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{n > 99 ? "99+" : n}</span>
                        })()}
                      </div>
                      {!isCollapsed && item.subItems && (
                        <Icon icon={isExp(item.id) ? "tabler:chevron-up" : "tabler:chevron-down"} className="w-4 h-4 flex-shrink-0" />
                      )}
                    </button>
                  )}

                  {!isCollapsed && item.subItems && (
                    <div className={clsx("overflow-hidden transition-all duration-300 ease-in-out",
                      (window.innerWidth < 640 && expandedMobile[item.id]) ||
                        (!isCollapsed && window.innerWidth >= 640 && expandedDesktop === item.id)
                        ? "max-h-screen" : "max-h-0")}>
                      <ul className="space-y-1 pl-3 mt-1">
                        {item.subItems.map(sub => {
                          const sa = isSubActive(sub)
                          return (
                            <li key={sub.label}>
                              {sub.kind === "link" ? (
                                <Link href={sub.path} className={clsx(
                                  "block p-2 text-sm rounded-md transition-all duration-200 relative focus:outline-none",
                                  sa ? "bg-indigo-100 text-blue-900 font-medium" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                                )}>
                                  {sa && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-800 rounded-full ml-1" />}
                                  <span className={clsx(sa && "ml-3")}>{sub.label}</span>
                                </Link>
                              ) : (
                                <button onClick={() => handleSub(sub)} className={clsx(
                                  "w-full text-left block p-2 text-sm rounded-md transition-all duration-200 relative focus:outline-none",
                                  sa ? "bg-indigo-100 text-blue-900 font-medium" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                                )}>
                                  {sa && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-800 rounded-full ml-1" />}
                                  <span className={clsx("flex items-center justify-between gap-2", sa && "ml-3")}>
                                    {sub.label}
                                    {!!sub.badge && (
                                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                                        {sub.badge > 99 ? "99+" : sub.badge}
                                      </span>
                                    )}
                                  </span>
                                </button>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Collapse */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <button onClick={() => setCollapsed(!isCollapsed)}
          className={clsx("hidden sm:flex items-center w-full py-2 rounded-md font-bold text-blue-900 hover:bg-gray-50 focus:outline-none transition-all duration-200",
            isCollapsed ? "justify-center" : "justify-start")}
          aria-label={isCollapsed ? t.expandSidebar : t.collapseSidebar}>
          <Icon icon={isCollapsed ? "tabler:layout-sidebar-right-expand" : "tabler:layout-sidebar-right-collapse"} className="w-5 h-5 text-blue-900" />
          {!isCollapsed && <span className="ml-2 font-bold text-blue-900">{t.collapse}</span>}
        </button>
      </div>
    </aside>
  )
}

export default ManagerSidebar
