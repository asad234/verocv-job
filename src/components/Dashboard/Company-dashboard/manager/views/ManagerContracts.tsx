"use client"

import type React from "react"
import { useState, useMemo, useEffect, useCallback } from "react"
import { Icon } from "@iconify/react"
import clsx from "clsx"
import { useManagerTranslations } from "@/utils/Managertranslations"
import { useManagerDashboard } from "@/components/Dashboard/Company-dashboard/manager/ManagerDashboardContext"
import type { EmployeeContract, ContractStatus, SigningMethod } from "@/utils/contractsStore"
import {
  loadContracts, loadContract, saveContract, sendForSignature, addLifecycleEvent, deleteContract, ApiError, RECIPIENT_ERROR_CODES,
} from "@/utils/contractsApi"
import { runsToPlainText } from "@/utils/richText"
import { loadWithCovered, type CoveringFor } from "@/utils/coveredTeam"
import { CoveringBadge, CoveringNotice } from "@/components/Dashboard/Company-dashboard/manager/delegation/CoveringBadge"
import SigningMethodDialog from "./SigningMethodDialog"
import ManagerContractSign from "./contracts/ManagerContractSign"
import LogoReminderDialog from "../company/Logoreminderdialog"

/** A contract, plus `coveringFor` when it belongs to a colleague you're covering for. */
type ListedContract = EmployeeContract & { coveringFor?: CoveringFor }

/* ─── Constants ─── */
const NAVY = "rgb(5,22,80)"
const LIGHT = "rgb(239,246,255)"
const EXPIRING_SOON_DAYS = 30

const CONTRACT_TYPE_LABEL = {
  permanent: { en: "Permanent", sv: "Tillsvidare", icon: "tabler:infinity" },
  temporary: { en: "Temporary", sv: "Visstid", icon: "tabler:calendar-time" },
  on_call: { en: "On-call / Flexible", sv: "Behovsanställning", icon: "tabler:calendar-repeat" },
  consultant: { en: "Consultant", sv: "Konsult", icon: "tabler:briefcase" },
} as const

const STATUS_STYLE: Record<ContractStatus, { bg: string; text: string; border: string; dot: string; en: string; sv: string }> = {
  draft: { bg: "rgb(248,250,252)", text: "rgb(71,85,105)", border: "rgb(226,232,240)", dot: "rgb(148,163,184)", en: "Draft", sv: "Utkast" },
  pending_signature: { bg: "rgb(255,251,235)", text: "rgb(146,64,14)", border: "rgb(253,230,138)", dot: "rgb(245,158,11)", en: "Pending signature", sv: "Väntar på signering" },
  pending_manager_signature: { bg: "rgb(245,243,255)", text: "rgb(91,33,182)", border: "rgb(221,214,254)", dot: "rgb(139,92,246)", en: "Needs your signature", sv: "Behöver din signatur" },
  active: { bg: "rgb(240,253,244)", text: "rgb(22,101,52)", border: "rgb(187,247,208)", dot: "rgb(34,197,94)", en: "Active", sv: "Aktivt" },
  expiring_soon: { bg: "rgb(255,247,237)", text: "rgb(154,52,18)", border: "rgb(254,215,170)", dot: "rgb(249,115,22)", en: "Expiring soon", sv: "Löper snart ut" },
  expired: { bg: "rgb(254,242,242)", text: "rgb(153,27,27)", border: "rgb(254,202,202)", dot: "rgb(239,68,68)", en: "Expired", sv: "Utgånget" },
  terminated: { bg: "rgb(243,244,246)", text: "rgb(55,65,81)", border: "rgb(209,213,219)", dot: "rgb(107,114,128)", en: "Terminated", sv: "Avslutat" },
}

/** True when the employee has signed but the manager hasn't yet. */
const needsManagerSignature = (c: EmployeeContract) =>
  !!c.signedAt && !c.managerSignedAt &&
  c.status !== "terminated" && c.displayStatus !== "terminated" &&
  !c.history.some(h => h.type === "terminated")

/** The server's `displayStatus` is used when available. */
function computeStatus(contract: EmployeeContract): ContractStatus {
  // Decided from the signatures themselves, so contracts that were stored as
  // "active" before two-party signing existed still ask the manager to sign.
  if (needsManagerSignature(contract)) return "pending_manager_signature"
  if (contract.displayStatus) return contract.displayStatus
  if (contract.history.some(h => h.type === "terminated")) return "terminated"
  if (!contract.signedAt) return contract.history.some(h => h.type === "sent") ? "pending_signature" : "draft"
  if (!contract.managerSignedAt) return "pending_manager_signature"
  if (!contract.endDate) return "active"
  const end = new Date(contract.endDate).getTime()
  const now = Date.now()
  if (end < now) return "expired"
  const daysLeft = (end - now) / (1000 * 60 * 60 * 24)
  if (daysLeft <= EXPIRING_SOON_DAYS) return "expiring_soon"
  return "active"
}

function fmtDate(d: string, isEn: boolean) {
  return new Date(d).toLocaleDateString(isEn ? "en-GB" : "sv-SE", { day: "numeric", month: "short", year: "numeric" })
}
function daysUntil(d: string) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
}
const contractTitle = (c: EmployeeContract) =>
  runsToPlainText(c.sections.agreementTitle) || runsToPlainText(c.sections.position) || c.title || ""

const Spinner = () => (
  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
)

/* ─────────────────────────────────────────────
   RENEW / EXTEND DIALOG
───────────────────────────────────────────── */
const RenewExtendDialog: React.FC<{
  contract: EmployeeContract; isEn: boolean; mode: "renew" | "extend"; busy: boolean
  onClose: () => void
  onConfirm: (newEndDate: string, note: string) => void
}> = ({ contract, isEn, mode, busy, onClose, onConfirm }) => {
  const suggested = contract.endDate
    ? new Date(new Date(contract.endDate).getTime() + 180 * 86400000).toISOString().slice(0, 10)
    : new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10)
  const [newEndDate, setNewEndDate] = useState(suggested)
  const [note, setNote] = useState("")
  const isRenew = mode === "renew"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!busy ? onClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: LIGHT }}>
            <Icon icon={isRenew ? "tabler:refresh" : "tabler:calendar-plus"} className="w-5 h-5" style={{ color: NAVY }} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900">
              {isRenew ? (isEn ? "Renew Contract" : "Förnya Kontrakt") : (isEn ? "Extend Contract" : "Förläng Kontrakt")}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {contract.employeeName} — {contractTitle(contract)}
            </p>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl bg-gray-50 p-3.5 text-xs text-gray-500">
            {isEn ? "Current end date:" : "Nuvarande slutdatum:"}{" "}
            <span className="font-semibold text-gray-700">{contract.endDate ? fmtDate(contract.endDate, isEn) : "—"}</span>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">{isEn ? "New End Date" : "Nytt Slutdatum"}</label>
            <input type="date" value={newEndDate} onChange={e => setNewEndDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">{isEn ? "Note (optional)" : "Anteckning (valfritt)"}</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              placeholder={isEn ? "Reason for renewal / extension…" : "Anledning till förnyelse / förlängning…"}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none outline-none focus:ring-2 focus:ring-blue-100" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button onClick={onClose} disabled={busy}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-40">
            {isEn ? "Cancel" : "Avbryt"}
          </button>
          <button onClick={() => onConfirm(new Date(newEndDate).toISOString(), note)} disabled={busy || !newEndDate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50"
            style={{ backgroundColor: NAVY }}>
            {busy ? <Spinner /> : <Icon icon={isRenew ? "tabler:refresh" : "tabler:calendar-plus"} className="w-4 h-4" />}
            {isRenew ? (isEn ? "Confirm Renewal" : "Bekräfta Förnyelse") : (isEn ? "Confirm Extension" : "Bekräfta Förlängning")}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   TERMINATE DIALOG
───────────────────────────────────────────── */
const TerminateDialog: React.FC<{
  contract: EmployeeContract; isEn: boolean; busy: boolean
  onClose: () => void
  onConfirm: (note: string) => void
}> = ({ contract, isEn, busy, onClose, onConfirm }) => {
  const [note, setNote] = useState("")
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!busy ? onClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
        <div className="px-6 py-5 border-b border-red-100 bg-red-50/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <Icon icon="tabler:file-x" className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{isEn ? "Terminate Contract" : "Avsluta Kontrakt"}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{contract.employeeName}</p>
          </div>
        </div>
        <div className="px-6 py-5 space-y-3">
          <p className="text-xs text-gray-500">
            {isEn ? "This marks the contract as terminated effective today. This action can't be undone." : "Detta markerar kontraktet som avslutat från och med idag. Detta kan inte ångras."}
          </p>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
            placeholder={isEn ? "Reason for termination…" : "Anledning till avslut…"}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none outline-none focus:ring-2 focus:ring-red-100" />
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button onClick={onClose} disabled={busy}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-40">
            {isEn ? "Cancel" : "Avbryt"}
          </button>
          <button onClick={() => onConfirm(note)} disabled={busy}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50"
            style={{ backgroundColor: "rgb(220,38,38)" }}>
            {busy ? <Spinner /> : <Icon icon="tabler:file-x" className="w-4 h-4" />}
            {isEn ? "Terminate" : "Avsluta"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   DELETE DRAFT DIALOG
───────────────────────────────────────────── */
const DeleteDraftDialog: React.FC<{
  contract: EmployeeContract; isEn: boolean; busy: boolean
  onClose: () => void
  onConfirm: () => void
}> = ({ contract, isEn, busy, onClose, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!busy ? onClose : undefined} />
    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100">
      <div className="px-6 py-5 border-b border-red-100 bg-red-50/50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
          <Icon icon="tabler:trash" className="w-5 h-5 text-red-600" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 text-sm">{isEn ? "Delete draft" : "Radera utkast"}</h3>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {contractTitle(contract) || (isEn ? "Untitled contract" : "Namnlöst kontrakt")}
          </p>
        </div>
      </div>
      <p className="px-6 py-4 text-xs text-gray-500">
        {isEn ? "The draft and everything written in it will be permanently deleted." : "Utkastet och allt innehåll raderas permanent."}
      </p>
      <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
        <button onClick={onClose} disabled={busy}
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-40">
          {isEn ? "Cancel" : "Avbryt"}
        </button>
        <button onClick={onConfirm} disabled={busy}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50"
          style={{ backgroundColor: "rgb(220,38,38)" }}>
          {busy ? <Spinner /> : <Icon icon="tabler:trash" className="w-3.5 h-3.5" />}
          {isEn ? "Delete" : "Radera"}
        </button>
      </div>
    </div>
  </div>
)

/* ─────────────────────────────────────────────
   CONTRACT CARD
───────────────────────────────────────────── */
const ContractCard: React.FC<{
  contract: ListedContract; isEn: boolean
  onSend: () => void; onRenew: () => void; onExtend: () => void
  onTerminate: () => void; onOpen: () => void; onDelete: () => void; onSign: () => void
}> = ({ contract, isEn, onSend, onRenew, onExtend, onTerminate, onOpen, onDelete, onSign }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const status = computeStatus(contract)
  const ss = STATUS_STYLE[status]
  const typeCfg = CONTRACT_TYPE_LABEL[contract.contractType] ?? CONTRACT_TYPE_LABEL.permanent
  const daysLeft = contract.endDate ? daysUntil(contract.endDate) : null
  const fullySigned = !!contract.signedAt && !!contract.managerSignedAt
  const needsMySignature = status === "pending_manager_signature"

  return (
    <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      <div className="h-1.5 w-full rounded-t-2xl" style={{ backgroundColor: ss.dot }} />

      <div className="px-5 pt-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-gray-900 truncate">
              {contractTitle(contract) || (isEn ? "Untitled contract" : "Namnlöst kontrakt")}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 min-w-0">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{ backgroundColor: NAVY }}>
                {contract.employeeInitials || "?"}
              </div>
              <span className="text-xs text-gray-500 truncate">
                {contract.employeeName || (isEn ? "No employee selected" : "Ingen medarbetare vald")}
              </span>
              {contract.employeeTitle && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-gray-400 truncate">{contract.employeeTitle}</span>
                </>
              )}
            </div>
            {contract.coveringFor && (
              <div className="mt-1.5"><CoveringBadge coveringFor={contract.coveringFor} language={isEn ? "en" : "sv"} /></div>
            )}
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-full border flex-shrink-0"
            style={{ color: ss.text, backgroundColor: ss.bg, borderColor: ss.border }}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: ss.dot }} />
            {isEn ? ss.en : ss.sv}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: LIGHT, color: NAVY }}>
            <Icon icon={typeCfg.icon} className="w-3 h-3" />
            {isEn ? typeCfg.en : typeCfg.sv}
          </span>
          <span className="text-[10px] font-medium text-gray-400">
            {contract.employmentExtent === "full_time" ? (isEn ? "Full-time" : "Heltid") : (isEn ? "Part-time" : "Deltid")}
          </span>
          {fullySigned && status !== "terminated" && (
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border border-green-200 bg-green-50 text-green-700">
              <Icon icon="tabler:rosette-discount-check-filled" className="w-3 h-3" />
              {isEn ? "Fully signed" : "Fullständigt signerat"}
            </span>
          )}
          {contract.signingMethod && status !== "draft" && !fullySigned && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400">
              <Icon icon="tabler:signature" className="w-3 h-3" />
              VeroCV
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-3 flex-1">
        <div className="grid grid-cols-2 gap-2 border-t border-gray-50 pt-3 text-xs">
          <div>
            <p className="text-gray-400 text-[10px] uppercase font-semibold tracking-wide">{isEn ? "Start" : "Start"}</p>
            <p className="text-gray-700 font-medium mt-0.5">{fmtDate(contract.startDate, isEn)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-[10px] uppercase font-semibold tracking-wide">{isEn ? "End" : "Slut"}</p>
            <p className="text-gray-700 font-medium mt-0.5">{contract.endDate ? fmtDate(contract.endDate, isEn) : (isEn ? "No end date" : "Inget slutdatum")}</p>
          </div>
        </div>
        {status === "expiring_soon" && daysLeft !== null && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: STATUS_STYLE.expiring_soon.bg, color: STATUS_STYLE.expiring_soon.text }}>
            <Icon icon="tabler:alert-triangle" className="w-3.5 h-3.5 flex-shrink-0" />
            {isEn ? `Expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}` : `Löper ut om ${daysLeft} dag${daysLeft === 1 ? "" : "ar"}`}
          </div>
        )}
        {status === "expired" && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: STATUS_STYLE.expired.bg, color: STATUS_STYLE.expired.text }}>
            <Icon icon="tabler:file-off" className="w-3.5 h-3.5 flex-shrink-0" />
            {isEn ? "This contract has expired" : "Detta kontrakt har löpt ut"}
          </div>
        )}
      </div>

      <div className="px-5 pb-4 flex items-center gap-2">
        {status === "draft" && (
          <>
            <button onClick={onOpen}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all">
              <Icon icon="tabler:edit" className="w-3.5 h-3.5" />
              {isEn ? "Continue editing" : "Fortsätt redigera"}
            </button>
            <button onClick={onSend}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold text-white transition-all"
              style={{ backgroundColor: NAVY }}>
              <Icon icon="tabler:send" className="w-3.5 h-3.5" />
              {isEn ? "Send" : "Skicka"}
            </button>
          </>
        )}

        {needsMySignature && (
          <button onClick={onSign}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold text-white transition-all"
            style={{ backgroundColor: "rgb(109,40,217)" }}>
            <Icon icon="tabler:signature" className="w-3.5 h-3.5" />
            {isEn ? "Sign contract" : "Signera kontrakt"}
          </button>
        )}

        {status === "pending_signature" && (
          <button onClick={onOpen}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200">
            <Icon icon="tabler:clock" className="w-3.5 h-3.5" />
            {isEn ? "Awaiting signature" : "Väntar på signering"}
          </button>
        )}

        {(status === "expiring_soon" || status === "expired") && (
          <>
            <button onClick={onRenew}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold text-white transition-all"
              style={{ backgroundColor: NAVY }}>
              <Icon icon="tabler:refresh" className="w-3.5 h-3.5" />
              {isEn ? "Renew" : "Förnya"}
            </button>
            <button onClick={onExtend}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all">
              <Icon icon="tabler:calendar-plus" className="w-3.5 h-3.5" />
              {isEn ? "Extend" : "Förläng"}
            </button>
          </>
        )}

        {status === "active" && (
          <button onClick={onExtend}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all">
            <Icon icon="tabler:calendar-plus" className="w-3.5 h-3.5" />
            {isEn ? "Extend" : "Förläng"}
          </button>
        )}

        {status === "terminated" && (
          <button onClick={onOpen}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border border-gray-200 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-all">
            <Icon icon="tabler:history" className="w-3.5 h-3.5" />
            {isEn ? "View contract" : "Visa kontrakt"}
          </button>
        )}

        <div className="relative">
          <button onClick={() => setMenuOpen(v => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all flex-shrink-0">
            <Icon icon="tabler:dots" className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 bottom-10 z-20 bg-white rounded-xl border border-gray-100 shadow-xl w-48 py-1 overflow-hidden">
                <button onClick={() => { onOpen(); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <Icon icon="tabler:file-text" className="w-3.5 h-3.5" />
                  {isEn ? "Open contract" : "Öppna kontrakt"}
                </button>
                {needsMySignature && (
                  <button onClick={() => { onSign(); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-violet-700 hover:bg-violet-50 transition-colors">
                    <Icon icon="tabler:signature" className="w-3.5 h-3.5" />
                    {isEn ? "Sign contract" : "Signera kontrakt"}
                  </button>
                )}
                {fullySigned && (
                  <a href={`/api/company/managers/employee-contracts/${contract.id}/pdf`}
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <Icon icon="tabler:file-download" className="w-3.5 h-3.5" />
                    {isEn ? "Download signed PDF" : "Ladda ned signerad PDF"}
                  </a>
                )}
                {(status === "active" || status === "expiring_soon" || status === "expired" || status === "pending_signature" || status === "pending_manager_signature") && (
                  <>
                    <div className="my-1 border-t border-gray-100" />
                    <button onClick={() => { onTerminate(); setMenuOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
                      <Icon icon="tabler:file-x" className="w-3.5 h-3.5" />
                      {isEn ? "Terminate" : "Avsluta"}
                    </button>
                  </>
                )}
                {status === "draft" && (
                  <>
                    <div className="my-1 border-t border-gray-100" />
                    <button onClick={() => { onDelete(); setMenuOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
                      <Icon icon="tabler:trash" className="w-3.5 h-3.5" />
                      {isEn ? "Delete draft" : "Radera utkast"}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function ManagerContracts() {
  const { language } = useManagerTranslations()
  const { selectedContractId, setView, setSelectedContractId } = useManagerDashboard()
  const isEn = language === "en"

  const [contracts, setContracts] = useState<ListedContract[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<ContractStatus | "all">("all")
  const [filterEmp, setFilterEmp] = useState("")

  const [renewing, setRenewing] = useState<{ contract: EmployeeContract; mode: "renew" | "extend" } | null>(null)
  const [terminating, setTerminating] = useState<EmployeeContract | null>(null)
  const [deleting, setDeleting] = useState<EmployeeContract | null>(null)
  const [sending, setSending] = useState<EmployeeContract | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  /** Contract (full, with editor content) waiting on the "Add your company logo?" reminder. */
  const [logoReminder, setLogoReminder] = useState<{ row: EmployeeContract; full: EmployeeContract } | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  // Contract open in ManagerContractSign
  const [signingId, setSigningId] = useState<string | null>(null)

  /* ── Load from the database ── */
  const refresh = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      // Yours + those of any colleague you're covering for (marked with a badge).
      setContracts(await loadWithCovered(loadContracts, "contract"))
    } catch (e) {
      setLoadError((e as Error).message || (isEn ? "Couldn't load contracts." : "Kunde inte ladda kontrakt."))
    } finally {
      setLoading(false)
    }
  }, [isEn])

  useEffect(() => { refresh() }, [refresh])

  // The manager notification bell opens a contract for signing by setting
  // selectedContractId and switching to this view.
  useEffect(() => {
    if (!selectedContractId) return
    setSigningId(selectedContractId)
    setSelectedContractId(null)
  }, [selectedContractId, setSelectedContractId])

  // Keeps the "colleague's team" marker when a contract comes back from the server.
  const replace = (updated: EmployeeContract) =>
    setContracts(prev => prev.map(c => (c.id === updated.id ? { ...updated, coveringFor: c.coveringFor } : c)))

  // Only contracts linked to an employee account appear in the employee filter.
  const employees = useMemo(() => [
    ...new Map(
      contracts
        .filter(c => c.employeeId)
        .map(c => [c.employeeId, { id: c.employeeId, name: c.employeeName || (isEn ? "Unnamed" : "Namnlös") }]),
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name, "sv")), [contracts, isEn])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return contracts
      .filter(c =>
        (!q || contractTitle(c).toLowerCase().includes(q) || c.employeeName.toLowerCase().includes(q)) &&
        (!filterEmp || c.employeeId === filterEmp) &&
        (filterStatus === "all" || computeStatus(c) === filterStatus),
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [contracts, search, filterEmp, filterStatus])

  const counts = useMemo(() => {
    const c: Record<ContractStatus | "all", number> = { all: contracts.length, draft: 0, pending_signature: 0, pending_manager_signature: 0, active: 0, expiring_soon: 0, expired: 0, terminated: 0 }
    contracts.forEach(ct => { c[computeStatus(ct)]++ })
    return c
  }, [contracts])

  const openInEditor = (id: string | null) => {
    setSelectedContractId(id)
    setView("contract_editor")
  }

  const errorMessage = (e: unknown, fallbackEn: string, fallbackSv: string) =>
    (e as Error)?.message || (isEn ? fallbackEn : fallbackSv)

  /* ── Send: logo reminder (optional) → SigningMethodDialog ── */
  const startSend = async (row: EmployeeContract) => {
    setSendError(null)
    setActionError(null)
    setBusy(true)
    try {
      // List rows don't carry the editor content, so load the contract to see if it has a logo.
      const full = await loadContract(row.id)
      if (!full.companyLogo) {
        setLogoError(null)
        setLogoReminder({ row, full })
        return
      }
    } catch {
      // Couldn't check — don't block sending, just skip the reminder.
    } finally {
      setBusy(false)
    }
    setSending(row)
  }

  /** Reminder → "Upload logo": save the logo on the contract, then continue to send. */
  const handleReminderUpload = async (logo: string) => {
    if (!logoReminder) return
    setBusy(true)
    setLogoError(null)
    try {
      const saved = await saveContract({ ...logoReminder.full, companyLogo: logo })
      replace(saved)
      setLogoReminder(null)
      setSending(saved)
    } catch (e) {
      setLogoError(errorMessage(e, "Couldn't save the logo.", "Kunde inte spara loggan."))
      throw e
    } finally {
      setBusy(false)
    }
  }

  /** Reminder → "Send without logo". */
  const handleReminderSkip = () => {
    if (!logoReminder) return
    setSending(logoReminder.row)
    setLogoReminder(null)
  }

  /* ── Send (via SigningMethodDialog) ── */
  const handleChooseMethod = async (method: Exclude<SigningMethod, null>, recipientEmail?: string) => {
    if (!sending) return
    const target = sending
    setBusy(true)
    setSendError(null)
    setActionError(null)
    try {
      const result = await sendForSignature(target.id, method, recipientEmail)
      replace(result.contract)
      setSending(null)
    } catch (e) {
      if (e instanceof ApiError && RECIPIENT_ERROR_CODES.includes(e.data?.code)) {
        // Keep the dialog open so an email can be entered / corrected.
        setSendError(e.message)
      } else if (e instanceof ApiError && e.status === 422) {
        // Required information is missing — open the editor so it can be completed.
        setSending(null)
        openInEditor(target.id)
      } else {
        setSendError(errorMessage(e, "Couldn't send the contract.", "Kunde inte skicka kontraktet."))
      }
    } finally {
      setBusy(false)
    }
  }

  /* ── Renew / extend ── */
  const handleRenewExtend = async (contract: EmployeeContract, mode: "renew" | "extend", newEndDate: string, note: string) => {
    setBusy(true)
    setActionError(null)
    try {
      replace(await addLifecycleEvent(contract, mode === "renew" ? "renewed" : "extended", { endDate: newEndDate, note }))
      setRenewing(null)
    } catch (e) {
      setActionError(errorMessage(e, "Couldn't update the contract.", "Kunde inte uppdatera kontraktet."))
    } finally {
      setBusy(false)
    }
  }

  /* ── Terminate ── */
  const handleTerminate = async (contract: EmployeeContract, note: string) => {
    setBusy(true)
    setActionError(null)
    try {
      replace(await addLifecycleEvent(contract, "terminated", { note }))
      setTerminating(null)
    } catch (e) {
      setActionError(errorMessage(e, "Couldn't terminate the contract.", "Kunde inte avsluta kontraktet."))
    } finally {
      setBusy(false)
    }
  }

  /* ── Delete draft ── */
  const handleDelete = async (contract: EmployeeContract) => {
    setBusy(true)
    setActionError(null)
    try {
      await deleteContract(contract.id)
      setContracts(prev => prev.filter(c => c.id !== contract.id))
      setDeleting(null)
    } catch (e) {
      setActionError(errorMessage(e, "Couldn't delete the draft.", "Kunde inte radera utkastet."))
    } finally {
      setBusy(false)
    }
  }

  const STATUS_TABS: (ContractStatus | "all")[] = ["all", "draft", "pending_signature", "pending_manager_signature", "active", "expiring_soon", "expired", "terminated"]

  return (
    <div className="p-4 sm:p-6 m-2 sm:m-4">

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: NAVY }}>
              <Icon icon="tabler:file-text" className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                {isEn ? "Employee Contracts" : "Medarbetarkontrakt"}
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {isEn
                  ? `${contracts.length} contracts across ${employees.length} employees`
                  : `${contracts.length} kontrakt för ${employees.length} medarbetare`}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:flex-shrink-0">
            <button onClick={() => setView("contract_templates")}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all w-full sm:w-auto">
              <Icon icon="tabler:folder-symlink" className="w-4 h-4" />
              {isEn ? "Reference Files" : "Referensfiler"}
            </button>
            <button onClick={() => openInEditor(null)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-md w-full sm:w-auto"
              style={{ backgroundColor: NAVY }}>
              <Icon icon="tabler:plus" className="w-4 h-4" />
              {isEn ? "Create Contract" : "Skapa Kontrakt"}
            </button>
          </div>
        </div>

        {counts.pending_manager_signature > 0 && (
          <button onClick={() => setFilterStatus("pending_manager_signature")}
            className="mt-4 w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all hover:shadow-sm"
            style={{ backgroundColor: STATUS_STYLE.pending_manager_signature.bg, borderColor: STATUS_STYLE.pending_manager_signature.border }}>
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
              <Icon icon="tabler:signature" className="w-5 h-5" style={{ color: STATUS_STYLE.pending_manager_signature.text }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: STATUS_STYLE.pending_manager_signature.text }}>
                {isEn
                  ? `${counts.pending_manager_signature} contract${counts.pending_manager_signature === 1 ? "" : "s"} signed by the employee — your signature is needed`
                  : `${counts.pending_manager_signature} kontrakt signerat av medarbetaren — din signatur behövs`}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                {isEn ? "Sign to complete and seal the contract." : "Signera för att slutföra och försegla kontraktet."}
              </p>
            </div>
            <Icon icon="tabler:chevron-right" className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>
        )}

        {(counts.expiring_soon > 0 || counts.expired > 0) && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            {counts.expiring_soon > 0 && (
              <button onClick={() => setFilterStatus("expiring_soon")}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all hover:shadow-sm"
                style={{ backgroundColor: STATUS_STYLE.expiring_soon.bg, borderColor: STATUS_STYLE.expiring_soon.border, color: STATUS_STYLE.expiring_soon.text }}>
                <Icon icon="tabler:alert-triangle" className="w-3.5 h-3.5" />
                {counts.expiring_soon} {isEn ? "expiring soon" : "löper snart ut"}
              </button>
            )}
            {counts.expired > 0 && (
              <button onClick={() => setFilterStatus("expired")}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all hover:shadow-sm"
                style={{ backgroundColor: STATUS_STYLE.expired.bg, borderColor: STATUS_STYLE.expired.border, color: STATUS_STYLE.expired.text }}>
                <Icon icon="tabler:file-off" className="w-3.5 h-3.5" />
                {counts.expired} {isEn ? "expired" : "utgångna"}
              </button>
            )}
          </div>
        )}
      </div>

      <CoveringNotice language={isEn ? "en" : "sv"} />

      {actionError && (
        <div className="mb-4 flex items-start gap-2 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-600">
          <Icon icon="tabler:alert-circle" className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="flex-1">{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-600">
            <Icon icon="tabler:x" className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl overflow-x-auto mb-4 w-fit max-w-full">
        {STATUS_TABS.map(s => {
          const active = filterStatus === s
          const label = s === "all" ? (isEn ? "All" : "Alla") : (isEn ? STATUS_STYLE[s].en : STATUS_STYLE[s].sv)
          return (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                active ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700")}>
              {label}
              <span className={clsx("text-xs px-1.5 rounded-full", active ? "bg-gray-100 text-gray-600" : "text-gray-400")}>{counts[s]}</span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Icon icon="tabler:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={isEn ? "Search contracts or employees…" : "Sök kontrakt eller medarbetare…"}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-200 transition-all" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <Icon icon="tabler:x" className="w-4 h-4" />
            </button>
          )}
        </div>
        <select value={filterEmp} onChange={e => setFilterEmp(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white text-gray-600 outline-none cursor-pointer">
          <option value="">{isEn ? "All employees" : "Alla medarbetare"}</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-100 bg-white text-xs text-gray-500 whitespace-nowrap">
          <Icon icon="tabler:file-text" className="w-3.5 h-3.5 text-gray-400" />
          {isEn ? `${filtered.length} of ${contracts.length}` : `${filtered.length} av ${contracts.length}`}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-20 flex items-center justify-center gap-2 text-sm text-gray-400">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
          {isEn ? "Loading contracts…" : "Laddar kontrakt…"}
        </div>
      ) : loadError ? (
        <div className="bg-white rounded-2xl border border-red-100 py-16 text-center">
          <Icon icon="tabler:cloud-off" className="w-10 h-10 text-red-300 mx-auto mb-3" />
          <p className="text-sm text-red-600 font-medium">{loadError}</p>
          <button onClick={refresh}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <Icon icon="tabler:refresh" className="w-4 h-4" />
            {isEn ? "Try again" : "Försök igen"}
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
          <Icon icon="tabler:file-off" className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {contracts.length === 0
              ? (isEn ? "No contracts yet. Create your first one." : "Inga kontrakt ännu. Skapa ditt första.")
              : (isEn ? "No contracts match your filters." : "Inga kontrakt matchar dina filter.")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filtered.map(c => (
            <ContractCard
              key={c.id} contract={c} isEn={isEn}
              onSend={() => startSend(c)}
              onRenew={() => setRenewing({ contract: c, mode: "renew" })}
              onExtend={() => setRenewing({ contract: c, mode: "extend" })}
              onTerminate={() => setTerminating(c)}
              onDelete={() => setDeleting(c)}
              onOpen={() => openInEditor(c.id)}
              onSign={() => setSigningId(c.id)}
            />
          ))}
        </div>
      )}

      {renewing && (
        <RenewExtendDialog
          contract={renewing.contract} isEn={isEn} mode={renewing.mode} busy={busy}
          onClose={() => setRenewing(null)}
          onConfirm={(newEndDate, note) => handleRenewExtend(renewing.contract, renewing.mode, newEndDate, note)}
        />
      )}
      {terminating && (
        <TerminateDialog
          contract={terminating} isEn={isEn} busy={busy}
          onClose={() => setTerminating(null)}
          onConfirm={(note) => handleTerminate(terminating, note)}
        />
      )}
      {deleting && (
        <DeleteDraftDialog
          contract={deleting} isEn={isEn} busy={busy}
          onClose={() => setDeleting(null)}
          onConfirm={() => handleDelete(deleting)}
        />
      )}
      {logoReminder && (
        <LogoReminderDialog
          isEn={isEn}
          busy={busy}
          error={logoError}
          onClose={() => { if (!busy) setLogoReminder(null) }}
          onUpload={handleReminderUpload}
          onSkip={handleReminderSkip}
        />
      )}
      {sending && (
        <SigningMethodDialog
          isEn={isEn}
          employeeName={sending.employeeName}
          hasLinkedEmployee={!!sending.employeeId}
          recipientEmail={sending.recipientEmail}
          busy={busy}
          error={sendError}
          onClose={() => { if (!busy) setSending(null) }}
          onChoose={handleChooseMethod}
        />
      )}
      {signingId && (
        <ManagerContractSign
          contractId={signingId}
          isEn={isEn}
          onClose={() => setSigningId(null)}
          onSigned={updated => replace(updated)}
        />
      )}
    </div>
  )
}
