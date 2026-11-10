"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect, createContext, useContext } from "react"
import { Icon } from "@iconify/react"
import { useManagerAccess } from "@/hooks/useManagerAccess"
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"
import { DashboardTranslations } from "@/utils/dashboardTranslations"

// ─── Internal translation context ────────────────────────────────────────────

const PT = createContext<DashboardTranslations | null>(null)
function useT() {
  const t = useContext(PT)
  if (!t) throw new Error("Portfolio: missing translation context")
  return t
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ItemType = "image" | "video" | "youtube" | "link" | "document"

interface PortfolioItem {
  id: string
  type: ItemType
  title: string
  description?: string
  tags?: string[]
  featured?: boolean
  hidden?: boolean
  imageUrl?: string
  videoUrl?: string
  videoThumbnailUrl?: string
  youtubeUrl?: string
  youtubeVideoId?: string
  youtubeThumbnailUrl?: string
  linkUrl?: string
  linkThumbnailUrl?: string
  documentUrl?: string
  documentMediaId?: string
  videoMediaId?: string
  videoThumbnailMediaId?: string
  documentName?: string
  documentSize?: number
  documentExt?: DocExt
  createdAt: string
}

type FilterType = "all" | ItemType

// ─── Constants ────────────────────────────────────────────────────────────────

const BRAND = "rgb(5, 22, 80)"
const BRAND_HOVER = "rgb(15, 32, 100)"

const TYPE_STYLE: Record<ItemType, { icon: string; color: string; bg: string }> = {
  image: { icon: "tabler:photo", color: "#0ea5e9", bg: "#e0f2fe" },
  video: { icon: "tabler:movie", color: "#8b5cf6", bg: "#ede9fe" },
  youtube: { icon: "tabler:brand-youtube", color: "#ef4444", bg: "#fee2e2" },
  link: { icon: "tabler:link", color: "#10b981", bg: "#d1fae5" },
  document: { icon: "tabler:file-text", color: "#f59e0b", bg: "#fef3c7" },
}

type DocExt = "pdf" | "docx" | "doc" | "pptx" | "ppt"

const DOC_CONFIG: Record<DocExt, { icon: string; color: string; bg: string; label: string }> = {
  pdf: { icon: "tabler:file-type-pdf", color: "#ef4444", bg: "#fee2e2", label: "PDF" },
  docx: { icon: "tabler:file-type-doc", color: "#2563eb", bg: "#dbeafe", label: "DOCX" },
  doc: { icon: "tabler:file-type-doc", color: "#2563eb", bg: "#dbeafe", label: "DOC" },
  pptx: { icon: "tabler:file-type-ppt", color: "#ea580c", bg: "#ffedd5", label: "PPTX" },
  ppt: { icon: "tabler:file-type-ppt", color: "#ea580c", bg: "#ffedd5", label: "PPT" },
}

const ACCEPTED_DOC_TYPES = ".pdf,.doc,.docx,.ppt,.pptx"

function getDocExt(filename: string): DocExt {
  const ext = filename.split(".").pop()?.toLowerCase() ?? ""
  if (["pdf", "docx", "pptx", "doc", "ppt"].includes(ext)) return ext as DocExt
  return "pdf"
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── YouTube helper ───────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === "youtu.be") return u.pathname.slice(1)
    if (u.hostname.includes("youtube.com")) {
      if (u.searchParams.get("v")) return u.searchParams.get("v")
      const parts = u.pathname.split("/")
      const idx = parts.findIndex((p) => ["shorts", "embed", "v"].includes(p))
      if (idx !== -1) return parts[idx + 1] ?? null
    }
    return null
  } catch { return null }
}

// ─── Shared small components ──────────────────────────────────────────────────

function TagPill({ tag }: { tag: string }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
      {tag}
    </span>
  )
}

function TypeBadge({ type }: { type: ItemType }) {
  const t = useT()
  const s = TYPE_STYLE[type]
  const labelMap: Record<ItemType, string> = {
    image: t.portfolioTypeImageLabel,
    video: t.portfolioTypeVideoLabel,
    youtube: t.portfolioTypeYoutubeLabel,
    link: t.portfolioTypeLinkLabel,
    document: t.portfolioTypeDocumentLabel,
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      <Icon icon={s.icon} className="w-3 h-3" />
      {labelMap[type]}
    </span>
  )
}

// ─── Document thumbnail ───────────────────────────────────────────────────────

function DocumentThumbnail({ item }: { item: PortfolioItem }) {
  const ext: DocExt = item.documentExt ?? "pdf"
  const cfg = DOC_CONFIG[ext]
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-3 p-4"
      style={{ background: `linear-gradient(135deg, ${cfg.bg} 0%, #fff 100%)` }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm"
        style={{ backgroundColor: cfg.bg, border: `2px solid ${cfg.color}22` }}
      >
        <Icon icon={cfg.icon} className="w-9 h-9" style={{ color: cfg.color }} />
      </div>
      <span
        className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
        style={{ backgroundColor: cfg.color, color: "#fff" }}
      >
        {cfg.label}
      </span>
      {item.documentName && (
        <p className="text-xs text-gray-500 text-center leading-tight w-full px-2 break-all line-clamp-2">
          {item.documentName}
        </p>
      )}
      {item.documentSize != null && (
        <p className="text-xs text-gray-400">{formatBytes(item.documentSize)}</p>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ImageEditor — canvas-based zoom/pan editor
// ═══════════════════════════════════════════════════════════════════════════════

interface ImageEditorProps {
  src: string
  onApply: (finalUrl: string) => void
  onReset: () => void
}

const EDITOR_W = 448
const EDITOR_H = 252

function ImageEditor({ src, onApply, onReset }: ImageEditorProps) {
  const t = useT()
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragOrigin = useRef({ mx: 0, my: 0, ox: 0, oy: 0 })
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const MIN_ZOOM = 0.5
  const MAX_ZOOM = 4
  const clamp = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    setZoom((z) => clamp(z - e.deltaY * 0.001))
  }
  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true)
    dragOrigin.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y }
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return
    setOffset({
      x: dragOrigin.current.ox + (e.clientX - dragOrigin.current.mx) / zoom,
      y: dragOrigin.current.oy + (e.clientY - dragOrigin.current.my) / zoom,
    })
  }
  const onMouseUp = () => setDragging(false)

  const handleApply = () => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    canvas.width = EDITOR_W
    canvas.height = EDITOR_H
    const ctx = canvas.getContext("2d")!
    ctx.fillStyle = "#f3f4f6"
    ctx.fillRect(0, 0, EDITOR_W, EDITOR_H)
    ctx.save()
    ctx.translate(EDITOR_W / 2, EDITOR_H / 2)
    ctx.scale(zoom, zoom)
    ctx.translate(offset.x, offset.y)
    ctx.drawImage(img, -EDITOR_W / 2, -EDITOR_H / 2, EDITOR_W, EDITOR_H)
    ctx.restore()
    onApply(canvas.toDataURL("image/jpeg", 0.95))
  }

  const handleReset = () => { setZoom(1); setOffset({ x: 0, y: 0 }); onReset() }
  const progress = ((zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100

  return (
    <div className="space-y-3">
      <div
        className="relative w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50 select-none"
        style={{ height: 220, cursor: dragging ? "grabbing" : "grab" }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp} onWheel={handleWheel}
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: "linear-gradient(45deg,#d1d5db 25%,transparent 25%),linear-gradient(-45deg,#d1d5db 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#d1d5db 75%),linear-gradient(-45deg,transparent 75%,#d1d5db 75%)",
            backgroundSize: "14px 14px",
            backgroundPosition: "0 0,0 7px,7px -7px,-7px 0",
          }}
        />
        <img
          ref={imgRef} src={src} alt="edit preview" draggable={false} crossOrigin="anonymous"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`, transformOrigin: "center center", transition: dragging ? "none" : "transform 0.06s ease-out" }}
        />
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full font-mono pointer-events-none">
          {Math.round(zoom * 100)}%
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/40 text-white/80 text-xs px-3 py-1 rounded-full pointer-events-none whitespace-nowrap">
          {t.portfolioScrollZoomHint}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => setZoom((z) => clamp(z - 0.1))} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0">
          <Icon icon="tabler:minus" className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 relative h-1.5 rounded-full bg-gray-200 overflow-hidden">
          <div className="absolute left-0 top-0 h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: BRAND }} />
          <input type="range" min={MIN_ZOOM} max={MAX_ZOOM} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
        </div>
        <button onClick={() => setZoom((z) => clamp(z + 0.1))} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0">
          <Icon icon="tabler:plus" className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {[0.5, 1, 1.5, 2, 3].map((preset) => {
          const active = Math.abs(zoom - preset) < 0.05
          return (
            <button key={preset} onClick={() => { setZoom(preset); setOffset({ x: 0, y: 0 }) }}
              className="px-2.5 py-1 rounded-lg text-xs font-medium border transition-all"
              style={active ? { backgroundColor: BRAND, color: "#fff", borderColor: BRAND } : { borderColor: "#e5e7eb", color: "#6b7280" }}>
              {preset === 1 ? "1×" : `${preset}×`}
            </button>
          )
        })}
        <div className="ml-auto flex items-center gap-2">
          <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors">
            <Icon icon="tabler:refresh" className="w-3.5 h-3.5" />
            {t.portfolioChangeImage}
          </button>
          <button onClick={handleApply} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors" style={{ backgroundColor: BRAND }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND_HOVER)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND)}>
            <Icon icon="tabler:crop" className="w-3.5 h-3.5" />
            {t.portfolioApplyCrop}
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ImageLightbox — full-screen dialog with zoom/pan/navigation
// ═══════════════════════════════════════════════════════════════════════════════

interface LightboxProps {
  item: PortfolioItem
  allImages: PortfolioItem[]
  onClose: () => void
  onNavigate: (item: PortfolioItem) => void
}

function ImageLightbox({ item, allImages, onClose, onNavigate }: LightboxProps) {
  const t = useT()
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragOrigin = useRef({ mx: 0, my: 0, ox: 0, oy: 0 })

  const currentIndex = allImages.findIndex((i) => i.id === item.id)
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < allImages.length - 1

  useEffect(() => { setZoom(1); setOffset({ x: 0, y: 0 }) }, [item.id])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft" && hasPrev) { const p = allImages[currentIndex - 1]; if (p) onNavigate(p) }
      if (e.key === "ArrowRight" && hasNext) { const n = allImages[currentIndex + 1]; if (n) onNavigate(n) }
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(6, z + 0.25))
      if (e.key === "-") setZoom((z) => Math.max(1, z - 0.25))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [hasPrev, hasNext, currentIndex, allImages, onClose, onNavigate])

  const clampZoom = (z: number) => Math.min(6, Math.max(1, z))
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const next = clampZoom(zoom - e.deltaY * 0.002)
    setZoom(next)
    if (next === 1) setOffset({ x: 0, y: 0 })
  }
  const onMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return
    setDragging(true)
    dragOrigin.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y }
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return
    setOffset({ x: dragOrigin.current.ox + (e.clientX - dragOrigin.current.mx) / zoom, y: dragOrigin.current.oy + (e.clientY - dragOrigin.current.my) / zoom })
  }
  const onMouseUp = () => setDragging(false)
  const resetView = () => { setZoom(1); setOffset({ x: 0, y: 0 }) }
  const downloadImage = () => {
    const url = item.imageUrl
    if (!url) return
    const a = document.createElement("a")
    a.href = url
    a.download = `${item.title.replace(/\s+/g, "_")}.jpg`
    a.click()
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ backgroundColor: "rgba(0,0,0,0.96)" }}>
      <div className="flex items-center justify-between px-3 sm:px-5 py-3 flex-shrink-0 gap-2" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate leading-tight max-w-[180px] sm:max-w-none">{item.title}</p>
            {item.description && <p className="text-white/40 text-xs truncate mt-0.5">{item.description}</p>}
          </div>
          {item.featured && (
            <span className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-white text-xs font-semibold">
              <Icon icon="tabler:star-filled" className="w-3 h-3" />
              {t.portfolioFeaturedBadge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 ml-4">
          <button onClick={() => { const z = clampZoom(zoom - 0.25); setZoom(z); if (z === 1) setOffset({ x: 0, y: 0 }) }} className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all" title={t.portfolioLightboxZoomOut}>
            <Icon icon="tabler:zoom-out" className="w-4 h-4" />
          </button>
          <button onClick={resetView} className="min-w-[48px] h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-xs font-mono transition-all px-2" title={t.portfolioLightboxResetZoom}>
            {Math.round(zoom * 100)}%
          </button>
          <button onClick={() => setZoom((z) => clampZoom(z + 0.25))} className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all" title={t.portfolioLightboxZoomIn}>
            <Icon icon="tabler:zoom-in" className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-white/15 mx-1" />
          <button onClick={resetView} className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all" title={t.portfolioLightboxFitScreen}>
            <Icon icon="tabler:arrows-minimize" className="w-4 h-4" />
          </button>
          <button onClick={downloadImage} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all" title={t.portfolioLightboxDownload}>
            <Icon icon="tabler:download" className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-white/15 mx-1" />
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-red-500/60 transition-all" title={t.portfolioLightboxClose}>
            <Icon icon="tabler:x" className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden"
        style={{ cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "default" }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp} onWheel={handleWheel}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <img
          src={item.imageUrl} alt={item.title} draggable={false}
          className="max-w-full max-h-full object-contain pointer-events-none select-none rounded-sm"
          style={{ transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`, transformOrigin: "center center", transition: dragging ? "none" : "transform 0.1s ease-out", maxHeight: "calc(100vh - 130px)", boxShadow: "0 25px 60px rgba(0,0,0,0.8)" }}
        />
        {hasPrev && (
          <button onClick={(e) => { e.stopPropagation(); const p = allImages[currentIndex - 1]; if (p) onNavigate(p) }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 border border-white/15 flex items-center justify-center text-white transition-all hover:scale-110 backdrop-blur-sm"
            title={t.portfolioLightboxPrevImage}>
            <Icon icon="tabler:chevron-left" className="w-5 h-5" />
          </button>
        )}
        {hasNext && (
          <button onClick={(e) => { e.stopPropagation(); const n = allImages[currentIndex + 1]; if (n) onNavigate(n) }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 border border-white/15 flex items-center justify-center text-white transition-all hover:scale-110 backdrop-blur-sm"
            title={t.portfolioLightboxNextImage}>
            <Icon icon="tabler:chevron-right" className="w-5 h-5" />
          </button>
        )}
        {zoom === 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm text-white/60 text-xs px-4 py-1.5 rounded-full pointer-events-none border border-white/10">
            {t.portfolioLightboxScrollHint}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex flex-wrap gap-1.5">
          {item.tags?.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/60 border border-white/10">{tag}</span>
          ))}
        </div>
        {allImages.length > 1 && (
          <div className="flex items-center gap-1.5 ml-4">
            {allImages.map((img, idx) => (
              <button key={img.id} onClick={() => onNavigate(img)} title={img.title}
                className={`rounded-full transition-all ${idx === currentIndex ? "bg-white w-4 h-1.5" : "bg-white/30 hover:bg-white/60 w-1.5 h-1.5"}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PortfolioCard
// ═══════════════════════════════════════════════════════════════════════════════

function PortfolioCard({
  item,
  onDelete,
  onImageClick,
  onEdit,
  onToggleHidden,
}: {
  item: PortfolioItem
  onDelete: (id: string) => void
  onImageClick: (item: PortfolioItem) => void
  onEdit: (item: PortfolioItem) => void
  onToggleHidden: (item: PortfolioItem) => void
}) {
  const t = useT()
  const [playing, setPlaying] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  // "Hide from manager" only makes sense when a manager has access.
  const { hasAccess: canHide } = useManagerAccess()
  const showHidden = canHide && !!item.hidden

  const isImage = item.type === "image"
  const isDocument = item.type === "document"

  const thumbnail = (() => {
    switch (item.type) {
      case "image": return item.imageUrl
      case "video": return item.videoThumbnailUrl
      case "youtube": return item.youtubeThumbnailUrl
      case "link": return item.linkThumbnailUrl
      default: return undefined
    }
  })()

  const externalUrl = (() => {
    switch (item.type) {
      case "youtube": return `https://www.youtube.com/watch?v=${item.youtubeVideoId}`
      case "link": return item.linkUrl
      case "document": return item.documentUrl
      default: return undefined
    }
  })()

  const docCfg = isDocument ? DOC_CONFIG[item.documentExt ?? "pdf"] : null

  return (
    <div className={`group relative bg-white rounded-2xl shadow-sm border ${showHidden ? "border-gray-200 opacity-70" : "border-gray-100"} hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col ${menuOpen ? "z-[100]" : ""}`}>
      {/* Thumbnail */}
      <div
        className="relative w-full aspect-video bg-gray-100 overflow-hidden"
        onClick={isImage ? () => onImageClick(item) : undefined}
        style={isImage ? { cursor: "zoom-in" } : {}}
      >
        {isDocument ? (
          <DocumentThumbnail item={item} />
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
              <button onClick={() => onImageClick(item)} className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition-transform shadow-lg" title={t.portfolioViewFullImage}>
                <Icon icon="tabler:arrows-maximize" className="w-5 h-5 text-gray-800" />
              </button>
            )}
            {(item.type === "youtube" || item.type === "video") && !playing && (
              <button onClick={(e) => { e.stopPropagation(); setPlaying(true) }} className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                <Icon icon="tabler:player-play-filled" className="w-5 h-5 text-gray-800 ml-0.5" />
              </button>
            )}
            {externalUrl && (
              <a href={externalUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center hover:scale-110 transition-transform shadow">
                <Icon icon="tabler:external-link" className="w-4 h-4 text-gray-700" />
              </a>
            )}
          </div>
        )}

        {isDocument && item.documentUrl && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2" style={{ backgroundColor: `${docCfg?.color}18` }}>
            <a
              href={item.documentUrl} download={item.documentName}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold text-sm text-white shadow-lg transition-all hover:scale-105 hover:brightness-110"
              style={{ backgroundColor: docCfg?.color }}
            >
              <Icon icon="tabler:download" className="w-4 h-4" />
              {t.portfolioDownloadButton}
            </a>
          </div>
        )}

        {item.featured && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-white text-xs font-semibold shadow pointer-events-none">
            <Icon icon="tabler:star-filled" className="w-3 h-3" />
            {t.portfolioFeaturedBadge}
          </div>
        )}

        {showHidden && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-800/85 text-white text-xs font-semibold shadow pointer-events-none">
            <Icon icon="tabler:eye-off" className="w-3 h-3" />
            {"Hidden"}
          </div>
        )}

        {item.type === "youtube" && !playing && (
          <div className="absolute bottom-2 right-2 pointer-events-none">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 text-white text-xs font-bold shadow">
              <Icon icon="tabler:brand-youtube" className="w-3.5 h-3.5" />
              {t.portfolioYoutubeBadge}
            </div>
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

      {/* Card body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2 flex-1"
            onClick={isImage ? () => onImageClick(item) : undefined}
            style={isImage ? { cursor: "pointer" } : {}}
          >
            {item.title}
          </h3>

          {/* Kebab menu */}
          <div className="relative" ref={(el) => {
            if (!el) return
            const handler = (e: MouseEvent) => { if (!el.contains(e.target as Node)) setMenuOpen(false) }
            if (menuOpen) document.addEventListener("mousedown", handler)
            return () => document.removeEventListener("mousedown", handler)
          }}>
            <button onClick={() => setMenuOpen((v) => !v)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <Icon icon="tabler:dots-vertical" className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-xl z-50 min-w-[170px] py-1 overflow-hidden">
                {isImage && (
                  <button onClick={() => { onImageClick(item); setMenuOpen(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                    <Icon icon="tabler:arrows-maximize" className="w-3.5 h-3.5" />
                    {t.portfolioViewFullImage}
                  </button>
                )}
                {isDocument && item.documentUrl && (
                  <a href={item.documentUrl} download={item.documentName} className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setMenuOpen(false)}>
                    <Icon icon="tabler:download" className="w-3.5 h-3.5" />
                    {t.portfolioDownloadFile}
                  </a>
                )}
                {externalUrl && !isDocument && (
                  <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setMenuOpen(false)}>
                    <Icon icon="tabler:external-link" className="w-3.5 h-3.5" />
                    {t.portfolioOpenLinkLabel}
                  </a>
                )}
                {/* ── Edit button ── */}
                <button
                  onClick={() => { onEdit(item); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Icon icon="tabler:pencil" className="w-3.5 h-3.5" />
                  {t.portfolioEditItem ?? "Edit"}
                </button>
                {/* ── Hide / Unhide button — only with an accepted manager connection ── */}
                {canHide && (
                  <button
                    onClick={() => { onToggleHidden(item); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Icon icon={item.hidden ? "tabler:eye" : "tabler:eye-off"} className="w-3.5 h-3.5" />
                    {item.hidden
                      ? t.portfolioUnhideFromManager
                      : t.portfolioHideFromManager}
                  </button>
                )}
                <div className="my-1 border-t border-gray-100" />
                <button onClick={() => { onDelete(item.id); setMenuOpen(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors">
                  <Icon icon="tabler:trash" className="w-3.5 h-3.5" />
                  {t.portfolioDeleteItem}
                </button>
              </div>
            )}
          </div>
        </div>

        <TypeBadge type={item.type} />

        {item.description && (
          <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{item.description}</p>
        )}

        {isDocument && (item.documentName || item.documentSize != null) && (
          <div className="flex items-center gap-2 mt-0.5">
            <Icon icon={docCfg?.icon ?? "tabler:file"} className="w-3.5 h-3.5 flex-shrink-0" style={{ color: docCfg?.color }} />
            <span className="text-xs text-gray-400 truncate">{item.documentName}</span>
            {item.documentSize != null && (
              <span className="text-xs text-gray-300 flex-shrink-0">· {formatBytes(item.documentSize)}</span>
            )}
          </div>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-1">
            {item.tags.map((tag) => <TagPill key={tag} tag={tag} />)}
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// AddModal — handles both "add new" and "edit existing"
// ═══════════════════════════════════════════════════════════════════════════════

interface ModalProps {
  onClose: () => void
  onAdd: (item: PortfolioItem) => void
  editItem?: PortfolioItem
  onEdit?: (item: PortfolioItem) => void
}

function AddModal({ onClose, onAdd, editItem, onEdit }: ModalProps) {
  const t = useT()
  const isEditing = Boolean(editItem)

  const [step, setStep] = useState<"pick" | "form">(isEditing ? "form" : "pick")
  const [selectedType, setSelectedType] = useState<ItemType | null>(editItem?.type ?? null)

  const [title, setTitle] = useState(editItem?.title ?? "")
  const [description, setDescription] = useState(editItem?.description ?? "")
  const [tags, setTags] = useState(editItem?.tags?.join(", ") ?? "")
  const [featured, setFeatured] = useState(editItem?.featured ?? false)

  // Image — seed with existing URL so current image is shown immediately
  const [filePreview, setFilePreview] = useState<string | null>(editItem?.imageUrl ?? null)
  const [appliedUrl, setAppliedUrl] = useState<string | null>(editItem?.imageUrl ?? null)
  const [imgDragging, setImgDragging] = useState(false)

  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbPreview, setThumbPreview] = useState<string | null>(editItem?.videoThumbnailUrl ?? null)
  const [vidDragging, setVidDragging] = useState(false)

  const [youtubeUrl, setYoutubeUrl] = useState(editItem?.youtubeUrl ?? "")
  const [youtubeId, setYoutubeId] = useState<string | null>(editItem?.youtubeVideoId ?? null)

  const [linkUrl, setLinkUrl] = useState(editItem?.linkUrl ?? "")
  const [linkThumbPreview, setLinkThumbPreview] = useState<string | null>(editItem?.linkThumbnailUrl ?? null)

  const [docFile, setDocFile] = useState<File | null>(null)
  const [docDragging, setDocDragging] = useState(false)

  // In edit mode with no new file selected, we keep the existing document
  const keepExistingDoc =
    isEditing &&
    editItem?.type === "document" &&
    Boolean(editItem?.documentUrl) &&
    docFile === null

  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const thumbInputRef = useRef<HTMLInputElement>(null)
  const linkThumbRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)

  const readFile = (f: File): Promise<string> =>
    new Promise((res) => { const r = new FileReader(); r.onload = (e) => res(e.target?.result as string); r.readAsDataURL(f) })

  const sanitizeFilename = (original: string): string => {
    const lastDot = original.lastIndexOf(".")
    const base = lastDot > 0 ? original.slice(0, lastDot) : original
    const ext = lastDot > 0 ? original.slice(lastDot).toLowerCase() : ""
    const safe = base
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, "")
      || "file"
    return `${safe}${ext}`
  }

  const DIRECT_UPLOAD_THRESHOLD = 10 * 1024 * 1024

  const uploadFileToMedia = async (file: File): Promise<{ id: string; url: string }> => {
    const safeName = sanitizeFilename(file.name)

    if (file.size >= DIRECT_UPLOAD_THRESHOLD) {
      const presignRes = await fetch("/api/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, mimeType: file.type, fileSize: file.size }),
      })
      if (!presignRes.ok) throw new Error(`Presign request failed (${presignRes.status}): ${await presignRes.text()}`)
      const { uploadId, key, publicUrl, safeName: sName, partUrls, partSize } = await presignRes.json()

      const parts: { PartNumber: number; ETag: string }[] = []
      for (let i = 0; i < partUrls.length; i++) {
        const start = i * partSize
        const end = Math.min(start + partSize, file.size)
        const chunk = file.slice(start, end)
        setUploadProgress(`Uploading part ${i + 1} of ${partUrls.length}…`)
        const partRes = await fetch(partUrls[i], { method: "PUT", headers: { "Content-Type": file.type }, body: chunk })
        if (!partRes.ok) throw new Error(`Part ${i + 1} upload failed (${partRes.status}): ${await partRes.text()}`)
        const etag = partRes.headers.get("ETag") ?? partRes.headers.get("etag") ?? ""
        parts.push({ PartNumber: i + 1, ETag: etag })
      }

      setUploadProgress("Finalising upload…")
      const completeRes = await fetch("/api/presign/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId, key, publicUrl, originalFilename: file.name, safeName: sName, mimeType: file.type, fileSize: file.size, parts }),
      })
      if (!completeRes.ok) throw new Error(`Upload completion failed (${completeRes.status}): ${await completeRes.text()}`)
      const { id, url } = await completeRes.json()
      return { id: String(id), url }
    }

    const safeFile = new File([file], safeName, { type: file.type })
    const form = new FormData()
    form.append("file", safeFile, safeName)
    form.append("alt", file.name)
    const res = await fetch("/api/media", { method: "POST", body: form })
    if (!res.ok) throw new Error(`Media upload failed (${res.status}): ${await res.text()}`)
    const { doc } = await res.json()
    return { id: String(doc.id), url: doc.url as string }
  }

  const handleImageFile = async (f: File) => { setFilePreview(await readFile(f)); setAppliedUrl(null) }

  const handleImageDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); setImgDragging(false)
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith("image/")) await handleImageFile(f)
  }, [])

  const handleVideoDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); setVidDragging(false)
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith("video/")) setVideoFile(f)
  }, [])

  const handleDocFile = async (f: File) => {
    setDocFile(f)
    if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "))
  }

  const handleDocDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); setDocDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) await handleDocFile(f)
  }, [title])

  useEffect(() => { setYoutubeId(youtubeUrl ? extractYouTubeId(youtubeUrl) : null) }, [youtubeUrl])

  const finalImageUrl = appliedUrl ?? filePreview

  const canSubmit = (() => {
    if (!title.trim() || !selectedType) return false
    if (selectedType === "image" && !finalImageUrl) return false
    if (selectedType === "video") return false
    if (selectedType === "youtube" && !youtubeId) return false
    if (selectedType === "link" && !linkUrl.trim()) return false
    if (selectedType === "document" && !docFile && !keepExistingDoc) return false
    return true
  })()

  const handleSubmit = async () => {
    if (!selectedType || !canSubmit || uploading) return
    setUploading(true)
    try {
      const tagList = tags.split(",").map((tag) => tag.trim()).filter(Boolean)
      const base = {
        id: editItem?.id ?? crypto.randomUUID(),
        type: selectedType,
        title: title.trim(),
        description: description.trim() || undefined,
        tags: tagList.length ? tagList : undefined,
        featured,
        hidden: editItem?.hidden ?? false,
        createdAt: editItem?.createdAt ?? new Date().toISOString(),
      }
      let item: PortfolioItem

      switch (selectedType) {
        case "image":
          item = { ...base, imageUrl: finalImageUrl! }
          break

        case "video": {
          setUploadProgress("Uploading video…")
          const videoResult = videoFile ? await uploadFileToMedia(videoFile) : null
          item = {
            ...base,
            videoUrl: videoResult?.url ?? editItem?.videoUrl,
            videoMediaId: videoResult?.id ?? editItem?.videoMediaId,
            videoThumbnailUrl: thumbPreview || editItem?.videoThumbnailUrl || undefined,
          }
          break
        }

        case "youtube":
          item = { ...base, youtubeUrl, youtubeVideoId: youtubeId!, youtubeThumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` }
          break

        case "link":
          item = { ...base, linkUrl, linkThumbnailUrl: linkThumbPreview || undefined }
          break

        case "document": {
          let docResult: { id: string; url: string } | null = null
          if (docFile) {
            setUploadProgress("Uploading document…")
            docResult = await uploadFileToMedia(docFile)
          }
          item = {
            ...base,
            documentUrl: docResult?.url ?? editItem?.documentUrl,
            documentMediaId: docResult?.id ?? editItem?.documentMediaId,
            documentName: docFile?.name ?? editItem?.documentName,
            documentSize: docFile?.size ?? editItem?.documentSize,
            documentExt: docFile ? getDocExt(docFile.name) : editItem?.documentExt,
          }
          break
        }
      }

      if (isEditing && onEdit) {
        onEdit({ ...editItem!, ...item! })
      } else {
        onAdd(item!)
      }
      onClose()
    } catch (err) {
      console.error("Failed to upload file:", err)
      setUploadProgress("Upload failed — please try again")
    } finally {
      setUploading(false)
      if (uploadProgress !== "Upload failed — please try again") setUploadProgress("")
    }
  }

  // Back arrow: in edit mode just close; in add mode go back to type picker
  const goBack = () => {
    if (isEditing) { onClose(); return }
    setStep("pick"); setFilePreview(null); setAppliedUrl(null); setDocFile(null); setVideoFile(null); setUploadProgress("")
  }

  const docExt = docFile ? getDocExt(docFile.name) : null
  const docCfgPreview = docExt ? DOC_CONFIG[docExt] : null

  const TYPE_CONFIG: Record<ItemType, { label: string; icon: string; color: string; bg: string; desc: string }> = {
    image: { label: t.portfolioTypeImageLabel, icon: "tabler:photo", color: "#0ea5e9", bg: "#e0f2fe", desc: t.portfolioTypeImageDesc },
    video: { label: t.portfolioTypeVideoLabel, icon: "tabler:movie", color: "#8b5cf6", bg: "#ede9fe", desc: t.portfolioTypeVideoDesc },
    youtube: { label: t.portfolioTypeYoutubeLabel, icon: "tabler:brand-youtube", color: "#ef4444", bg: "#fee2e2", desc: t.portfolioTypeYoutubeDesc },
    link: { label: t.portfolioTypeLinkLabel, icon: "tabler:link", color: "#10b981", bg: "#d1fae5", desc: t.portfolioTypeLinkDesc },
    document: { label: t.portfolioTypeDocumentLabel, icon: "tabler:file-text", color: "#f59e0b", bg: "#fef3c7", desc: t.portfolioTypeDocumentDesc },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto z-10">
        {/* Sticky header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 py-4 border-b border-gray-100 rounded-t-2xl">
          <div className="flex items-center gap-3">
            {step === "form" && (
              <button onClick={goBack} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500">
                <Icon icon="tabler:arrow-left" className="w-4 h-4" />
              </button>
            )}
            <h2 className="font-semibold text-gray-800 text-base">
              {step === "pick"
                ? t.portfolioAddModalTitle
                : isEditing
                  ? `${t.portfolioEditPrefix ?? "Edit"} ${TYPE_CONFIG[selectedType!].label}`
                  : `${t.portfolioNewItemPrefix} ${TYPE_CONFIG[selectedType!].label}`}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-400">
            <Icon icon="tabler:x" className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {/* Step 1: type picker (add mode only) */}
          {step === "pick" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">{t.portfolioAddModalPrompt}</p>
              {(Object.entries(TYPE_CONFIG) as [ItemType, typeof TYPE_CONFIG[ItemType]][]).map(([type, cfg]) => (
                <button key={type} onClick={() => { setSelectedType(type); setStep("form") }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all group text-left">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110" style={{ backgroundColor: cfg.bg }}>
                    <Icon icon={cfg.icon} className="w-5 h-5" style={{ color: cfg.color }} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{cfg.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{cfg.desc}</p>
                  </div>
                  <Icon icon="tabler:chevron-right" className="w-4 h-4 text-gray-300 ml-auto group-hover:text-gray-500 transition-colors" />
                </button>
              ))}
            </div>
          )}

          {/* Step 2: form */}
          {step === "form" && selectedType && (
            <div className="space-y-4">

              {/* IMAGE */}
              {selectedType === "image" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-gray-600">
                      {filePreview ? t.portfolioImageAdjustLabel : t.portfolioImageFieldLabel}
                    </label>
                    {appliedUrl && !isEditing && (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <Icon icon="tabler:check" className="w-3.5 h-3.5" />
                        {t.portfolioCropApplied}
                      </span>
                    )}
                  </div>
                  {!filePreview ? (
                    <div onDragOver={(e) => { e.preventDefault(); setImgDragging(true) }} onDragLeave={() => setImgDragging(false)} onDrop={handleImageDrop} onClick={() => fileInputRef.current?.click()}
                      className={`relative w-full rounded-xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-3 py-14 ${imgDragging ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-400 bg-gray-50"}`}>
                      <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                        <Icon icon="tabler:photo-up" className="w-7 h-7 text-blue-500" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">
                          {t.portfolioDragDropOr} <span className="text-blue-500">{t.portfolioBrowse}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{t.portfolioImageFormats}</p>
                      </div>
                    </div>
                  ) : (
                    <ImageEditor
                      src={filePreview}
                      onApply={setAppliedUrl}
                      onReset={() => { setFilePreview(null); setAppliedUrl(null) }}
                    />
                  )}
                  <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) await handleImageFile(f) }} />
                </div>
              )}

              {/* VIDEO — Coming Soon */}
              {selectedType === "video" && (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden">
                    <div className="opacity-30 pointer-events-none select-none space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">{t.portfolioVideoFileLabel}</label>
                        <div className="w-full py-8 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2">
                          <Icon icon="tabler:movie-up" className="w-8 h-8 text-gray-300" />
                          <p className="text-xs text-gray-400">Drag & drop or <span className="text-purple-400 font-medium">browse</span></p>
                          <p className="text-xs text-gray-300">MP4, MOV, WebM</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">{t.portfolioThumbnailOptional}</label>
                        <div className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center">
                          <Icon icon="tabler:photo" className="w-7 h-7 text-gray-300 mb-1" />
                          <p className="text-xs text-gray-400">{t.portfolioAddThumbnail}</p>
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-[2px] rounded-xl">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: "#ede9fe" }}>
                        <Icon icon="tabler:clock-hour-4" className="w-7 h-7" style={{ color: "#8b5cf6" }} />
                      </div>
                      <div className="text-center px-4">
                        <p className="font-semibold text-gray-800 text-sm">{t.portfolioVideoComingSoonTitle}</p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{t.portfolioVideoComingSoonBody}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "#ede9fe", color: "#7c3aed" }}>
                        {t.portfolioVideoComingSoonBadge}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* YOUTUBE */}
              {selectedType === "youtube" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">{t.portfolioYoutubeUrlLabel}</label>
                    <input type="url" placeholder={t.portfolioYoutubeUrlPlaceholder} value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all" />
                  </div>
                  <div className={`w-full aspect-video rounded-xl overflow-hidden border-2 transition-all ${youtubeId ? "border-red-200" : "border-gray-100 bg-gray-50"}`}>
                    {youtubeId ? (
                      <div className="relative w-full h-full">
                        <img src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`} alt="thumbnail" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-red-600/90 flex items-center justify-center shadow-xl"><Icon icon="tabler:player-play-filled" className="w-6 h-6 text-white ml-1" /></div>
                        </div>
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                          <Icon icon="tabler:check" className="w-3 h-3 text-green-400" />{t.portfolioYoutubeVideoDetected}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <Icon icon="tabler:brand-youtube" className="w-10 h-10 text-gray-200" />
                        <p className="text-xs text-gray-300">{t.portfolioYoutubeThumbnailHint}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* LINK */}
              {selectedType === "link" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">{t.portfolioWebsiteUrlLabel}</label>
                    <input type="url" placeholder={t.portfolioWebsiteUrlPlaceholder} value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">{t.portfolioPreviewImageOptional}</label>
                    <div onClick={() => linkThumbRef.current?.click()} className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-400 bg-gray-50 cursor-pointer transition-all flex flex-col items-center justify-center overflow-hidden">
                      {linkThumbPreview ? <img src={linkThumbPreview} alt="preview" className="w-full h-full object-cover" /> : <><Icon icon="tabler:screenshot" className="w-7 h-7 text-gray-300 mb-1" /><p className="text-xs text-gray-400">{t.portfolioUploadScreenshot}</p></>}
                    </div>
                    <input ref={linkThumbRef} type="file" className="hidden" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setLinkThumbPreview(await readFile(f)) }} />
                  </div>
                </div>
              )}

              {/* DOCUMENT */}
              {selectedType === "document" && (
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-gray-600">{t.portfolioDocumentFieldLabel}</label>

                  {/* Edit mode: show current doc with Replace button */}
                  {isEditing && !docFile && editItem?.documentName && (
                    <div
                      className="relative w-full rounded-xl border-2 p-4 flex items-center gap-4"
                      style={{
                        borderColor: `${DOC_CONFIG[editItem.documentExt ?? "pdf"].color}40`,
                        backgroundColor: `${DOC_CONFIG[editItem.documentExt ?? "pdf"].color}08`,
                      }}
                    >
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: DOC_CONFIG[editItem.documentExt ?? "pdf"].bg }}
                      >
                        <Icon
                          icon={DOC_CONFIG[editItem.documentExt ?? "pdf"].icon}
                          className="w-8 h-8"
                          style={{ color: DOC_CONFIG[editItem.documentExt ?? "pdf"].color }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{editItem.documentName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-bold uppercase"
                            style={{
                              backgroundColor: DOC_CONFIG[editItem.documentExt ?? "pdf"].bg,
                              color: DOC_CONFIG[editItem.documentExt ?? "pdf"].color,
                            }}
                          >
                            {DOC_CONFIG[editItem.documentExt ?? "pdf"].label}
                          </span>
                          {editItem.documentSize != null && (
                            <span className="text-xs text-gray-400">{formatBytes(editItem.documentSize)}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {t.portfolioKeepCurrentFile ?? "Current file — upload a new one to replace"}
                        </p>
                      </div>
                      <button
                        onClick={() => docInputRef.current?.click()}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
                      >
                        <Icon icon="tabler:replace" className="w-3.5 h-3.5" />
                        {t.portfolioReplaceFile ?? "Replace"}
                      </button>
                    </div>
                  )}

                  {/* Add mode (or edit with no existing doc): show drop zone */}
                  {!isEditing && !docFile && (
                    <div onDragOver={(e) => { e.preventDefault(); setDocDragging(true) }} onDragLeave={() => setDocDragging(false)} onDrop={handleDocDrop} onClick={() => docInputRef.current?.click()}
                      className={`relative w-full rounded-xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-3 py-12 ${docDragging ? "border-amber-400 bg-amber-50" : "border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 bg-gray-50"}`}>
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#fef3c7" }}>
                        <Icon icon="tabler:file-upload" className="w-8 h-8" style={{ color: "#f59e0b" }} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">{t.portfolioDragDropOr} <span style={{ color: "#f59e0b" }}>{t.portfolioBrowse}</span></p>
                        <p className="text-xs text-gray-400 mt-1">{t.portfolioSupportedFormats}</p>
                        <div className="flex items-center justify-center gap-1.5 mt-1.5">
                          {(["pdf", "docx", "pptx"] as const).map((ext) => {
                            const c = DOC_CONFIG[ext]
                            return <span key={ext} className="px-2 py-0.5 rounded-full text-xs font-bold uppercase" style={{ backgroundColor: c.bg, color: c.color }}>{c.label}</span>
                          })}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Max 10 MB</p>
                      </div>
                    </div>
                  )}

                  {/* New file selected (both add and edit modes) */}
                  {docFile && (
                    <div className="relative w-full rounded-xl border-2 p-4 flex items-center gap-4" style={{ borderColor: `${docCfgPreview?.color}40`, backgroundColor: `${docCfgPreview?.color}08` }}>
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ backgroundColor: docCfgPreview?.bg }}>
                        <Icon icon={docCfgPreview?.icon ?? "tabler:file"} className="w-8 h-8" style={{ color: docCfgPreview?.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{docFile.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase" style={{ backgroundColor: docCfgPreview?.bg, color: docCfgPreview?.color }}>{docCfgPreview?.label}</span>
                          <span className="text-xs text-gray-400">{formatBytes(docFile.size)}</span>
                        </div>
                      </div>
                      <button onClick={() => setDocFile(null)} className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all" title={t.portfolioRemoveFile}>
                        <Icon icon="tabler:x" className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <input ref={docInputRef} type="file" className="hidden" accept={ACCEPTED_DOC_TYPES} onChange={async (e) => { const f = e.target.files?.[0]; if (f) await handleDocFile(f) }} />
                </div>
              )}

              {/* Shared fields */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">{t.portfolioItemTitleLabel}</label>
                <input type="text" placeholder={t.portfolioItemTitlePlaceholder} value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">{t.portfolioItemDescriptionLabel}</label>
                <textarea placeholder={t.portfolioItemDescriptionPlaceholder} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">{t.portfolioItemTagsLabel}</label>
                <input type="text" placeholder={t.portfolioItemTagsPlaceholder} value={tags} onChange={(e) => setTags(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all" />
                <p className="text-xs text-gray-400 mt-1">{t.portfolioItemTagsHint}</p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer group select-none">
                <div onClick={() => setFeatured((v) => !v)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${featured ? "border-amber-400 bg-amber-400" : "border-gray-300 group-hover:border-amber-300"}`}>
                  {featured && <Icon icon="tabler:check" className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm text-gray-600">
                  <Icon icon="tabler:star" className="w-3.5 h-3.5 inline mr-1 text-amber-400" />
                  {t.portfolioMarkAsFeatured}
                </span>
              </label>

              {uploadProgress && (
                <p className="text-xs text-center text-amber-600 font-medium animate-pulse">{uploadProgress}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={!canSubmit || uploading}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: (canSubmit && !uploading) ? BRAND : "#9ca3af" }}
                onMouseEnter={(e) => { if (canSubmit && !uploading) e.currentTarget.style.backgroundColor = BRAND_HOVER }}
                onMouseLeave={(e) => { if (canSubmit && !uploading) e.currentTarget.style.backgroundColor = BRAND }}
              >
                {uploading ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <Icon icon={isEditing ? "tabler:check" : "tabler:plus"} className="w-4 h-4" />
                )}
                {uploading
                  ? uploadProgress || "Uploading…"
                  : isEditing
                    ? (t.portfolioSaveChangesButton ?? "Save changes")
                    : t.portfolioAddToPortfolioButton}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Portfolio — main page component
// ═══════════════════════════════════════════════════════════════════════════════

interface PortfolioProps {
  buttonText?: string
  hideTitle?: boolean
  onClick?: () => void
}

const Portfolio: React.FC<PortfolioProps> = ({ buttonText, hideTitle = false }) => {
  const { t } = useDashboardTranslations()
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<FilterType>("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null)
  const [search, setSearch] = useState("")
  const [lightboxItem, setLightboxItem] = useState<PortfolioItem | null>(null)

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/portfolios")
      .then((r) => r.json())
      .then(({ items }) => setItems(items ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // ── Create ────────────────────────────────────────────────────────────────
  const handleAdd = async (item: PortfolioItem) => {
    setSaving(true)
    try {
      const res = await fetch("/api/portfolios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      })
      if (!res.ok) throw new Error(await res.text())
      const { item: saved } = await res.json()
      setItems((prev) => [saved, ...prev])
    } catch (err) {
      console.error("Failed to save portfolio item:", err)
      setItems((prev) => [item, ...prev])
    } finally {
      setSaving(false)
    }
  }

  // ── Edit ──────────────────────────────────────────────────────────────────
  const handleEdit = async (updated: PortfolioItem) => {
    // Optimistic update
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
    try {
      const res = await fetch(`/api/portfolios/${updated.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      })
      if (!res.ok) throw new Error(await res.text())
      const { item: saved } = await res.json()
      setItems((prev) => prev.map((i) => (i.id === saved.id ? saved : i)))
    } catch (err) {
      console.error("Failed to update portfolio item:", err)
      // Re-fetch to restore correct state
      fetch("/api/portfolios")
        .then((r) => r.json())
        .then(({ items }) => setItems(items ?? []))
        .catch(console.error)
    }
  }

  // ── Toggle visibility to manager ────────────────────────────────────────────
  const handleToggleHidden = async (item: PortfolioItem) => {
    const updated = { ...item, hidden: !item.hidden }
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)))
    try {
      const res = await fetch(`/api/portfolios/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: updated.hidden }),
      })
      if (!res.ok) throw new Error(await res.text())
      const { item: saved } = await res.json()
      setItems((prev) => prev.map((i) => (i.id === saved.id ? saved : i)))
    } catch (err) {
      console.error("Failed to toggle hidden state:", err)
      fetch("/api/portfolios")
        .then((r) => r.json())
        .then(({ items }) => setItems(items ?? []))
        .catch(console.error)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    try {
      const res = await fetch(`/api/portfolios/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error(await res.text())
    } catch (err) {
      console.error("Failed to delete portfolio item:", err)
      fetch("/api/portfolios")
        .then((r) => r.json())
        .then(({ items }) => setItems(items ?? []))
        .catch(console.error)
    }
  }

  const filtered = items.filter((item) => {
    if (filter !== "all" && item.type !== filter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        item.title.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.tags?.some((tag) => tag.toLowerCase().includes(q)) ||
        item.documentName?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const sorted = [...filtered].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
  const allImages = items.filter((i) => i.type === "image")

  const counts: Record<FilterType, number> = {
    all: items.length,
    image: items.filter((i) => i.type === "image").length,
    video: items.filter((i) => i.type === "video").length,
    youtube: items.filter((i) => i.type === "youtube").length,
    link: items.filter((i) => i.type === "link").length,
    document: items.filter((i) => i.type === "document").length,
  }

  const FILTERS: { key: FilterType; label: string; icon: string }[] = [
    { key: "all", label: t.portfolioFilterAll, icon: "tabler:layout-grid" },
    { key: "image", label: t.portfolioFilterImages, icon: "tabler:photo" },
    { key: "video", label: t.portfolioFilterVideos, icon: "tabler:movie" },
    { key: "youtube", label: t.portfolioFilterYoutube, icon: "tabler:brand-youtube" },
    { key: "link", label: t.portfolioFilterLinks, icon: "tabler:link" },
    { key: "document", label: t.portfolioFilterDocuments, icon: "tabler:file-text" },
  ]

  return (
    <PT.Provider value={t}>
      <div className="w-full flex justify-center pb-12">
        <div className="w-full max-w-5xl px-4">
          {/* Header */}
          {!hideTitle && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-gray-900">{t.portfolioTitle}</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {items.length === 0
                    ? t.portfolioNoItemsYet
                    : `${items.length} ${t.portfolioTitle.toLowerCase()}`}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-sm hover:shadow-md"
                style={{ backgroundColor: BRAND }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND_HOVER)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND)}
              >
                {saving ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <Icon icon="tabler:plus" className="w-4 h-4" />
                )}
                {saving ? "…" : (buttonText || t.portfolioAddItemButton)}
              </button>
            </div>
          )}

          {/* Filters + search */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl overflow-x-auto flex-shrink-0 scrollbar-none">
              {FILTERS.map((f) => {
                const active = filter === f.key
                return (
                  <button key={f.key} onClick={() => setFilter(f.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${active ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>
                    <Icon icon={f.icon} className="w-3.5 h-3.5" />
                    {f.label}
                    {counts[f.key] > 0 && (
                      <span className={`text-xs px-1 rounded-full ${active ? "bg-gray-100 text-gray-600" : "text-gray-400"}`}>
                        {counts[f.key]}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <div className="relative flex-1 min-w-0">
              <Icon icon="tabler:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder={t.portfolioSearchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all border border-transparent focus:border-gray-200" />
            </div>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-transparent animate-spin" style={{ borderTopColor: BRAND }} />
              <p className="text-sm text-gray-400">{t.loading}</p>
            </div>
          ) : sorted.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sorted.map((item) => (
                <PortfolioCard
                  key={item.id}
                  item={item}
                  onDelete={handleDelete}
                  onImageClick={setLightboxItem}
                  onEdit={setEditingItem}
                  onToggleHidden={handleToggleHidden}
                />
              ))}
              {/* Ghost add card */}
              <button onClick={() => setModalOpen(true)}
                className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-400 bg-gray-50 hover:bg-gray-100 transition-all aspect-video min-h-[120px] cursor-pointer group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: BRAND }}>
                  <Icon icon="tabler:plus" className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-400 group-hover:text-gray-600 transition-colors">
                  {t.portfolioGhostCardLabel}
                </span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Icon icon="tabler:folder-open" className="w-10 h-10 text-gray-300" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-600">
                  {search || filter !== "all" ? t.portfolioNoMatchTitle : t.portfolioEmptyTitle}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {search || filter !== "all" ? t.portfolioNoMatchSubtitle : t.portfolioEmptySubtitle}
                </p>
              </div>
              {!search && filter === "all" && (
                <button onClick={() => setModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all mt-2"
                  style={{ backgroundColor: BRAND }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND_HOVER)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND)}>
                  <Icon icon="tabler:plus" className="w-4 h-4" />
                  {t.portfolioAddFirstItemButton}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Add modal */}
        {modalOpen && (
          <AddModal onClose={() => setModalOpen(false)} onAdd={handleAdd} />
        )}

        {/* Edit modal */}
        {editingItem && (
          <AddModal
            onClose={() => setEditingItem(null)}
            onAdd={handleAdd}
            editItem={editingItem}
            onEdit={async (updated) => {
              setEditingItem(null)
              await handleEdit(updated)
            }}
          />
        )}

        {lightboxItem && (
          <ImageLightbox item={lightboxItem} allImages={allImages} onClose={() => setLightboxItem(null)} onNavigate={setLightboxItem} />
        )}
      </div>
    </PT.Provider>
  )
}

export default Portfolio
