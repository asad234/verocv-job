"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Icon } from "@iconify/react"
import Link from "next/link"
import clsx from "clsx"

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
type EmployeeRole = "1.Business Admin" | "2.Manager" | "3.Employee" | "4.Consultant"
type EmployeeStatus = "active" | "inactive" | "pending"

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  role: EmployeeRole
  status: EmployeeStatus
}

/* ─────────────────────────────────────────────
   TRANSLATIONS
───────────────────────────────────────────── */
const pageT = {
  en: {
    welcomeTitle: "Welcome to Business Admin",
    welcomeSubtitle: "Manage your company's team, access and account settings from one place.",
    setupTitle: "Set Up Your Company",
    step1Title: "Upload your company logo",
    step1Desc: "Add your logo — it will appear across all company accounts.",
    step2Title: "Add your first employee",
    step2Desc: "Invite colleagues by work email and assign their role.",
    step3Title: "Configure company settings",
    step3Desc: "Set up permissions, notifications and integrations.",
    step4Title: "View statistics",
    step4Desc: "Track CV performance and placement rates. Coming soon.",
    completionMessage: "Complete all steps to unlock the full platform.",
    employeeAdmin: "Employee Administration",
    addEmployee: "Add employee",
    name: "Name",
    role: "Role",
    status: "Status",
    actions: "Actions",
    addUser: "Add User",
    workEmail: "Work Email",
    emailPlaceholder: "colleague@company.com",
    sendInvite: "Send Invitation",
    inviteSent: "Invitation sent!",
    statistics: "Statistics",
    comingSoon: "Coming Soon",
    comingSoonDesc: "Placement rates, CV performance and team insights — launching soon.",
    companyLogo: "Company Logo",
    logoDesc: "Shared across all company accounts and visible to your team.",
    uploadLogo: "Upload logo",
    removeLogo: "Remove",
    logoHint: "PNG, SVG or JPG · Max 2 MB",
    active: "Active",
    inactive: "Inactive",
    pending: "Pending",
    rolePlaceholder: "Select role",
  },
  sv: {
    welcomeTitle: "Välkommen, Företagsadmin",
    welcomeSubtitle: "Hantera ditt företags team, åtkomst och kontoinställningar från ett ställe.",
    setupTitle: "Konfigurera ditt företag",
    step1Title: "Ladda upp din logotyp",
    step1Desc: "Lägg till logotypen — den visas på alla företagskonton.",
    step2Title: "Lägg till din första medarbetare",
    step2Desc: "Bjud in kollegor via jobbmail och tilldela roller.",
    step3Title: "Konfigurera företagsinställningar",
    step3Desc: "Ställ in behörigheter, notifieringar och integrationer.",
    step4Title: "Se statistik",
    step4Desc: "Följ CV-prestanda och placeringsgrad. Kommer snart.",
    completionMessage: "Slutför alla steg för att låsa upp hela plattformen.",
    employeeAdmin: "Medarbetaradministration",
    addEmployee: "Lägg till medarbetare",
    name: "Namn",
    role: "Roll",
    status: "Status",
    actions: "Åtgärder",
    addUser: "Lägg till användare",
    workEmail: "Jobbmail",
    emailPlaceholder: "kollega@foretaget.se",
    sendInvite: "Skicka inbjudan",
    inviteSent: "Inbjudan skickad!",
    statistics: "Statistik",
    comingSoon: "Kommer snart",
    comingSoonDesc: "Placeringsgrad, CV-prestanda och teaminsikter — lanseras snart.",
    companyLogo: "Företagslogotyp",
    logoDesc: "Delas med alla företagskonton och syns för ditt team.",
    uploadLogo: "Ladda upp logotyp",
    removeLogo: "Ta bort",
    logoHint: "PNG, SVG eller JPG · Max 2 MB",
    active: "Aktiv",
    inactive: "Inaktiv",
    pending: "Väntande",
    rolePlaceholder: "Välj roll",
  },
}

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const NAVY = "rgb(5, 22, 80)"
const NAVY_LIGHT = "rgb(176, 196, 222)"
const NAVY_LIGHTER = "rgb(239, 246, 255)"
const NAVY_BORDER = "rgb(191, 219, 254)"

const ROLE_OPTIONS: EmployeeRole[] = [
  "1.Business Admin",
  "2.Manager",
  "3.Employee",
  "4.Consultant",
]

const STATUS_OPTIONS: EmployeeStatus[] = ["active", "inactive", "pending"]

const statusStyles: Record<EmployeeStatus, { bg: string; text: string; border: string }> = {
  active: { bg: "rgb(240,253,244)", text: "rgb(22,101,52)", border: "rgb(187,247,208)" },
  inactive: { bg: "rgb(248,250,252)", text: "rgb(100,116,139)", border: "rgb(226,232,240)" },
  pending: { bg: "rgb(255,251,235)", text: "rgb(146,64,14)", border: "rgb(253,230,138)" },
}

const MOCK_EMPLOYEES: Employee[] = [
  { id: "1", firstName: "Alexander", lastName: "Blom", email: "a.blom@nordic.se", role: "1.Business Admin", status: "active" },
  { id: "2", firstName: "Lena", lastName: "Larsson", email: "l.larsson@nordic.se", role: "2.Manager", status: "active" },
  { id: "3", firstName: "Lisa", lastName: "Svensson", email: "l.svensson@nordic.se", role: "3.Employee", status: "active" },
]

/* ─────────────────────────────────────────────
   CARD — mirrors existing Card component
───────────────────────────────────────────── */
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={clsx("bg-white rounded-2xl border border-gray-200 shadow-sm", className)}>
    {children}
  </div>
)

/* ─────────────────────────────────────────────
   CARD HEADER
───────────────────────────────────────────── */
const CardHeader: React.FC<{ icon: string; title: string; action?: React.ReactNode }> = ({ icon, title, action }) => (
  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg" style={{ backgroundColor: NAVY }}>
        <Icon icon={icon} className="w-5 h-5 text-white" />
      </div>
      <h2 className="text-lg font-bold" style={{ color: NAVY }}>{title}</h2>
    </div>
    {action}
  </div>
)

/* ─────────────────────────────────────────────
   STEP ROW — mirrors existing DashboardHomePage step rows exactly
───────────────────────────────────────────── */
interface StepRowProps {
  num: number
  title: string
  desc: string
  href?: string
  onClick?: () => void
  disabled?: boolean
  badge?: string
}

const StepRow: React.FC<StepRowProps> = ({ num, title, desc, href, onClick, disabled, badge }) => {
  const inner = (
    <>
      <div
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `rgba(176, 196, 222, 0.3)` }}
      >
        <span className="font-bold" style={{ color: NAVY }}>{num}</span>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3
            className="font-semibold text-gray-800"
            onMouseEnter={e => !disabled && (e.currentTarget.style.color = NAVY)}
            onMouseLeave={e => (e.currentTarget.style.color = "")}
          >
            {title}
          </h3>
          {badge && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 border border-amber-200">
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
      </div>
      <Icon
        icon="tabler:chevron-right"
        className="w-5 h-5 text-gray-400 flex-shrink-0"
        onMouseEnter={e => !disabled && ((e.currentTarget as SVGElement).style.color = NAVY)}
        onMouseLeave={e => ((e.currentTarget as SVGElement).style.color = "")}
      />
    </>
  )

  const baseClass = clsx(
    "group flex items-center gap-4 p-4 rounded-xl border border-gray-200 transition-all",
    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
  )

  const hoverHandlers = disabled ? {} : {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.borderColor = NAVY_LIGHT
      e.currentTarget.style.backgroundColor = `rgba(176, 196, 222, 0.1)`
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.borderColor = ""
      e.currentTarget.style.backgroundColor = ""
    },
  }

  if (href && !disabled) {
    return (
      <Link href={href} className={baseClass} {...hoverHandlers}>
        {inner}
      </Link>
    )
  }

  return (
    <div className={baseClass} onClick={!disabled ? onClick : undefined} {...hoverHandlers}>
      {inner}
    </div>
  )
}

/* ─────────────────────────────────────────────
   EMPLOYEE TABLE
───────────────────────────────────────────── */
interface EmployeeTableProps {
  employees: Employee[]
  t: typeof pageT["en"]
  onRoleChange: (id: string, role: EmployeeRole) => void
  onStatusChange: (id: string, status: EmployeeStatus) => void
  onDelete: (id: string) => void
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({ employees, t, onRoleChange, onStatusChange, onDelete }) => (
  <div>
    {/* Column headers */}
    <div className="grid grid-cols-12 gap-3 px-6 py-3 text-xs font-semibold tracking-widest uppercase text-gray-400 bg-gray-50/70 border-b border-gray-100">
      <div className="col-span-4">{t.name}</div>
      <div className="col-span-4">{t.role}</div>
      <div className="col-span-3">{t.status}</div>
      <div className="col-span-1" />
    </div>

    {/* Rows */}
    {employees.map((emp, i) => {
      const ss = statusStyles[emp.status]
      return (
        <div
          key={emp.id}
          className={clsx(
            "grid grid-cols-12 gap-3 px-6 py-4 items-center hover:bg-blue-50/20 transition-colors",
            i < employees.length - 1 && "border-b border-gray-50",
          )}
        >
          {/* Name + email */}
          <div className="col-span-4 flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: NAVY }}
            >
              {emp.firstName[0]}{emp.lastName[0]}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">
                {emp.firstName} {emp.lastName}
              </div>
              <div className="text-xs text-gray-400 truncate">{emp.email}</div>
            </div>
          </div>

          {/* Role dropdown */}
          <div className="col-span-4">
            <select
              value={emp.role}
              onChange={e => onRoleChange(emp.id, e.target.value as EmployeeRole)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium bg-white text-gray-700 outline-none cursor-pointer transition-all focus:ring-2 focus:ring-blue-200"
            >
              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Status dropdown */}
          <div className="col-span-3">
            <select
              value={emp.status}
              onChange={e => onStatusChange(emp.id, e.target.value as EmployeeStatus)}
              className="w-full px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer outline-none transition-all"
              style={{ color: ss.text, backgroundColor: ss.bg, borderColor: ss.border }}
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>
                  {t[s as keyof typeof t] as string}
                </option>
              ))}
            </select>
          </div>

          {/* Delete */}
          <div className="col-span-1 flex justify-end">
            <button
              onClick={() => onDelete(emp.id)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
            >
              <Icon icon="tabler:trash" className="w-4 h-4" />
            </button>
          </div>
        </div>
      )
    })}
  </div>
)

/* ─────────────────────────────────────────────
   ADD USER CARD
───────────────────────────────────────────── */
const AddUserCard: React.FC<{ t: typeof pageT["en"] }> = ({ t }) => {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<EmployeeRole | "">("")
  const [sent, setSent] = useState(false)

  const handleSend = () => {
    if (!email || !role) return
    setSent(true)
    setTimeout(() => { setSent(false); setEmail(""); setRole("") }, 3000)
  }

  return (
    <Card>
      <CardHeader icon="tabler:user-plus" title={t.addUser} />
      <div className="p-6">
        {sent ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: "rgb(240,253,244)" }}
            >
              <Icon icon="tabler:check" className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-semibold text-gray-800">{t.inviteSent}</p>
            <p className="text-xs text-gray-400 mt-1 truncate max-w-full">{email}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                {t.workEmail}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                {t.role}
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as EmployeeRole)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white text-gray-700 outline-none cursor-pointer focus:ring-2 focus:ring-blue-200 transition-all"
              >
                <option value="">—</option>
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button
              onClick={handleSend}
              disabled={!email || !role}
              className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md hover:opacity-90"
              style={{ backgroundColor: NAVY }}
            >
              {t.sendInvite}
            </button>
          </div>
        )}
      </div>
    </Card>
  )
}

/* ─────────────────────────────────────────────
   COMPANY LOGO CARD
───────────────────────────────────────────── */
const CompanyLogoCard: React.FC<{ t: typeof pageT["en"] }> = ({ t }) => {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
  }

  return (
    <Card>
      <CardHeader icon="tabler:building" title={t.companyLogo} />
      <div className="p-6">
        <div
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/30"
        >
          {preview ? (
            <img src={preview} alt="Logo" className="h-14 object-contain" />
          ) : (
            <>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: NAVY_LIGHTER }}>
                <Icon icon="tabler:upload" className="w-6 h-6" style={{ color: NAVY }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">{t.uploadLogo}</p>
                <p className="text-xs text-gray-400 mt-1">{t.logoHint}</p>
              </div>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        {preview && (
          <button
            onClick={() => setPreview(null)}
            className="mt-3 text-xs text-gray-400 hover:text-red-500 transition-colors w-full text-center"
          >
            {t.removeLogo}
          </button>
        )}
        <p className="text-xs text-gray-400 mt-3 text-center leading-relaxed">{t.logoDesc}</p>
      </div>
    </Card>
  )
}

/* ─────────────────────────────────────────────
   STATISTICS PLACEHOLDER
───────────────────────────────────────────── */
const StatisticsCard: React.FC<{ t: typeof pageT["en"] }> = ({ t }) => (
  <Card>
    <CardHeader icon="tabler:chart-bar" title={t.statistics} />
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: NAVY_LIGHTER }}
      >
        <Icon icon="tabler:rocket" className="w-7 h-7" style={{ color: NAVY }} />
      </div>
      <span
        className="text-sm font-semibold tracking-widest uppercase px-4 py-2 rounded-full border mb-3"
        style={{ color: NAVY, backgroundColor: NAVY_LIGHTER, borderColor: NAVY_BORDER }}
      >
        {t.comingSoon}
      </span>
      <p className="text-xs text-gray-400 max-w-xs leading-relaxed">{t.comingSoonDesc}</p>
    </div>
  </Card>
)

/* ─────────────────────────────────────────────
   MAIN PAGE — mirrors DashboardHomePage layout exactly
───────────────────────────────────────────── */
interface BusinessAdminDashboardProps {
  language?: "en" | "sv"
}

const BusinessAdminDashboard: React.FC<BusinessAdminDashboardProps> = ({ language = "sv" }) => {
  const t = pageT[language]
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES)
  const [showAddRow, setShowAddRow] = useState(false)
  const [newRow, setNewRow] = useState({ email: "", role: "" as EmployeeRole | "" })

  const handleRoleChange = (id: string, role: EmployeeRole) =>
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, role } : e))

  const handleStatusChange = (id: string, status: EmployeeStatus) =>
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, status } : e))

  const handleDelete = (id: string) =>
    setEmployees(prev => prev.filter(e => e.id !== id))

  const handleAddRow = () => {
    if (!newRow.email || !newRow.role) return
    const parts = newRow.email.split("@")[0]?.split(".") ?? ["New", "User"]
    setEmployees(prev => [...prev, {
      id: Date.now().toString(),
      firstName: parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : "New",
      lastName: parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : "User",
      email: newRow.email,
      role: newRow.role as EmployeeRole,
      status: "pending",
    }])
    setNewRow({ email: "", role: "" })
    setShowAddRow(false)
  }

  return (
    <div className="p-4 sm:p-6 m-2 sm:m-4 min-h-screen">

      {/* ── Welcome — identical structure to DashboardHomePage ── */}
      <div className="mb-6 text-center mx-auto w-full md:w-[80%] lg:w-[60%]">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{t.welcomeTitle}</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">{t.welcomeSubtitle}</p>
      </div>

      {/* ── Two-column layout — same flex structure as original ── */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 h-full">

        {/* ════ LEFT 60% ════ */}
        <div className="w-full lg:w-[60%] space-y-4 sm:space-y-6 flex-grow">

          {/* Setup steps card — mirrors "Get Started" card exactly */}
          <Card className="p-6">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-2 rounded-lg" style={{ backgroundColor: NAVY }}>
                <Icon icon="tabler:rocket" className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold" style={{ color: NAVY }}>{t.setupTitle}</h2>
            </div>

            <div className="space-y-4">
              <StepRow
                num={1}
                title={t.step1Title}
                desc={t.step1Desc}
                href="/company/dashboard/settings/company"
              />
              <StepRow
                num={2}
                title={t.step2Title}
                desc={t.step2Desc}
                href="/company/dashboard/invitation"
              />
              <StepRow
                num={3}
                title={t.step3Title}
                desc={t.step3Desc}
                href="/company/dashboard/settings/company"
              />
              <StepRow
                num={4}
                title={t.step4Title}
                desc={t.step4Desc}
                disabled
                badge={language === "en" ? "Soon" : "Snart"}
              />
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">{t.completionMessage}</p>
            </div>
          </Card>

          {/* Employee Administration table card */}
          <Card>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: NAVY }}>
                  <Icon icon="tabler:users-group" className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold" style={{ color: NAVY }}>{t.employeeAdmin}</h2>
              </div>
              {/* + button — teal like wireframe */}
              <button
                onClick={() => setShowAddRow(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all hover:shadow-md hover:scale-105"
                style={{ backgroundColor: "rgb(20,184,166)" }}
              >
                <Icon icon="tabler:plus" className="w-5 h-5" />
              </button>
            </div>

            <EmployeeTable
              employees={employees}
              t={t}
              onRoleChange={handleRoleChange}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />

            {/* Inline add row */}
            {showAddRow && (
              <div className="px-6 py-4 border-t border-blue-100 bg-blue-50/40">
                <div className="flex items-center gap-3">
                  <input
                    type="email"
                    placeholder={t.emailPlaceholder}
                    value={newRow.email}
                    onChange={e => setNewRow(r => ({ ...r, email: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                  <select
                    value={newRow.role}
                    onChange={e => setNewRow(r => ({ ...r, role: e.target.value as EmployeeRole }))}
                    className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white outline-none cursor-pointer"
                  >
                    <option value="">—</option>
                    {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button
                    onClick={handleAddRow}
                    className="px-4 py-2 rounded-xl text-white text-sm font-semibold hover:shadow-md transition-all"
                    style={{ backgroundColor: NAVY }}
                  >
                    {t.addEmployee}
                  </button>
                  <button
                    onClick={() => setShowAddRow(false)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <Icon icon="tabler:x" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Add employee link row */}
            {!showAddRow && (
              <div className="px-6 py-4 border-t border-gray-50">
                <button
                  onClick={() => setShowAddRow(true)}
                  className="flex items-center gap-2 text-sm font-medium transition-all hover:opacity-70"
                  style={{ color: NAVY }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: "rgb(20,184,166)" }}
                  >
                    <Icon icon="tabler:plus" className="w-4 h-4" />
                  </div>
                  {t.addEmployee}
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* ════ RIGHT 40% ════ */}
        <div className="w-full lg:w-[40%] space-y-4 sm:space-y-6 flex-grow">
          <AddUserCard t={t} />
          <CompanyLogoCard t={t} />
          <StatisticsCard t={t} />
        </div>
      </div>
    </div>
  )
}

export default BusinessAdminDashboard
