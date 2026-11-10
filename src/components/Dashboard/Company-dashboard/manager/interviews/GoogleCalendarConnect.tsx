"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/manager/views/GoogleCalendarConnect.tsx
// WHAT IT DOES:   The manager's Google Calendar connection (for Google Meet links):
//                   • useGoogleCalendar()      — status + connect / disconnect
//                   • <GoogleCalendarBadge>    — small pill for the Interviews header
//                   • <GoogleConnectResult>    — banner after returning from Google (?google=…)
// Connecting is a full-page redirect to Google; Google sends the manager back to the
// same URL with ?google=connected (or an error code).
// ══════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useState } from "react"
import { Icon } from "@iconify/react"
import { disconnectGoogle, getGoogleStatus, googleConnectUrl, type GoogleStatus } from "@/utils/interviewsApi"

export function useGoogleCalendar() {
  const [status, setStatus] = useState<GoogleStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    try {
      setStatus(await getGoogleStatus())
    } catch {
      setStatus({ configured: false, connected: false, email: null, connectedAt: null })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  /** Leaves the page for Google's consent screen; call `beforeLeave` to save drafts first. */
  const connect = useCallback((beforeLeave?: () => void) => {
    beforeLeave?.()
    const here = `${window.location.pathname}${window.location.search}`
    window.location.href = googleConnectUrl(here)
  }, [])

  const disconnect = useCallback(async () => {
    setBusy(true)
    try {
      setStatus(await disconnectGoogle())
    } finally {
      setBusy(false)
    }
  }, [])

  return { status, loading, busy, refresh, connect, disconnect }
}

/* ─── Header pill ─── */
export function GoogleCalendarBadge({
  isEn, google,
}: { isEn: boolean; google: ReturnType<typeof useGoogleCalendar> }) {
  const { status, loading, busy, connect, disconnect } = google
  const [menu, setMenu] = useState(false)

  if (loading || !status) {
    return <div className="h-9 w-44 rounded-xl bg-gray-100 animate-pulse" />
  }
  if (!status.configured) return null

  if (!status.connected) {
    return (
      <button onClick={() => connect()}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all">
        <Icon icon="logos:google-calendar" className="w-4 h-4" />
        {isEn ? "Connect Google Calendar" : "Anslut Google Kalender"}
      </button>
    )
  }

  return (
    <div className="relative">
      <button onClick={() => setMenu(m => !m)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-green-200 bg-green-50 text-xs font-semibold text-green-800 hover:bg-green-100/70 transition-all max-w-[260px]">
        <Icon icon="logos:google-meet" className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{status.email ?? (isEn ? "Google connected" : "Google ansluten")}</span>
        <Icon icon="tabler:chevron-down" className="w-3.5 h-3.5 flex-shrink-0" />
      </button>
      {menu && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenu(false)} />
          <div className="absolute right-0 mt-2 w-64 z-40 bg-white rounded-xl border border-gray-200 shadow-lg p-3 text-xs">
            <p className="text-gray-500 leading-relaxed">
              {isEn
                ? "Interviews are added to this Google Calendar and video interviews get a Google Meet link."
                : "Intervjuer läggs i denna Google Kalender och videointervjuer får en Google Meet-länk."}
            </p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setMenu(false); connect() }}
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 font-medium text-gray-600 hover:bg-gray-50">
                {isEn ? "Switch account" : "Byt konto"}
              </button>
              <button onClick={async () => { await disconnect(); setMenu(false) }} disabled={busy}
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-red-100 font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
                {isEn ? "Disconnect" : "Koppla från"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Result banner after returning from Google ─── */
const RESULT_TEXT: Record<string, { ok: boolean; en: string; sv: string }> = {
  connected: { ok: true, en: "Google Calendar connected. Video interviews now get a Google Meet link automatically.", sv: "Google Kalender ansluten. Videointervjuer får nu automatiskt en Google Meet-länk." },
  denied: { ok: false, en: "Google Calendar was not connected — access was declined.", sv: "Google Kalender anslöts inte — åtkomst nekades." },
  missing_scope: { ok: false, en: "Please allow access to Google Calendar when connecting.", sv: "Tillåt åtkomst till Google Kalender när du ansluter." },
  not_configured: { ok: false, en: "Google Calendar isn't set up on the server yet (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).", sv: "Google Kalender är inte konfigurerat på servern än (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)." },
  invalid_state: { ok: false, en: "The Google sign-in expired. Please try connecting again.", sv: "Google-inloggningen gick ut. Försök ansluta igen." },
  not_authorized: { ok: false, en: "Please sign in as a manager and try again.", sv: "Logga in som chef och försök igen." },
  error: { ok: false, en: "Google Calendar could not be connected. Please try again.", sv: "Google Kalender kunde inte anslutas. Försök igen." },
}

/** Reads ?google=… once, shows a banner and removes the parameter from the URL. */
export function GoogleConnectResult({ isEn, onConnected }: { isEn: boolean; onConnected?: () => void }) {
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    const url = new URL(window.location.href)
    const value = url.searchParams.get("google")
    if (!value) return
    setResult(value)
    url.searchParams.delete("google")
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)
    if (value === "connected") onConnected?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!result) return null
  const cfg = RESULT_TEXT[result] ?? RESULT_TEXT.error!
  return (
    <div className={`flex items-start gap-2 px-4 py-3 rounded-xl border text-sm mb-4 ${cfg.ok ? "border-green-200 bg-green-50 text-green-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
      <Icon icon={cfg.ok ? "tabler:circle-check" : "tabler:alert-triangle"} className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span className="flex-1">{isEn ? cfg.en : cfg.sv}</span>
      <button onClick={() => setResult(null)} className="opacity-60 hover:opacity-100">
        <Icon icon="tabler:x" className="w-4 h-4" />
      </button>
    </div>
  )
}
