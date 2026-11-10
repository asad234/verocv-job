"use client"
// FILE LOCATION:  src/components/Dashboard/SidebarMenu.tsx   (REPLACE)
// Profile → Availability only shows for employees connected to a manager with full access.

import type React from "react"

import { useState, useRef, useEffect } from "react"
import clsx from "clsx"
import { Icon } from "@iconify/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { ViewType } from "./LayoutDashboard"
import Image from "next/image"
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"
import { useManagerAccess } from "@/hooks/useManagerAccess"
import { useChatUnread } from "@/utils/chat"

type MenuItem = {
  id: string
  label: string
  icon: string
  path?: string
  subItems?: { path: string; label: string; view: string; badge?: number }[]
}

interface SidebarMenuProps {
  isOpen: boolean
  setOpen: (open: boolean) => void
  isCollapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  pathname: string
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({ isOpen, setOpen, isCollapsed, setCollapsed, pathname }) => {
  const [expandedMenuMobile, setExpandedMenuMobile] = useState<{ [key: string]: boolean }>({})
  const [expandedMenuDesktop, setExpandedMenuDesktop] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { t, language } = useDashboardTranslations()
  const isSv = language === "sv"
  // "Others" (Contracts + Interviews) is only for employees who have accepted a
  // manager's invitation. Hidden for everyone else, and hidden again as soon
  // as the connection is revoked by either side.
  const { hasAccess: hasManagerAccess, hasFullAccess } = useManagerAccess()
  const unreadChats = useChatUnread()

  const allMenuItems: MenuItem[] = [
    {
      id: "home",
      label: t.home,
      icon: "tabler:home",
      subItems: [{ path: "/dashboard", label: t.dashboard, view: "home" }],
    },
    {
      id: "profile",
      label: t.profile,
      icon: "tabler:user",
      subItems: [
        { path: "/dashboard/profile", label: t.myProfile, view: "profile" },
        { path: "/dashboard/cv", label: t.cv, view: "cv" },
        // Only when connected to a manager with full access — availability is part of that.
        ...(hasFullAccess ? [{ path: "/dashboard/availability", label: t.availability, view: "availability" }] : []),
        { path: "/dashboard/details", label: t.details, view: "details" },
        { path: "/dashboard/portfolios", label: t.portfolios, view: "portfolios" },
      ],
    },
    {
      id: "request",
      label: t.featureRequest,
      icon: "tabler:bulb",
      path: "/dashboard/request",
    },
    {
      id: "invitation",
      label: t.sendInvitation,
      icon: "tabler:send",
      path: "/dashboard/invitation",
    },
    {
      // "Others" → Contracts, Interviews, Chats (with your manager)
      id: "others",
      label: (t as any).others ?? (isSv ? "Övrigt" : "Others"),
      icon: "tabler:category",
      subItems: [
        { path: "/dashboard/others/contracts", label: (t as any).contracts ?? (isSv ? "Kontrakt" : "Contracts"), view: "contracts" },
        { path: "/dashboard/others/my-interviews", label: (t as any).interviews ?? (isSv ? "Intervjuer" : "Interviews"), view: "interviews" },
        { path: "/dashboard/others/chats", label: (t as any).chats ?? (isSv ? "Chattar" : "Chats"), view: "chats", badge: unreadChats },
      ],
    },
    {
      id: "settings",
      label: t.settings,
      icon: "tabler:settings",
      subItems: [
        { path: "/dashboard/settings/help", label: t.helpSupport, view: "help" },
        { path: "/dashboard/settings/account", label: t.accountSettings, view: "account" },
      ],
    },
  ]

  const menuItems = allMenuItems.filter((item) => item.id !== "others" || hasManagerAccess)

  const toggleMenuMobile = (menuId: string) => {
    if (isAnimating) return
    setIsAnimating(true)
    setExpandedMenuMobile((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }))
    setTimeout(() => setIsAnimating(false), 300)
  }

  const toggleMenuDesktop = (menuId: string) => {
    if (isAnimating) return
    setIsAnimating(true)
    setExpandedMenuDesktop((prev) => (prev === menuId ? null : menuId))
    setTimeout(() => setIsAnimating(false), 300)
  }

  const handleMenuItemClick = (path: string, menuId: string) => {
    if (isCollapsed && window.innerWidth >= 640) {
      setCollapsed(false)
      setExpandedMenuDesktop(menuId)
    } else {
      router.push(path)
      if (window.innerWidth < 640) {
        setOpen(false)
      } else {
        setExpandedMenuDesktop(menuId)
      }
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        window.innerWidth < 640 &&
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest("button[aria-label='Open sidebar']")
      ) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [setOpen, isOpen])

  useEffect(() => {
    if (!pathname) return
    // Find the current menu based on pathname
    const currentMenu = menuItems.find((item) => {
      if (item.path === pathname) return true // Check direct path
      return item.subItems?.some((subItem) => pathname === subItem.path || pathname.startsWith(subItem.path))
    })

    if (currentMenu) {
      // For desktop - only set if not already set
      if (window.innerWidth >= 640 && expandedMenuDesktop === null) {
        setExpandedMenuDesktop(currentMenu.id)
      }
      // For mobile - only set if not already set
      else if (window.innerWidth < 640 && !expandedMenuMobile[currentMenu.id]) {
        setExpandedMenuMobile((prev) => ({ ...prev, [currentMenu.id]: true }))
      }
    }
  }, [pathname, expandedMenuDesktop, expandedMenuMobile])

  // Check if a menu item is active (main menu button)
  const isMenuActive = (item: MenuItem) => {
    // Check if direct path matches
    if (pathname === item.path) return true
    // Check if any sub-item path matches
    return item.subItems?.some((subItem) => pathname === subItem.path) || false
  }

  // Check if a sub-item is active
  const isSubItemActive = (subItemPath: string) => {
    return pathname === subItemPath
  }

  const isExpanded = (itemId: string) => {
    return window.innerWidth < 640 ? expandedMenuMobile[itemId] : expandedMenuDesktop === itemId
  }

  return (
    <aside
      ref={sidebarRef}
      className={clsx(
        "fixed sm:sticky top-0 transform transition-all duration-300 ease-in-out z-50 sm:z-0",
        "bg-white border-r border-gray-200 flex-shrink-0 h-screen flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "sm:translate-x-0",
        isCollapsed ? "sm:w-20" : "sm:w-64",
        "w-64",
      )}
    >
      {/* Header section - fixed at top */}
      <div
        className={clsx(
          "p-4 flex items-center flex-shrink-0",
          isCollapsed ? "sm:justify-center" : "sm:justify-between",
          "justify-between",
        )}
      >
        <Link href="/dashboard" className="flex items-center">
          <Image src="/logo/logovero.svg" alt="VeroCv Icon" width={310} height={150} className="text-indigo-600" />
        </Link>
        <button
          onClick={() => setOpen(false)}
          className="sm:hidden text-gray-500 hover:text-gray-700 focus:outline-none p-2 -mr-2"
          aria-label="Close sidebar"
        >
          <Icon icon="tabler:x" className="w-6 h-6" />
        </button>
      </div>

      {/* Scrollable menu section - takes remaining space */}
      <div className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              <div className="relative">
                {item.path ? ( // Render as Link if it has a direct path
                  <Link
                    href={item.path}
                    onClick={() => handleMenuItemClick(item.path!, item.id)}
                    className={clsx(
                      "w-full text-left p-3 flex items-center rounded-md transition-all duration-200",
                      "focus:outline-none relative",
                      isCollapsed ? "sm:justify-center" : "sm:justify-start",
                      "justify-start",
                      pathname === item.path
                        ? "bg-indigo-50 text-indigo-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.2)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = ''
                    }}
                  >
                    {/* Active indicator - left border */}
                    {pathname === item.path && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-r-full" />
                    )}
                    <Icon icon={item.icon} className={clsx("w-5 h-5", pathname === item.path ? "ml-2" : "")} />
                    {!isCollapsed && <span className="ml-2">{item.label}</span>}
                  </Link>
                ) : (
                  // Render as button if it has sub-items
                  <button
                    onClick={() => {
                      if (window.innerWidth < 640) {
                        toggleMenuMobile(item.id)
                      } else {
                        if (isCollapsed) {
                          setCollapsed(false)
                          setExpandedMenuDesktop(item.id)
                        } else {
                          toggleMenuDesktop(item.id)
                        }
                      }
                    }}
                    className={clsx(
                      "w-full text-left p-3 flex items-center rounded-md transition-all duration-200",
                      "focus:outline-none relative",
                      isCollapsed ? "sm:justify-center" : "sm:justify-between",
                      "justify-between",
                      isMenuActive(item)
                        ? "bg-indigo-50 text-blue-900 font-medium"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.2)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = ''
                    }}
                    aria-expanded={isExpanded(item.id)}
                    aria-controls={`submenu-${item.id}`}
                  >
                    {/* Active indicator - left border */}
                    {isMenuActive(item) && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-800 rounded-r-full" />
                    )}
                    <div className="flex items-center relative">
                      <Icon icon={item.icon} className={clsx("w-5 h-5", isMenuActive(item) ? "ml-2" : "")} />
                      {!isCollapsed && <span className="ml-2">{item.label}</span>}
                      {/* Unread chats while the group is closed / the sidebar is collapsed */}
                      {(() => {
                        const n = item.subItems?.reduce((a, s) => a + (s.badge ?? 0), 0) ?? 0
                        if (!n || (isExpanded(item.id) && !isCollapsed)) return null
                        return isCollapsed
                          ? <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" aria-label={`${n}`} />
                          : <span className="ml-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{n > 99 ? "99+" : n}</span>
                      })()}
                    </div>
                    {!isCollapsed && item.subItems && item.subItems.length > 0 && (
                      <Icon
                        icon={
                          isExpanded(item.id)
                            ? "tabler:chevron-up"
                            : "tabler:chevron-down"
                        }
                        className="w-4 h-4 transition-transform duration-300"
                      />
                    )}
                  </button>
                )}
                {!isCollapsed && item.subItems && item.subItems.length > 0 && (
                  <div
                    id={`submenu-${item.id}`}
                    className={clsx(
                      "overflow-hidden transition-all duration-300 ease-in-out",
                      (window.innerWidth < 640 && expandedMenuMobile[item.id]) ||
                        (!isCollapsed && window.innerWidth >= 640 && expandedMenuDesktop === item.id)
                        ? "max-h-screen"
                        : "max-h-0",
                    )}
                  >
                    <ul className="space-y-1 pl-3 mt-1">
                      {item.subItems.map((subItem) => (
                        <li key={subItem.path}>
                          <Link
                            href={subItem.path}
                            className={clsx(
                              "block p-2 text-sm rounded-md transition-all duration-200 relative",
                              "focus:outline-none",
                              isSubItemActive(subItem.path)
                                ? "bg-indigo-100 text-blue-900 font-medium"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                            onFocus={(e) => {
                              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.2)'
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.boxShadow = ''
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMenuItemClick(subItem.path, item.id)
                            }}
                          >
                            {/* Active indicator dot for sub-items */}
                            {isSubItemActive(subItem.path) && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-800 rounded-full ml-1" />
                            )}
                            <span className={clsx("flex items-center justify-between gap-2", isSubItemActive(subItem.path) && "ml-3")}>
                              {subItem.label}
                              {!!subItem.badge && (
                                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                                  {subItem.badge > 99 ? "99+" : subItem.badge}
                                </span>
                              )}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Collapse button section - fixed at bottom */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <button
          onClick={() => setCollapsed(!isCollapsed)}
          className={clsx(
            "hidden sm:flex items-center w-full py-2 rounded-md font-bold text-blue-900 hover:bg-gray-50 focus:outline-none transition-all duration-200",
            isCollapsed ? "justify-center" : "justify-start",
          )}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.2)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = ''
          }}
          aria-label={isCollapsed ? t.expandSidebar : t.collapseSidebar}
        >
          <Icon
            icon={
              isCollapsed
                ? "tabler:layout-sidebar-right-expand"
                : "tabler:layout-sidebar-right-collapse"
            }
            className="w-5 h-5 text-blue-900"
          />
          {!isCollapsed && (
            <span className="ml-2 font-bold text-blue-900">
              {t.collapse}
            </span>
          )}
        </button>
      </div>

    </aside>
  )
}

export default SidebarMenu
