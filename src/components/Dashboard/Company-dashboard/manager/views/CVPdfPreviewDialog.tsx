"use client"

import dynamic from "next/dynamic"
import { Icon } from "@iconify/react"

const NAVY = "rgb(5,22,80)"

function PdfLoading() {
  return (
    <div className="flex items-center justify-center h-full text-gray-400 text-sm gap-2">
      <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
      Rendering PDF preview…
    </div>
  )
}

// Reusing the SAME component the public CV page (/cv/[url]/page.tsx) uses —
// LivePdfPreview already correctly handles template selection, SSR, and
// prop resolution for live in-browser preview. No reason to reimplement that
// logic separately (which is what caused the earlier "X is not a function"
// errors — my own manual <PDFViewer> + per-template switch approach).
const LivePdfPreview = dynamic(
  () => import("@/components/CV/PdfViewer/livePdfViewer"),
  { ssr: false, loading: () => <PdfLoading /> },
)

const VALID_TEMPLATES = ["minimalist", "modern", "classic", "ats", "konsult"] as const
function isValidTemplate(t: unknown): t is (typeof VALID_TEMPLATES)[number] {
  return typeof t === "string" && (VALID_TEMPLATES as readonly string[]).includes(t)
}

export default function CVPdfPreviewDialog({ cv, onClose }: { cv: any; onClose: () => void }) {
  const template = isValidTemplate(cv.template) ? cv.template : "modern"

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black/80">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: NAVY }}>
            <Icon icon="tabler:file-text" className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{cv.name}</p>
            <p className="text-xs text-gray-400 capitalize">{template} template · read-only</p>
          </div>
        </div>
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0">
          <Icon icon="tabler:x" className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 min-h-0">
        {/* Passing the raw CV document straight through, exactly like the
            public CV page does — no custom field mapping. */}
        <LivePdfPreview
          cvData={cv}
          visibility={cv.visibility}
          template={template}
          showToolbar={true}
          fullScreen={false}
          portfolioItems={cv.portfolioItems ?? []}
          accentColor={cv.accentColor}
          headingFontId={cv.headingFontId}
          bodyFontId={cv.bodyFontId}
        />
      </div>
    </div>
  )
}
