"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/manager/views/CompanyLogoPicker.tsx
// WHAT IT DOES:   Company logo upload for the contract editor ("Document Style" panel).
//                 Any image (PNG, JPG, SVG, WebP) is resized in the browser to max 600 px
//                 and stored as a PNG data URL on the contract — the PDF builder only
//                 accepts PNG/JPEG, and a small image keeps the contract light.
// ══════════════════════════════════════════════════════════════════════

import { useRef, useState } from "react"
import { Icon } from "@iconify/react"

const NAVY = "rgb(5,22,80)"
const MAX_INPUT_BYTES = 5 * 1024 * 1024
const MAX_SIDE = 600

interface CompanyLogoPickerProps {
  isEn: boolean
  value: string | null | undefined
  disabled?: boolean
  onChange: (dataUrl: string | null) => void
}

/** Reads any browser-supported image and returns a PNG data URL, max 600 px on the longest side. */
export async function toResizedPng(file: File): Promise<string> {
  const src = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error("unreadable image"))
    el.src = src
  })
  const w = img.naturalWidth || 300
  const h = img.naturalHeight || 150
  const scale = Math.min(1, MAX_SIDE / Math.max(w, h))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(w * scale))
  canvas.height = Math.max(1, Math.round(h * scale))
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("canvas unavailable")
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL("image/png")
}

export default function CompanyLogoPicker({ isEn, value, disabled, onChange }: CompanyLogoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    if (!file.type.startsWith("image/")) {
      setError(isEn ? "Choose an image file (PNG, JPG or SVG)." : "Välj en bildfil (PNG, JPG eller SVG).")
      return
    }
    if (file.size > MAX_INPUT_BYTES) {
      setError(isEn ? "The image is larger than 5 MB." : "Bilden är större än 5 MB.")
      return
    }
    setBusy(true)
    try {
      onChange(await toResizedPng(file))
    } catch {
      setError(isEn ? "The image could not be read." : "Bilden kunde inte läsas.")
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-500 mb-1.5">{isEn ? "Company Logo" : "Företagslogga"}</p>

      {value ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-14 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center p-1.5 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={isEn ? "Company logo" : "Företagslogga"} className="max-h-full max-w-full object-contain" />
          </div>
          <div className="flex flex-col gap-1">
            <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled || busy}
              className="px-2 py-1 rounded-md border border-gray-200 text-[11px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
              {isEn ? "Replace" : "Byt"}
            </button>
            <button type="button" onClick={() => onChange(null)} disabled={disabled || busy}
              className="px-2 py-1 rounded-md border border-red-100 text-[11px] font-medium text-red-500 hover:bg-red-50 disabled:opacity-40">
              {isEn ? "Remove" : "Ta bort"}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled || busy}
          className="w-full flex items-center justify-center gap-1.5 h-14 rounded-lg border-2 border-dashed border-gray-200 text-xs font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-40">
          {busy
            ? <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
            : <Icon icon="tabler:photo-plus" className="w-4 h-4" style={{ color: NAVY }} />}
          {isEn ? "Upload logo" : "Ladda upp logga"}
        </button>
      )}

      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden"
        onChange={e => handleFile(e.target.files?.[0])} />

      {error ? (
        <p className="text-[10px] text-red-500 mt-1">{error}</p>
      ) : (
        <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
          {isEn
            ? "Shown small at the top of the contract, and as a faint watermark on the signed PDF."
            : "Visas litet överst i kontraktet och som en svag vattenstämpel på den signerade PDF:en."}
        </p>
      )}
    </div>
  )
}
