"use client"

// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/manager/views/ManagerMyContracts.tsx
// WHAT IT DOES:   Manager → Others → My contracts (view "my_contracts").
//   Employment contracts the business admin sent to YOU — the same page as the
//   employee's "My contracts":
//     • list with tabs (All / To sign / Active / Ended) and contract cards
//     • contract page: the document + action card (sign / waiting / complete),
//       details and history
//     • View PDF (opens the signed PDF inside the page), Download PDF, Print / PDF
//   URL: ?contract=<id> opens a contract (the browser's back button works).
//   Data: /api/company/managers/my-contracts/* (myManagerContractsApi)
// ══════════════════════════════════════════════════════════════════════

import type React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Icon } from "@iconify/react"
import clsx from "clsx"
import { useManagerTranslations } from "@/utils/Managertranslations"
import { loadWebFontsForPreview } from "@/utils/pdfFonts"
import {
  CONTRACTS_CHANGED_EVENT,
  isFullySigned,
  myManagerContractsApi,
  needsMySignature,
  type ReceivedContract,
  type ReceivedContractDetail,
} from "@/utils/myManagerContractsApi"
import ContractDocumentView, { ContractDocumentData } from "@/components/Dashboard/Contracts/ContractDocumentView"
import SignatureCanvas, { SignatureResult } from "./SignatureCanvas"

/* ─── Constants (same look as the employee page) ─── */
const NAVY = "rgb(5,22,80)"
const LIGHT = "rgb(239,246,255)"

type StatusKey = "pending_signature" | "pending_manager_signature" | "active" | "expiring_soon" | "expired" | "terminated"

const CONTRACT_TYPE_LABEL: Record<string, { en: string; sv: string; icon: string }> = {
  permanent: { en: "Permanent", sv: "Tillsvidare", icon: "tabler:infinity" },
  temporary: { en: "Fixed-term", sv: "Visstid", icon: "tabler:calendar-time" },
  on_call: { en: "On-call", sv: "Behovsanställning", icon: "tabler:calendar-repeat" },
  consultant: { en: "Consultant", sv: "Konsult", icon: "tabler:briefcase" },
}

const STATUS_STYLE: Record<StatusKey, { bg: string; text: string; border: string; dot: string; en: string; sv: string }> = {
  pending_signature: { bg: "rgb(255,251,235)", text: "rgb(146,64,14)", border: "rgb(253,230,138)", dot: "rgb(245,158,11)", en: "Waiting for your signature", sv: "Väntar på din signatur" },
  pending_manager_signature: { bg: "rgb(238,242,255)", text: "rgb(67,56,202)", border: "rgb(199,210,254)", dot: "rgb(99,102,241)", en: "Waiting for your employer to sign", sv: "Väntar på att arbetsgivaren signerar" },
  active: { bg: "rgb(240,253,244)", text: "rgb(22,101,52)", border: "rgb(187,247,208)", dot: "rgb(34,197,94)", en: "Fully signed", sv: "Fullständigt signerat" },
  expiring_soon: { bg: "rgb(255,247,237)", text: "rgb(154,52,18)", border: "rgb(254,215,170)", dot: "rgb(249,115,22)", en: "Expiring soon", sv: "Löper snart ut" },
  expired: { bg: "rgb(254,242,242)", text: "rgb(153,27,27)", border: "rgb(254,202,202)", dot: "rgb(239,68,68)", en: "Expired", sv: "Utgånget" },
  terminated: { bg: "rgb(243,244,246)", text: "rgb(55,65,81)", border: "rgb(209,213,219)", dot: "rgb(107,114,128)", en: "Terminated", sv: "Avslutat" },
}

const EVENT_META: Record<string, { icon: string; color: string; en: string; sv: string }> = {
  sent: { icon: "tabler:send", color: "rgb(37,99,235)", en: "Sent to you for signature", sv: "Skickat till dig för signering" },
  signed: { icon: "tabler:signature", color: "rgb(37,99,235)", en: "Signed by you", sv: "Signerat av dig" },
  manager_signed: { icon: "tabler:rosette-discount-check-filled", color: "rgb(22,163,74)", en: "Signed by your employer — contract complete", sv: "Signerat av arbetsgivaren — kontraktet är klart" },
  renewed: { icon: "tabler:refresh", color: NAVY, en: "Contract renewed", sv: "Kontraktet förnyades" },
  extended: { icon: "tabler:calendar-plus", color: NAVY, en: "Contract extended", sv: "Kontraktet förlängdes" },
  terminated: { icon: "tabler:file-x", color: "rgb(220,38,38)", en: "Contract terminated", sv: "Kontraktet avslutades" },
}

const DOC_ID = "manager-contract-document"
const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #${DOC_ID}, #${DOC_ID} * { visibility: visible !important; }
  #${DOC_ID} { position: absolute; inset: 0; border: 0 !important; box-shadow: none !important; padding: 2rem !important; }
}`

type Tab = "all" | "to_sign" | "active" | "ended"

/** Decided from the signatures, so it's never "Fully signed" before the employer has signed. */
function effectiveStatus(c: Pick<ReceivedContract, "displayStatus" | "status" | "signedAt" | "managerSignedAt">): StatusKey {
  const terminated = c.displayStatus === "terminated" || c.status === "terminated"
  if (terminated) return "terminated"
  if (c.signedAt && !c.managerSignedAt) return "pending_manager_signature"
  const s = (c.displayStatus || c.status) as StatusKey
  return STATUS_STYLE[s] ? s : "pending_signature"
}

function fmtDate(d: string | null | undefined, isEn: boolean) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString(isEn ? "en-GB" : "sv-SE", { day: "numeric", month: "short", year: "numeric" })
}
function fmtDateTime(d: string, isEn: boolean) {
  return new Date(d).toLocaleString(isEn ? "en-GB" : "sv-SE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

const StatusBadge: React.FC<{ status: StatusKey; isEn: boolean }> = ({ status, isEn }) => {
  const s = STATUS_STYLE[status]
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-full border flex-shrink-0"
      style={{ color: s.text, backgroundColor: s.bg, borderColor: s.border }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.dot }} />
      {isEn ? s.en : s.sv}
    </span>
  )
}

/* ─── ?contract=<id> in the URL (other params, e.g. the dashboard view, are kept) ─── */
const readContractParam = () =>
  typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("contract")

function writeContractParam(id: string | null) {
  const url = new URL(window.location.href)
  if (id) url.searchParams.set("contract", id)
  else url.searchParams.delete("contract")
  window.history.pushState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)
}

/* ═════════════════════════════════════════════
   PAGE
═════════════════════════════════════════════ */
export default function ManagerMyContracts() {
  const { language } = useManagerTranslations()
  const isEn = language === "en"

  const [contracts, setContracts] = useState<ReceivedContract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setError(null)
    try {
      setContracts(await myManagerContractsApi.list())
    } catch (e) {
      setError((e as Error).message || (isEn ? "Couldn't load your contracts." : "Kunde inte ladda dina kontrakt."))
    } finally {
      setLoading(false)
    }
  }, [isEn])
  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    setSelectedId(readContractParam())
    const onPop = () => setSelectedId(readContractParam())
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  const open = (id: string) => { writeContractParam(id); setSelectedId(id); window.scrollTo({ top: 0 }) }
  const back = () => { writeContractParam(null); setSelectedId(null); refresh() }

  const counts = useMemo(() => ({
    all: contracts.length,
    to_sign: contracts.filter(needsMySignature).length,
    active: contracts.filter(c => ["active", "expiring_soon", "pending_manager_signature"].includes(effectiveStatus(c))).length,
    ended: contracts.filter(c => ["expired", "terminated"].includes(effectiveStatus(c))).length,
  }), [contracts])

  const filtered = useMemo(() => contracts.filter(c => {
    if (tab === "to_sign") return needsMySignature(c)
    if (tab === "active") return ["active", "expiring_soon", "pending_manager_signature"].includes(effectiveStatus(c))
    if (tab === "ended") return ["expired", "terminated"].includes(effectiveStatus(c))
    return true
  }), [contracts, tab])

  if (selectedId) return <ContractDetailView id={selectedId} isEn={isEn} onBack={back} onChanged={refresh} />

  const TABS: { id: Tab; en: string; sv: string }[] = [
    { id: "all", en: "All", sv: "Alla" },
    { id: "to_sign", en: "To sign", sv: "Att signera" },
    { id: "active", en: "Active", sv: "Aktiva" },
    { id: "ended", en: "Ended", sv: "Avslutade" },
  ]

  return (
    <div className="w-full max-w-7xl mx-auto px-1 sm:px-2 py-2">
      {/* Header */}
      <div className="mb-6 flex items-start gap-3">
        <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: NAVY }}>
          <Icon icon="tabler:file-certificate" className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{isEn ? "My Contracts" : "Mina Kontrakt"}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEn ? "Review, sign and download your employment contracts." : "Granska, signera och ladda ned dina anställningsavtal."}
          </p>
        </div>
      </div>

      {/* Action banner */}
      {counts.to_sign > 0 && (
        <button onClick={() => setTab("to_sign")}
          className="w-full mb-5 flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all hover:shadow-sm"
          style={{ backgroundColor: STATUS_STYLE.pending_signature.bg, borderColor: STATUS_STYLE.pending_signature.border }}>
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
            <Icon icon="tabler:signature" className="w-5 h-5" style={{ color: STATUS_STYLE.pending_signature.text }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: STATUS_STYLE.pending_signature.text }}>
              {isEn
                ? `${counts.to_sign} contract${counts.to_sign === 1 ? "" : "s"} waiting for your signature`
                : `${counts.to_sign} kontrakt väntar på din signatur`}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">{isEn ? "Read the contract carefully before you sign." : "Läs kontraktet noggrant innan du signerar."}</p>
          </div>
          <Icon icon="tabler:chevron-right" className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </button>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl overflow-x-auto mb-5 w-fit max-w-full">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
              tab === t.id ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700")}>
            {isEn ? t.en : t.sv}
            <span className={clsx("text-xs px-1.5 rounded-full", tab === t.id ? "bg-gray-100 text-gray-600" : "text-gray-400")}>{counts[t.id]}</span>
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-20 flex items-center justify-center gap-2 text-sm text-gray-400">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
          {isEn ? "Loading contracts…" : "Laddar kontrakt…"}
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-red-100 py-16 text-center">
          <Icon icon="tabler:cloud-off" className="w-10 h-10 text-red-300 mx-auto mb-3" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
          <button onClick={() => { setLoading(true); refresh() }}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <Icon icon="tabler:refresh" className="w-4 h-4" />{isEn ? "Try again" : "Försök igen"}
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
          <Icon icon="tabler:file-off" className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {contracts.length === 0
              ? (isEn ? "You don't have any contracts yet." : "Du har inga kontrakt ännu.")
              : (isEn ? "No contracts in this category." : "Inga kontrakt i denna kategori.")}
          </p>
          {contracts.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {isEn ? "When your employer sends you a contract, it will appear here." : "När din arbetsgivare skickar ett kontrakt visas det här."}
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(c => <ContractCard key={c.id} contract={c} isEn={isEn} onOpen={() => open(c.id)} />)}
        </div>
      )}
    </div>
  )
}

/* ═════════════════════════════════════════════
   LIST CARD
═════════════════════════════════════════════ */
const ContractCard: React.FC<{ contract: ReceivedContract; isEn: boolean; onOpen: () => void }> = ({ contract: c, isEn, onOpen }) => {
  const statusKey = effectiveStatus(c)
  const status = STATUS_STYLE[statusKey]
  const type = CONTRACT_TYPE_LABEL[c.contractType] ?? CONTRACT_TYPE_LABEL.permanent!
  const toSign = needsMySignature(c)
  const done = isFullySigned(c)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden">
      <div className="h-1.5 w-full" style={{ backgroundColor: status.dot }} />
      <div className="px-5 pt-4 pb-3 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900 truncate">{c.title || (isEn ? "Employment contract" : "Anställningsavtal")}</h3>
            <p className="text-xs text-gray-500 mt-1 truncate">{[c.companyName, c.positionTitle].filter(Boolean).join(" · ") || "—"}</p>
          </div>
          <StatusBadge status={statusKey} isEn={isEn} />
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: LIGHT, color: NAVY }}>
            <Icon icon={type.icon} className="w-3 h-3" />{isEn ? type.en : type.sv}
          </span>
          <span className="text-[10px] font-medium text-gray-400">
            {c.employmentExtent === "full_time" ? (isEn ? "Full-time" : "Heltid") : (isEn ? "Part-time" : "Deltid")}
          </span>
          {done && statusKey !== "terminated" && (
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border border-green-200 bg-green-50 text-green-700">
              <Icon icon="tabler:rosette-discount-check-filled" className="w-3 h-3" />{isEn ? "Sealed" : "Förseglat"}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-gray-50 mt-3 pt-3 text-xs">
          <div>
            <p className="text-gray-400 text-[10px] uppercase font-semibold tracking-wide">Start</p>
            <p className="text-gray-700 font-medium mt-0.5">{fmtDate(c.startDate, isEn)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-[10px] uppercase font-semibold tracking-wide">{isEn ? "End" : "Slut"}</p>
            <p className="text-gray-700 font-medium mt-0.5">{c.endDate ? fmtDate(c.endDate, isEn) : (isEn ? "No end date" : "Inget slutdatum")}</p>
          </div>
        </div>
        {statusKey === "pending_manager_signature" && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg"
            style={{ backgroundColor: STATUS_STYLE.pending_manager_signature.bg, color: STATUS_STYLE.pending_manager_signature.text }}>
            <Icon icon="tabler:hourglass" className="w-3.5 h-3.5 flex-shrink-0" />
            {isEn ? "You've signed — 1 of 2 signatures" : "Du har signerat — 1 av 2 signaturer"}
          </div>
        )}
        {c.senderName && (
          <p className="text-[11px] text-gray-400 mt-3 flex items-center gap-1.5">
            <Icon icon="tabler:user" className="w-3 h-3" />
            {isEn ? "Sent by" : "Skickat av"} {c.senderName}
            {c.sentAt && <> · {fmtDate(c.sentAt, isEn)}</>}
          </p>
        )}
      </div>

      <div className="px-5 pb-4 flex gap-2">
        <button onClick={onOpen}
          className={clsx("flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold transition-all",
            toSign ? "text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50")}
          style={toSign ? { backgroundColor: NAVY } : undefined}>
          <Icon icon={toSign ? "tabler:signature" : "tabler:file-text"} className="w-3.5 h-3.5" />
          {toSign ? (isEn ? "Review & sign" : "Granska & signera") : (isEn ? "View contract" : "Visa kontrakt")}
        </button>
        {done && (
          <a href={myManagerContractsApi.pdfUrl(c.id, true)} title={isEn ? "Download signed PDF" : "Ladda ned signerad PDF"}
            aria-label={isEn ? "Download signed PDF" : "Ladda ned signerad PDF"}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-red-500 hover:bg-gray-50 flex-shrink-0">
            <Icon icon="tabler:file-type-pdf" className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  )
}

/* ═════════════════════════════════════════════
   PDF VIEWER (the signed PDF, inside the page)
═════════════════════════════════════════════ */
function PdfViewer({ contract, isEn, onClose }: { contract: ReceivedContractDetail; isEn: boolean; onClose: () => void }) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading")
  const [url, setUrl] = useState("")
  const src = myManagerContractsApi.pdfUrl(contract.id)

  // Fetch first so a problem shows as a message instead of a broken frame.
  useEffect(() => {
    let alive = true
    let made = ""
    fetch(src, { credentials: "include", cache: "no-store" })
      .then(async r => {
        if (!r.ok || !(r.headers.get("content-type") ?? "").includes("pdf")) throw new Error()
        made = URL.createObjectURL(await r.blob())
        if (alive) { setUrl(made); setState("ok") }
      })
      .catch(() => alive && setState("error"))
    return () => { alive = false; if (made) URL.revokeObjectURL(made) }
  }, [src])

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", k)
    return () => window.removeEventListener("keydown", k)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-gray-900/70" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={contract.title}
        className="relative w-full max-w-5xl h-[94vh] flex flex-col bg-white rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-gray-100">
          <Icon icon="tabler:file-type-pdf" className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 truncate">{contract.title || (isEn ? "Employment contract" : "Anställningsavtal")}</p>
            <p className="text-xs text-gray-500 truncate">{isEn ? "Signed by both parties" : "Signerat av båda parter"}</p>
          </div>
          <a href={src} target="_blank" rel="noopener noreferrer" title={isEn ? "Open in new tab" : "Öppna i ny flik"}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50">
            <Icon icon="tabler:external-link" className="w-3.5 h-3.5" /><span className="hidden sm:inline">{isEn ? "Open in new tab" : "Öppna i ny flik"}</span>
          </a>
          <a href={myManagerContractsApi.pdfUrl(contract.id, true)} title={isEn ? "Download" : "Ladda ned"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: NAVY }}>
            <Icon icon="tabler:download" className="w-3.5 h-3.5" /><span className="hidden sm:inline">{isEn ? "Download" : "Ladda ned"}</span>
          </a>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100" aria-label={isEn ? "Close" : "Stäng"}>
            <Icon icon="tabler:x" className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 min-h-0 bg-gray-100">
          {state === "ok" ? (
            <iframe src={url} title={contract.title} className="w-full h-full bg-white" />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-sm text-gray-500 p-6 text-center">
              <Icon icon={state === "error" ? "tabler:alert-circle" : "tabler:loader-2"} className={clsx("w-8 h-8", state === "error" ? "text-red-300" : "animate-spin text-gray-300")} />
              {state === "error" ? (isEn ? "Couldn't open the PDF." : "Kunde inte öppna PDF:en.") : (isEn ? "Loading the signed contract…" : "Laddar det signerade kontraktet…")}
              {state === "error" && (
                <a href={src} target="_blank" rel="noopener noreferrer" className="font-semibold underline" style={{ color: NAVY }}>
                  {isEn ? "Open in new tab" : "Öppna i ny flik"}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═════════════════════════════════════════════
   DETAIL VIEW
═════════════════════════════════════════════ */
function ContractDetailView({ id, isEn, onBack, onChanged }: { id: string; isEn: boolean; onBack: () => void; onChanged: () => void }) {
  const [contract, setContract] = useState<ReceivedContractDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pdfOpen, setPdfOpen] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      setContract(await myManagerContractsApi.get(id))
    } catch (e) {
      setError((e as Error).message || (isEn ? "Couldn't load the contract." : "Kunde inte ladda kontraktet."))
    } finally {
      setLoading(false)
    }
  }, [id, isEn])

  useEffect(() => { setLoading(true); load() }, [load])
  useEffect(() => { loadWebFontsForPreview() }, [])

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center gap-2 text-sm text-gray-400">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        {isEn ? "Loading contract…" : "Laddar kontrakt…"}
      </div>
    )
  }

  if (error || !contract) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <Icon icon="tabler:file-alert" className="w-10 h-10 text-red-300 mx-auto mb-3" />
        <p className="text-sm text-red-600 font-medium">{error ?? (isEn ? "Contract not found." : "Kontraktet hittades inte.")}</p>
        <button onClick={onBack}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
          <Icon icon="tabler:arrow-left" className="w-4 h-4" />{isEn ? "Back to contracts" : "Tillbaka till kontrakt"}
        </button>
      </div>
    )
  }

  const toSign = needsMySignature(contract)
  const done = isFullySigned(contract)

  return (
    <div className="w-full max-w-7xl mx-auto px-1 sm:px-2 py-2">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} aria-label={isEn ? "Back to contracts" : "Tillbaka till kontrakt"}
            className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 flex-shrink-0">
            <Icon icon="tabler:arrow-left" className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-gray-800 truncate">{contract.title || (isEn ? "Employment contract" : "Anställningsavtal")}</h1>
            <p className="text-xs text-gray-400 truncate">{contract.companyName || contract.senderName || "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={effectiveStatus(contract)} isEn={isEn} />
          {done && (
            <>
              <button onClick={() => setPdfOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50">
                <Icon icon="tabler:file-type-pdf" className="w-3.5 h-3.5 text-red-500" />{isEn ? "View PDF" : "Visa PDF"}
              </button>
              <a href={myManagerContractsApi.pdfUrl(contract.id, true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: NAVY }}>
                <Icon icon="tabler:file-download" className="w-3.5 h-3.5" />{isEn ? "Signed PDF" : "Signerad PDF"}
              </a>
            </>
          )}
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50">
            <Icon icon="tabler:printer" className="w-3.5 h-3.5" />{isEn ? "Print / PDF" : "Skriv ut / PDF"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Sidebar — first on mobile when you need to act */}
        <div className={clsx("space-y-4 lg:col-span-1 lg:order-2 lg:sticky lg:top-4", !toSign && "order-2")}>
          <ActionCard contract={contract} isEn={isEn} onViewPdf={() => setPdfOpen(true)}
            onSigned={async () => { await load(); onChanged(); window.dispatchEvent(new Event(CONTRACTS_CHANGED_EVENT)) }} />
          <DetailsCard contract={contract} isEn={isEn} />
          <TimelineCard events={contract.history} isEn={isEn} />
        </div>

        {/* The contract itself */}
        <div className="lg:col-span-2 lg:order-1">
          <ContractDocumentView data={toDocumentData(contract)} isEn={isEn} id={DOC_ID} />
        </div>
      </div>

      {pdfOpen && <PdfViewer contract={contract} isEn={isEn} onClose={() => setPdfOpen(false)} />}
    </div>
  )
}

/* ─── Action card: sign / waiting / complete / ended ─── */
function ActionCard({ contract, isEn, onSigned, onViewPdf }: {
  contract: ReceivedContractDetail; isEn: boolean; onSigned: () => Promise<void>; onViewPdf: () => void
}) {
  const [fullName, setFullName] = useState(contract.employeeName || "")
  const [signature, setSignature] = useState<SignatureResult>({ dataUrl: null, typedName: null })
  const [consent, setConsent] = useState(false)
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wait = STATUS_STYLE.pending_manager_signature

  /* Signed by both — complete */
  if (contract.signedAt && contract.managerSignedAt) {
    return (
      <div className="bg-white rounded-2xl border-2 p-5" style={{ borderColor: "rgb(187,247,208)" }}>
        <div className="flex items-center gap-2 mb-1">
          <Icon icon="tabler:rosette-discount-check-filled" className="w-6 h-6 text-green-600" />
          <p className="text-sm font-bold text-gray-800">{isEn ? "Contract complete" : "Kontraktet är klart"}</p>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed mb-3">
          {isEn ? "You and your employer have both signed. The contract is sealed." : "Du och din arbetsgivare har båda signerat. Kontraktet är förseglat."}
        </p>
        <div className="space-y-1.5 text-xs">
          <p className="flex items-center gap-1.5 text-gray-600">
            <Icon icon="tabler:circle-check-filled" className="w-3.5 h-3.5 text-green-500" />
            {contract.signedByName} · {fmtDateTime(contract.signedAt, isEn)}
          </p>
          <p className="flex items-center gap-1.5 text-gray-600">
            <Icon icon="tabler:circle-check-filled" className="w-3.5 h-3.5 text-green-500" />
            {contract.managerSignedByName || contract.companyName} · {fmtDateTime(contract.managerSignedAt, isEn)}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={onViewPdf}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <Icon icon="tabler:eye" className="w-4 h-4" />{isEn ? "View PDF" : "Visa PDF"}
          </button>
          <a href={myManagerContractsApi.pdfUrl(contract.id, true)}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: NAVY }}>
            <Icon icon="tabler:file-download" className="w-4 h-4" />{isEn ? "Download" : "Ladda ned"}
          </a>
        </div>
      </div>
    )
  }

  /* Signed by you — waiting for the employer */
  if (contract.signedAt) {
    return (
      <div className="bg-white rounded-2xl border-2 p-5" style={{ borderColor: wait.border }}>
        <div className="flex items-center gap-2 mb-1">
          <Icon icon="tabler:hourglass" className="w-5 h-5" style={{ color: wait.text }} />
          <p className="text-sm font-bold" style={{ color: wait.text }}>{isEn ? "Waiting for your employer to sign" : "Väntar på att arbetsgivaren signerar"}</p>
        </div>
        <p className="text-xs text-gray-500 mb-3">{isEn ? "1 of 2 signatures — you have signed." : "1 av 2 signaturer — du har signerat."}</p>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mb-4">
          <div className="h-full w-1/2 rounded-full" style={{ backgroundColor: wait.dot }} />
        </div>
        {contract.signatureDataUrl && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={contract.signatureDataUrl} alt={isEn ? "Your signature" : "Din signatur"} className="max-h-20 mx-auto" />
          </div>
        )}
        <p className="text-xs text-gray-500">{contract.signedByName} · {fmtDateTime(contract.signedAt, isEn)}</p>
        <div className="mt-3 flex items-start gap-2 rounded-xl border px-3 py-2.5" style={{ backgroundColor: wait.bg, borderColor: wait.border }}>
          <Icon icon="tabler:clock" className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: wait.dot }} />
          <p className="text-xs leading-relaxed" style={{ color: wait.text }}>
            {isEn
              ? "When your employer has signed, the signed PDF is available here to view and download."
              : "När din arbetsgivare har signerat finns den signerade PDF:en här att visa och ladda ned."}
          </p>
        </div>
      </div>
    )
  }

  /* Terminated before signing */
  if (effectiveStatus(contract) === "terminated") {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center gap-2">
          <Icon icon="tabler:file-x" className="w-5 h-5 text-gray-400" />
          <p className="text-sm font-semibold text-gray-700">{isEn ? "This contract has been terminated" : "Detta kontrakt har avslutats"}</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">{isEn ? "It can no longer be signed." : "Det kan inte längre signeras."}</p>
      </div>
    )
  }

  if (!needsMySignature(contract)) return null

  const handleSign = async () => {
    setError(null)
    if (fullName.trim().length < 2) return setError(isEn ? "Enter your full name." : "Ange ditt fullständiga namn.")
    if (!signature.dataUrl) return setError(isEn ? "Draw or type your signature." : "Rita eller skriv din signatur.")
    if (!consent) return setError(isEn ? "Confirm that you have read and agree to the contract." : "Bekräfta att du har läst och godkänner kontraktet.")
    setSigning(true)
    try {
      await myManagerContractsApi.sign(contract.id, { fullName: fullName.trim(), signatureDataUrl: signature.dataUrl, typedName: signature.typedName, consent: true })
      await onSigned()
    } catch (e) {
      setError((e as Error).message || (isEn ? "Signing failed. Please try again." : "Signeringen misslyckades. Försök igen."))
    } finally {
      setSigning(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border-2 p-5 space-y-4" style={{ borderColor: STATUS_STYLE.pending_signature.border }}>
      <div>
        <div className="flex items-center gap-2">
          <Icon icon="tabler:signature" className="w-5 h-5" style={{ color: STATUS_STYLE.pending_signature.text }} />
          <p className="text-sm font-semibold text-gray-800">{isEn ? "Sign the contract" : "Signera kontraktet"}</p>
        </div>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          {isEn
            ? "Read the whole contract before signing. If something is wrong, contact your employer before you sign."
            : "Läs hela kontraktet innan du signerar. Om något är fel, kontakta din arbetsgivare innan du signerar."}
        </p>
      </div>

      {contract.signingMethod !== "verocv" ? (
        <p className="text-xs text-amber-800 bg-amber-50 rounded-xl px-3 py-2.5">
          {isEn ? "This contract must be signed with BankID, which isn't available on this page." : "Det här kontraktet ska signeras med BankID, vilket inte finns på den här sidan."}
        </p>
      ) : (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="mgr-contract-name">{isEn ? "Full name" : "Fullständigt namn"}</label>
            <input id="mgr-contract-name" type="text" value={fullName} onChange={e => setFullName(e.target.value)} disabled={signing} maxLength={120}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50" />
          </div>
          <div>
            <p className="block text-xs font-medium text-gray-600 mb-1.5">{isEn ? "Your signature" : "Din signatur"}</p>
            <SignatureCanvas isEn={isEn} defaultName={fullName} disabled={signing} onChange={setSignature} />
          </div>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} disabled={signing}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 flex-shrink-0" />
            <span className="text-xs text-gray-600 leading-relaxed">
              {isEn
                ? "I have read the entire contract and agree to its terms. I understand that my electronic signature is legally binding, in the same way as a handwritten signature."
                : "Jag har läst hela kontraktet och godkänner villkoren. Jag förstår att min elektroniska signatur är juridiskt bindande, på samma sätt som en namnteckning."}
            </span>
          </label>
          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl border border-red-200 bg-red-50 text-xs text-red-600" role="alert">
              <Icon icon="tabler:alert-circle" className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          <button onClick={handleSign} disabled={signing}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60" style={{ backgroundColor: NAVY }}>
            {signing ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Icon icon="tabler:signature" className="w-4 h-4" />}
            {signing ? (isEn ? "Signing…" : "Signerar…") : (isEn ? "Sign contract" : "Signera kontrakt")}
          </button>
        </>
      )}
    </div>
  )
}

/* ─── Key facts ─── */
function DetailsCard({ contract: c, isEn }: { contract: ReceivedContractDetail; isEn: boolean }) {
  const type = CONTRACT_TYPE_LABEL[c.contractType] ?? CONTRACT_TYPE_LABEL.permanent!
  const rows: [string, string][] = [
    [isEn ? "Employer" : "Arbetsgivare", c.companyName || "—"],
    [isEn ? "Position" : "Befattning", c.positionTitle || "—"],
    [isEn ? "Form of employment" : "Anställningsform", isEn ? type.en : type.sv],
    [isEn ? "Extent" : "Omfattning", c.employmentExtent === "full_time" ? (isEn ? "Full-time" : "Heltid") : (isEn ? "Part-time" : "Deltid")],
    [isEn ? "Start date" : "Tillträdesdatum", fmtDate(c.startDate, isEn)],
    [isEn ? "End date" : "Slutdatum", c.endDate ? fmtDate(c.endDate, isEn) : (isEn ? "No end date" : "Inget slutdatum")],
    [isEn ? "Workplace" : "Arbetsplats", c.workplace || "—"],
    [isEn ? "Sent by" : "Skickat av", c.senderName || "—"],
    [isEn ? "Signing method" : "Signeringsmetod", isEn ? "VeroCV signature" : "VeroCV-signatur"],
  ]
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">{isEn ? "Details" : "Detaljer"}</p>
      <dl className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-3 text-xs">
            <dt className="text-gray-400 flex-shrink-0">{label}</dt>
            <dd className="text-gray-700 font-medium text-right break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/* ─── Timeline ─── */
function TimelineCard({ events, isEn }: { events: ReceivedContractDetail["history"]; isEn: boolean }) {
  const sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  if (sorted.length === 0) return null
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">{isEn ? "History" : "Historik"}</p>
      <ol className="relative space-y-4">
        {sorted.map((ev, i) => {
          const meta = EVENT_META[ev.type] ?? { icon: "tabler:point", color: "rgb(107,114,128)", en: ev.type, sv: ev.type }
          return (
            <li key={ev.id || i} className="flex gap-3">
              <div className="relative flex flex-col items-center">
                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-50 border border-gray-100">
                  <Icon icon={meta.icon} className="w-3.5 h-3.5" style={{ color: meta.color }} />
                </div>
                {i < sorted.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1" />}
              </div>
              <div className="pb-1">
                <p className="text-xs font-medium text-gray-700">{isEn ? meta.en : meta.sv}</p>
                <p className="text-[11px] text-gray-400">{fmtDateTime(ev.date, isEn)}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/* ─── The contract document (shared view) ─── */
const toDocumentData = (c: ReceivedContractDetail): ContractDocumentData => ({
  title: c.title,
  sections: c.sections,
  documentStyle: c.documentStyle,
  companyName: c.companyName,
  orgNumber: c.orgNumber,
  companyAddress: c.companyAddress,
  contactPerson: c.contactPerson,
  employeeName: c.employeeName,
  personalNumber: c.personalNumber,
  employeeAddress: c.employeeAddress,
  signingPlace: c.signingPlace,
  signingDate: c.signingDate,
  employeeSignature: { name: c.signedByName ?? c.employeeName, signedAt: c.signedAt, dataUrl: c.signatureDataUrl, method: "verocv" },
  employerSignature: { name: c.managerSignedByName ?? "", signedAt: c.managerSignedAt, dataUrl: c.managerSignatureDataUrl },
  companyLogo: c.companyLogo,
})
