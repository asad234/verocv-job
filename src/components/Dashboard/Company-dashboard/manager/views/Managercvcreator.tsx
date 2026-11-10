"use client"

import type React from "react"
import { useState } from "react"
import { Icon } from "@iconify/react"
import clsx from "clsx"
import { useManagerTranslations } from "@/utils/Managertranslations"

/* ─── Types ─── */
interface CVSection { count: number; visible: boolean }

interface ManagedCV {
  id: string
  name: string
  employeeId: string
  employeeName: string
  employeeInitials: string
  employeeTitle: string
  template: string
  isPublic: boolean
  updatedAt: string
  createdAt: string
  sections: {
    experience: CVSection
    education: CVSection
    skills: CVSection
    projects: CVSection
    languages: CVSection
    certifications: CVSection
    references: CVSection
    portfolio: CVSection
  }
}

type SortKey = "updated" | "created" | "name" | "employee"

/* ─── Constants ─── */
const NAVY = "rgb(5,22,80)"
const LIGHT = "rgb(239,246,255)"

/* ─── Mock Data ─── */
const MOCK_CVS: ManagedCV[] = [
  {
    id: "cv1", name: "Emma Larsson CV_2", employeeId: "1",
    employeeName: "Emma Larsson", employeeInitials: "EL", employeeTitle: "Frontend Developer",
    template: "modern", isPublic: true, updatedAt: "2026-05-27T10:22:00Z", createdAt: "2026-03-01T09:00:00Z",
    sections: { experience: { count: 4, visible: true }, education: { count: 2, visible: true }, skills: { count: 10, visible: true }, projects: { count: 3, visible: true }, languages: { count: 3, visible: true }, certifications: { count: 2, visible: true }, references: { count: 2, visible: true }, portfolio: { count: 5, visible: true } },
  },
  {
    id: "cv2", name: "Emma Larsson CV_1", employeeId: "1",
    employeeName: "Emma Larsson", employeeInitials: "EL", employeeTitle: "Frontend Developer",
    template: "classic", isPublic: false, updatedAt: "2026-03-25T14:10:00Z", createdAt: "2026-01-10T08:00:00Z",
    sections: { experience: { count: 3, visible: true }, education: { count: 2, visible: true }, skills: { count: 7, visible: true }, projects: { count: 2, visible: true }, languages: { count: 2, visible: true }, certifications: { count: 1, visible: true }, references: { count: 1, visible: true }, portfolio: { count: 2, visible: true } },
  },
  {
    id: "cv3", name: "Lars Svensson CV_1", employeeId: "2",
    employeeName: "Lars Svensson", employeeInitials: "LS", employeeTitle: "Backend Engineer",
    template: "modern", isPublic: false, updatedAt: "2026-05-20T11:45:00Z", createdAt: "2026-02-14T10:00:00Z",
    sections: { experience: { count: 5, visible: true }, education: { count: 1, visible: true }, skills: { count: 6, visible: true }, projects: { count: 4, visible: true }, languages: { count: 2, visible: true }, certifications: { count: 2, visible: true }, references: { count: 2, visible: true }, portfolio: { count: 1, visible: true } },
  },
  {
    id: "cv4", name: "Anna Björk CV_2", employeeId: "3",
    employeeName: "Anna Björk", employeeInitials: "AB", employeeTitle: "UX Designer",
    template: "creative", isPublic: true, updatedAt: "2026-05-28T09:00:00Z", createdAt: "2026-02-28T08:30:00Z",
    sections: { experience: { count: 6, visible: true }, education: { count: 2, visible: true }, skills: { count: 8, visible: true }, projects: { count: 5, visible: true }, languages: { count: 3, visible: true }, certifications: { count: 2, visible: true }, references: { count: 3, visible: true }, portfolio: { count: 8, visible: true } },
  },
  {
    id: "cv5", name: "Anna Björk CV_1", employeeId: "3",
    employeeName: "Anna Björk", employeeInitials: "AB", employeeTitle: "UX Designer",
    template: "modern", isPublic: false, updatedAt: "2026-03-10T13:20:00Z", createdAt: "2026-01-20T07:45:00Z",
    sections: { experience: { count: 5, visible: true }, education: { count: 2, visible: true }, skills: { count: 6, visible: true }, projects: { count: 4, visible: true }, languages: { count: 3, visible: true }, certifications: { count: 1, visible: true }, references: { count: 2, visible: true }, portfolio: { count: 6, visible: true } },
  },
  {
    id: "cv6", name: "Marcus Holm CV_1", employeeId: "4",
    employeeName: "Marcus Holm", employeeInitials: "MH", employeeTitle: "Project Manager",
    template: "classic", isPublic: false, updatedAt: "2026-05-15T16:30:00Z", createdAt: "2026-04-01T11:00:00Z",
    sections: { experience: { count: 7, visible: true }, education: { count: 2, visible: true }, skills: { count: 5, visible: true }, projects: { count: 3, visible: true }, languages: { count: 2, visible: true }, certifications: { count: 2, visible: true }, references: { count: 3, visible: true }, portfolio: { count: 0, visible: true } },
  },
  {
    id: "cv7", name: "Sofia Lindgren CV_2", employeeId: "5",
    employeeName: "Sofia Lindgren", employeeInitials: "SL", employeeTitle: "Data Analyst",
    template: "modern", isPublic: true, updatedAt: "2026-05-29T08:15:00Z", createdAt: "2026-02-05T09:30:00Z",
    sections: { experience: { count: 4, visible: true }, education: { count: 2, visible: true }, skills: { count: 9, visible: true }, projects: { count: 3, visible: true }, languages: { count: 3, visible: true }, certifications: { count: 2, visible: true }, references: { count: 2, visible: true }, portfolio: { count: 4, visible: true } },
  },
  {
    id: "cv8", name: "Sofia Lindgren CV_1", employeeId: "5",
    employeeName: "Sofia Lindgren", employeeInitials: "SL", employeeTitle: "Data Analyst",
    template: "creative", isPublic: false, updatedAt: "2026-04-12T14:00:00Z", createdAt: "2026-01-30T10:15:00Z",
    sections: { experience: { count: 3, visible: true }, education: { count: 2, visible: true }, skills: { count: 6, visible: true }, projects: { count: 2, visible: true }, languages: { count: 3, visible: true }, certifications: { count: 1, visible: true }, references: { count: 1, visible: true }, portfolio: { count: 3, visible: true } },
  },
]

/* ─── Helpers ─── */
function getRelativeTime(dateStr: string, isEn: boolean): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 3600000
  if (diff < 1) return isEn ? "Just now" : "Nyss"
  if (diff < 24) return isEn ? `${Math.floor(diff)}h ago` : `${Math.floor(diff)}h sedan`
  if (diff < 168) return isEn ? `${Math.floor(diff / 24)}d ago` : `${Math.floor(diff / 24)}d sedan`
  return new Date(dateStr).toLocaleDateString(isEn ? "en-GB" : "sv-SE", { day: "numeric", month: "short", year: "numeric" })
}

const TEMPLATE_COLORS: Record<string, { bg: string; color: string }> = {
  modern: { bg: "rgb(239,246,255)", color: NAVY },
  classic: { bg: "rgb(248,250,252)", color: "rgb(71,85,105)" },
  creative: { bg: "rgb(245,243,255)", color: "rgb(109,40,217)" },
}

/* ─────────────────────────────────────────────
   DELETE CONFIRM DIALOG
───────────────────────────────────────────── */
const DeleteDialog: React.FC<{
  cv: ManagedCV; onClose: () => void; onConfirm: () => void; isEn: boolean
}> = ({ cv, onClose, onConfirm, isEn }) => {
  const [text, setText] = useState("")
  const match = text === cv.name

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
        <div className="px-6 py-5 border-b border-red-100 bg-red-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <Icon icon="tabler:trash" className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{isEn ? "Delete CV" : "Radera CV"}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{isEn ? "This action cannot be undone" : "Denna åtgärd kan inte ångras"}</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl border border-red-100 bg-red-50/40 p-3.5 space-y-1.5">
            <p className="text-xs font-semibold text-red-700">{isEn ? "This will permanently delete:" : "Detta raderar permanent:"}</p>
            <ul className="text-xs text-red-600 space-y-0.5 ml-3 list-disc">
              <li>{isEn ? "All CV sections and content" : "Alla CV-sektioner och innehåll"}</li>
              <li>{isEn ? "Skills, experience & education" : "Kompetenser, erfarenhet & utbildning"}</li>
              <li>{isEn ? "Template layout & settings" : "Malllayout & inställningar"}</li>
              {cv.isPublic && <li className="font-semibold">{isEn ? "The public link will stop working" : "Den publika länken slutar fungera"}</li>}
            </ul>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-2">
              {isEn ? `Type "${cv.name}" to confirm:` : `Skriv "${cv.name}" för att bekräfta:`}
            </p>
            <input type="text" value={text} onChange={e => setText(e.target.value)}
              placeholder={cv.name}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-red-200 transition-all" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all">
            {isEn ? "Cancel" : "Avbryt"}
          </button>
          <button onClick={onConfirm} disabled={!match}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: match ? "rgb(220,38,38)" : "rgb(252,165,165)" }}>
            <Icon icon="tabler:trash" className="w-4 h-4" />
            {isEn ? "Delete permanently" : "Radera permanent"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   CV CARD
───────────────────────────────────────────── */
const CVCard: React.FC<{
  cv: ManagedCV; isEn: boolean
  onDelete: () => void
  onEdit: () => void
  onTogglePublic: () => void
}> = ({ cv, isEn, onDelete, onEdit, onTogglePublic }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const tpl = TEMPLATE_COLORS[cv.template] ?? TEMPLATE_COLORS.modern!

  const stats = [
    { icon: "tabler:briefcase", label: isEn ? "Exp" : "Erfarenhet", val: cv.sections.experience.count },
    { icon: "tabler:school", label: isEn ? "Edu" : "Utbildning", val: cv.sections.education.count },
    { icon: "tabler:code", label: isEn ? "Skills" : "Kompetenser", val: cv.sections.skills.count },
    { icon: "tabler:file-text", label: isEn ? "Proj" : "Projekt", val: cv.sections.projects.count },
    { icon: "tabler:language", label: isEn ? "Lang" : "Språk", val: cv.sections.languages.count },
    { icon: "tabler:certificate", label: isEn ? "Certs" : "Certifikat", val: cv.sections.certifications.count },
    { icon: "tabler:users", label: isEn ? "Refs" : "Referenser", val: cv.sections.references.count },
    { icon: "tabler:briefcase-2", label: isEn ? "Port" : "Portfolio", val: cv.sections.portfolio.count },
  ]

  return (
    <div className="relative group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col">

      {/* Status bar */}
      <div className="h-1.5 w-full transition-colors duration-300"
        style={{ backgroundColor: cv.isPublic ? "rgb(20,184,166)" : "rgb(203,213,225)" }} />

      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-900 transition-colors">{cv.name}</h3>
            {/* Employee pill */}
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{ backgroundColor: NAVY }}>
                {cv.employeeInitials}
              </div>
              <span className="text-sm text-gray-500 truncate">{cv.employeeName}</span>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-400 truncate">{cv.employeeTitle}</span>
            </div>
          </div>

          {/* Public/Private toggle badge */}
          <button onClick={onTogglePublic}
            className={clsx("flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-full border transition-all hover:shadow-sm flex-shrink-0",
              cv.isPublic ? "text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-100" : "text-gray-500 bg-gray-50 border-gray-200 hover:bg-gray-100")}>
            <Icon icon={cv.isPublic ? "tabler:world" : "tabler:lock"} className="w-3 h-3" />
            {cv.isPublic ? (isEn ? "Public" : "Publik") : (isEn ? "Private" : "Privat")}
          </button>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-2.5 text-[10px] text-gray-400 font-medium uppercase tracking-wide">
          <span className="flex items-center gap-1"><Icon icon="tabler:clock" className="w-3 h-3" />{getRelativeTime(cv.updatedAt, isEn)}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span className="px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: tpl.bg, color: tpl.color }}>
            {cv.template.charAt(0).toUpperCase() + cv.template.slice(1)}
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="px-5 pt-3 pb-4 flex-1">
        <div className="grid grid-cols-4 gap-2 border-t border-gray-50 pt-3">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50/80">
              <Icon icon={s.icon} className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm font-bold text-gray-800">{s.val}</span>
              <span className="text-[8px] text-gray-400 uppercase font-semibold tracking-wide text-center leading-tight">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-5 pb-4 flex items-center gap-2">
        {/* Preview */}
        <button
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all"
          onClick={() => alert("Preview CV — connect to CV preview")}
        >
          <Icon icon="tabler:eye" className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{isEn ? "Preview" : "Förhandsgranska"}</span>
        </button>

        {/* Edit (primary) */}
        <button onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold text-white transition-all hover:shadow-md"
          style={{ backgroundColor: NAVY }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgb(15,32,90)"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = NAVY}>
          <Icon icon="tabler:edit" className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{isEn ? "Edit" : "Redigera"}</span>
        </button>

        {/* More menu */}
        <div className="relative">
          <button onClick={() => setMenuOpen(v => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all flex-shrink-0">
            <Icon icon="tabler:dots" className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 bottom-10 z-20 bg-white rounded-xl border border-gray-100 shadow-xl w-44 py-1 overflow-hidden">
                {[
                  { icon: "tabler:copy", label: isEn ? "Duplicate" : "Duplicera", action: () => { alert("Duplicate"); setMenuOpen(false) } },
                  { icon: "tabler:download", label: isEn ? "Download PDF" : "Ladda ned PDF", action: () => { alert("Download PDF"); setMenuOpen(false) } },
                  { icon: "tabler:link", label: isEn ? "Copy Link" : "Kopiera länk", action: () => { alert("Copy link"); setMenuOpen(false) } },
                  null,
                  { icon: "tabler:trash", label: isEn ? "Delete" : "Radera", action: () => { onDelete(); setMenuOpen(false) }, danger: true },
                ].map((item, i) =>
                  item === null
                    ? <div key={i} className="my-1 border-t border-gray-100" />
                    : (
                      <button key={i} onClick={item.action}
                        className={clsx("w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium transition-colors",
                          item.danger ? "text-red-600 hover:bg-red-50" : "text-gray-700 hover:bg-gray-50")}>
                        <Icon icon={item.icon} className="w-3.5 h-3.5 flex-shrink-0" />
                        {item.label}
                      </button>
                    )
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function ManagerCVCreator() {
  const { language } = useManagerTranslations()
  const isEn = language === "en"

  const [cvs, setCvs] = useState<ManagedCV[]>(MOCK_CVS)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortKey>("updated")
  const [filterEmp, setFilterEmp] = useState("")
  const [filterTpl, setFilterTpl] = useState("")
  const [filterPublic, setFilterPublic] = useState<"all" | "public" | "private">("all")
  const [cvToDelete, setCvToDelete] = useState<ManagedCV | null>(null)

  /* Unique employees for filter */
  const employees = [...new Map(cvs.map(c => [c.employeeId, { id: c.employeeId, name: c.employeeName }])).values()]
  const templates = [...new Set(cvs.map(c => c.template))]

  /* Filter + sort */
  const filtered = cvs
    .filter(cv =>
      (!search || cv.name.toLowerCase().includes(search.toLowerCase()) || cv.employeeName.toLowerCase().includes(search.toLowerCase())) &&
      (!filterEmp || cv.employeeId === filterEmp) &&
      (!filterTpl || cv.template === filterTpl) &&
      (filterPublic === "all" || (filterPublic === "public" ? cv.isPublic : !cv.isPublic))
    )
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name)
      if (sortBy === "employee") return a.employeeName.localeCompare(b.employeeName)
      if (sortBy === "created") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

  const handleTogglePublic = (id: string) =>
    setCvs(p => p.map(cv => cv.id === id ? { ...cv, isPublic: !cv.isPublic } : cv))

  const handleDelete = (id: string) => {
    setCvs(p => p.filter(cv => cv.id !== id))
    setCvToDelete(null)
  }

  /* Summary counts */
  const totalPublic = cvs.filter(c => c.isPublic).length
  const totalPrivate = cvs.filter(c => !c.isPublic).length

  return (
    <div className="p-4 sm:p-6 m-2 sm:m-4">

      {/* ── Header ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg" style={{ backgroundColor: NAVY }}>
                <Icon icon="tabler:files" className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                {isEn ? "Employee CVs" : "Medarbetarnas CV:n"}
              </h1>
            </div>
            <p className="text-gray-500 text-sm ml-12">
              {isEn
                ? `${cvs.length} CVs across ${employees.length} employees — ${totalPublic} public, ${totalPrivate} private`
                : `${cvs.length} CV:n för ${employees.length} medarbetare — ${totalPublic} publika, ${totalPrivate} privata`}
            </p>
          </div>
          <button
            onClick={() => alert("Navigate to CV editor — connect to CV creation route")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-md"
            style={{ backgroundColor: NAVY }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgb(15,32,90)"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = NAVY}>
            <Icon icon="tabler:plus" className="w-4 h-4" />
            {isEn ? "Create CV" : "Skapa CV"}
          </button>
        </div>

        {/* Summary stat pills */}
        <div className="flex items-center gap-3 mt-4 flex-wrap ml-12">
          {[
            { icon: "tabler:files", label: isEn ? "Total CVs" : "Totalt", val: cvs.length, color: NAVY, bg: LIGHT },
            { icon: "tabler:world", label: isEn ? "Public" : "Publika", val: totalPublic, color: "rgb(13,148,136)", bg: "rgb(240,253,250)" },
            { icon: "tabler:lock", label: isEn ? "Private" : "Privata", val: totalPrivate, color: "rgb(100,116,139)", bg: "rgb(248,250,252)" },
            { icon: "tabler:users", label: isEn ? "Employees" : "Medarbetare", val: employees.length, color: "rgb(109,40,217)", bg: "rgb(245,243,255)" },
          ].map((p, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold"
              style={{ backgroundColor: p.bg, borderColor: p.color + "30", color: p.color }}>
              <Icon icon={p.icon} className="w-3.5 h-3.5" />
              <span>{p.val} {p.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Icon icon="tabler:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={isEn ? "Search CVs or employees…" : "Sök CV:n eller medarbetare…"}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-200 transition-all" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <Icon icon="tabler:x" className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Employee filter */}
        <select value={filterEmp} onChange={e => setFilterEmp(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white text-gray-600 outline-none cursor-pointer">
          <option value="">{isEn ? "All employees" : "Alla medarbetare"}</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>

        {/* Template filter */}
        <select value={filterTpl} onChange={e => setFilterTpl(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white text-gray-600 outline-none cursor-pointer">
          <option value="">{isEn ? "All templates" : "Alla mallar"}</option>
          {templates.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>

        {/* Public filter */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
          {(["all", "public", "private"] as const).map(f => (
            <button key={f} onClick={() => setFilterPublic(f)}
              className={clsx("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                filterPublic === f ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700")}
              style={filterPublic === f ? { backgroundColor: NAVY } : {}}>
              {f === "all" ? (isEn ? "All" : "Alla") : f === "public" ? (isEn ? "Public" : "Publik") : (isEn ? "Private" : "Privat")}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white text-gray-600 outline-none cursor-pointer">
          <option value="updated">{isEn ? "Last updated" : "Senast uppdaterat"}</option>
          <option value="created">{isEn ? "Date created" : "Skapandedatum"}</option>
          <option value="name">   {isEn ? "Name A–Z" : "Namn A–Ö"}</option>
          <option value="employee">{isEn ? "Employee A–Z" : "Medarbetare A–Ö"}</option>
        </select>

        {/* Count */}
        <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-100 bg-white text-xs text-gray-500 whitespace-nowrap">
          <Icon icon="tabler:files" className="w-3.5 h-3.5 text-gray-400" />
          {isEn ? `${filtered.length} of ${cvs.length}` : `${filtered.length} av ${cvs.length}`}
        </div>
      </div>

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
          <Icon icon="tabler:files-off" className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">{isEn ? "No CVs match your filters." : "Inga CV:n matchar dina filter."}</p>
          <p className="text-sm text-gray-400 mt-1">{isEn ? "Try adjusting your search or filters." : "Prova att justera sökning eller filter."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filtered.map(cv => (
            <CVCard key={cv.id} cv={cv} isEn={isEn}
              onDelete={() => setCvToDelete(cv)}
              onEdit={() => alert(`Edit CV ${cv.id} — connect to CV editor route`)}
              onTogglePublic={() => handleTogglePublic(cv.id)}
            />
          ))}
        </div>
      )}

      {/* Delete dialog */}
      {cvToDelete && (
        <DeleteDialog
          cv={cvToDelete}
          onClose={() => setCvToDelete(null)}
          onConfirm={() => handleDelete(cvToDelete.id)}
          isEn={isEn}
        />
      )}
    </div>
  )
}
