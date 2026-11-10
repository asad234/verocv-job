"use client"

import { useRef, useEffect, useState } from "react"
import { Icon } from "@iconify/react"
import { PDF_FONTS, type PdfFontValue } from "@/utils/pdfFonts"
import {
  type RichRun, runsToHtml, serializeToRuns, applyStyleToSelection, clearFormattingInSelection,
} from "@/utils/richText"

const SIZE_OPTIONS = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28]

interface RichTextEditorProps {
  value: RichRun[]
  onChange: (runs: RichRun[]) => void
  placeholder?: string
  isEn: boolean
  minHeightPx?: number
  defaultFontFamily?: PdfFontValue
  defaultColor?: string
  defaultFontSize?: number
}

export default function RichTextEditor({
  value, onChange, placeholder, isEn, minHeightPx = 220,
  defaultFontFamily, defaultColor, defaultFontSize,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const savedRange = useRef<Range | null>(null)
  const [pendingColor, setPendingColor] = useState("#051650")
  const [isEmpty, setIsEmpty] = useState(value.length === 0)

  // Load content once on mount only — after that, the browser owns the DOM
  // natively as the person types/formats, and we just read it back out.
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = runsToHtml(value)
      setIsEmpty(value.length === 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const captureSelection = () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange()
    }
  }

  // Toolbar controls steal focus from the editor, which clears the browser's
  // live selection — this restores the last selection made *inside* the
  // editor right before a toolbar action runs.
  const restoreSelection = (): boolean => {
    if (!savedRange.current) return false
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(savedRange.current)
    return true
  }

  const commitChange = () => {
    if (!editorRef.current) return
    const runs = serializeToRuns(editorRef.current)
    setIsEmpty((editorRef.current.textContent ?? "").trim().length === 0)
    onChange(runs)
  }

  const withSelection = (fn: () => void) => {
    if (!editorRef.current) return
    editorRef.current.focus()
    if (!restoreSelection()) return // nothing was selected — no-op
    fn()
    commitChange()
  }

  const toggleBold = () => withSelection(() => {
    const isBold = document.queryCommandState?.("bold") ?? false
    applyStyleToSelection(editorRef.current!, { bold: !isBold })
  })

  const toggleItalic = () => withSelection(() => {
    const isItalic = document.queryCommandState?.("italic") ?? false
    applyStyleToSelection(editorRef.current!, { italic: !isItalic })
  })

  const applyColor = () => withSelection(() => {
    applyStyleToSelection(editorRef.current!, { color: pendingColor })
  })

  const applyFont = (family: string) => withSelection(() => {
    applyStyleToSelection(editorRef.current!, { fontFamily: family })
  })

  const applySize = (size: number) => withSelection(() => {
    applyStyleToSelection(editorRef.current!, { fontSize: size })
  })

  const clearFormat = () => withSelection(() => {
    clearFormattingInSelection(editorRef.current!)
  })

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 flex-wrap px-2.5 py-2 bg-gray-50 border-b border-gray-200">
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={toggleBold}
          className="w-7 h-7 rounded-md flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors" title={isEn ? "Bold" : "Fet"}>
          <Icon icon="tabler:bold" className="w-4 h-4" />
        </button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={toggleItalic}
          className="w-7 h-7 rounded-md flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors" title={isEn ? "Italic" : "Kursiv"}>
          <Icon icon="tabler:italic" className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        <select onMouseDown={e => e.stopPropagation()} onChange={e => applyFont(e.target.value)} defaultValue=""
          className="text-xs border border-gray-200 rounded-md px-1.5 py-1 bg-white text-gray-600 outline-none max-w-[140px]">
          <option value="" disabled>{isEn ? "Font…" : "Typsnitt…"}</option>
          {Object.entries(PDF_FONTS).map(([key, family]) => (
            <option key={key} value={family} style={{ fontFamily: `'${family}'` }}>{family}</option>
          ))}
        </select>

        <select onMouseDown={e => e.stopPropagation()} onChange={e => applySize(Number(e.target.value))} defaultValue=""
          className="text-xs border border-gray-200 rounded-md px-1.5 py-1 bg-white text-gray-600 outline-none w-[70px]">
          <option value="" disabled>{isEn ? "Size" : "Storlek"}</option>
          {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}pt</option>)}
        </select>

        <div className="flex items-center gap-1">
          <input type="color" value={pendingColor} onChange={e => setPendingColor(e.target.value)}
            className="w-7 h-7 rounded-md border border-gray-200 cursor-pointer p-0.5 bg-white" title={isEn ? "Pick color" : "Välj färg"} />
          <button type="button" onMouseDown={e => e.preventDefault()} onClick={applyColor}
            className="text-xs px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-200 transition-colors">
            {isEn ? "Apply color" : "Applicera färg"}
          </button>
        </div>

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        <button type="button" onMouseDown={e => e.preventDefault()} onClick={clearFormat}
          className="text-xs px-2 py-1 rounded-md text-gray-500 hover:bg-gray-200 transition-colors flex items-center gap-1">
          <Icon icon="tabler:clear-formatting" className="w-3.5 h-3.5" />
          {isEn ? "Clear" : "Rensa"}
        </button>

        <span className="ml-auto text-[10px] text-gray-400 hidden sm:block">
          {isEn ? "Select text, then apply a style" : "Markera text, applicera sedan stil"}
        </span>
      </div>

      {/* Editable surface */}
      <div className="relative">
        {isEmpty && placeholder && (
          <p className="absolute top-3 left-3 text-sm text-gray-300 pointer-events-none">{placeholder}</p>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={commitChange}
          onMouseUp={captureSelection}
          onKeyUp={captureSelection}
          onBlur={captureSelection}
          className="px-3 py-3 text-sm leading-relaxed outline-none"
          style={{
            minHeight: minHeightPx,
            fontFamily: defaultFontFamily ? `'${defaultFontFamily}'` : undefined,
            color: defaultColor,
            fontSize: defaultFontSize ? `${defaultFontSize}pt` : undefined,
          }}
        />
      </div>
    </div>
  )
}
