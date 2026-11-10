"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Availability/Calendar/WeekCalendar.tsx   (REPLACE)
// WHAT IT DOES:   The employee's year calendar — pick a tool, then drag over days:
//   Mark (saved straight away to your calendar):
//     • Tillgänglig / Available   • Bokad / Booked   • Rensa / Clear
//   Time off (the same types as on "Time off & week"):
//     • Semester, Sjuk, VAB, Föräldraledig, Kompledigt, Tjänstledigt, Utbildning, Annat
//     → dragging opens the request form with those days filled in (onTimeOffRange).
//       Sick / VAB are registered at once, the rest go to your manager (managers: your business admin).
//   Your requests are drawn on top: solid = approved, dashed = waiting (for your manager / business admin).
// ══════════════════════════════════════════════════════════════════════

import type React from "react"
import { useState, useEffect, useRef, forwardRef } from "react"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { cn } from "@/utils/cn"
import axios from "axios"
import { ClearCalendarButton } from "./ClearCalendarModal"
import { TIME_OFF_TYPES, TYPE_LABELS, type TimeOffRequest, type TimeOffType } from "@/utils/managerAvailability"

type DateStatus = "booked" | "available" | "vacation" | "none"
/** A calendar mark, or a kind of time off to ask for. */
export type CalendarTool = "available" | "booked" | "none" | TimeOffType

interface DateInfo {
  year: number
  month: number
  day: number
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "icon"
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = "default", size = "default", ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
      variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/90",
      variant === "outline" && "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      variant === "ghost" && "hover:bg-accent hover:text-accent-foreground",
      size === "default" && "h-10 px-4 py-2",
      size === "sm" && "h-9 rounded-md px-3",
      size === "icon" && "h-10 w-10",
      className,
    )}
    {...props}
  />
))
Button.displayName = "Button"

const Switch = ({ id, checked, onCheckedChange }: { id: string; checked: boolean; onCheckedChange: (c: boolean) => void }) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange(!checked)}
    className={cn("inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors", checked ? "bg-primary" : "bg-input")}
  >
    <span className={cn("block h-4 w-4 rounded-full bg-background shadow-lg transition-transform", checked ? "translate-x-4" : "translate-x-0")} />
  </button>
)

interface YearCalendarTranslations {
  today: string
  available: string
  vacation: string
  booked: string
  clear: string
  showWeekNumbers: string
  dragToSelectMultiple: string
  none: string
}

interface YearCalendarProps {
  initialYear?: number
  calendarId?: number | null
  onDateSelect?: (date: string, status: DateStatus) => void
  initialDateStatuses?: Record<string, DateStatus>
  translations?: YearCalendarTranslations
  /** Your days-off requests — drawn on top of the calendar */
  requests?: TimeOffRequest[]
  /** Dragged over days with a time-off tool → open the request form */
  onTimeOffRange?: (start: string, end: string, type: TimeOffType) => void
  lang?: "sv" | "en"
  /** Who answers your requests — "employee": your manager · "manager": your business admin */
  audience?: "employee" | "manager"
}

const MARK_STYLE: Record<"available" | "booked" | "vacation", { bg: string; color: string }> = {
  available: { bg: "rgb(220,252,231)", color: "rgb(22,101,52)" },
  booked: { bg: "rgb(191,219,254)", color: "rgb(30,64,175)" },
  vacation: { bg: "rgb(254,202,202)", color: "rgb(153,27,27)" },
}

const pad = (n: number) => String(n).padStart(2, "0")
const keyOf = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`
const isTimeOff = (t: CalendarTool): t is TimeOffType => (TIME_OFF_TYPES as readonly string[]).includes(t)

export default function YearCalendar({
  initialYear = new Date().getFullYear(),
  onDateSelect = () => { },
  initialDateStatuses = {},
  calendarId = null,
  requests = [],
  onTimeOffRange,
  lang = "sv",
  audience = "employee",
  translations = {
    today: "Today",
    available: "Available",
    vacation: "Vacation",
    booked: "Booked",
    clear: "Clear",
    showWeekNumbers: "Show week numbers",
    dragToSelectMultiple: "Drag to select multiple days",
    none: "None",
  },
}: YearCalendarProps) {
  const [year, setYear] = useState(initialYear)
  const [tool, setTool] = useState<CalendarTool>("booked")
  const [dateStatuses, setDateStatuses] = useState<Record<string, DateStatus>>(initialDateStatuses)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState<DateInfo | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<DateInfo | null>(null)
  const [showWeekNumbers, setShowWeekNumbers] = useState(true)
  const calendarRef = useRef<HTMLDivElement>(null)
  const todayCellRef = useRef<HTMLDivElement | null>(null)
  const E = lang === "en"
  const waitingFor = audience === "manager"
    ? (E ? "Waiting for your business admin" : "Väntar på din business admin")
    : (E ? "Waiting for your manager" : "Väntar på din chef")

  const today = new Date()
  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth()
  const todayDay = today.getDate()

  useEffect(() => {
    const normalized: Record<string, DateStatus> = {}
    Object.entries(initialDateStatuses).forEach(([iso, status]) => {
      normalized[String(iso).slice(0, 10)] = status as DateStatus
    })
    setDateStatuses(normalized)
  }, [initialDateStatuses])

  const goToToday = () => {
    setYear(todayYear)
    setTimeout(() => todayCellRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50)
  }

  const daysIn = (y: number, m: number) => new Date(y, m + 1, 0).getDate()
  const weekdayOf = (y: number, m: number, d: number) => (new Date(y, m, d).getDay() + 6) % 7 // 0 = Monday
  const isoWeek = (y: number, m: number, d: number) => {
    const date = new Date(y, m, d)
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7))
    const week1 = new Date(date.getFullYear(), 0, 4)
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  }

  /** The request (approved or waiting) covering a day, if any. */
  const requestOn = (key: string) =>
    requests.find((r) => (r.status === "approved" || r.status === "pending") && r.startDate <= key && r.endDate >= key)

  const inSelection = (m: number, d: number) => {
    if (!isSelecting || !selectionStart || !selectionEnd) return false
    const date = new Date(year, m, d)
    const a = new Date(selectionStart.year, selectionStart.month, selectionStart.day)
    const b = new Date(selectionEnd.year, selectionEnd.month, selectionEnd.day)
    const [min, max] = a <= b ? [a, b] : [b, a]
    return date >= min && date <= max
  }

  const handleDown = (m: number, d: number) => {
    setIsSelecting(true)
    setSelectionStart({ year, month: m, day: d })
    setSelectionEnd({ year, month: m, day: d })
  }
  const handleMove = (m: number, d: number) => {
    if (isSelecting && selectionStart) setSelectionEnd({ year, month: m, day: d })
  }

  const handleUp = () => {
    if (isSelecting && selectionStart && selectionEnd) {
      const a = new Date(selectionStart.year, selectionStart.month, selectionStart.day)
      const b = new Date(selectionEnd.year, selectionEnd.month, selectionEnd.day)
      const [min, max] = a <= b ? [a, b] : [b, a]
      const startKey = keyOf(min.getFullYear(), min.getMonth(), min.getDate())
      const endKey = keyOf(max.getFullYear(), max.getMonth(), max.getDate())

      if (isTimeOff(tool)) {
        // Time off isn't drawn into the calendar — it becomes a request.
        onTimeOffRange?.(startKey, endKey, tool)
      } else {
        const status: DateStatus = tool
        const next = { ...dateStatuses }
        const keys: string[] = []
        for (const cur = new Date(min); cur <= max; cur.setDate(cur.getDate() + 1)) {
          const k = keyOf(cur.getFullYear(), cur.getMonth(), cur.getDate())
          if (status === "none") delete next[k]
          else next[k] = status
          keys.push(k)
          onDateSelect(k, status)
        }
        setDateStatuses(next)
        axios
          .post("/api/calendar-availability/bulk", { updates: keys.map((date) => ({ date, status })) })
          .catch((e: unknown) => console.error("Error updating dates in bulk:", e))
      }
    }
    setIsSelecting(false)
    setSelectionStart(null)
    setSelectionEnd(null)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches?.[0]
    if (!isSelecting || !touch) return
    const cell = document.elementFromPoint(touch.clientX, touch.clientY)?.closest("[data-date]")
    const [m, d] = (cell?.getAttribute("data-date") ?? "").split("-").map(Number)
    if (Number.isFinite(m) && Number.isFinite(d)) handleMove(m!, d!)
  }

  const months = E
    ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    : ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"]

  const markTools: { id: CalendarTool; label: string; swatch: string }[] = [
    { id: "available", label: translations.available, swatch: MARK_STYLE.available.bg },
    { id: "booked", label: translations.booked, swatch: MARK_STYLE.booked.bg },
    { id: "none", label: translations.clear || (E ? "Clear" : "Rensa"), swatch: "white" },
  ]

  const ToolButton = ({ id, label, swatch, border }: { id: CalendarTool; label: string; swatch: string; border?: string }) => (
    <button type="button" onClick={() => setTool(id)}
      className={cn("flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all",
        tool === id ? "ring-2 ring-blue-500 border-transparent bg-white" : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white")}>
      <span className="w-3 h-3 rounded-sm flex-shrink-0 border" style={{ backgroundColor: swatch, borderColor: border ?? "rgb(209,213,219)" }} />
      {label}
    </button>
  )

  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Year navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b gap-3">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => setYear((y) => y - 1)} className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-lg font-medium">{year}</span>
          <Button variant="ghost" size="icon" onClick={() => setYear((y) => y + 1)} className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={goToToday} className="ml-2 hidden sm:flex bg-transparent">
            <Calendar className="h-4 w-4 mr-2" />{translations.today}
          </Button>
        </div>
        <ClearCalendarButton availabilityId={calendarId?.toString()} onCleared={() => setDateStatuses({})} />
      </div>

      {/* Tools: pick one, then drag over the days */}
      <div className="px-4 py-3 border-b bg-gray-50/60 space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-24 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{E ? "Mark" : "Markera"}</span>
          {markTools.map((t) => <ToolButton key={t.id} {...t} />)}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-24 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{E ? "Time off" : "Ledighet"}</span>
          {TIME_OFF_TYPES.map((k) => (
            <ToolButton key={k} id={k} label={TYPE_LABELS[k][lang]} swatch={TYPE_LABELS[k].bg} border={TYPE_LABELS[k].color} />
          ))}
        </div>
        <p className="text-[11px] text-gray-500">
          {isTimeOff(tool)
            ? (E ? `Drag over the days — a ${TYPE_LABELS[tool].en.toLowerCase()} request opens with them filled in.` : `Dra över dagarna — en ansökan om ${TYPE_LABELS[tool].sv.toLowerCase()} öppnas med dagarna ifyllda.`)
            : (E ? "Drag over the days — they're saved straight away." : "Dra över dagarna — de sparas direkt.")}
        </p>
      </div>

      <div
        className="p-2 sm:p-4 overflow-x-auto select-none"
        ref={calendarRef}
        onMouseUp={handleUp}
        onMouseLeave={handleUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleUp}
        onTouchCancel={handleUp}
      >
        <div className="grid grid-cols-1 gap-4 min-w-[600px]">
          {months.map((name, m) => {
            const n = daysIn(year, m)
            return (
              <div key={name} className="border rounded overflow-hidden">
                <div className="grid grid-cols-[auto_repeat(31,minmax(24px,1fr))] bg-gray-50">
                  <div className="p-2 font-medium text-sm bg-gray-100 flex items-center justify-center w-12">{name}</div>
                  {Array.from({ length: n }, (_, i) => {
                    const d = i + 1
                    const key = keyOf(year, m, d)
                    const mark = dateStatuses[key]
                    const req = requestOn(key)
                    const type = req ? TYPE_LABELS[req.type] : null
                    const isCurrent = year === todayYear && m === todayMonth && d === todayDay
                    const weekend = weekdayOf(year, m, d) >= 5
                    const style: React.CSSProperties = type
                      ? { backgroundColor: type.bg, color: type.color, ...(req!.status === "pending" ? { outline: `2px dashed ${type.color}`, outlineOffset: "-3px" } : {}) }
                      : mark && mark !== "none" ? { backgroundColor: MARK_STYLE[mark].bg, color: MARK_STYLE[mark].color } : {}
                    const title = [key, type ? `${type[lang]} · ${req!.status === "pending" ? waitingFor.toLowerCase() : (E ? "approved" : "godkänd")}` : mark && mark !== "none" ? (mark === "vacation" ? translations.vacation : mark === "booked" ? translations.booked : translations.available) : ""]
                      .filter(Boolean).join(" · ")
                    return (
                      <div
                        key={key}
                        title={title}
                        className={cn(
                          "relative p-2 text-center text-sm border-l cursor-pointer",
                          !type && !mark && (weekend ? "bg-gray-50 text-gray-400" : "bg-white hover:bg-gray-50"),
                          isCurrent && "ring-2 ring-inset ring-blue-500 font-bold",
                          inSelection(m, d) && "ring-2 ring-inset ring-blue-400 !bg-blue-50",
                        )}
                        style={style}
                        data-date={`${m}-${d}`}
                        onMouseDown={() => handleDown(m, d)}
                        onMouseMove={() => handleMove(m, d)}
                        onTouchStart={() => handleDown(m, d)}
                        ref={isCurrent ? todayCellRef : null}
                      >
                        {showWeekNumbers && weekdayOf(year, m, d) === 0 && (
                          <div className="absolute top-0 left-0 text-[9px] text-gray-500 font-medium">{isoWeek(year, m, d)}</div>
                        )}
                        {d}
                      </div>
                    )
                  })}
                  {Array.from({ length: 31 - n }, (_, i) => <div key={`empty-${m}-${i}`} className="p-2 border-l bg-gray-50" />)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="border-t px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: MARK_STYLE.available.bg }} />{translations.available}</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: MARK_STYLE.booked.bg }} />{translations.booked}</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: TYPE_LABELS.vacation.bg }} />{E ? "Time off — approved" : "Ledighet — godkänd"}</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm border-2 border-dashed" style={{ borderColor: TYPE_LABELS.vacation.color }} />{waitingFor}</span>
      </div>

      <div className="border-t p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch id="week-numbers" checked={showWeekNumbers} onCheckedChange={setShowWeekNumbers} />
          <label htmlFor="week-numbers" className="text-sm cursor-pointer">{translations.showWeekNumbers}</label>
        </div>
        <div className="text-xs text-gray-500">
          <span className="hidden sm:inline">{translations.dragToSelectMultiple}</span>
          <span className="sm:hidden">{E ? "Tap and drag to select" : "Tryck och dra för att markera"}</span>
        </div>
      </div>
    </div>
  )
}
