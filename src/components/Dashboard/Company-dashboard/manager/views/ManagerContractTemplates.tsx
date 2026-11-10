"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/manager/views/ManagerContractTemplates.tsx
// WHAT IT DOES:   The "Reference Files" page. Files are now saved in the database
//                 (contract-templates collection) through
//                 /api/company/managers/contract-templates — so they show up in
//                 "Generate from one of your templates".
//                 Files that were saved in this browser by the old version
//                 (localStorage) can be moved to the account with one click.
// ══════════════════════════════════════════════════════════════════════

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Icon } from "@iconify/react"
import clsx from "clsx"
import { useManagerTranslations } from "@/utils/Managertranslations"
import { useManagerDashboard } from "@/components/Dashboard/Company-dashboard/manager/ManagerDashboardContext"
import {
  loadTemplates, addTemplateFile, deleteTemplate, templateDownloadUrl, formatFileSize, MAX_FILE_BYTES,
  type ContractTemplateFile,
} from "@/utils/contractsApi"

const NAVY = "rgb(5,22,80)"
const LIGHT = "rgb(239,246,255)"

/* ─── Files saved by the old localStorage version of this page ─── */
const LEGACY_STORAGE_KEY = "veroCvMockContractTemplates"

interface LegacyTemplate {
  id: string
  name: string
  mimeType: string
  notes?: string
  dataUrl: string
}

function readLegacyTemplates(): LegacyTemplate[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter(t => typeof t?.dataUrl === "string" && t.dataUrl.startsWith("data:")) : []
  } catch {
    return []
  }
}

function writeLegacyTemplates(list: LegacyTemplate[]) {
  try {
    if (list.length === 0) window.localStorage.removeItem(LEGACY_STORAGE_KEY)
    else window.localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(list))
  } catch {
    // ignore storage errors
  }
}

async function legacyToFile(t: LegacyTemplate): Promise<File> {
  const blob = await (await fetch(t.dataUrl)).blob()
  return new File([blob], t.name || "template.pdf", { type: t.mimeType || blob.type || "application/pdf" })
}

/* ─── Helpers ─── */
function fmtDate(d: string, isEn: boolean) {
  return new Date(d).toLocaleDateString(isEn ? "en-GB" : "sv-SE", { day: "numeric", month: "short", year: "numeric" })
}

function fileIcon(mimeType: string) {
  if (mimeType.includes("pdf")) return { icon: "tabler:file-type-pdf", color: "#ef4444", bg: "#fee2e2" }
  if (mimeType.includes("word") || mimeType.includes("doc")) return { icon: "tabler:file-type-doc", color: "#2563eb", bg: "#dbeafe" }
  return { icon: "tabler:file-text", color: "#6b7280", bg: "#f3f4f6" }
}

/* ─────────────────────────────────────────────
   DELETE CONFIRM
───────────────────────────────────────────── */
const DeleteConfirm: React.FC<{
  file: ContractTemplateFile; isEn: boolean; busy: boolean; onClose: () => void; onConfirm: () => void
}> = ({ file, isEn, busy, onClose, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!busy ? onClose : undefined} />
    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100">
      <div className="px-6 py-5 border-b border-red-100 bg-red-50/50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
          <Icon icon="tabler:trash" className="w-5 h-5 text-red-600" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 text-sm">{isEn ? "Delete file" : "Radera fil"}</h3>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{file.name}</p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50">
        <button onClick={onClose} disabled={busy}
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-40">
          {isEn ? "Cancel" : "Avbryt"}
        </button>
        <button onClick={onConfirm} disabled={busy}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50"
          style={{ backgroundColor: "rgb(220,38,38)" }}>
          {busy
            ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <Icon icon="tabler:trash" className="w-3.5 h-3.5" />}
          {isEn ? "Delete" : "Radera"}
        </button>
      </div>
    </div>
  </div>
)

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function ManagerContractTemplates() {
  const { language } = useManagerTranslations()
  const { setView } = useManagerDashboard()
  const isEn = language === "en"

  const [files, setFiles] = useState<ContractTemplateFile[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ContractTemplateFile | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [legacy, setLegacy] = useState<LegacyTemplate[]>([])
  const [migrating, setMigrating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      setFiles(await loadTemplates())
    } catch (e) {
      setLoadError((e as Error).message || (isEn ? "Couldn't load your files." : "Kunde inte ladda dina filer."))
    } finally {
      setLoading(false)
    }
  }, [isEn])

  useEffect(() => {
    refresh()
    setLegacy(readLegacyTemplates())
  }, [refresh])

  const filtered = files.filter(f =>
    !search || f.name.toLowerCase().includes(search.toLowerCase()) || (f.notes ?? "").toLowerCase().includes(search.toLowerCase())
  )

  /* ── Upload ── */
  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    setUploadError(null)
    setUploading(true)
    try {
      for (const file of Array.from(fileList)) {
        if (file.size > MAX_FILE_BYTES) {
          setUploadError(isEn
            ? `"${file.name}" is too large (max ${formatFileSize(MAX_FILE_BYTES)}).`
            : `"${file.name}" är för stor (max ${formatFileSize(MAX_FILE_BYTES)}).`)
          continue
        }
        try {
          const entry = await addTemplateFile(file)
          setFiles(prev => [entry, ...prev])
        } catch (e) {
          setUploadError(`"${file.name}": ${(e as Error).message || (isEn ? "upload failed" : "uppladdningen misslyckades")}`)
        }
      }
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  /* ── Move files from this browser (old version) to the account ── */
  const migrateLegacy = async () => {
    setMigrating(true)
    setUploadError(null)
    let remaining = [...legacy]
    for (const t of legacy) {
      try {
        const entry = await addTemplateFile(await legacyToFile(t), t.notes)
        setFiles(prev => [entry, ...prev])
        remaining = remaining.filter(x => x.id !== t.id)
      } catch (e) {
        setUploadError(`"${t.name}": ${(e as Error).message || (isEn ? "could not be moved" : "kunde inte flyttas")}`)
      }
    }
    writeLegacyTemplates(remaining)
    setLegacy(remaining)
    setMigrating(false)
  }

  /* ── Delete ── */
  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteTemplate(deleteTarget.id)
      setFiles(prev => prev.filter(f => f.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (e) {
      setUploadError((e as Error).message || (isEn ? "Couldn't delete the file." : "Kunde inte radera filen."))
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  const openFile = (file: ContractTemplateFile) => window.open(file.url, "_blank", "noopener")

  const downloadFile = (file: ContractTemplateFile) => {
    const a = document.createElement("a")
    a.href = templateDownloadUrl(file)
    a.download = file.name
    a.click()
  }

  return (
    <div className="p-4 sm:p-6 m-2 sm:m-4">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 flex-wrap justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setView("contracts")}
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 flex-shrink-0">
              <Icon icon="tabler:arrow-left" className="w-4 h-4" />
            </button>
            <div className="p-2 rounded-lg" style={{ backgroundColor: NAVY }}>
              <Icon icon="tabler:folder-symlink" className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                {isEn ? "Contract Templates" : "Kontraktsmallar"}
              </h1>
              <p className="text-gray-500 text-sm">
                {isEn ? `${files.length} reference files saved` : `${files.length} referensfiler sparade`}
              </p>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3 ml-[84px] max-w-xl">
          {isEn
            ? "Upload your company's standard contract documents here — PDFs, templates, clause libraries. You can generate new employee contracts from them."
            : "Ladda upp företagets standardkontrakt här — PDF:er, mallar, klausulbibliotek. Du kan generera nya medarbetarkontrakt utifrån dem."}
        </p>
      </div>

      {/* Files left over from the old browser-only version */}
      {legacy.length > 0 && (
        <div className="mb-6 flex items-start gap-3 px-4 py-3.5 rounded-2xl border border-amber-200 bg-amber-50">
          <Icon icon="tabler:cloud-upload" className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900">
              {isEn
                ? `${legacy.length} file${legacy.length === 1 ? " is" : "s are"} only saved in this browser`
                : `${legacy.length} fil${legacy.length === 1 ? "" : "er"} är bara sparade i den här webbläsaren`}
            </p>
            <p className="text-xs text-amber-800 mt-0.5">
              {isEn
                ? "Move them to your account so you can generate contracts from them."
                : "Flytta dem till ditt konto så att du kan generera kontrakt utifrån dem."}
              {" "}{legacy.map(l => l.name).join(", ")}
            </p>
          </div>
          <button onClick={migrateLegacy} disabled={migrating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white flex-shrink-0 disabled:opacity-60"
            style={{ backgroundColor: NAVY }}>
            {migrating
              ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Icon icon="tabler:arrow-right" className="w-3.5 h-3.5" />}
            {isEn ? "Move to my account" : "Flytta till mitt konto"}
          </button>
        </div>
      )}

      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={clsx(
          "relative w-full rounded-2xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-3 py-10 mb-6",
          dragging ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-400 bg-gray-50"
        )}
      >
        {uploading ? (
          <>
            <div className="w-10 h-10 border-4 border-gray-200 border-t-transparent rounded-full animate-spin" style={{ borderTopColor: NAVY }} />
            <p className="text-sm font-medium text-gray-500">{isEn ? "Uploading…" : "Laddar upp…"}</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: LIGHT }}>
              <Icon icon="tabler:file-upload" className="w-7 h-7" style={{ color: NAVY }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">
                {isEn ? "Drag & drop or " : "Dra & släpp eller "}
                <span style={{ color: NAVY }} className="font-semibold">{isEn ? "browse" : "bläddra"}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PDF, DOCX — max {formatFileSize(MAX_FILE_BYTES)}
              </p>
            </div>
          </>
        )}
        <input ref={inputRef} type="file" multiple accept=".pdf,.doc,.docx" className="hidden"
          onChange={e => handleFiles(e.target.files)} />
      </div>

      {uploadError && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-600">
          <Icon icon="tabler:alert-circle" className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-600">
            <Icon icon="tabler:x" className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search */}
      {files.length > 0 && (
        <div className="relative mb-4 max-w-sm">
          <Icon icon="tabler:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={isEn ? "Search files…" : "Sök filer…"}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-200" />
        </div>
      )}

      {/* File list */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 flex items-center justify-center gap-2 text-sm text-gray-400">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
          {isEn ? "Loading files…" : "Laddar filer…"}
        </div>
      ) : loadError ? (
        <div className="bg-white rounded-2xl border border-red-100 py-16 text-center">
          <Icon icon="tabler:cloud-off" className="w-10 h-10 text-red-300 mx-auto mb-3" />
          <p className="text-sm text-red-600 font-medium">{loadError}</p>
          <button onClick={refresh}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <Icon icon="tabler:refresh" className="w-4 h-4" />
            {isEn ? "Try again" : "Försök igen"}
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <Icon icon="tabler:folder-off" className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium text-sm">
            {files.length === 0
              ? (isEn ? "No reference files uploaded yet." : "Inga referensfiler uppladdade än.")
              : (isEn ? "No files match your search." : "Inga filer matchar din sökning.")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(file => {
            const cfg = fileIcon(file.mimeType)
            const oldDoc = file.mimeType === "application/msword" || file.name.toLowerCase().endsWith(".doc")
            return (
              <div key={file.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-4 flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.bg }}>
                  <Icon icon={cfg.icon} className="w-6 h-6" style={{ color: cfg.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 truncate" title={file.name}>{file.name}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <span>{formatFileSize(file.sizeBytes)}</span>
                    <span>·</span>
                    <span>{fmtDate(file.uploadedAt, isEn)}</span>
                  </div>
                  {oldDoc && (
                    <p className="text-[11px] text-amber-600 mt-1">
                      {isEn ? "Old .doc format — can't be used for generating. Save as .docx or PDF." : "Gammalt .doc-format — kan inte användas för generering. Spara som .docx eller PDF."}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-3">
                    <button onClick={() => openFile(file)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-[11px] font-medium text-gray-600 hover:bg-gray-50 transition-all">
                      <Icon icon="tabler:eye" className="w-3.5 h-3.5" />
                      {isEn ? "View" : "Visa"}
                    </button>
                    <button onClick={() => downloadFile(file)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-[11px] font-medium text-gray-600 hover:bg-gray-50 transition-all">
                      <Icon icon="tabler:download" className="w-3.5 h-3.5" />
                      {isEn ? "Download" : "Ladda ner"}
                    </button>
                    <button onClick={() => setDeleteTarget(file)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-100 text-[11px] font-medium text-red-500 hover:bg-red-50 transition-all ml-auto">
                      <Icon icon="tabler:trash" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirm file={deleteTarget} isEn={isEn} busy={deleting}
          onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
      )}
    </div>
  )
}
