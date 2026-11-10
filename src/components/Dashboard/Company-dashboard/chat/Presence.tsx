"use client"

// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Chat/Presence.tsx   (NEW)
// WHAT IT DOES:   Chat status UI:
//   <PresenceDot presence={p} />          coloured dot (on avatars)
//   presenceLine(p, lang)                 "In a meeting · until 14:00" / "Last seen 5 min ago"
//   <PresencePicker language="sv" />      your own status: pick one, add a note,
//                                         choose when it clears. Can be used
//                                         anywhere (e.g. a dashboard header).
// ══════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from "react"
import { Icon } from "@iconify/react"
import {
  PRESENCE_CHANGED_EVENT,
  PRESENCE_MESSAGE_MAX,
  PRESENCE_STATUSES,
  chatApi,
  type ChatPresence,
  type MyPresence,
  type PresenceStatus,
} from "@/utils/chat"

const NAVY = "rgb(5,22,80)"
type Lang = "en" | "sv"

export const PRESENCE_UI: Record<PresenceStatus, { color: string; icon: string; en: string; sv: string; enHint: string; svHint: string }> = {
  available: { color: "rgb(34,197,94)", icon: "tabler:circle-check-filled", en: "Available", sv: "Tillgänglig", enHint: "Free to chat", svHint: "Ledig att chatta" },
  busy: { color: "rgb(239,68,68)", icon: "tabler:circle-filled", en: "Busy", sv: "Upptagen", enHint: "Answers when possible", svHint: "Svarar när det går" },
  in_meeting: { color: "rgb(220,38,38)", icon: "tabler:users", en: "In a meeting", sv: "I möte", enHint: "Back after the meeting", svHint: "Tillbaka efter mötet" },
  away: { color: "rgb(245,158,11)", icon: "tabler:clock-filled", en: "Away", sv: "Borta", enHint: "Be right back", svHint: "Strax tillbaka" },
  out_of_office: { color: "rgb(139,92,246)", icon: "tabler:plane-departure", en: "Not at the office", sv: "Inte på kontoret", enHint: "Out of office, vacation, sick…", svHint: "Ledig, semester, sjuk…" },
  not_available: { color: "rgb(185,28,28)", icon: "tabler:minus", en: "Not available", sv: "Inte tillgänglig", enHint: "Do not disturb", svHint: "Stör ej" },
  offline: { color: "rgb(156,163,175)", icon: "tabler:circle", en: "Offline", sv: "Offline", enHint: "Appear offline to others", svHint: "Visas som offline för andra" },
}

export const presenceLabel = (s: PresenceStatus, lang: Lang | string) => PRESENCE_UI[s][lang === "sv" ? "sv" : "en"]

/** Dot with a white ring — absolutely positioned when `overlay`. */
export function PresenceDot({
  presence,
  size = 12,
  overlay = false,
  language = "en",
}: {
  presence?: ChatPresence | null
  size?: number
  overlay?: boolean
  language?: Lang | string
}) {
  if (!presence) return null
  const ui = PRESENCE_UI[presence.status] ?? PRESENCE_UI.offline
  const hollow = presence.status === "offline"
  const minus = presence.status === "not_available"
  return (
    <span
      className={`${overlay ? "absolute -bottom-0.5 -right-0.5" : "inline-block"} rounded-full ring-2 ring-white flex items-center justify-center flex-shrink-0`}
      style={{
        width: size,
        height: size,
        backgroundColor: hollow ? "white" : ui.color,
        boxShadow: hollow ? `inset 0 0 0 2px ${ui.color}` : undefined,
      }}
      title={presenceLabel(presence.status, language)}
      aria-label={presenceLabel(presence.status, language)}
      role="img"
    >
      {minus && <span className="block bg-white rounded-full" style={{ width: size * 0.5, height: Math.max(2, size * 0.16) }} />}
    </span>
  )
}

const loc = (l: Lang) => (l === "sv" ? "sv-SE" : "en-GB")

function untilText(iso: string, l: Lang) {
  const d = new Date(iso)
  const now = new Date()
  const time = d.toLocaleTimeString(loc(l), { hour: "2-digit", minute: "2-digit" })
  if (d.toDateString() === now.toDateString()) return l === "sv" ? `till ${time}` : `until ${time}`
  const day = d.toLocaleDateString(loc(l), { weekday: "short", day: "numeric", month: "short" })
  return l === "sv" ? `till ${day}` : `until ${day}`
}

export function lastSeenText(iso: string, l: Lang) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.round(diff / 60_000)
  if (min < 2) return l === "sv" ? "Sågs nyss" : "Last seen just now"
  if (min < 60) return l === "sv" ? `Sågs för ${min} min sedan` : `Last seen ${min} min ago`
  const h = Math.round(min / 60)
  if (h < 24) return l === "sv" ? `Sågs för ${h} h sedan` : `Last seen ${h} h ago`
  const d = new Date(iso).toLocaleDateString(loc(l), { day: "numeric", month: "short" })
  return l === "sv" ? `Sågs senast ${d}` : `Last seen ${d}`
}

/** One line for under a name: "In a meeting · Back at 14:00 · until 15:00". */
export function presenceLine(p: ChatPresence | undefined | null, language: Lang | string): string {
  const l: Lang = language === "sv" ? "sv" : "en"
  if (!p) return ""
  if (p.status === "offline") return p.lastSeenAt ? lastSeenText(p.lastSeenAt, l) : presenceLabel("offline", l)
  return [presenceLabel(p.status, l), p.message, p.until ? untilText(p.until, l) : null].filter(Boolean).join(" · ")
}

/** True when the person probably won't answer right away. */
export const isUnavailable = (p?: ChatPresence | null) =>
  !!p && ["busy", "in_meeting", "away", "out_of_office", "not_available"].includes(p.status)

/* ─── Picker ─── */
type ClearAfter = "never" | "30m" | "1h" | "2h" | "today" | "week"
function untilFrom(c: ClearAfter): string | null {
  const d = new Date()
  if (c === "never") return null
  if (c === "30m") return new Date(d.getTime() + 30 * 60_000).toISOString()
  if (c === "1h") return new Date(d.getTime() + 60 * 60_000).toISOString()
  if (c === "2h") return new Date(d.getTime() + 120 * 60_000).toISOString()
  if (c === "today") {
    d.setHours(23, 59, 0, 0)
    return d.toISOString()
  }
  // this week → Sunday 23:59
  const add = (7 - d.getDay()) % 7
  d.setDate(d.getDate() + add)
  d.setHours(23, 59, 0, 0)
  return d.toISOString()
}

const PTX = {
  en: { title: "Your status", note: "Status message", notePh: "e.g. Back at 14:00", clear: "Clear after", save: "Save", cancel: "Cancel", saving: "Saving…", failed: "Couldn't save your status.", options: { never: "Don't clear", "30m": "30 minutes", "1h": "1 hour", "2h": "2 hours", today: "Today", week: "This week" } as Record<ClearAfter, string>, clearNote: "Clear message", change: "Change your status" },
  sv: { title: "Din status", note: "Statusmeddelande", notePh: "t.ex. Tillbaka 14:00", clear: "Rensa efter", save: "Spara", cancel: "Avbryt", saving: "Sparar…", failed: "Kunde inte spara din status.", options: { never: "Rensa inte", "30m": "30 minuter", "1h": "1 timme", "2h": "2 timmar", today: "Idag", week: "Den här veckan" } as Record<ClearAfter, string>, clearNote: "Rensa meddelande", change: "Ändra din status" },
}

export function PresencePicker({ language = "en", compact = false }: { language?: Lang | string; compact?: boolean }) {
  const l: Lang = language === "sv" ? "sv" : "en"
  const tx = PTX[l]
  const [mine, setMine] = useState<MyPresence | null>(null)
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<PresenceStatus>("available")
  const [message, setMessage] = useState("")
  const [clearAfter, setClearAfter] = useState<ClearAfter>("never")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  // Fixed position so the menu isn't cut off by a parent with overflow:hidden.
  const [pos, setPos] = useState<{ top: number; left: number; maxH: number } | null>(null)
  const place = () => {
    const r = btnRef.current?.getBoundingClientRect()
    if (!r) return
    const width = Math.min(304, window.innerWidth - 32)
    const left = Math.max(16, Math.min(r.left, window.innerWidth - width - 16))
    const top = r.bottom + 8
    setPos({ top, left, maxH: Math.max(240, window.innerHeight - top - 16) })
  }
  useEffect(() => {
    if (!open) return
    place()
    window.addEventListener("resize", place)
    window.addEventListener("scroll", place, true)
    return () => { window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true) }
  }, [open])

  useEffect(() => {
    chatApi.myPresence().then(setMine).catch(() => { })
    const onChange = (e: Event) => setMine((e as CustomEvent<MyPresence>).detail)
    window.addEventListener(PRESENCE_CHANGED_EVENT, onChange)
    return () => window.removeEventListener(PRESENCE_CHANGED_EVENT, onChange)
  }, [])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey) }
  }, [open])

  const openPicker = () => {
    setStatus(mine?.chosen ?? "available")
    setMessage(mine?.message ?? "")
    setClearAfter("never")
    setError("")
    setOpen(true)
  }

  const save = async () => {
    setSaving(true)
    setError("")
    try {
      const keepsUntil = clearAfter === "never" && status === mine?.chosen ? mine?.until ?? null : untilFrom(clearAfter)
      const saved = await chatApi.setPresence({ status, message: message.trim() || null, until: keepsUntil })
      setMine(saved)
      setOpen(false)
    } catch (e: any) {
      setError(e?.message || tx.failed)
    } finally {
      setSaving(false)
    }
  }

  // What I see on my own chip: what I chose (even if others see "Offline" while I'm away).
  const shown: ChatPresence = mine ? { status: mine.chosen, message: mine.message, until: mine.until } : { status: "available" }
  const endsBySelf = status !== "available" && status !== "offline"

  return (
    <div className="relative" ref={ref}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        className={`flex items-center gap-2 max-w-full rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors ${compact ? "px-2 py-1" : "px-3 py-1.5"}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={tx.change}
      >
        <PresenceDot presence={shown} size={10} language={l} />
        <span className="text-xs font-semibold text-gray-700 truncate">{presenceLabel(shown.status, l)}</span>
        {!compact && shown.message && <span className="text-xs text-gray-400 truncate">· {shown.message}</span>}
        <Icon icon="tabler:chevron-down" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={tx.title}
          className="fixed z-[60] w-[19rem] max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-gray-200 shadow-xl p-3 overflow-y-auto"
          style={pos ? { top: pos.top, left: pos.left, maxHeight: pos.maxH } : { visibility: "hidden" }}
        >
          <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">{tx.title}</p>
          <ul className="space-y-0.5" role="radiogroup">
            {PRESENCE_STATUSES.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={status === s}
                  onClick={() => setStatus(s)}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-colors ${status === s ? "bg-blue-50" : "hover:bg-gray-50"}`}
                >
                  <PresenceDot presence={{ status: s }} size={12} language={l} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-gray-800">{s === "offline" ? (l === "sv" ? "Visa som offline" : "Appear offline") : presenceLabel(s, l)}</span>
                    <span className="block text-[11px] text-gray-400 truncate">{PRESENCE_UI[s][l === "sv" ? "svHint" : "enHint"]}</span>
                  </span>
                  {status === s && <Icon icon="tabler:check" className="w-4 h-4 flex-shrink-0" style={{ color: NAVY }} />}
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
            <label className="block">
              <span className="block text-xs font-medium text-gray-600 mb-1">{tx.note}</span>
              <div className="relative">
                <input
                  value={message}
                  maxLength={PRESENCE_MESSAGE_MAX}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={tx.notePh}
                  className="w-full px-3 py-2 pr-8 text-sm rounded-xl border border-gray-200 outline-none focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
                />
                {message && (
                  <button type="button" onClick={() => setMessage("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600" aria-label={tx.clearNote}>
                    <Icon icon="tabler:x" className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </label>
            {endsBySelf && (
              <label className="block">
                <span className="block text-xs font-medium text-gray-600 mb-1">{tx.clear}</span>
                <select
                  value={clearAfter}
                  onChange={(e) => setClearAfter(e.target.value as ClearAfter)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white outline-none focus:border-blue-200 focus:ring-2 focus:ring-blue-100 cursor-pointer"
                >
                  {(Object.keys(tx.options) as ClearAfter[]).map((k) => (
                    <option key={k} value={k}>{tx.options[k]}</option>
                  ))}
                </select>
                {clearAfter === "never" && status === mine?.chosen && mine?.until && (
                  <span className="block mt-1 text-[11px] text-gray-400">{presenceLine({ status, until: mine.until }, l)}</span>
                )}
              </label>
            )}
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 text-sm rounded-xl text-gray-600 hover:bg-gray-50">{tx.cancel}</button>
              <button type="button" onClick={save} disabled={saving} className="px-4 py-1.5 text-sm font-semibold text-white rounded-xl disabled:opacity-60" style={{ backgroundColor: NAVY }}>
                {saving ? tx.saving : tx.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
