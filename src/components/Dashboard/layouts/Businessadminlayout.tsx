"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import clsx from "clsx"
import { Icon } from "@iconify/react"
import { usePathname, useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import Link from "next/link"
import { useDashboardTranslations, type DashboardLanguage } from "@/hooks/useDashboardTranslation"

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
export type CompanyRole = "business_admin" | "manager" | "employee" | "consultant"

interface CompanyAccount {
  id: string
  label: string
  role: CompanyRole
  companyName: string
}

interface Employee {
  id: string
  name: string
  role: CompanyRole
  status: "active" | "inactive"
  avatarInitials: string
}

interface EmployeeSelectorProps {
  employees: Employee[]
  onClose: () => void
  onAction: (employeeId: string, action: string) => void
  language: string
}

/* ─────────────────────────────────────────────
   MOCK DATA — replace with real API calls
───────────────────────────────────────────── */
const MOCK_ACCOUNTS: CompanyAccount[] = [
  { id: "1", label: "Business Admin", role: "business_admin", companyName: "Nordic Konsult AB" },
  { id: "2", label: "Manager", role: "manager", companyName: "Nordic Konsult AB" },
  { id: "3", label: "My Personal Account", role: "employee", companyName: "" },
]

const MOCK_EMPLOYEES: Employee[] = [
  { id: "e1", name: "Emma Larsson", role: "employee", status: "active", avatarInitials: "EL" },
  { id: "e2", name: "Lars Svensson", role: "employee", status: "active", avatarInitials: "LS" },
  { id: "e3", name: "Anna Björk", role: "consultant", status: "active", avatarInitials: "AB" },
  { id: "e4", name: "Marcus Holm", role: "employee", status: "inactive", avatarInitials: "MH" },
]

/* ─────────────────────────────────────────────
   EMPLOYEE SELECTOR MODAL
───────────────────────────────────────────── */
const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({ employees, onClose, onAction, language }) => {
  const isEn = language === "en"

  const actionGroups = [
    {
      key: "create_cv",
      label: isEn ? "Create CV" : "Skapa CV",
      icon: "tabler:file-plus",
    },
    {
      key: "list_cvs",
      label: isEn ? "List CVs" : "Visa CV:n",
      icon: "tabler:files",
    },
    {
      key: "availability",
      label: isEn ? "Availability" : "Tillgänglighet",
      icon: "tabler:calendar-check",
    },
    {
      key: "portfolio",
      label: isEn ? "Portfolio" : "Portfolio",
      icon: "tabler:briefcase",
    },
    {
      key: "profile",
      label: isEn ? "Profile" : "Profil",
      icon: "tabler:user",
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-blue-100 w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgb(239,246,255)" }}>
              <Icon icon="tabler:users" className="w-5 h-5" style={{ color: "rgb(5,22,80)" }} />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              {isEn ? "Select Employee" : "Välj Medarbetare"}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
            <Icon icon="tabler:x" className="w-5 h-5" />
          </button>
        </div>

        {/* Employee list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {employees.map(emp => (
            <div key={emp.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-blue-50/40 hover:border-blue-200 transition-all group">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: "rgb(5,22,80)" }}>
                {emp.avatarInitials}
              </div>

              {/* Name & status */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 text-sm truncate">{emp.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={clsx("w-1.5 h-1.5 rounded-full", emp.status === "active" ? "bg-green-400" : "bg-gray-300")} />
                  <span className="text-xs text-gray-400 capitalize">{emp.status}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {actionGroups.map(action => (
                  <button
                    key={action.key}
                    onClick={() => onAction(emp.id, action.key)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-white transition-all duration-200"
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = "rgb(5,22,80)"
                      e.currentTarget.style.borderColor = "rgb(5,22,80)"
                      e.currentTarget.style.color = "white"
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = ""
                      e.currentTarget.style.borderColor = ""
                      e.currentTarget.style.color = ""
                    }}
                  >
                    <Icon icon={action.icon} className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   SIDEBAR NAV ITEM
───────────────────────────────────────────── */
interface NavItemProps {
  icon: string
  label: string
  href?: string
  badge?: string
  isCollapsed: boolean
  isActive?: boolean
  isExpanded?: boolean
  hasChildren?: boolean
  onClick?: () => void
  onToggle?: () => void
}

const NavItem: React.FC<NavItemProps> = ({
  icon, label, href, badge, isCollapsed, isActive, isExpanded, hasChildren, onClick, onToggle,
}) => {
  const base = clsx(
    "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer text-sm font-medium w-full text-left",
    isActive
      ? "text-white shadow-sm"
      : "text-slate-500 hover:text-slate-800 hover:bg-blue-50/60"
  )

  const inner = (
    <>
      <div className={clsx("flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
        isActive ? "bg-white/20" : "bg-transparent group-hover:bg-blue-100/60"
      )}>
        <Icon icon={icon} className="w-4.5 h-4.5" />
      </div>
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {badge && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 border border-amber-200 whitespace-nowrap">
              {badge}
            </span>
          )}
          {hasChildren && (
            <Icon icon={isExpanded ? "tabler:chevron-up" : "tabler:chevron-down"} className="w-3.5 h-3.5 flex-shrink-0" />
          )}
        </>
      )}
    </>
  )

  const style = isActive ? { backgroundColor: "rgb(5,22,80)" } : {}

  if (href && !hasChildren) {
    return (
      <Link href={href} className={base} style={style} onClick={onClick}>
        {inner}
      </Link>
    )
  }

  return (
    <button className={base} style={style} onClick={hasChildren ? onToggle : onClick}>
      {inner}
    </button>
  )
}

/* ─────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────── */
interface SidebarProps {
  role: CompanyRole
  isOpen: boolean
  isCollapsed: boolean
  setOpen: (v: boolean) => void
  setCollapsed: (v: boolean) => void
  pathname: string
  language: string
  onEmployeeSelect: (section: string) => void
  companyLogo?: string | null
}

const CompanySidebar: React.FC<SidebarProps> = ({
  role, isOpen, isCollapsed, setOpen, setCollapsed, pathname, language, onEmployeeSelect, companyLogo,
}) => {
  const [employeesExpanded, setEmployeesExpanded] = useState(true)
  const isEn = language === "en"
  const soon = isEn ? "Soon" : "Snart"

  /* ── Sidebar menu definitions ── */
  const businessAdminNav = [
    { icon: "tabler:home", label: isEn ? "Home" : "Hem", href: "/company/dashboard" },
    { icon: "tabler:layout-dashboard", label: isEn ? "Dashboard" : "Dashboard", href: "/company/dashboard/overview" },
    { icon: "tabler:users", label: isEn ? "Users" : "Användare", href: "/company/dashboard/users", badge: soon },
    { icon: "tabler:chart-bar", label: isEn ? "Statistics" : "Statistik", href: "/company/dashboard/statistics", badge: soon },
  ]

  const managerEmployeeChildren = [
    { icon: "tabler:user-circle", label: isEn ? "Employee Profiles" : "Medarbetarprofiler", section: "profiles" },
    { icon: "tabler:file-text", label: isEn ? "CV Creator" : "CV-skapare", section: "cv" },
    { icon: "tabler:calendar", label: isEn ? "Employee Availability" : "Tillgänglighet", section: "availability" },
    { icon: "tabler:briefcase", label: isEn ? "Employee Portfolios" : "Portfolios", section: "portfolio" },
    { icon: "tabler:settings-2", label: isEn ? "Employee Administration" : "Medarbetaradmin", href: "/company/dashboard/administration" },
  ]

  const managerNav = [
    { icon: "tabler:home", label: isEn ? "Home" : "Hem", href: "/company/dashboard" },
  ]

  const sharedBottomNav = [
    { icon: "tabler:star", label: isEn ? "Feature Request" : "Funktionsförslag", href: "/company/dashboard/feature-request" },
    { icon: "tabler:mail-forward", label: isEn ? "Send Invitation" : "Skicka inbjudan", href: "/company/dashboard/invite" },
    { icon: "tabler:settings", label: isEn ? "Settings" : "Inställningar", href: "/company/dashboard/settings" },
  ]

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={clsx("fixed inset-0 z-40 bg-black/50 transition-opacity sm:hidden", isOpen ? "opacity-100" : "opacity-0 pointer-events-none")}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar panel */}
      <aside className={clsx(
        "fixed left-0 top-0 z-50 h-full bg-white border-r border-gray-100 flex flex-col transition-all duration-300 shadow-sm",
        "sm:relative sm:z-auto sm:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0",
        isCollapsed ? "w-[68px]" : "w-60",
      )}>

        {/* Logo area */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100 flex-shrink-0">
          {companyLogo ? (
            <img src={companyLogo} alt="Company" className="h-8 w-auto object-contain" />
          ) : (
            <div className="flex-shrink-0">
              <img src="/logo/logovero.svg" alt="VeroCV" className={clsx("object-contain", isCollapsed ? "h-7" : "h-8")} />
            </div>
          )}
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-400 truncate">
                {role === "business_admin" ? (isEn ? "Business Admin" : "Företagsadmin") : (isEn ? "Manager" : "Chef")}
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">

          {/* Business Admin menu */}
          {role === "business_admin" && businessAdminNav.map(item => (
            <NavItem key={item.href} {...item} isCollapsed={isCollapsed} isActive={pathname === item.href} />
          ))}

          {/* Manager menu */}
          {role === "manager" && (
            <>
              {managerNav.map(item => (
                <NavItem key={item.href} {...item} isCollapsed={isCollapsed} isActive={pathname === item.href} />
              ))}

              {/* Employees expandable group */}
              <NavItem
                icon="tabler:users"
                label={isEn ? "Employees" : "Medarbetare"}
                isCollapsed={isCollapsed}
                hasChildren
                isExpanded={employeesExpanded}
                onToggle={() => setEmployeesExpanded(v => !v)}
                isActive={false}
              />

              {/* Children */}
              {employeesExpanded && !isCollapsed && (
                <div className="ml-3 pl-3 border-l-2 space-y-0.5" style={{ borderColor: "rgb(176,196,222)" }}>
                  {managerEmployeeChildren.map(child => (
                    child.href ? (
                      <NavItem
                        key={child.href}
                        icon={child.icon}
                        label={child.label}
                        href={child.href}
                        isCollapsed={false}
                        isActive={pathname === child.href}
                      />
                    ) : (
                      <button
                        key={child.section}
                        onClick={() => onEmployeeSelect(child.section!)}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-blue-50/60 transition-all"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                          <Icon icon={child.icon} className="w-4 h-4" />
                        </div>
                        <span className="truncate">{child.label}</span>
                      </button>
                    )
                  ))}
                </div>
              )}
            </>
          )}

          {/* Divider */}
          <div className="my-3 border-t border-gray-100" />

          {/* Shared bottom nav */}
          {sharedBottomNav.map(item => (
            <NavItem key={item.href} {...item} isCollapsed={isCollapsed} isActive={pathname === item.href} />
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={() => setCollapsed(!isCollapsed)}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-600 hover:bg-gray-50 transition-all"
          >
            <Icon icon={isCollapsed ? "tabler:layout-sidebar-right" : "tabler:layout-sidebar"} className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>{isEn ? "Collapse" : "Minimera"}</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

/* ─────────────────────────────────────────────
   MAIN LAYOUT
───────────────────────────────────────────── */
interface CompanyDashboardLayoutProps {
  children: React.ReactNode
  role?: CompanyRole
  companyLogo?: string | null
}

const CompanyDashboardLayout: React.FC<CompanyDashboardLayoutProps> = ({
  children,
  role = "business_admin",
  companyLogo = null,
}) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false)
  const [isLanguageMenuOpen, setLanguageMenuOpen] = useState(false)
  const [isAccountMenuOpen, setAccountMenuOpen] = useState(false)
  const [employeeSelectorSection, setEmployeeSelectorSection] = useState<string | null>(null)

  const profileMenuRef = useRef<HTMLDivElement>(null)
  const languageMenuRef = useRef<HTMLDivElement>(null)
  const accountMenuRef = useRef<HTMLDivElement>(null)

  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const { language, setLanguage, t } = useDashboardTranslations()

  const isEn = language === "en"

  const currentAccount = MOCK_ACCOUNTS.find(a => a.role === role) ?? MOCK_ACCOUNTS[0]!

  /* Close dropdowns on outside click */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (isProfileMenuOpen && profileMenuRef.current && !profileMenuRef.current.contains(target) && !target.closest("#profile-btn")) setProfileMenuOpen(false)
      if (isLanguageMenuOpen && languageMenuRef.current && !languageMenuRef.current.contains(target) && !target.closest("#lang-btn")) setLanguageMenuOpen(false)
      if (isAccountMenuOpen && accountMenuRef.current && !accountMenuRef.current.contains(target) && !target.closest("#account-btn")) setAccountMenuOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [isProfileMenuOpen, isLanguageMenuOpen, isAccountMenuOpen])

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.replace("/")
  }

  const handleLanguageChange = (lang: DashboardLanguage) => {
    setLanguage(lang)
    setLanguageMenuOpen(false)
  }

  const handleEmployeeAction = (employeeId: string, action: string) => {
    // TODO: navigate to employee-specific section
    console.log("Employee action:", employeeId, action)
    setEmployeeSelectorSection(null)
  }

  const roleLabel = role === "business_admin"
    ? (isEn ? "Business Admin" : "Företagsadmin")
    : role === "manager"
      ? (isEn ? "Manager" : "Chef")
      : (isEn ? "Employee" : "Medarbetare")

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <CompanySidebar
        role={role}
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        setOpen={setSidebarOpen}
        setCollapsed={setSidebarCollapsed}
        pathname={pathname}
        language={language}
        onEmployeeSelect={section => setEmployeeSelectorSection(section)}
        companyLogo={companyLogo}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* ── NAVBAR ── */}
        <nav className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          {/* Mobile toggle */}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="sm:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          >
            <Icon icon="tabler:menu-2" className="w-5 h-5" />
          </button>

          {/* Role breadcrumb */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="px-3 py-1 rounded-full text-xs font-semibold tracking-wide border"
              style={{ backgroundColor: "rgb(239,246,255)", borderColor: "rgb(191,219,254)", color: "rgb(5,22,80)" }}>
              {roleLabel}
            </div>
            {currentAccount.companyName && (
              <span className="text-sm text-slate-400">— {currentAccount.companyName}</span>
            )}
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-2 ml-auto">

            {/* Language */}
            <div className="relative">
              <button id="lang-btn" onClick={() => setLanguageMenuOpen(v => !v)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                <Icon icon={language === "en" ? "circle-flags:gb" : "circle-flags:se"} className="w-5 h-5" />
              </button>
              <div ref={languageMenuRef} className={clsx(
                "absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden",
                isLanguageMenuOpen ? "block" : "hidden"
              )}>
                {[
                  { code: "en" as DashboardLanguage, icon: "circle-flags:gb", label: "English" },
                  { code: "sv" as DashboardLanguage, icon: "circle-flags:se", label: "Svenska" },
                ].map(lang => (
                  <button key={lang.code} onClick={() => handleLanguageChange(lang.code)}
                    className={clsx("flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors",
                      language === lang.code ? "font-medium" : "text-gray-600"
                    )}
                    style={language === lang.code ? { color: "rgb(5,22,80)" } : {}}>
                    <Icon icon={lang.icon} className="w-4 h-4" />
                    {lang.label}
                    {language === lang.code && <Icon icon="tabler:check" className="w-3.5 h-3.5 ml-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all relative">
              <Icon icon="tabler:bell" className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-400 border-2 border-white" />
            </button>

            {/* Profile + Account switcher */}
            <div className="relative">
              <button id="profile-btn" onClick={() => setProfileMenuOpen(v => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: "rgb(5,22,80)" }}>
                  {session?.user?.name?.slice(0, 2).toUpperCase() ?? "GR"}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {session?.user?.name ?? "Georgi Renström"}
                </span>
                <Icon icon="tabler:chevron-down" className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
              </button>

              <div ref={profileMenuRef} className={clsx(
                "absolute right-0 mt-2 w-60 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden",
                isProfileMenuOpen ? "block" : "hidden"
              )}>
                {/* Account switcher */}
                <div className="px-4 pt-4 pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-400 tracking-widest uppercase">
                      {isEn ? "My Accounts" : "Mina konton"}
                    </span>
                    <Icon icon="tabler:chevron-down" className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <div className="space-y-1">
                    {MOCK_ACCOUNTS.map(acc => (
                      <button key={acc.id}
                        className={clsx(
                          "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                          acc.role === role ? "font-semibold" : "text-gray-600 hover:bg-gray-50"
                        )}
                        style={acc.role === role ? { backgroundColor: "rgb(239,246,255)", color: "rgb(5,22,80)" } : {}}
                      >
                        {acc.role === "employee" && !acc.companyName
                          ? (isEn ? "My Personal Account" : "Mitt personliga konto")
                          : `${acc.label}: ${acc.companyName}`}
                        {acc.role === role && <Icon icon="tabler:check" className="inline w-3.5 h-3.5 ml-2" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100 px-4 py-2">
                  <Link href="/company/dashboard/profile"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    onClick={() => setProfileMenuOpen(false)}>
                    <Icon icon="tabler:user" className="w-4 h-4" />
                    {t.profile ?? "Profile"}
                  </Link>
                  <button onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    <Icon icon="tabler:logout" className="w-4 h-4" />
                    {t.signOut ?? "Sign out"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-100/60 p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Employee selector modal */}
      {employeeSelectorSection && (
        <EmployeeSelector
          employees={MOCK_EMPLOYEES}
          onClose={() => setEmployeeSelectorSection(null)}
          onAction={handleEmployeeAction}
          language={language}
        />
      )}
    </div>
  )
}

export default CompanyDashboardLayout
