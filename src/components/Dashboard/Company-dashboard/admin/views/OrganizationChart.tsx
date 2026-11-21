"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/admin/views/OrganizationChart.tsx   (NEW)
// VIEW:           "organization"  (sidebar → Organisation)
// WHAT IT DOES:   The company as a connected tree, so the business admin can see at a glance
//                 who works here and who reports to whom:
//                   Company (you) → Departments → Managers → Employees
//   • The department level only appears when your managers have a department set
//     (Managers → Edit, or the manager's own settings). Managers without one go under "No department".
//   • Click a manager / employee card → their profile. The chat icon opens a chat with them.
//   • Search highlights matches, ⊖ / ⊕ fold a branch, zoom + drag to move around.
//   • An employee who works with several of your managers shows under each of them (+1 chip).
// DATA:           existing routes only — no new API:
//   GET /api/company/admin/managers · GET /api/company/admin/employees · GET /api/company/admin/settings
// ══════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import type React from "react"
import { Icon } from "@iconify/react"
import { useSession } from "next-auth/react"
import { useBusinessAdmin } from "../Businessadmincontext"
import { useBusinessAdminTranslations } from "@/utils/Businessadmintranslations"
import { managersApi, type ManagerRow } from "@/utils/adminManagers"
import { employeesApi, type EmployeeRow } from "@/utils/adminEmployees"

/* ─────────────────────────────────────────────
   TEXT
───────────────────────────────────────────── */
const TEXT = {
  sv: {
    title: "Organisation",
    intro: "Hela företaget som ett träd — vem som arbetar här, vem som leder vem och vem som gör vad.",
    company: "Företaget",
    you: "Du",
    businessAdmin: "Företagsadmin",
    manager: "Chef",
    employee: "Medarbetare",
    noDepartment: "Ingen avdelning",
    managers: (n: number) => `${n} ${n === 1 ? "chef" : "chefer"}`,
    employees: (n: number) => `${n} ${n === 1 ? "medarbetare" : "medarbetare"}`,
    departments: "Avdelningar",
    managersStat: "Chefer",
    employeesStat: "Medarbetare",
    pendingStat: "Väntande inbjudningar",
    onlineStat: "Online nu",
    pending: (n: number) => `${n} väntar`,
    noEmployees: "Inga medarbetare ännu",
    showMore: (n: number) => `Visa ${n} till`,
    showLess: "Visa färre",
    search: "Sök namn, roll, e-post eller avdelning…",
    matches: (n: number) => `${n} ${n === 1 ? "träff" : "träffar"}`,
    noMatches: "Inga träffar",
    expandAll: "Visa alla",
    collapseAll: "Fäll ihop",
    fit: "Anpassa",
    zoomIn: "Zooma in",
    zoomOut: "Zooma ut",
    showEmployees: "Visa medarbetare",
    open: "Öppna profil",
    chat: "Chatta",
    online: "Online",
    lastSeen: "Senast aktiv",
    never: "Har inte loggat in än",
    inactive: "Inaktiv",
    notActivated: "Ej aktiverad",
    alsoWith: "Arbetar även med",
    emptyTitle: "Ingen organisation att visa än",
    emptyDesc: "Skapa din första chef så växer trädet här — medarbetare som ansluter till cheferna visas under dem.",
    createManager: "Skapa chef",
    error: "Det gick inte att ladda organisationen.",
    retry: "Försök igen",
    hint: "Dra för att flytta · Ctrl + scroll för att zooma",
    legend: { company: "Företag", department: "Avdelning", manager: "Chef", employee: "Medarbetare" },
  },
  en: {
    title: "Organization",
    intro: "The whole company as a tree — who works here, who leads whom and who does what.",
    company: "Company",
    you: "You",
    businessAdmin: "Business Admin",
    manager: "Manager",
    employee: "Employee",
    noDepartment: "No department",
    managers: (n: number) => `${n} ${n === 1 ? "manager" : "managers"}`,
    employees: (n: number) => `${n} ${n === 1 ? "employee" : "employees"}`,
    departments: "Departments",
    managersStat: "Managers",
    employeesStat: "Employees",
    pendingStat: "Pending invitations",
    onlineStat: "Online now",
    pending: (n: number) => `${n} pending`,
    noEmployees: "No employees yet",
    showMore: (n: number) => `Show ${n} more`,
    showLess: "Show less",
    search: "Search name, role, email or department…",
    matches: (n: number) => `${n} ${n === 1 ? "match" : "matches"}`,
    noMatches: "No matches",
    expandAll: "Expand all",
    collapseAll: "Collapse all",
    fit: "Fit",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    showEmployees: "Show employees",
    open: "Open profile",
    chat: "Chat",
    online: "Online",
    lastSeen: "Last active",
    never: "Hasn't signed in yet",
    inactive: "Inactive",
    notActivated: "Not activated",
    alsoWith: "Also works with",
    emptyTitle: "No organization to show yet",
    emptyDesc: "Create your first manager and the tree grows here — employees who connect to your managers appear under them.",
    createManager: "Create manager",
    error: "Couldn't load the organization.",
    retry: "Try again",
    hint: "Drag to move · Ctrl + scroll to zoom",
    legend: { company: "Company", department: "Department", manager: "Manager", employee: "Employee" },
  },
} as const
type Txt = (typeof TEXT)["sv"] | (typeof TEXT)["en"]

/* ─────────────────────────────────────────────
   LOOK
───────────────────────────────────────────── */
type Tone = "company" | "department" | "manager" | "employee"
const TONE: Record<Tone, string> = {
  company: "rgb(5,22,80)", // VeroCV navy
  department: "#1e40af",
  manager: "#2563eb",
  employee: "#059669",
}
const AVATAR_COLORS: readonly (readonly [bg: string, fg: string])[] = [
  ["#dbeafe", "#1e3a8a"], ["#dcfce7", "#166534"], ["#fef3c7", "#92400e"], ["#fce7f3", "#9d174d"],
  ["#ede9fe", "#5b21b6"], ["#cffafe", "#155e75"], ["#ffedd5", "#9a3412"], ["#e0e7ff", "#3730a3"],
]
const avatarColor = (seed: string) => {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length] ?? (["#dbeafe", "#1e3a8a"] as const)
}
const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "?"

const ONLINE_MS = 3 * 60_000
const isOnline = (at: string | null) => !!at && Date.now() - new Date(at).getTime() < ONLINE_MS
const fmtSeen = (at: string | null, lang: "sv" | "en", t: Txt) => {
  if (!at) return t.never
  if (isOnline(at)) return t.online
  return `${t.lastSeen}: ${new Date(at).toLocaleString(lang === "sv" ? "sv-SE" : "en-GB", { dateStyle: "medium", timeStyle: "short" })}`
}

const CARD_W = 236
const MGR_INSET = 22 // space on each side of a manager card; employee cards are indented by 2× this
const RAIL_X = 30 // x of the employee rail (under the left part of the manager card)
const EMP_PREVIEW = 5 // employees shown per manager before "Show more"

/* ─────────────────────────────────────────────
   TREE MODEL
───────────────────────────────────────────── */
interface Company {
  name: string
  adminName: string
  adminTitle: string
  logo: string | null
}
interface DeptNode {
  key: string
  name: string
  managers: ManagerRow[]
}

const norm = (s: string) => s.toLocaleLowerCase("sv").normalize("NFD").replace(/[̀-ͯ]/g, "")

/* ─────────────────────────────────────────────
   CARD
───────────────────────────────────────────── */
function Card({
  tone, role, name, sub, avatar, online, seenLabel, badge, dim, hit, onOpen, onChat, t,
}: {
  tone: Tone
  role: string
  name: string
  sub?: React.ReactNode
  avatar: React.ReactNode
  online?: boolean | undefined
  seenLabel?: string | undefined
  badge?: string | undefined
  dim?: boolean | undefined
  hit?: boolean | undefined
  onOpen?: (() => void) | undefined
  onChat?: (() => void) | undefined
  t: Txt
}) {
  const clickable = !!onOpen
  return (
    <div
      data-card
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={(e) => { if (clickable && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onOpen?.() } }}
      title={clickable ? t.open : undefined}
      style={{ width: CARD_W }}
      className={[
        "group relative mx-auto flex overflow-hidden rounded-xl border bg-white text-left shadow-sm transition-all duration-200",
        clickable ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400" : "",
        hit ? "ring-2 ring-amber-400 ring-offset-2" : "",
        dim ? "opacity-35" : "",
        "border-slate-200",
      ].join(" ")}
    >
      {/* Avatar */}
      <div className="relative flex w-[60px] flex-shrink-0 items-center justify-center bg-slate-50 border-r border-slate-100">
        {avatar}
        {online !== undefined && (
          <span
            title={seenLabel}
            className={`absolute bottom-2 right-2 h-2.5 w-2.5 rounded-full ring-2 ring-white ${online ? "bg-emerald-500" : "bg-slate-300"}`}
          />
        )}
      </div>
      {/* Text */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ backgroundColor: TONE[tone] }}>
          <span className="truncate text-[10.5px] font-bold uppercase tracking-wide text-white" title={role}>{role}</span>
          {badge && (
            <span className="ml-auto flex-shrink-0 rounded-full bg-white/90 px-1.5 py-px text-[9px] font-bold uppercase text-slate-700">{badge}</span>
          )}
        </div>
        <div className="px-3 py-2">
          <div className="truncate text-sm font-semibold text-slate-800" title={name}>{name}</div>
          {sub && <div className="mt-0.5 truncate text-[11.5px] text-slate-500">{sub}</div>}
        </div>
      </div>
      {onChat && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onChat() }}
          title={t.chat}
          aria-label={`${t.chat}: ${name}`}
          className="absolute right-1.5 bottom-1.5 rounded-md p-1 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-blue-700 focus:opacity-100 group-hover:opacity-100"
        >
          <Icon icon="tabler:message-circle" className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

const PersonAvatar = ({ name, size = 40 }: { name: string; size?: number }) => {
  const [bg, fg] = avatarColor(name)
  return (
    <div
      className="flex items-center justify-center rounded-full text-xs font-bold"
      style={{ width: size, height: size, backgroundColor: bg, color: fg }}
      aria-hidden
    >
      {initials(name)}
    </div>
  )
}

/** The small ⊖ / ⊕ circle that sits on the connector line. */
const FoldButton = ({ open, onClick, className = "", label, style }: { open: boolean; onClick: () => void; className?: string; label: string; style?: React.CSSProperties | undefined }) => (
  <button
    type="button"
    style={style}
    onClick={(e) => { e.stopPropagation(); onClick() }}
    aria-expanded={open}
    aria-label={label}
    title={label}
    className={`absolute z-10 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-slate-300 bg-white text-slate-500 hover:border-blue-500 hover:text-blue-700 ${className}`}
  >
    <Icon icon={open ? "tabler:minus" : "tabler:plus"} className="h-2.5 w-2.5" />
  </button>
)

/* ─────────────────────────────────────────────
   MAIN
───────────────────────────────────────────── */
export default function OrganizationChart() {
  const { language } = useBusinessAdminTranslations()
  const lang: "sv" | "en" = language === "en" ? "en" : "sv"
  const t: Txt = TEXT[lang]
  const { data: session } = useSession()
  const { openManagerProfile, openEmployeeProfile, openChat, setView } = useBusinessAdmin()

  const [managers, setManagers] = useState<ManagerRow[] | null>(null)
  const [employees, setEmployees] = useState<EmployeeRow[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [error, setError] = useState(false)

  const [query, setQuery] = useState("")
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [showAllEmp, setShowAllEmp] = useState<Set<string>>(new Set())
  const [showEmployees, setShowEmployees] = useState(true)

  /* ── Load ── */
  const load = useCallback(async () => {
    setError(false)
    try {
      const [m, e, s] = await Promise.all([
        managersApi.list(),
        employeesApi.list().catch(() => ({ data: [] as EmployeeRow[] })),
        fetch("/api/company/admin/settings", { credentials: "include", cache: "no-store" })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ])
      const d = s?.data
      const adminName = [d?.firstName, d?.lastName].filter(Boolean).join(" ").trim() || session?.user?.name || ""
      setCompany({
        name: d?.company?.companyName || "",
        adminName,
        adminTitle: d?.jobTitle || "",
        logo: d?.company?.logo || null,
      })
      setEmployees(e.data)
      setManagers(m)
    } catch {
      setError(true)
      setManagers([])
    }
  }, [session?.user?.name])
  useEffect(() => { load() }, [load])

  /* ── Build the tree ── */
  const empByManager = useMemo(() => {
    const map = new Map<string, EmployeeRow[]>()
    for (const e of employees) for (const m of e.managers) {
      if (!map.has(m.id)) map.set(m.id, [])
      map.get(m.id)!.push(e)
    }
    for (const list of map.values()) list.sort((a, b) => a.name.localeCompare(b.name, "sv"))
    return map
  }, [employees])

  const departments: DeptNode[] = useMemo(() => {
    const groups = new Map<string, DeptNode>()
    for (const m of managers ?? []) {
      const name = m.department.trim()
      const key = name ? norm(name) : "__none__"
      if (!groups.has(key)) groups.set(key, { key, name: name || t.noDepartment, managers: [] })
      groups.get(key)!.managers.push(m)
    }
    for (const g of groups.values()) g.managers.sort((a, b) => a.name.localeCompare(b.name, "sv"))
    return [...groups.values()].sort((a, b) =>
      a.key === "__none__" ? 1 : b.key === "__none__" ? -1 : a.name.localeCompare(b.name, "sv"),
    )
  }, [managers, t.noDepartment])
  // Show the department level only when at least one manager has a department.
  const useDeptLevel = departments.some((d) => d.key !== "__none__")

  /* ── Search ── */
  const q = norm(query.trim())
  const matchManager = (m: ManagerRow) =>
    !!q && [m.name, m.email, m.jobTitle, m.department].some((v) => norm(v || "").includes(q))
  const matchEmployee = (e: EmployeeRow) =>
    !!q && [e.name, e.email, e.title].some((v) => norm(v || "").includes(q))
  const matchDept = (d: DeptNode) => !!q && norm(d.name).includes(q)
  const matchCount = useMemo(() => {
    if (!q) return 0
    const empHits = employees.filter((e) => [e.name, e.email, e.title].some((v) => norm(v || "").includes(q))).length
    const mgrHits = (managers ?? []).filter((m) => [m.name, m.email, m.jobTitle, m.department].some((v) => norm(v || "").includes(q))).length
    return empHits + mgrHits
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, employees, managers])

  /* ── Folding ── */
  const isOpen = (id: string) => (q ? true : !collapsed.has(id)) // searching opens everything
  const toggle = (id: string) =>
    setCollapsed((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const expandAll = () => { setCollapsed(new Set()); setShowEmployees(true) }
  // Fold one level down: departments (or managers when there are no departments) stay visible.
  const collapseAll = () =>
    setCollapsed(new Set(useDeptLevel ? departments.map((d) => `d:${d.key}`) : (managers ?? []).map((m) => `m:${m.id}`)))

  /* ── Zoom + pan ── */
  const viewportRef = useRef<HTMLDivElement>(null)
  const treeRef = useRef<HTMLDivElement>(null)
  const [natural, setNatural] = useState({ w: 0, h: 0 })
  const [scale, setScale] = useState(1)
  const fittedOnce = useRef(false)

  useLayoutEffect(() => {
    const el = treeRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setNatural({ w: el.offsetWidth, h: el.offsetHeight }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [managers])

  const clampScale = (s: number) => Math.min(1.5, Math.max(0.35, Math.round(s * 100) / 100))
  const fit = useCallback(() => {
    const vp = viewportRef.current
    if (!vp || !natural.w) return
    const s = clampScale(Math.min(1, (vp.clientWidth - 32) / natural.w))
    setScale(s)
    requestAnimationFrame(() => {
      vp.scrollLeft = (vp.scrollWidth - vp.clientWidth) / 2
      vp.scrollTop = 0
    })
  }, [natural.w])
  useEffect(() => {
    if (!fittedOnce.current && natural.w && managers?.length) { fittedOnce.current = true; fit() }
  }, [natural.w, managers, fit])

  // Ctrl / ⌘ + wheel zooms (plain wheel scrolls as usual).
  useEffect(() => {
    const vp = viewportRef.current
    if (!vp) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      setScale((s) => clampScale(s * (e.deltaY < 0 ? 1.1 : 0.9)))
    }
    vp.addEventListener("wheel", onWheel, { passive: false })
    return () => vp.removeEventListener("wheel", onWheel)
  }, [managers])

  // Drag the background to move around.
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest("[data-card],button,a,input")) return
    const vp = viewportRef.current!
    drag.current = { x: e.clientX, y: e.clientY, left: vp.scrollLeft, top: vp.scrollTop }
    setDragging(true)
      ; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const vp = viewportRef.current!
    vp.scrollLeft = drag.current.left - (e.clientX - drag.current.x)
    vp.scrollTop = drag.current.top - (e.clientY - drag.current.y)
  }
  const endDrag = () => { drag.current = null; setDragging(false) }

  /* ── Stats ── */
  const stats = useMemo(() => {
    const ms = managers ?? []
    const people = [...ms.map((m) => m.lastSeenAt), ...employees.map((e) => e.lastSeenAt)]
    return {
      departments: departments.filter((d) => d.key !== "__none__").length,
      managers: ms.length,
      employees: employees.length,
      pending: ms.reduce((a, m) => a + (m.pendingInvitations || 0), 0),
      online: people.filter((at) => isOnline(at)).length,
    }
  }, [managers, employees, departments])

  /* ─────────── RENDER PIECES ─────────── */
  const renderEmployees = (m: ManagerRow) => {
    const list = empByManager.get(m.id) ?? []
    const all = showAllEmp.has(m.id) || !!q
    const shown = all ? list : list.slice(0, EMP_PREVIEW)
    const rest = list.length - shown.length
    if (!list.length) {
      return (
        <div className="mx-auto mt-2 text-center text-[11.5px] italic text-slate-400" style={{ width: CARD_W }}>
          {t.noEmployees}
        </div>
      )
    }
    const rows: React.ReactNode[] = shown.map((e) => {
      const others = e.managers.filter((x) => x.id !== m.id)
      const hit = matchEmployee(e)
      return (
        <Card
          key={e.id}
          t={t}
          tone="employee"
          role={e.title || t.employee}
          name={e.name}
          sub={
            <span className="flex items-center gap-1.5">
              <span className="truncate">{e.email}</span>
              {others.length > 0 && (
                <span
                  className="flex-shrink-0 rounded-full bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-600"
                  title={`${t.alsoWith}: ${others.map((o) => o.name).join(", ")}`}
                >
                  +{others.length}
                </span>
              )}
            </span>
          }
          avatar={<PersonAvatar name={e.name} />}
          online={isOnline(e.lastSeenAt)}
          seenLabel={fmtSeen(e.lastSeenAt, lang, t)}
          hit={hit}
          dim={!!q && !hit}
          onOpen={() => openEmployeeProfile(e.id)}
          onChat={() => openChat(e.id)}
        />
      )
    })
    if (rest > 0 || (showAllEmp.has(m.id) && list.length > EMP_PREVIEW && !q)) {
      rows.push(
        <button
          key="__more"
          type="button"
          onClick={() => setShowAllEmp((s) => { const n = new Set(s); if (n.has(m.id)) n.delete(m.id); else n.add(m.id); return n })}
          className="rounded-lg border border-dashed border-slate-300 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-blue-400 hover:text-blue-700"
        >
          {rest > 0 ? t.showMore(rest) : t.showLess}
        </button>,
      )
    }
    // Vertical rail under the manager's avatar with a short branch to each card (like the picture).
    return (
      <div className="mx-auto text-left" style={{ width: CARD_W + 2 * MGR_INSET }}>
        {rows.map((node, i) => {
          const last = i === rows.length - 1
          return (
            <div key={i} className="relative pt-2.5" style={{ paddingLeft: 2 * MGR_INSET }}>
              <span className="absolute top-0 border-l-2 border-slate-300" style={{ left: RAIL_X - 1, height: last ? "calc(50% + 5px)" : "100%" }} />
              <span className="absolute border-t-2 border-slate-300" style={{ left: RAIL_X - 1, width: 2 * MGR_INSET - RAIL_X + 1, top: "calc(50% + 4px)" }} />
              {node}
            </div>
          )
        })}
      </div>
    )
  }

  const renderManager = (m: ManagerRow) => {
    const count = empByManager.get(m.id)?.length ?? 0
    const open = showEmployees && isOpen(`m:${m.id}`)
    const hit = matchManager(m)
    const subtreeHit = hit || (empByManager.get(m.id) ?? []).some(matchEmployee)
    return (
      <li key={m.id}>
        <div className="relative mx-auto" style={{ width: CARD_W + 2 * MGR_INSET }}>
          <div style={{ marginLeft: MGR_INSET, width: CARD_W }}>
            <Card
              t={t}
              tone="manager"
              role={m.jobTitle || t.manager}
              name={m.name}
              sub={
                <span className="flex items-center gap-1.5">
                  <Icon icon="tabler:users" className="h-3.5 w-3.5 flex-shrink-0" />
                  {t.employees(count)}
                  {m.pendingInvitations > 0 && (
                    <span className="rounded-full bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-800">
                      {t.pending(m.pendingInvitations)}
                    </span>
                  )}
                </span>
              }
              avatar={<PersonAvatar name={m.name} />}
              online={isOnline(m.lastSeenAt)}
              seenLabel={fmtSeen(m.lastSeenAt, lang, t)}
              badge={m.status === "inactive" ? t.inactive : m.status === "pending" ? t.notActivated : undefined}
              hit={hit}
              dim={(!!q && !subtreeHit) || m.status === "inactive"}
              onOpen={() => openManagerProfile(m.id)}
              onChat={() => openChat(m.id)}
            />
          </div>
          {showEmployees && count > 0 && !q && (
            <FoldButton
              open={open}
              onClick={() => toggle(`m:${m.id}`)}
              className="-bottom-[9px]"
              style={{ left: RAIL_X - 9 }}
              label={m.name}
            />
          )}
        </div>
        {open && renderEmployees(m)}
      </li>
    )
  }

  const renderDept = (d: DeptNode) => {
    const id = `d:${d.key}`
    const open = isOpen(id)
    const empCount = new Set(d.managers.flatMap((m) => (empByManager.get(m.id) ?? []).map((e) => e.id))).size
    const subtreeHit =
      matchDept(d) || d.managers.some((m) => matchManager(m) || (empByManager.get(m.id) ?? []).some(matchEmployee))
    return (
      <li key={d.key}>
        <div className="relative mx-auto" style={{ width: CARD_W }}>
          <Card
            t={t}
            tone="department"
            role={d.name}
            name={t.managers(d.managers.length)}
            sub={t.employees(empCount)}
            avatar={
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-800">
                <Icon icon={d.key === "__none__" ? "tabler:folder-question" : "tabler:building-community"} className="h-5 w-5" />
              </div>
            }
            hit={matchDept(d)}
            dim={!!q && !subtreeHit}
          />
          {!q && (
            <FoldButton open={open} onClick={() => toggle(id)} className="-bottom-[9px] left-1/2 -translate-x-1/2" label={d.name} />
          )}
        </div>
        {open && <ul>{d.managers.map(renderManager)}</ul>}
      </li>
    )
  }

  /* ─────────── STATES ─────────── */
  if (managers === null) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
        <div className="h-[420px] animate-pulse rounded-2xl bg-white" />
      </div>
    )
  }

  const companyName = company?.name || t.company
  const rootOpen = isOpen("root")

  return (
    <div className="space-y-5">
      <style>{TREE_CSS}</style>

      {/* Heading */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{t.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{t.intro}</p>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          {(["company", "department", "manager", "employee"] as Tone[])
            .filter((k) => k !== "department" || useDeptLevel)
            .map((k) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: TONE[k] }} />
                {t.legend[k]}
              </span>
            ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { icon: "tabler:building-community", label: t.departments, value: stats.departments, show: useDeptLevel },
          { icon: "tabler:user-star", label: t.managersStat, value: stats.managers, show: true },
          { icon: "tabler:users", label: t.employeesStat, value: stats.employees, show: true },
          { icon: "tabler:mail-forward", label: t.pendingStat, value: stats.pending, show: true },
          { icon: "tabler:circle-dot", label: t.onlineStat, value: stats.online, show: true },
        ]
          .filter((s) => s.show)
          .map((s) => (
            <div key={s.label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-900">
                <Icon icon={s.icon} className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-semibold leading-tight text-slate-900">{s.value}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            </div>
          ))}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">{t.error}</p>
          <button onClick={load} className="mt-3 rounded-full px-5 py-2 text-sm font-medium text-white" style={{ backgroundColor: TONE.company }}>
            {t.retry}
          </button>
        </div>
      ) : managers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-900">
            <Icon icon="tabler:sitemap" className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">{t.emptyTitle}</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{t.emptyDesc}</p>
          <button onClick={() => setView("create_manager")} className="mt-5 rounded-full px-6 py-2.5 text-sm font-medium text-white" style={{ backgroundColor: TONE.company }}>
            {t.createManager}
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-2.5">
            <div className="relative min-w-[220px] flex-1">
              <Icon icon="tabler:search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.search}
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-24 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-blue-200"
              />
              {q && (
                <span className={`absolute right-8 top-1/2 -translate-y-1/2 text-xs ${matchCount ? "text-slate-500" : "text-red-500"}`}>
                  {matchCount ? t.matches(matchCount) : t.noMatches}
                </span>
              )}
              {query && (
                <button onClick={() => setQuery("")} aria-label="Clear" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-700">
                  <Icon icon="tabler:x" className="h-4 w-4" />
                </button>
              )}
            </div>

            <label className="flex cursor-pointer select-none items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
              <input type="checkbox" checked={showEmployees} onChange={(e) => setShowEmployees(e.target.checked)} className="h-4 w-4 accent-blue-800" />
              {t.showEmployees}
            </label>

            <div className="flex items-center gap-1">
              <ToolBtn icon="tabler:arrows-diagonal" label={t.expandAll} onClick={expandAll} />
              <ToolBtn icon="tabler:arrows-diagonal-minimize-2" label={t.collapseAll} onClick={collapseAll} />
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-0.5">
              <ToolBtn icon="tabler:minus" label={t.zoomOut} onClick={() => setScale((s) => clampScale(s - 0.1))} bare />
              <button onClick={() => setScale(1)} className="w-12 text-center text-xs font-medium text-slate-600 hover:text-slate-900" title="100%">
                {Math.round(scale * 100)}%
              </button>
              <ToolBtn icon="tabler:plus" label={t.zoomIn} onClick={() => setScale((s) => clampScale(s + 0.1))} bare />
              <ToolBtn icon="tabler:maximize" label={t.fit} onClick={fit} bare />
            </div>
          </div>

          {/* Canvas */}
          <div
            ref={viewportRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className={`oc-canvas relative h-[calc(100vh-330px)] min-h-[460px] overflow-auto ${dragging ? "cursor-grabbing select-none" : "cursor-grab"}`}
          >
            <div className="mx-auto overflow-hidden p-6" style={{ width: natural.w * scale + 48, height: natural.h * scale + 48 }}>
              <div
                ref={treeRef}
                className="oc-tree inline-block"
                style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: "max-content" }}
              >
                <ul>
                  <li>
                    <div className="relative mx-auto" style={{ width: CARD_W }}>
                      <Card
                        t={t}
                        tone="company"
                        role={companyName}
                        name={company?.adminName || t.businessAdmin}
                        sub={`${company?.adminTitle || t.businessAdmin} · ${t.you}`}
                        avatar={
                          company?.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={company.logo} alt="" className="h-10 w-10 rounded-md object-contain" />
                          ) : (
                            <PersonAvatar name={companyName} />
                          )
                        }
                        dim={!!q}
                        onOpen={() => setView("account")}
                      />
                      {!q && (
                        <FoldButton open={rootOpen} onClick={() => toggle("root")} className="-bottom-[9px] left-1/2 -translate-x-1/2" label={companyName} />
                      )}
                    </div>
                    {rootOpen && (
                      <ul>
                        {useDeptLevel
                          ? departments.map(renderDept)
                          : (departments[0]?.managers ?? []).map(renderManager)}
                      </ul>
                    )}
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400">{t.hint}</div>
        </div>
      )}
    </div>
  )
}

const ToolBtn = ({ icon, label, onClick, bare }: { icon: string; label: string; onClick: () => void; bare?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    className={`flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 ${bare ? "h-7 w-7" : "h-9 w-9 border border-slate-200"}`}
  >
    <Icon icon={icon} className="h-4 w-4" />
  </button>
)

/* ─────────────────────────────────────────────
   CONNECTOR LINES (classic org-chart CSS)
   ul = one row of children, li = one node. Each li draws half of the horizontal
   bar above it plus the short drop to its card; ul draws the drop from the parent.
───────────────────────────────────────────── */
const LINE = "2px solid #cbd5e1"
const TREE_CSS = `
.oc-canvas {
  background-image: radial-gradient(#e2e8f0 1px, transparent 1px);
  background-size: 18px 18px;
}
.oc-tree ul { position: relative; display: flex; justify-content: center; padding: 26px 0 0; margin: 0; }
.oc-tree > ul { padding-top: 0; }
.oc-tree li { position: relative; list-style: none; padding: 26px 10px 0; display: flex; flex-direction: column; align-items: center; }
.oc-tree > ul > li { padding-top: 0; }
.oc-tree li::before, .oc-tree li::after {
  content: ""; position: absolute; top: 0; right: 50%; width: 50%; height: 26px; border-top: ${LINE};
}
.oc-tree li::after { right: auto; left: 50%; border-left: ${LINE}; }
.oc-tree > ul > li::before, .oc-tree > ul > li::after { display: none; }
.oc-tree li:first-child::before, .oc-tree li:last-child::after { border: 0 none; }
.oc-tree li:last-child:not(:only-child)::before { border-right: ${LINE}; border-radius: 0 10px 0 0; }
.oc-tree li:first-child:not(:only-child)::after { border-radius: 10px 0 0 0; }
/* a single child: just a straight line down */
.oc-tree li:only-child::before { display: none; }
.oc-tree li:only-child::after { border: 0 none; border-left: ${LINE}; border-radius: 0; }
.oc-tree ul ul::before {
  content: ""; position: absolute; top: 0; left: 50%; height: 26px; border-left: ${LINE};
}
.oc-tree li:last-child:not(:only-child)::before { margin-right: -1px; }
`
