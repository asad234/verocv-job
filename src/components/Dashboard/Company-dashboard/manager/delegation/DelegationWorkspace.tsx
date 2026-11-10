"use client"

// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/manager/delegation/DelegationWorkspace.tsx  (NEW)
// WHAT IT DOES:   Two pieces for your manager dashboard layout:
//
//   <ActingAsBanner language={language} />
//       Put it at the very top of the manager dashboard content. Shows an amber
//       bar ONLY while you're working in a colleague's workspace, with a
//       "Back to my workspace" button.
//
//   <WorkspaceSwitcher language={language} />
//       Put it in the header (next to the bell). Shows ONLY if you're covering
//       for someone right now — a dropdown to jump between your workspace and
//       theirs.
//
// Both refresh when a delegation changes (accept / end) and on window focus.
// ══════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from "react"
import { Icon } from "@iconify/react"
import clsx from "clsx"
import { DELEGATIONS_CHANGED_EVENT, getActing, switchWorkspace, type ActingState } from "@/utils/delegations"

const NAVY = "rgb(5,22,80)"
type Lang = "en" | "sv"

const initials = (name: string) => {
  const p = name.trim().split(/\s+/).filter(Boolean)
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1]?.[0] ?? "" : "")).toUpperCase() || "?"
}

function useActing() {
  const [state, setState] = useState<ActingState | null>(null)
  const load = useCallback(() => {
    getActing().then(setState).catch(() => { /* not a manager / offline — show nothing */ })
  }, [])
  useEffect(() => {
    load()
    window.addEventListener(DELEGATIONS_CHANGED_EVENT, load)
    window.addEventListener("focus", load)
    return () => {
      window.removeEventListener(DELEGATIONS_CHANGED_EVENT, load)
      window.removeEventListener("focus", load)
    }
  }, [load])
  return state
}

export function ActingAsBanner({ language }: { language: Lang }) {
  const state = useActing()
  const [leaving, setLeaving] = useState(false)
  const isEn = language !== "sv"
  if (!state?.actingAs) return null
  const name = state.actingAs.name || state.actingAs.email

  return (
    <div className="sticky top-0 z-40 bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3 flex-wrap">
        <div className="w-8 h-8 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {initials(name)}
        </div>
        <p className="flex-1 min-w-[200px] text-sm text-amber-900">
          {isEn ? <>You're working in <b>{name}</b>'s workspace while covering for them.</>
            : <>Du arbetar i <b>{name}</b>s arbetsyta medan du täcker upp.</>}
          <span className="hidden sm:inline text-amber-700">
            {isEn ? " Changes you make are made for them." : " Ändringar du gör sker för deras räkning."}
          </span>
        </p>
        <button onClick={() => { setLeaving(true); switchWorkspace(null).catch(() => setLeaving(false)) }} disabled={leaving}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-amber-300 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-60">
          {leaving ? <span className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /> : <Icon icon="tabler:arrow-back-up" className="w-4 h-4" />}
          {isEn ? "Back to my workspace" : "Tillbaka till min arbetsyta"}
        </button>
      </div>
    </div>
  )
}

export function WorkspaceSwitcher({ language }: { language: Lang }) {
  const state = useActing()
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const isEn = language !== "sv"

  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [])

  if (!state || (state.available.length === 0 && !state.actingAs)) return null

  const current = state.actingAs
  const go = (ownerId: string | null) => {
    setSwitching(ownerId ?? "me")
    switchWorkspace(ownerId).catch(() => setSwitching(null))
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)}
        className={clsx("flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl border text-sm font-medium transition-colors",
          current ? "border-amber-300 bg-amber-50 text-amber-900" : "border-gray-200 text-gray-700 hover:bg-gray-50")}>
        <span className={clsx("w-6 h-6 rounded-full text-[10px] font-bold text-white flex items-center justify-center", current ? "bg-amber-500" : "")}
          style={current ? undefined : { backgroundColor: NAVY }}>
          {current ? initials(current.name) : <Icon icon="tabler:user" className="w-3.5 h-3.5" />}
        </span>
        <span className="hidden sm:inline max-w-[140px] truncate">
          {current ? current.name.split(" ")[0] : (isEn ? "My workspace" : "Min arbetsyta")}
        </span>
        <Icon icon="tabler:selector" className="w-4 h-4 opacity-60" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-gray-200 shadow-xl z-50 py-1.5">
          <p className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            {isEn ? "Switch workspace" : "Byt arbetsyta"}
          </p>
          {[{ id: null as string | null, name: isEn ? "My workspace" : "Min arbetsyta", sub: isEn ? "Your own employees" : "Dina egna medarbetare" },
          ...state.available.map((p) => ({ id: p.id as string | null, name: p.name, sub: isEn ? "Covering while they're away" : "Du täcker upp" }))]
            .map((o) => {
              const active = (o.id === null && !current) || (o.id !== null && current?.id === o.id)
              return (
                <button key={o.id ?? "me"} onClick={() => (active ? setOpen(false) : go(o.id))} disabled={!!switching}
                  className={clsx("w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 disabled:opacity-60", active && "bg-blue-50/60")}>
                  <span className={clsx("w-8 h-8 rounded-full text-[11px] font-bold text-white flex items-center justify-center flex-shrink-0", o.id ? "bg-amber-500" : "")}
                    style={o.id ? undefined : { backgroundColor: NAVY }}>
                    {o.id ? initials(o.name) : <Icon icon="tabler:user" className="w-4 h-4" />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-gray-800 truncate">{o.name}</span>
                    <span className="block text-xs text-gray-400 truncate">{o.sub}</span>
                  </span>
                  {switching === (o.id ?? "me")
                    ? <span className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                    : active && <Icon icon="tabler:check" className="w-4 h-4 text-blue-900" />}
                </button>
              )
            })}
        </div>
      )}
    </div>
  )
}
