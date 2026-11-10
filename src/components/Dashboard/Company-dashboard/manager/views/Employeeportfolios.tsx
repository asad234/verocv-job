"use client"

import { useState, useEffect } from "react"
import { Icon } from "@iconify/react"
import { useManagerTranslations } from "@/utils/Managertranslations"
import { loadManagedEmployees, type CoveringFor } from "@/utils/coveredTeam"
import { CoveringBadge, CoveringNotice } from "@/components/Dashboard/Company-dashboard/manager/delegation/CoveringBadge"

const NAVY = "rgb(5,22,80)"

interface EmployeeSummary {
  employeeId: string
  employeeName: string
  employeeEmail: string
  acceptedAt: string | null
  /** Set when this employee belongs to a colleague you're covering for. */
  coveringFor?: CoveringFor
}

type ItemType = "image" | "video" | "youtube" | "link" | "document"

interface PortfolioItem {
  id: string
  type: ItemType
  title: string
  description?: string
  tags?: string[]
  featured?: boolean
  imageUrl?: string
  videoUrl?: string
  videoThumbnailUrl?: string
  youtubeUrl?: string
  youtubeVideoId?: string
  youtubeThumbnailUrl?: string
  linkUrl?: string
  linkThumbnailUrl?: string
  documentUrl?: string
  documentName?: string
  documentSize?: number
  documentExt?: "pdf" | "docx" | "doc" | "pptx" | "ppt"
  createdAt: string
}

const TYPE_STYLE: Record<ItemType, { icon: string; color: string; bg: string }> = {
  image: { icon: "tabler:photo", color: "#0ea5e9", bg: "#e0f2fe" },
  video: { icon: "tabler:movie", color: "#8b5cf6", bg: "#ede9fe" },
  youtube: { icon: "tabler:brand-youtube", color: "#ef4444", bg: "#fee2e2" },
  link: { icon: "tabler:link", color: "#10b981", bg: "#d1fae5" },
  document: { icon: "tabler:file-text", color: "#f59e0b", bg: "#fef3c7" },
}

const DOC_CONFIG: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  pdf: { icon: "tabler:file-type-pdf", color: "#ef4444", bg: "#fee2e2", label: "PDF" },
  docx: { icon: "tabler:file-type-doc", color: "#2563eb", bg: "#dbeafe", label: "DOCX" },
  doc: { icon: "tabler:file-type-doc", color: "#2563eb", bg: "#dbeafe", label: "DOC" },
  pptx: { icon: "tabler:file-type-ppt", color: "#ea580c", bg: "#ffedd5", label: "PPTX" },
  ppt: { icon: "tabler:file-type-ppt", color: "#ea580c", bg: "#ffedd5", label: "PPT" },
}

type TFunc = ReturnType<typeof useManagerTranslations>["t"]

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/* ─────────────────────────────────────────────
   READ-ONLY IMAGE LIGHTBOX — zoom/pan/navigate, no edit
───────────────────────────────────────────── */
function ImageLightbox({
  item, allImages, onClose, onNavigate,
}: {
  item: PortfolioItem
  allImages: PortfolioItem[]
  onClose: () => void
  onNavigate: (item: PortfolioItem) => void
}) {
  const [zoom, setZoom] = useState(1)

  const currentIndex = allImages.findIndex((i) => i.id === item.id)
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < allImages.length - 1

  useEffect(() => { setZoom(1) }, [item.id])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft" && hasPrev) { const p = allImages[currentIndex - 1]; if (p) onNavigate(p) }
      if (e.key === "ArrowRight" && hasNext) { const n = allImages[currentIndex + 1]; if (n) onNavigate(n) }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [hasPrev, hasNext, currentIndex, allImages, onClose, onNavigate])

  const downloadImage = () => {
    if (!item.imageUrl) return
    const a = document.createElement("a")
    a.href = item.imageUrl
    a.download = `${item.title.replace(/\s+/g, "_")}.jpg`
    a.click()
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ backgroundColor: "rgba(0,0,0,0.96)" }}>
      <div className="flex items-center justify-between px-3 sm:px-5 py-3 flex-shrink-0 gap-2" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm truncate">{item.title}</p>
          {item.description && <p className="text-white/40 text-xs truncate mt-0.5">{item.description}</p>}
        </div>
        <div className="flex items-center gap-1.5 ml-4">
          <button onClick={() => setZoom((z) => Math.max(1, z - 0.25))} className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all">
            <Icon icon="tabler:zoom-out" className="w-4 h-4" />
          </button>
          <button onClick={() => setZoom(1)} className="min-w-[48px] h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-xs font-mono transition-all px-2">
            {Math.round(zoom * 100)}%
          </button>
          <button onClick={() => setZoom((z) => Math.min(6, z + 0.25))} className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all">
            <Icon icon="tabler:zoom-in" className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-white/15 mx-1" />
          <button onClick={downloadImage} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all">
            <Icon icon="tabler:download" className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-white/15 mx-1" />
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-red-500/60 transition-all">
            <Icon icon="tabler:x" className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
        <img
          src={item.imageUrl} alt={item.title} draggable={false}
          className="max-w-full max-h-full object-contain select-none rounded-sm"
          style={{ transform: `scale(${zoom})`, transition: "transform 0.1s ease-out", maxHeight: "calc(100vh - 130px)", boxShadow: "0 25px 60px rgba(0,0,0,0.8)" }}
        />
        {hasPrev && (
          <button onClick={(e) => { e.stopPropagation(); const p = allImages[currentIndex - 1]; if (p) onNavigate(p) }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 border border-white/15 flex items-center justify-center text-white transition-all hover:scale-110 backdrop-blur-sm">
            <Icon icon="tabler:chevron-left" className="w-5 h-5" />
          </button>
        )}
        {hasNext && (
          <button onClick={(e) => { e.stopPropagation(); const n = allImages[currentIndex + 1]; if (n) onNavigate(n) }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 border border-white/15 flex items-center justify-center text-white transition-all hover:scale-110 backdrop-blur-sm">
            <Icon icon="tabler:chevron-right" className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   READ-ONLY PORTFOLIO CARD — view/open/play/download, no edit or delete
───────────────────────────────────────────── */
function ReadOnlyCard({ item, onImageClick, t }: { item: PortfolioItem; onImageClick: (item: PortfolioItem) => void; t: TFunc }) {
  const [playing, setPlaying] = useState(false)
  const isImage = item.type === "image"
  const isDocument = item.type === "document"

  const thumbnail = item.type === "image" ? item.imageUrl
    : item.type === "video" ? item.videoThumbnailUrl
      : item.type === "youtube" ? item.youtubeThumbnailUrl
        : item.type === "link" ? item.linkThumbnailUrl
          : undefined

  const externalUrl = item.type === "youtube" ? `https://www.youtube.com/watch?v=${item.youtubeVideoId}`
    : item.type === "link" ? item.linkUrl
      : item.type === "document" ? item.documentUrl
        : undefined

  const docCfg = isDocument ? DOC_CONFIG[item.documentExt ?? "pdf"] : null

  return (
    <div className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col overflow-hidden">
      <div
        className="relative w-full aspect-video bg-gray-100 overflow-hidden"
        onClick={isImage ? () => onImageClick(item) : undefined}
        style={isImage ? { cursor: "zoom-in" } : {}}
      >
        {isDocument ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4" style={{ background: `linear-gradient(135deg, ${docCfg?.bg} 0%, #fff 100%)` }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: docCfg?.bg, border: `2px solid ${docCfg?.color}22` }}>
              <Icon icon={docCfg?.icon ?? "tabler:file"} className="w-9 h-9" style={{ color: docCfg?.color }} />
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider" style={{ backgroundColor: docCfg?.color, color: "#fff" }}>
              {docCfg?.label}
            </span>
            {item.documentName && <p className="text-xs text-gray-500 text-center leading-tight w-full px-2 break-all line-clamp-2">{item.documentName}</p>}
            {item.documentSize != null && <p className="text-xs text-gray-400">{formatBytes(item.documentSize)}</p>}
          </div>
        ) : thumbnail ? (
          <img src={thumbnail} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon icon={TYPE_STYLE[item.type].icon} className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {!isDocument && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
            {isImage && (
              <button onClick={() => onImageClick(item)} className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                <Icon icon="tabler:arrows-maximize" className="w-5 h-5 text-gray-800" />
              </button>
            )}
            {(item.type === "youtube" || item.type === "video") && !playing && (
              <button onClick={(e) => { e.stopPropagation(); setPlaying(true) }} className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                <Icon icon="tabler:player-play-filled" className="w-5 h-5 text-gray-800 ml-0.5" />
              </button>
            )}
            {externalUrl && item.type === "link" && (
              <a href={externalUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center hover:scale-110 transition-transform shadow">
                <Icon icon="tabler:external-link" className="w-4 h-4 text-gray-700" />
              </a>
            )}
          </div>
        )}

        {isDocument && item.documentUrl && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center" style={{ backgroundColor: `${docCfg?.color}18` }}>

            <a href={item.documentUrl} download={item.documentName}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold text-sm text-white shadow-lg transition-all hover:scale-105 hover:brightness-110"
              style={{ backgroundColor: docCfg?.color }}
            >
              <Icon icon="tabler:download" className="w-4 h-4" />
              {t.downloadBtn}
            </a>
          </div>
        )}

        {item.featured && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-white text-xs font-semibold shadow pointer-events-none">
            <Icon icon="tabler:star-filled" className="w-3 h-3" />
            {t.featuredLabel}
          </div>
        )}

        {isImage && (
          <div className="absolute bottom-2 right-2 w-7 h-7 rounded-lg bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <Icon icon="tabler:arrows-maximize" className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>

      {/* YouTube embed */}
      {playing && item.type === "youtube" && item.youtubeVideoId && (
        <div className="relative w-full aspect-video">
          <iframe src={`https://www.youtube.com/embed/${item.youtubeVideoId}?autoplay=1`} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen />
          <button onClick={() => setPlaying(false)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80">
            <Icon icon="tabler:x" className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Video player */}
      {playing && item.type === "video" && item.videoUrl && (
        <div className="relative w-full aspect-video bg-black">
          <video src={item.videoUrl} className="w-full h-full" autoPlay controls playsInline />
          <button onClick={() => setPlaying(false)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 z-10">
            <Icon icon="tabler:x" className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3
          className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2"
          onClick={isImage ? () => onImageClick(item) : undefined}
          style={isImage ? { cursor: "pointer" } : {}}
        >
          {item.title}
        </h3>

        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold w-fit" style={{ color: TYPE_STYLE[item.type].color, backgroundColor: TYPE_STYLE[item.type].bg }}>
          <Icon icon={TYPE_STYLE[item.type].icon} className="w-3 h-3" />
          {t.portfolioTypeLabels[item.type]}
        </span>

        {item.description && <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{item.description}</p>}

        {isDocument && (item.documentName || item.documentSize != null) && (
          <div className="flex items-center gap-2 mt-0.5">
            <Icon icon={docCfg?.icon ?? "tabler:file"} className="w-3.5 h-3.5 flex-shrink-0" style={{ color: docCfg?.color }} />
            <span className="text-xs text-gray-400 truncate">{item.documentName}</span>
            {item.documentSize != null && <span className="text-xs text-gray-300 flex-shrink-0">· {formatBytes(item.documentSize)}</span>}
          </div>
        )}

        {externalUrl && item.type !== "document" && (
          <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium mt-auto pt-1 hover:opacity-70 transition-opacity w-fit" style={{ color: NAVY }}>
            <Icon icon="tabler:external-link" className="w-3.5 h-3.5" />
            {item.type === "link" ? t.openLinkBtn : t.openVideoBtn}
          </a>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.tags.map((tag) => (
              <span key={tag} className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function EmployeePortfolios() {
  const { t, language } = useManagerTranslations()

  const [employees, setEmployees] = useState<EmployeeSummary[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState("")
  const [employeeSearch, setEmployeeSearch] = useState("")

  const [selected, setSelected] = useState<EmployeeSummary | null>(null)
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [itemsError, setItemsError] = useState("")
  const [lightboxItem, setLightboxItem] = useState<PortfolioItem | null>(null)

  useEffect(() => {
    let cancelled = false
    // Your employees + the team of any colleague you're covering for.
    loadManagedEmployees<EmployeeSummary>()
      .then((list) => { if (!cancelled) setEmployees(list) })
      .catch(() => { if (!cancelled) setListError(t.failedToLoadEmployees) })
      .finally(() => { if (!cancelled) setLoadingList(false) })
    return () => { cancelled = true }
  }, [t.failedToLoadEmployees])

  const openEmployee = (emp: EmployeeSummary) => {
    setSelected(emp)
    setItems([])
    setItemsError("")
    setLoadingItems(true)
    fetch(`/api/company/managers/employees/${emp.employeeId}/portfolio`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.message || t.failedToLoadPortfolio)
        }
        const body = await res.json()
        setItems(body.items ?? [])
      })
      .catch((err) => setItemsError(err?.message || t.failedToLoadPortfolio))
      .finally(() => setLoadingItems(false))
  }

  const filteredEmployees = employees.filter((emp) => {
    if (!employeeSearch.trim()) return true
    const q = employeeSearch.toLowerCase()
    return (emp.employeeName || "").toLowerCase().includes(q) || emp.employeeEmail.toLowerCase().includes(q)
  })

  const allImages = items.filter((i) => i.type === "image")

  return (
    <div className="p-4 sm:p-6 m-2 sm:m-4">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg" style={{ backgroundColor: NAVY }}>
            <Icon icon="tabler:briefcase" className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{t.portfoliosTitle}</h1>
        </div>
        <p className="text-gray-500 text-sm ml-12">
          {t.portfoliosSubtitle}
        </p>
      </div>

      <CoveringNotice language={language} />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Employee list */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t.employeesListLabel} ({employees.length})
            </div>

            {/* Employee search */}
            <div className="px-3 py-2.5 border-b border-gray-100">
              <div className="relative">
                <Icon icon="tabler:search" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  placeholder={t.searchLabel}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {loadingList && (
              <div className="p-6 flex justify-center text-gray-400 text-sm gap-2 items-center">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                {t.loading}
              </div>
            )}

            {!loadingList && listError && <div className="p-4 text-sm text-red-600">{listError}</div>}

            {!loadingList && !listError && filteredEmployees.length === 0 && (
              <div className="p-6 text-center text-gray-400 text-sm">
                {employees.length === 0 ? t.noEmployees : t.noEmployeesMatchSearch}
              </div>
            )}

            {!loadingList && filteredEmployees.map((emp) => (
              <button
                key={emp.employeeId}
                onClick={() => openEmployee(emp)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-gray-50 last:border-0 transition-colors ${selected?.employeeId === emp.employeeId ? "bg-blue-50/60" : "hover:bg-gray-50"}`}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: NAVY }}>
                  {(emp.employeeName || emp.employeeEmail)[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-800 truncate">{emp.employeeName || emp.employeeEmail}</div>
                  <div className="text-xs text-gray-400 truncate">{emp.employeeEmail}</div>
                  {emp.coveringFor && <div className="mt-1"><CoveringBadge coveringFor={emp.coveringFor} language={language} /></div>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Portfolio view */}
        <div className="flex-1 min-w-0">
          {!selected && (
            <div className="flex flex-col items-center justify-center py-24 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
              <Icon icon="tabler:folder-open" className="w-10 h-10 mb-3 text-gray-300" />
              <p className="text-sm">{t.selectEmployeePortfolioPrompt}</p>
            </div>
          )}

          {selected && (
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <h2 className="text-lg font-bold text-gray-800">{selected.employeeName || selected.employeeEmail} · {t.portfolioLabel}</h2>
                <CoveringBadge coveringFor={selected.coveringFor} language={language} />
              </div>

              {loadingItems && (
                <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                  {t.loading}
                </div>
              )}

              {!loadingItems && itemsError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{itemsError}</div>
              )}

              {!loadingItems && !itemsError && items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
                  <Icon icon="tabler:folder-open" className="w-10 h-10 mb-3 text-gray-300" />
                  <p className="text-sm">{t.noPortfolioItems}</p>
                </div>
              )}

              {!loadingItems && !itemsError && items.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item) => (
                    <ReadOnlyCard key={item.id} item={item} onImageClick={setLightboxItem} t={t} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {lightboxItem && (
        <ImageLightbox item={lightboxItem} allImages={allImages} onClose={() => setLightboxItem(null)} onNavigate={setLightboxItem} />
      )}
    </div>
  )
}
