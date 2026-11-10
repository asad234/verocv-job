'use client'

export interface ContractTemplateFile {
  id: string
  name: string
  sizeBytes: number
  mimeType: string
  uploadedAt: string
  notes?: string
  // Base64 data URL — fine for a handful of PDFs during development, but
  // localStorage caps out around 5–10MB total depending on the browser.
  // Swap this whole file for real calls to a file-storage endpoint
  // (e.g. POST /api/company/managers/contract-templates, returning a URL
  // instead of embedding the file) once the backend exists — every function
  // below keeps the same name/signature so nothing else needs to change.
  dataUrl: string
}

const STORAGE_KEY = 'veroCvMockContractTemplates'
const MAX_FILE_BYTES = 8 * 1024 * 1024 // 8MB per file — generous for a contract PDF

export function loadTemplates(): ContractTemplateFile[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveTemplates(templates: ContractTemplateFile[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  } catch (err) {
    // Most likely a QuotaExceededError — surfaced to the caller so the UI
    // can tell the manager the upload didn't actually save.
    throw new Error('STORAGE_QUOTA_EXCEEDED')
  }
}

export function deleteTemplate(id: string) {
  const all = loadTemplates().filter((t) => t.id !== id)
  saveTemplates(all)
  return all
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export async function addTemplateFile(file: File, notes?: string): Promise<ContractTemplateFile> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('FILE_TOO_LARGE')
  }
  const dataUrl = await fileToDataUrl(file)
  const entry: ContractTemplateFile = {
    id: crypto.randomUUID(),
    name: file.name,
    sizeBytes: file.size,
    mimeType: file.type || 'application/pdf',
    uploadedAt: new Date().toISOString(),
    notes,
    dataUrl,
  }
  const all = [entry, ...loadTemplates()]
  saveTemplates(all)
  return entry
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export { MAX_FILE_BYTES }
