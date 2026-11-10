"use client"

// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/admin/views/EmployeeDocsDrawer.tsx   (NEW)
// WHAT IT DOES:   Side panel with an employee's CVs and portfolio (business admin).
//   • CVs: click one → opens it as a PDF (the same CVPdfPreviewDialog the
//     manager's "Employee CVs" page uses).
//   • Portfolio: images, videos, YouTube, links and documents — click to view.
//   Data is fetched when the panel opens: /api/company/admin/employees/:id/cvs|portfolio
// ══════════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react"
import { Icon } from "@iconify/react"
import { employeesApi, type AdminCv, type AdminPortfolioItem, type EmployeeRow } from "@/utils/adminEmployees"
// The manager dashboard's CV → PDF dialog (renders the CV with its template).
import CVPdfPreviewDialog from "@/components/Dashboard/Company-dashboard/manager/views/CVPdfPreviewDialog"
import { formatDate, initials, type EmployeesTx } from "./employeesText"

const NAVY = "rgb(5,22,80)"
type Tab = "cvs" | "portfolio"

const TYPE_ICON: Record<string, string> = {
  image: "tabler:photo",
  video: "tabler:video",
  youtube: "tabler:brand-youtube",
  link: "tabler:link",
  document: "tabler:file-text",
}

const fileSize = (n?: number) => (!n ? "" : n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} kB`)
const thumb = (i: AdminPortfolioItem) => i.imageUrl || i.videoThumbnailUrl || i.youtubeThumbnailUrl || i.linkThumbnailUrl

/* ─── Portfolio item viewer ─── */
function PortfolioViewer({ item, tx, onClose }: { item: AdminPortfolioItem; tx: EmployeesTx; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", k)
    return () => document.removeEventListener("keydown", k)
  }, [onClose])
  const isPdf = item.type === "document" && (item.documentExt?.toLowerCase() === "pdf" || item.documentUrl?.toLowerCase().endsWith(".pdf"))

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/80" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
          <Icon icon={TYPE_ICON[item.type] ?? "tabler:file"} className="w-5 h-5 flex-shrink-0" style={{ color: NAVY }} />
          <p className="font-semibold text-gray-900 truncate flex-1">{item.title}</p>
          {(item.linkUrl || item.documentUrl || item.youtubeUrl) && (
            <a href={item.linkUrl || item.documentUrl || item.youtubeUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50">
              <Icon icon="tabler:external-link" className="w-3.5 h-3.5" />
              {item.type === "document" ? tx.openDocument : tx.openLink}
            </a>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100" aria-label={tx.close}>
            <Icon icon="tabler:x" className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-auto bg-gray-50 flex items-center justify-center">
          {item.type === "image" && item.imageUrl ? (
            <img src={item.imageUrl} alt={item.title} className="max-w-full max-h-[75vh] object-contain" />
          ) : item.type === "video" && item.videoUrl ? (
            <video src={item.videoUrl} poster={item.videoThumbnailUrl} controls className="max-w-full max-h-[75vh]" />
          ) : item.type === "youtube" && item.youtubeVideoId ? (
            <div className="w-full aspect-video">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(item.youtubeVideoId)}`}
                title={item.title}
                allow="accelerometer; encrypted-media; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          ) : isPdf && item.documentUrl ? (
            <iframe src={item.documentUrl} title={item.title} className="w-full h-[75vh] bg-white" />
          ) : (
            <div className="p-10 text-center">
              <Icon icon={TYPE_ICON[item.type] ?? "tabler:file"} className="w-12 h-12 mx-auto text-gray-300" />
              <p className="mt-3 text-sm text-gray-600 break-all">{item.linkUrl || item.documentName || item.title}</p>
            </div>
          )}
        </div>
        {(item.description || item.tags?.length) && (
          <div className="px-5 py-3 border-t border-gray-100 text-sm text-gray-600">
            {item.description && <p className="whitespace-pre-wrap">{item.description}</p>}
            {item.tags?.length ? (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {item.tags.map((t) => <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{t}</span>)}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

/* ═════════════════════════════════════════════════════════════════════ */
export default function EmployeeDocsDrawer({
  employee,
  tx,
  language,
  initialTab = "cvs",
  onClose,
}: {
  employee: Pick<EmployeeRow, "id" | "name" | "email" | "title" | "canSeeCvs" | "canSeePortfolio" | "cvCount" | "portfolioCount"> | null
  tx: EmployeesTx
  language: string
  initialTab?: Tab
  onClose: () => void
}) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const [cvs, setCvs] = useState<AdminCv[] | null>(null)
  const [items, setItems] = useState<AdminPortfolioItem[] | null>(null)
  const [cvError, setCvError] = useState(false)
  const [pfError, setPfError] = useState(false)
  const [pdfCv, setPdfCv] = useState<AdminCv | null>(null)
  const [viewing, setViewing] = useState<AdminPortfolioItem | null>(null)

  useEffect(() => {
    if (!employee) return
    setTab(employee.canSeeCvs ? initialTab : "portfolio")
    setCvs(null)
    setItems(null)
    setCvError(false)
    setPfError(false)
    if (employee.canSeeCvs) employeesApi.cvs(employee.id).then(setCvs).catch(() => setCvError(true))
    if (employee.canSeePortfolio) employeesApi.portfolio(employee.id).then(setItems).catch(() => setPfError(true))
  }, [employee, initialTab])

  useEffect(() => {
    if (!employee) return
    const k = (e: KeyboardEvent) => { if (e.key === "Escape" && !viewing && !pdfCv) onClose() }
    document.addEventListener("keydown", k)
    return () => document.removeEventListener("keydown", k)
  }, [employee, viewing, pdfCv, onClose])

  if (!employee) return null

  const tabs: { key: Tab; label: string; n: number | null; allowed: boolean }[] = [
    { key: "cvs", label: tx.tabCvs, n: cvs?.length ?? employee.cvCount, allowed: employee.canSeeCvs },
    { key: "portfolio", label: tx.tabPortfolio, n: items?.length ?? employee.portfolioCount, allowed: employee.canSeePortfolio },
  ]

  const loading = (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}
    </div>
  )

  return (
    <>
      <div className="fixed inset-0 z-40 bg-gray-900/30 backdrop-blur-[2px]" onClick={onClose} />
      <aside role="dialog" aria-modal="true" aria-label={`${employee.name} — ${tx.docsBtn}`}
        className="fixed right-0 top-0 bottom-0 z-50 w-full sm:max-w-xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: "rgb(204,251,241)", color: "rgb(15,118,110)" }}>
            {initials(employee.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 truncate">{employee.name}</p>
            <p className="text-xs text-gray-500 truncate">{employee.title || employee.email}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100" aria-label={tx.close}>
            <Icon icon="tabler:x" className="w-5 h-5" />
          </button>
        </div>
        <p className="flex items-center gap-2 px-5 py-2 text-xs text-amber-800 bg-amber-50 border-b border-amber-100">
          <Icon icon="tabler:lock" className="w-3.5 h-3.5 flex-shrink-0" />{tx.readOnly}
        </p>

        {/* Tabs */}
        <div className="flex px-5 border-b border-gray-100" role="tablist">
          {tabs.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-1 mr-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.key ? "border-blue-900 text-blue-950" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              <Icon icon={t.key === "cvs" ? "tabler:files" : "tabler:briefcase"} className="w-4 h-4" />
              {t.label}
              {t.allowed ? <span className="text-[11px] px-1.5 rounded-full bg-gray-100 text-gray-600">{t.n ?? 0}</span> : <Icon icon="tabler:lock" className="w-3 h-3 text-gray-400" />}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "cvs" ? (
            !employee.canSeeCvs ? (
              <p className="text-sm text-gray-500 text-center py-10">{tx.notShared}</p>
            ) : cvError ? (
              <p className="text-sm text-red-600 text-center py-10">{tx.loadDocsFailed}</p>
            ) : cvs === null ? loading : cvs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-10">{tx.noCvs}</p>
            ) : (
              <ul className="space-y-2.5">
                {cvs.map((cv) => (
                  <li key={cv.id}>
                    <button onClick={() => setPdfCv(cv)}
                      className="group w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 text-left transition-colors">
                      <div className="w-11 h-14 rounded-md border border-gray-200 bg-white flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
                        <Icon icon="tabler:file-type-pdf" className="w-5 h-5 text-red-500" />
                        <span className="text-[8px] font-bold text-gray-400 mt-0.5">PDF</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-gray-900 truncate">{cv.name || "CV"}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {[cv.personalInfo?.title, `${tx.updated} ${formatDate(cv.updatedAt, language)}`].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <span className="flex items-center gap-1 text-xs font-semibold opacity-80 group-hover:opacity-100" style={{ color: NAVY }}>
                        {tx.openPdf}<Icon icon="tabler:chevron-right" className="w-4 h-4" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : !employee.canSeePortfolio ? (
            <p className="text-sm text-gray-500 text-center py-10">{tx.notShared}</p>
          ) : pfError ? (
            <p className="text-sm text-red-600 text-center py-10">{tx.loadDocsFailed}</p>
          ) : items === null ? loading : items.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-10">{tx.noPortfolio}</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((it) => {
                const img = thumb(it)
                return (
                  <li key={it.id}>
                    <button onClick={() => setViewing(it)} className="group w-full text-left rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-blue-200 transition-all">
                      <div className="relative aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                        {img ? (
                          <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform" />
                        ) : (
                          <Icon icon={TYPE_ICON[it.type] ?? "tabler:file"} className="w-8 h-8 text-gray-300" />
                        )}
                        {(it.type === "video" || it.type === "youtube") && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="w-10 h-10 rounded-full bg-black/55 flex items-center justify-center"><Icon icon="tabler:player-play-filled" className="w-5 h-5 text-white" /></span>
                          </span>
                        )}
                        {it.featured && <span className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-white">★</span>}
                      </div>
                      <div className="p-3">
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 truncate">
                          <Icon icon={TYPE_ICON[it.type] ?? "tabler:file"} className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />{it.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {it.description || it.documentName || it.linkUrl || formatDate(it.createdAt, language)}
                          {it.documentSize ? ` · ${fileSize(it.documentSize)}` : ""}
                        </p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </aside>

      {viewing && <PortfolioViewer item={viewing} tx={tx} onClose={() => setViewing(null)} />}
      {pdfCv && <div className="relative z-[80]"><CVPdfPreviewDialog cv={pdfCv as any} onClose={() => setPdfCv(null)} /></div>}
    </>
  )
}
