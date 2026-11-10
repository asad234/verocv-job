"use client"

import type React from "react"
import { useRef, useState, useEffect, useCallback } from "react"
import { Icon } from "@iconify/react"
import clsx from "clsx"

const NAVY = "rgb(5,22,80)"
const INK = "#111827"

// Drawn at 2× the displayed size for a crisp signature image.
const CANVAS_W = 1000
const CANVAS_H = 360

export interface SignatureResult {
  /** PNG of the signature — produced for both drawn and typed signatures. */
  dataUrl: string | null
  /** Set when the employee typed instead of drew. */
  typedName: string | null
}

interface SignatureCanvasProps {
  isEn: boolean
  defaultName?: string
  disabled?: boolean
  onChange: (result: SignatureResult) => void
}

type Mode = "draw" | "type"

const SIGNATURE_FONTS = [
  { family: "'Great Vibes', cursive", label: "Great Vibes" },
  { family: "'Dancing Script', cursive", label: "Dancing Script" },
  { family: "'Sacramento', cursive", label: "Sacramento" },
]

export default function SignatureCanvas({ isEn, defaultName = "", disabled, onChange }: SignatureCanvasProps) {
  const [mode, setMode] = useState<Mode>("draw")
  const [typedName, setTypedName] = useState(defaultName)
  const [fontIndex, setFontIndex] = useState(0)
  const [hasDrawing, setHasDrawing] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const hasDrawingRef = useRef(false) // ref, not state — avoids the stale value on the first stroke
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange })

  // Cursive fonts for typed signatures (loaded once).
  useEffect(() => {
    if (document.getElementById("verocv-signature-fonts")) return
    const link = document.createElement("link")
    link.id = "verocv-signature-fonts"
    link.rel = "stylesheet"
    link.href = "https://fonts.googleapis.com/css2?family=Great+Vibes&family=Dancing+Script&family=Sacramento&display=swap"
    document.head.appendChild(link)
  }, [])

  /* ── Drawing ── */
  // Maps screen coordinates to canvas pixels, whatever size the canvas is displayed at.
  const toCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  const getCtx = () => {
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return null
    ctx.strokeStyle = INK
    ctx.fillStyle = INK
    ctx.lineWidth = 4.5
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    return ctx
  }

  const emitDrawing = () => {
    const canvas = canvasRef.current
    onChangeRef.current({
      dataUrl: canvas && hasDrawingRef.current ? canvas.toDataURL("image/png") : null,
      typedName: null,
    })
  }

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drawingRef.current = true
    const p = toCanvasPoint(e)
    lastPoint.current = p
    // A dot, so a single tap also counts
    const ctx = getCtx()
    if (ctx) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !lastPoint.current) return
    const ctx = getCtx()
    if (!ctx) return
    const p = toCanvasPoint(e)
    ctx.beginPath()
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    lastPoint.current = p
    if (!hasDrawingRef.current) {
      hasDrawingRef.current = true
      setHasDrawing(true)
    }
  }

  const endDraw = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    lastPoint.current = null
    emitDrawing()
  }

  const clearDrawing = () => {
    const canvas = canvasRef.current
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height)
    hasDrawingRef.current = false
    setHasDrawing(false)
    onChangeRef.current({ dataUrl: null, typedName: null })
  }

  /* ── Typing: render the name in the chosen font to a PNG ── */
  const renderTyped = useCallback(async (name: string, fontIdx: number): Promise<string | null> => {
    const text = name.trim()
    if (!text) return null
    const family = SIGNATURE_FONTS[fontIdx]!.family
    try { await document.fonts.load(`96px ${family}`) } catch { /* fall back to the cursive default */ }

    const canvas = document.createElement("canvas")
    canvas.width = CANVAS_W
    canvas.height = 280
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    let size = 120
    ctx.font = `${size}px ${family}`
    while (ctx.measureText(text).width > canvas.width - 80 && size > 36) {
      size -= 4
      ctx.font = `${size}px ${family}`
    }
    ctx.fillStyle = INK
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(text, canvas.width / 2, canvas.height / 2)
    return canvas.toDataURL("image/png")
  }, [])

  useEffect(() => {
    if (mode !== "type") return
    let cancelled = false
    renderTyped(typedName, fontIndex).then(dataUrl => {
      if (!cancelled) onChangeRef.current({ dataUrl, typedName: typedName.trim() || null })
    })
    return () => { cancelled = true }
  }, [mode, typedName, fontIndex, renderTyped])

  const switchMode = (next: Mode) => {
    if (next === mode) return
    setMode(next)
    if (next === "draw") emitDrawing()
    // "type" emits from the effect above
  }

  return (
    <div className={clsx("space-y-3", disabled && "opacity-60 pointer-events-none")}>
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        <button type="button" onClick={() => switchMode("draw")}
          className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            mode === "draw" ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700")}>
          <Icon icon="tabler:signature" className="w-3.5 h-3.5" />
          {isEn ? "Draw" : "Rita"}
        </button>
        <button type="button" onClick={() => switchMode("type")}
          className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            mode === "type" ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700")}>
          <Icon icon="tabler:keyboard" className="w-3.5 h-3.5" />
          {isEn ? "Type" : "Skriv"}
        </button>
      </div>

      {/* Draw — kept mounted (just hidden) so the drawing survives switching tabs */}
      <div className={clsx("space-y-2", mode !== "draw" && "hidden")}>
        <div className="relative rounded-xl border-2 border-dashed border-gray-200 bg-white overflow-hidden">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="block w-full aspect-[25/9] touch-none cursor-crosshair"
            onPointerDown={startDraw}
            onPointerMove={moveDraw}
            onPointerUp={endDraw}
            onPointerCancel={endDraw}
          />
          {/* Signature line */}
          <div className="absolute left-6 right-6 bottom-[22%] border-b border-gray-300 pointer-events-none" />
          {!hasDrawing && (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-gray-300 pointer-events-none">
              {isEn ? "Sign here with your mouse or finger" : "Signera här med mus eller finger"}
            </p>
          )}
        </div>
        <button type="button" onClick={clearDrawing} disabled={!hasDrawing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-all">
          <Icon icon="tabler:eraser" className="w-3.5 h-3.5" />
          {isEn ? "Clear" : "Rensa"}
        </button>
      </div>

      {/* Type */}
      {mode === "type" && (
        <div className="space-y-2">
          <input
            type="text"
            value={typedName}
            onChange={e => setTypedName(e.target.value)}
            placeholder={isEn ? "Type your full name" : "Skriv ditt fullständiga namn"}
            maxLength={80}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-100"
          />
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white px-4 py-6 flex items-center justify-center min-h-[110px] overflow-hidden">
            {typedName.trim() ? (
              <p className="truncate max-w-full" style={{ fontFamily: SIGNATURE_FONTS[fontIndex]!.family, fontSize: "2.4rem", color: INK }}>
                {typedName}
              </p>
            ) : (
              <p className="text-sm text-gray-300">{isEn ? "Your signature preview" : "Förhandsvisning av din signatur"}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {SIGNATURE_FONTS.map((f, i) => (
              <button key={f.label} type="button" onClick={() => setFontIndex(i)}
                className={clsx("px-3 py-1.5 rounded-lg text-sm border transition-all",
                  fontIndex === i ? "text-white border-transparent" : "text-gray-600 border-gray-200 hover:bg-gray-50")}
                style={fontIndex === i ? { backgroundColor: NAVY, fontFamily: f.family } : { fontFamily: f.family }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
