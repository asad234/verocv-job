"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/manager/views/LogoReminderDialog.tsx
// WHAT IT DOES:   Shown when the manager sends a contract that has no company logo.
//                 A reminder only — the logo is NOT required:
//                   • "Upload logo"        → pick an image; it's added to the contract, then sending continues
//                   • "Send without logo"  → sending continues without any image
//                   • ✕ / backdrop         → cancel, nothing is sent
//                 Used by ManagerContractEditor and the Send button on ManagerContracts.
// ══════════════════════════════════════════════════════════════════════

import { useRef, useState } from "react"
import { Icon } from "@iconify/react"
import { toResizedPng } from "./Companylogopicker"

const NAVY = "rgb(5,22,80)"
const LIGHT = "rgb(239,246,255)"
const MAX_INPUT_BYTES = 5 * 1024 * 1024

interface LogoReminderDialogProps {
  isEn: boolean
  /** Something is saving/sending — disables the buttons. */
  busy?: boolean
  /** Error from saving the logo (shown in the dialog). */
  error?: string | null
  onClose: () => void
  /** The manager uploaded a logo (PNG data URL). May be async (e.g. saves the contract). */
  onUpload: (logoDataUrl: string) => void | Promise<void>
  /** The manager declined — continue sending without a logo. */
  onSkip: () => void
}

export default function LogoReminderDialog({ isEn, busy, error, onClose, onUpload, onSkip }: LogoReminderDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [reading, setReading] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const disabled = busy || reading

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setFileError(null)
    if (!file.type.startsWith("image/")) {
      setFileError(isEn ? "Choose an image file (PNG, JPG or SVG)." : "Välj en bildfil (PNG, JPG eller SVG).")
      return
    }
    if (file.size > MAX_INPUT_BYTES) {
      setFileError(isEn ? "The image is larger than 5 MB." : "Bilden är större än 5 MB.")
      return
    }
    setReading(true)
    try {
      let logo: string
      try {
        logo = await toResizedPng(file)
      } catch {
        setFileError(isEn ? "The image could not be read." : "Bilden kunde inte läsas.")
        return
      }
      // Saving errors are reported by the parent through the `error` prop.
      await Promise.resolve(onUpload(logo)).catch(() => { })
    } finally {
      setReading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const shownError = fileError || error

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!disabled ? onClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <button onClick={onClose} disabled={disabled} aria-label={isEn ? "Close" : "Stäng"}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-400 disabled:opacity-40">
          <Icon icon="tabler:x" className="w-4 h-4" />
        </button>

        <div className="px-6 pt-7 pb-5 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: LIGHT }}>
            <Icon icon="tabler:photo-star" className="w-7 h-7" style={{ color: NAVY }} />
          </div>
          <h2 className="font-semibold text-gray-800 text-base">
            {isEn ? "Add your company logo?" : "Lägg till er företagslogga?"}
          </h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            {isEn
              ? "This contract has no logo. Upload your logo image for a more professional contract — it's shown at the top of the contract and as a watermark on the signed PDF."
              : "Kontraktet har ingen logga. Ladda upp er logga för ett mer professionellt kontrakt — den visas överst i kontraktet och som vattenstämpel på den signerade PDF:en."}
          </p>

          {/* Mini preview of where the logo goes */}
          <div className="mx-auto mt-4 w-40 rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-left">
            <div className="h-3 w-10 rounded-sm border border-dashed border-gray-300 mb-2" />
            <div className="space-y-1">
              <div className="h-1.5 w-full rounded bg-gray-200" />
              <div className="h-1.5 w-5/6 rounded bg-gray-200" />
              <div className="h-1.5 w-4/6 rounded bg-gray-200" />
            </div>
          </div>

          {shownError && <p className="text-xs text-red-500 mt-3">{shownError}</p>}
        </div>

        <div className="px-6 pb-6 flex flex-col-reverse sm:flex-row gap-2">
          <button onClick={onSkip} disabled={disabled}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
            {isEn ? "Send without logo" : "Skicka utan logga"}
          </button>
          <button onClick={() => inputRef.current?.click()} disabled={disabled}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: NAVY }}>
            {disabled
              ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Icon icon="tabler:upload" className="w-4 h-4" />}
            {isEn ? "Upload logo" : "Ladda upp logga"}
          </button>
        </div>

        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden"
          onChange={e => handleFile(e.target.files?.[0])} />
      </div>
    </div>
  )
}
