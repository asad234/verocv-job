"use client"

// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/manager/delegation/DelegationSettings.tsx  (NEW)
// WHAT IT DOES:   "Substitute" tab in Manager Settings.
//   1. Your substitute  — ask a colleague (same company) to cover while you're
//                          away; see the status; cancel / end ("I'm back").
//   2. Covering for     — requests from colleagues: accept / decline; open their
//                          workspace; stop covering.
//   3. History
// ══════════════════════════════════════════════════════════════════════

import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Icon } from "@iconify/react"
import clsx from "clsx"
import DelegationHandover from "./DelegationHandover"
import {
  DELEGATIONS_CHANGED_EVENT, DELEGATION_REASONS, REASON_LABELS, STATE_LABELS, createDelegation, formatPeriod,
  getActing, getDelegations, respondDelegation, searchDelegateCandidates, switchWorkspace,
  type ActingState, type Delegation, type DelegationOverview, type DelegationPerson, type DelegationReason,
} from "@/utils/delegations"

const NAVY = "rgb(5,22,80)"
const inputCls = "w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white outline-none transition-all focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
type Lang = "en" | "sv"

const TONE: Record<string, string> = {
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  blue: "bg-blue-50 text-blue-800 border-blue-200",
  green: "bg-green-50 text-green-700 border-green-200",
  gray: "bg-gray-100 text-gray-600 border-gray-200",
  red: "bg-red-50 text-red-700 border-red-200",
}

const initials = (name: string) => {
  const p = name.trim().split(/\s+/).filter(Boolean)
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1]?.[0] ?? "" : "")).toUpperCase() || "?"
}
const today = () => new Date().toISOString().slice(0, 10)
const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

/* ─── Texts ─── */
const TX = {
  en: {
    intro: "Going away? Let a colleague take over your employees, contracts, interviews and invitations while you're out. You stay in control and can end it any time.",
    yourSubstitute: "Your substitute", coveringFor: "You're covering for", history: "History",
    chooseManager: "Manager who will cover for you", searchPh: "Type a first or last name…",
    noMatches: "No managers in your company match", searching: "Searching…", change: "Change",
    reason: "Reason", from: "From", until: "Until", untilHint: "Leave empty to keep it until you end it.",
    oneWeek: "1 week", twoWeeks: "2 weeks", oneMonth: "1 month", open: "Until ended",
    message: "Message (optional)", messagePh: "e.g. Contracts for Emma and Ahmed need signing this week. Thanks!",
    canTitle: (n: string) => `${n || "Your substitute"} will be able to:`,
    can: ["See and manage your employees", "Create, send and follow up contracts", "Book, edit and cancel interviews", "Send and revoke employee invitations", "See your reports"],
    cannot: "They can't change your personal settings or your Google Calendar connection, and their access ends the moment you or they end it.",
    send: "Send request", sending: "Sending…", sent: "Request sent. You'll be notified when they answer.",
    pickFirst: "Choose a manager first.",
    cancelReq: "Cancel request", imBack: "I'm back — end access", ending: "Ending…",
    waiting: (n: string) => `Waiting for ${n} to accept.`,
    activeNow: (n: string) => `${n} is covering for you right now.`,
    startsLater: (n: string, d: string) => `${n} accepted and takes over on ${d}.`,
    noIncoming: "No colleague has asked you to cover for them.",
    asksYou: (n: string) => `${n} asks you to cover while they're away.`,
    accept: "Accept", decline: "Decline",
    openWorkspace: (n: string) => `Open ${n}'s workspace`, inWorkspace: "You're in this workspace",
    backToMine: "Back to my workspace", stopCovering: "Stop covering",
    startsOn: (d: string) => `Starts ${d} — you'll be able to open the workspace then.`,
    confirmEndTitle: "End substitute access?",
    confirmEndOwner: (n: string) => `${n} will immediately lose access to your employees, contracts and interviews.`,
    confirmEndDelegate: (n: string) => `You will immediately lose access to ${n}'s workspace. ${n} will be notified.`,
    confirmDeclineTitle: "Decline the request?",
    confirmDecline: (n: string) => `${n} will be notified that you can't cover for them.`,
    confirm: "Yes, continue", back: "Go back",
    viewHandover: "View handover", previewHandover: "What they'll see",
    endedBy: (who: string) => `Ended by ${who}`, you: "you",
    youCovered: (n: string) => `You covered for ${n}`, coveredYou: (n: string) => `${n} covered for you`,
    loadFailed: "Couldn't load substitutes.", retry: "Try again", failed: "Something went wrong. Please try again.",
    noCompany: "Only managers in your own company can be chosen.",
    noCompanyLink: "Your account isn't linked to a company yet. Ask your business admin, or fill in Company name under Settings → Department.",
    noOtherManagers: "There are no other managers in your company yet.",
    matchCount: (n: number, total: number) => `${n} of ${total} managers`,
    allManagers: (total: number) => `All managers in your company (${total})`,
  },
  sv: {
    intro: "Ska du vara borta? Låt en kollega ta över dina medarbetare, kontrakt, intervjuer och inbjudningar medan du är borta. Du har kontrollen och kan avsluta när som helst.",
    yourSubstitute: "Din ställföreträdare", coveringFor: "Du täcker upp för", history: "Historik",
    chooseManager: "Chef som ska täcka upp för dig", searchPh: "Skriv ett för- eller efternamn…",
    noMatches: "Inga chefer i ditt företag matchar", searching: "Söker…", change: "Ändra",
    reason: "Anledning", from: "Från", until: "Till", untilHint: "Lämna tomt för att gälla tills du avslutar.",
    oneWeek: "1 vecka", twoWeeks: "2 veckor", oneMonth: "1 månad", open: "Tills vidare",
    message: "Meddelande (valfritt)", messagePh: "t.ex. Kontrakten för Emma och Ahmed behöver signeras i veckan. Tack!",
    canTitle: (n: string) => `${n || "Din ställföreträdare"} kommer att kunna:`,
    can: ["Se och hantera dina medarbetare", "Skapa, skicka och följa upp kontrakt", "Boka, ändra och avboka intervjuer", "Skicka och återkalla inbjudningar", "Se dina rapporter"],
    cannot: "De kan inte ändra dina personliga inställningar eller din Google Kalender-koppling, och åtkomsten upphör så fort du eller de avslutar.",
    send: "Skicka förfrågan", sending: "Skickar…", sent: "Förfrågan skickad. Du får en notis när de svarar.",
    pickFirst: "Välj en chef först.",
    cancelReq: "Avbryt förfrågan", imBack: "Jag är tillbaka — avsluta", ending: "Avslutar…",
    waiting: (n: string) => `Väntar på att ${n} ska acceptera.`,
    activeNow: (n: string) => `${n} täcker upp för dig just nu.`,
    startsLater: (n: string, d: string) => `${n} har accepterat och tar över ${d}.`,
    noIncoming: "Ingen kollega har bett dig täcka upp för dem.",
    asksYou: (n: string) => `${n} ber dig täcka upp medan hen är borta.`,
    accept: "Acceptera", decline: "Avböj",
    openWorkspace: (n: string) => `Öppna ${n}s arbetsyta`, inWorkspace: "Du är i den här arbetsytan",
    backToMine: "Tillbaka till min arbetsyta", stopCovering: "Sluta täcka upp",
    startsOn: (d: string) => `Börjar ${d} — då kan du öppna arbetsytan.`,
    confirmEndTitle: "Avsluta ställföreträdarens åtkomst?",
    confirmEndOwner: (n: string) => `${n} förlorar direkt åtkomsten till dina medarbetare, kontrakt och intervjuer.`,
    confirmEndDelegate: (n: string) => `Du förlorar direkt åtkomsten till ${n}s arbetsyta. ${n} får en notis.`,
    confirmDeclineTitle: "Avböja förfrågan?",
    confirmDecline: (n: string) => `${n} får en notis om att du inte kan täcka upp.`,
    confirm: "Ja, fortsätt", back: "Tillbaka",
    viewHandover: "Visa överlämning", previewHandover: "Det här ser de",
    endedBy: (who: string) => `Avslutad av ${who}`, you: "dig",
    youCovered: (n: string) => `Du täckte upp för ${n}`, coveredYou: (n: string) => `${n} täckte upp för dig`,
    loadFailed: "Kunde inte ladda ställföreträdare.", retry: "Försök igen", failed: "Något gick fel. Försök igen.",
    noCompany: "Bara chefer i ditt eget företag kan väljas.",
    noCompanyLink: "Ditt konto är inte kopplat till ett företag ännu. Fråga din företagsadmin, eller fyll i Företagsnamn under Inställningar → Avdelning.",
    noOtherManagers: "Det finns inga andra chefer i ditt företag ännu.",
    matchCount: (n: number, total: number) => `${n} av ${total} chefer`,
    allManagers: (total: number) => `Alla chefer i ditt företag (${total})`,
  },
}

/* ─── Small pieces ─── */
function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ backgroundColor: NAVY, width: size, height: size, fontSize: size * 0.32 }}>
      {initials(name)}
    </div>
  )
}

function StateBadge({ d, lang }: { d: Delegation; lang: Lang }) {
  const s = STATE_LABELS[d.state]
  return (
    <span className={clsx("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border", TONE[s.tone])}>
      {d.state === "active" && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
      {s[lang]}
    </span>
  )
}

function ReasonChip({ reason, lang }: { reason: DelegationReason; lang: Lang }) {
  const r = REASON_LABELS[reason] ?? REASON_LABELS.other
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
      <Icon icon={r.icon} className="w-3.5 h-3.5 text-gray-400" />{r[lang]}
    </span>
  )
}

function ConfirmDialog({ title, text, busy, danger = true, onConfirm, onCancel, tx }: {
  title: string; text: string; busy: boolean; danger?: boolean; onConfirm: () => void; onCancel: () => void; tx: (typeof TX)["en"]
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={busy ? undefined : onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 max-w-sm w-full">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-amber-50">
          <Icon icon="tabler:alert-triangle" className="w-6 h-6 text-amber-500" />
        </div>
        <h3 className="text-center text-gray-900 font-semibold text-base mb-2">{title}</h3>
        <p className="text-center text-gray-500 text-sm mb-6 leading-relaxed">{text}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={busy} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">{tx.back}</button>
          <button onClick={onConfirm} disabled={busy}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: danger ? "rgb(220,38,38)" : NAVY }}>
            {busy && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {tx.confirm}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main ─── */
export default function DelegationSettings({ language, notify }: {
  language: Lang
  /** Your settings page toast: notify(text, "success" | "error") */
  notify?: (text: string, type?: "success" | "error") => void
}) {
  const lang: Lang = language === "sv" ? "sv" : "en"
  const tx = TX[lang]
  const toast = (text: string, type: "success" | "error" = "success") => notify?.(text, type)

  const [data, setData] = useState<DelegationOverview | null>(null)
  const [acting, setActing] = useState<ActingState | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{ title: string; text: string; danger?: boolean; run: () => Promise<void> } | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  // Handover briefing: { id, asOwner } — opened by "View handover", right after
  // accepting, or by ?handover=<id> in the URL.
  const [handover, setHandover] = useState<{ id: string; asOwner: boolean } | null>(() => {
    if (typeof window === "undefined") return null
    const id = new URLSearchParams(window.location.search).get("handover")
    return id ? { id, asOwner: false } : null
  })

  const load = useCallback(async () => {
    setLoadError(false)
    try {
      const [d, a] = await Promise.all([getDelegations(), getActing().catch(() => null)])
      setData(d)
      setActing(a)
    } catch {
      setLoadError(true)
    }
  }, [])

  useEffect(() => {
    load()
    window.addEventListener(DELEGATIONS_CHANGED_EVENT, load)
    return () => window.removeEventListener(DELEGATIONS_CHANGED_EVENT, load)
  }, [load])

  const act = async (id: string, action: "accept" | "decline" | "cancel" | "end", okText?: string) => {
    setBusyId(id)
    try {
      await respondDelegation(id, action)
      if (okText) toast(okText)
      await load()
      // Just accepted → show everything you're taking over straight away.
      if (action === "accept") setHandover({ id, asOwner: false })
      // Stopped covering while inside that workspace → go back to your own.
      if (action === "end" && acting?.actingAs && data?.incoming.some((d) => d.id === id && d.owner.id === acting.actingAs?.id)) {
        await switchWorkspace(null)
      }
    } catch (e) {
      toast((e as Error).message || tx.failed, "error")
    } finally {
      setBusyId(null)
      setConfirm(null)
    }
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-3">
        {tx.loadFailed}
        <button onClick={load} className="font-semibold underline">{tx.retry}</button>
      </div>
    )
  }
  if (!data) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const out = data.outgoing
  const fmtDay = (v: string) => new Date(v).toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB", { day: "numeric", month: "long" })

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-3 p-4 rounded-2xl border border-blue-100 bg-blue-50/50">
        <Icon icon="tabler:user-share" className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: NAVY }} />
        <p className="text-sm text-gray-700 leading-relaxed">{tx.intro}</p>
      </div>

      {/* ── 1. Your substitute ── */}
      <section>
        <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 mb-4">{tx.yourSubstitute}</p>
        {out ? (
          <div className="rounded-2xl border border-gray-200 p-5">
            <div className="flex items-start gap-4 flex-wrap">
              <Avatar name={out.delegate.name} size={48} />
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{out.delegate.name}</h3>
                  <StateBadge d={out} lang={lang} />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{[out.delegate.jobTitle, out.delegate.email].filter(Boolean).join(" · ")}</p>
                <p className="text-sm text-gray-700 mt-3">
                  {out.state === "pending" ? tx.waiting(out.delegate.name)
                    : out.state === "scheduled" ? tx.startsLater(out.delegate.name, fmtDay(out.startsAt!))
                      : tx.activeNow(out.delegate.name)}
                </p>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <ReasonChip reason={out.reason} lang={lang} />
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                    <Icon icon="tabler:calendar" className="w-3.5 h-3.5 text-gray-400" />{formatPeriod(out, lang)}
                  </span>
                </div>
                {out.message && <p className="text-xs text-gray-500 mt-3 italic border-l-2 border-gray-200 pl-3">“{out.message}”</p>}
              </div>
            </div>
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
              {out.state === "pending" ? (
                <button onClick={() => act(out.id, "cancel")} disabled={busyId === out.id}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                  {tx.cancelReq}
                </button>
              ) : (
                <div className="flex gap-2 flex-wrap justify-end">
                  <button onClick={() => setHandover({ id: out.id, asOwner: true })}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <Icon icon="tabler:clipboard-list" className="w-4 h-4" />{tx.previewHandover}
                  </button>
                  <button
                    onClick={() => setConfirm({ title: tx.confirmEndTitle, text: tx.confirmEndOwner(out.delegate.name), run: () => act(out.id, "end") })}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:shadow-md"
                    style={{ backgroundColor: NAVY }}>
                    <Icon icon="tabler:door-enter" className="w-4 h-4" />{tx.imBack}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <RequestForm lang={lang} tx={tx} onSent={() => { toast(tx.sent); load() }} onError={(m) => toast(m, "error")} />
        )}
      </section>

      {/* ── 2. Covering for ── */}
      <section>
        <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 mb-4">{tx.coveringFor}</p>
        {data.incoming.length === 0 ? (
          <p className="text-sm text-gray-400 px-1">{tx.noIncoming}</p>
        ) : (
          <div className="space-y-3">
            {data.incoming.map((d) => {
              const inside = acting?.actingAs?.id === d.owner.id
              return (
                <div key={d.id} className={clsx("rounded-2xl border p-5", inside ? "border-amber-300 bg-amber-50/40" : "border-gray-200")}>
                  <div className="flex items-start gap-4 flex-wrap">
                    <Avatar name={d.owner.name} />
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{d.owner.name}</h3>
                        <StateBadge d={d} lang={lang} />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{[d.owner.jobTitle, d.owner.email].filter(Boolean).join(" · ")}</p>
                      {d.state === "pending" && <p className="text-sm text-gray-700 mt-3">{tx.asksYou(d.owner.name)}</p>}
                      {d.state === "scheduled" && d.startsAt && <p className="text-sm text-gray-700 mt-3">{tx.startsOn(fmtDay(d.startsAt))}</p>}
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <ReasonChip reason={d.reason} lang={lang} />
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                          <Icon icon="tabler:calendar" className="w-3.5 h-3.5 text-gray-400" />{formatPeriod(d, lang)}
                        </span>
                      </div>
                      {d.message && <p className="text-xs text-gray-500 mt-3 italic border-l-2 border-gray-200 pl-3">“{d.message}”</p>}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100 flex-wrap">
                    {d.state === "pending" && (
                      <>
                        <button onClick={() => setConfirm({ title: tx.confirmDeclineTitle, text: tx.confirmDecline(d.owner.name), run: () => act(d.id, "decline") })}
                          disabled={busyId === d.id}
                          className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                          {tx.decline}
                        </button>
                        <button onClick={() => act(d.id, "accept")} disabled={busyId === d.id}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:shadow-md disabled:opacity-50"
                          style={{ backgroundColor: NAVY }}>
                          {busyId === d.id ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icon icon="tabler:check" className="w-4 h-4" />}
                          {tx.accept}
                        </button>
                      </>
                    )}
                    {(d.state === "active" || d.state === "scheduled") && (
                      <>
                        <button onClick={() => setHandover({ id: d.id, asOwner: false })}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                          <Icon icon="tabler:clipboard-list" className="w-4 h-4" />{tx.viewHandover}
                        </button>
                        <button onClick={() => setConfirm({ title: tx.confirmEndTitle, text: tx.confirmEndDelegate(d.owner.name), run: () => act(d.id, "end") })}
                          className="px-4 py-2 rounded-xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50">
                          {tx.stopCovering}
                        </button>
                        {d.state === "active" && (inside ? (
                          <button onClick={() => switchWorkspace(null)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                            <Icon icon="tabler:arrow-back-up" className="w-4 h-4" />{tx.backToMine}
                          </button>
                        ) : (
                          <button onClick={() => switchWorkspace(d.owner.id)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:shadow-md"
                            style={{ backgroundColor: NAVY }}>
                            <Icon icon="tabler:arrows-exchange" className="w-4 h-4" />{tx.openWorkspace(d.owner.name.split(" ")[0] || d.owner.name)}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── 3. History ── */}
      {data.history.length > 0 && (
        <section>
          <button onClick={() => setShowHistory((v) => !v)} className="flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase text-gray-400 hover:text-gray-600">
            <Icon icon={showHistory ? "tabler:chevron-down" : "tabler:chevron-right"} className="w-3.5 h-3.5" />
            {tx.history} ({data.history.length})
          </button>
          {showHistory && (
            <div className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-100">
              {data.history.map((d) => <HistoryRow key={d.id} d={d} me={data.me} lang={lang} tx={tx} />)}
            </div>
          )}
        </section>
      )}

      {handover && (
        <DelegationHandover delegationId={handover.id} language={lang} canOpenWorkspace={!handover.asOwner}
          onClose={() => {
            setHandover(null)
            // Drop ?handover= so a refresh doesn't reopen it.
            const url = new URL(window.location.href)
            if (url.searchParams.has("handover")) { url.searchParams.delete("handover"); window.history.replaceState(null, "", url) }
          }} />
      )}

      {confirm && (
        <ConfirmDialog title={confirm.title} text={confirm.text} danger={confirm.danger} busy={!!busyId} tx={tx}
          onConfirm={() => confirm.run()} onCancel={() => setConfirm(null)} />
      )}
    </div>
  )
}

function HistoryRow({ d, me, lang, tx }: { d: Delegation; me: string; lang: Lang; tx: (typeof TX)["en"] }) {
  const iCovered = d.delegate.id === me
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Avatar name={iCovered ? d.owner.name : d.delegate.name} size={32} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 truncate">
          {iCovered ? tx.youCovered(d.owner.name) : tx.coveredYou(d.delegate.name)}
        </p>
        <p className="text-xs text-gray-400">{formatPeriod(d, lang)}</p>
      </div>
      <span className={clsx("text-[11px] font-semibold px-2 py-0.5 rounded-full border", TONE[STATE_LABELS[d.state].tone])}>
        {STATE_LABELS[d.state][lang]}
      </span>
    </div>
  )
}

/* ─── Request form ─── */
function RequestForm({ lang, tx, onSent, onError }: {
  lang: Lang; tx: (typeof TX)["en"]; onSent: () => void; onError: (m: string) => void
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<DelegationPerson[]>([])
  const [meta, setMeta] = useState<{ total: number; reason: "no_company" | "no_managers" | null }>({ total: 0, reason: null })
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<DelegationPerson | null>(null)
  const [reason, setReason] = useState<DelegationReason>("vacation")
  const [from, setFrom] = useState(today())
  const [until, setUntil] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const boxRef = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = (q: string) => {
    setQuery(q)
    setOpen(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const r = await searchDelegateCandidates(q)
        setResults(r.data)
        setMeta({ total: r.total, reason: r.reason })
      } catch { setResults([]) } finally { setSearching(false) }
    }, 250)
  }

  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [])

  const submit = async () => {
    if (!picked) { setError(tx.pickFirst); return }
    setError("")
    setSending(true)
    try {
      await createDelegation({
        delegateId: picked.id,
        reason,
        message: message.trim(),
        // "From today" = immediately; a later day starts at midnight that day.
        startsAt: from && from > today() ? new Date(`${from}T00:00:00`).toISOString() : null,
        endsAt: until ? new Date(`${until}T23:59:59`).toISOString() : null,
      })
      onSent()
    } catch (e) {
      const m = (e as Error).message || tx.failed
      setError(m)
      onError(m)
    } finally {
      setSending(false)
    }
  }

  const quick = [
    { label: tx.oneWeek, days: 7 }, { label: tx.twoWeeks, days: 14 }, { label: tx.oneMonth, days: 30 },
  ]
  const firstName = picked?.name.split(" ")[0] ?? ""

  return (
    <div className="rounded-2xl border border-gray-200 p-5 space-y-5">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">{error}</div>}

      {/* Manager picker */}
      <div ref={boxRef} className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{tx.chooseManager} <span className="text-red-500">*</span></label>
        {picked ? (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border-2" style={{ borderColor: NAVY, backgroundColor: "rgba(5,22,80,0.03)" }}>
            <Avatar name={picked.name} size={36} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{picked.name}</p>
              <p className="text-xs text-gray-400 truncate">{[picked.jobTitle, picked.email].filter(Boolean).join(" · ")}</p>
            </div>
            <button onClick={() => { setPicked(null); setQuery(""); setTimeout(() => boxRef.current?.querySelector("input")?.focus(), 0) }}
              className="text-xs font-semibold text-blue-900 hover:underline px-2">{tx.change}</button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Icon icon="tabler:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input value={query} onChange={(e) => search(e.target.value)} onFocus={() => search(query)}
                placeholder={tx.searchPh} className={clsx(inputCls, "pl-9")} autoComplete="off" />
            </div>
            {open && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-y-auto">
                {searching && results.length === 0 && <p className="px-4 py-3 text-sm text-gray-400">{tx.searching}</p>}
                {!searching && results.length === 0 && (
                  <div className="px-4 py-3">
                    {meta.reason === "no_company" ? (
                      <p className="text-sm text-gray-500">{tx.noCompanyLink}</p>
                    ) : meta.reason === "no_managers" ? (
                      <p className="text-sm text-gray-500">{tx.noOtherManagers}</p>
                    ) : (
                      <>
                        <p className="text-sm text-gray-500">{tx.noMatches}{query.trim() ? ` “${query.trim()}”` : ""}.</p>
                        <p className="text-xs text-gray-400 mt-0.5">{tx.noCompany}</p>
                      </>
                    )}
                  </div>
                )}
                {results.length > 0 && (
                  <p className="px-4 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    {query.trim() ? tx.matchCount(results.length, meta.total) : tx.allManagers(meta.total)}
                  </p>
                )}
                {results.map((p) => (
                  <button key={p.id} onClick={() => { setPicked(p); setOpen(false); setError("") }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0">
                    <Avatar name={p.name} size={32} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400 truncate">{[p.jobTitle, p.email].filter(Boolean).join(" · ")}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Reason */}
      <div>
        <p className="block text-sm font-medium text-gray-700 mb-1.5">{tx.reason}</p>
        <div className="flex flex-wrap gap-2">
          {DELEGATION_REASONS.map((r) => (
            <button key={r} type="button" onClick={() => setReason(r)}
              className={clsx("flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm transition-all",
                reason === r ? "text-white border-transparent" : "border-gray-200 text-gray-600 hover:bg-gray-50")}
              style={reason === r ? { backgroundColor: NAVY } : undefined}>
              <Icon icon={REASON_LABELS[r].icon} className="w-4 h-4" />{REASON_LABELS[r][lang]}
            </button>
          ))}
        </div>
      </div>

      {/* Period */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{tx.from}</label>
          <input type="date" value={from} min={today()} onChange={(e) => setFrom(e.target.value || today())} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{tx.until}</label>
          <input type="date" value={until} min={from || today()} onChange={(e) => setUntil(e.target.value)} className={inputCls} />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {quick.map((q) => (
              <button key={q.days} type="button" onClick={() => setUntil(addDays(from || today(), q.days))}
                className="px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-medium text-gray-600 hover:bg-gray-200">+{q.label}</button>
            ))}
            <button type="button" onClick={() => setUntil("")}
              className={clsx("px-2.5 py-1 rounded-lg text-xs font-medium", until ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-blue-50 text-blue-900")}>{tx.open}</button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">{tx.untilHint}</p>
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{tx.message}</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={1000}
          className={clsx(inputCls, "resize-none")} placeholder={tx.messagePh} />
      </div>

      {/* What they get */}
      <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
        <p className="text-xs font-semibold text-gray-700 mb-2">{tx.canTitle(firstName)}</p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {tx.can.map((c) => (
            <li key={c} className="flex items-center gap-2 text-xs text-gray-600">
              <Icon icon="tabler:circle-check-filled" className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />{c}
            </li>
          ))}
        </ul>
        <p className="text-xs text-gray-400 mt-3 leading-relaxed">{tx.cannot}</p>
      </div>

      <div className="flex justify-end pt-1">
        <button onClick={submit} disabled={sending || !picked}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: NAVY }}>
          {sending ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icon icon="tabler:send" className="w-4 h-4" />}
          {sending ? tx.sending : tx.send}
        </button>
      </div>
    </div>
  )
}
