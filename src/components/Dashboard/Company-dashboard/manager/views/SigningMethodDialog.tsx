"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/manager/views/SigningMethodDialog.tsx
// WHAT IT DOES:   "Send for signature" dialog. Contracts are always signed with VeroCV
//                 signing (drawn or typed signature) — there is no method to choose.
//                 Asks for the employee's VeroCV email only when no employee is linked.
// ══════════════════════════════════════════════════════════════════════

import { useState } from "react"
import { Icon } from "@iconify/react"
import type { SigningMethod } from "@/utils/contractsStore"

const NAVY = "rgb(5,22,80)"
const LIGHT = "rgb(239,246,255)"

type Method = Exclude<SigningMethod, null>

interface SigningMethodDialogProps {
  isEn: boolean
  employeeName: string
  /** true = an employee from the manager's list is linked; their account is used. */
  hasLinkedEmployee: boolean
  /** The linked employee's VeroCV account email (shown for confirmation), or one typed earlier. */
  recipientEmail?: string
  /** Sending in progress — disables everything. */
  busy?: boolean
  /** Error from the last send attempt (shown in the dialog). */
  error?: string | null
  onClose: () => void
  /** Always called with "verocv". */
  onChoose: (method: Method, recipientEmail?: string) => void
}

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())

export default function SigningMethodDialog({
  isEn, employeeName, hasLinkedEmployee, recipientEmail = "", busy, error, onClose, onChoose,
}: SigningMethodDialogProps) {
  const [email, setEmail] = useState(recipientEmail)
  const [emailTouched, setEmailTouched] = useState(false)

  const who = employeeName || (isEn ? "the employee" : "medarbetaren")
  const emailInvalid = !isValidEmail(email)

  const send = () => {
    if (busy) return
    if (hasLinkedEmployee) {
      onChoose("verocv")
      return
    }
    setEmailTouched(true)
    if (emailInvalid) return
    onChoose("verocv", email.trim().toLowerCase())
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!busy ? onClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-800 text-base">
              {isEn ? "Send for Signature" : "Skicka för Signering"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              {isEn ? `${who} will sign this contract in VeroCV.` : `${who} signerar detta kontrakt i VeroCV.`}
            </p>
          </div>
          <button onClick={onClose} disabled={busy}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-400 flex-shrink-0 disabled:opacity-40">
            <Icon icon="tabler:x" className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* How signing works */}
          <div className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/60">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: LIGHT }}>
              <Icon icon="tabler:signature" className="w-5 h-5" style={{ color: NAVY }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800">{isEn ? "VeroCV Signing" : "VeroCV-signering"}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                {isEn
                  ? "The employee draws or types their signature in VeroCV. After that, you sign too — then the contract is complete and a signed PDF is created."
                  : "Medarbetaren ritar eller skriver sin signatur i VeroCV. Därefter signerar du — sedan är kontraktet klart och en signerad PDF skapas."}
              </p>
            </div>
          </div>

          {/* Recipient */}
          {hasLinkedEmployee ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-green-100 bg-green-50/60 px-3.5 py-3">
              <Icon icon="tabler:user-check" className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-600" />
              <p className="text-xs text-gray-700 leading-relaxed">
                {isEn
                  ? <>Will be sent to <strong>{who}</strong>{recipientEmail ? <> ({recipientEmail})</> : null} — it appears in their VeroCV dashboard with a notification.</>
                  : <>Skickas till <strong>{who}</strong>{recipientEmail ? <> ({recipientEmail})</> : null} — det visas i deras VeroCV-dashboard med en notifikation.</>}
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {isEn ? "Employee's VeroCV email" : "Medarbetarens VeroCV-e-post"} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                autoFocus
                disabled={busy}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                onKeyDown={e => { if (e.key === "Enter") send() }}
                placeholder={isEn ? "name@example.com" : "namn@exempel.se"}
                className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 ${emailTouched && emailInvalid ? "border-red-300" : "border-gray-200"}`}
              />
              {emailTouched && emailInvalid ? (
                <p className="text-[11px] text-red-500 mt-1">{isEn ? "Enter a valid email address." : "Ange en giltig e-postadress."}</p>
              ) : (
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                  {isEn
                    ? "No employee from your list is selected. Must match an existing VeroCV employee account."
                    : "Ingen medarbetare från din lista är vald. Måste matcha ett befintligt VeroCV-medarbetarkonto."}
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl border border-red-200 bg-red-50 text-xs text-red-600">
              <Icon icon="tabler:alert-circle" className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 bg-gray-50 border-t border-gray-100">
          <button onClick={onClose} disabled={busy}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-all">
            {isEn ? "Cancel" : "Avbryt"}
          </button>
          <button onClick={send} disabled={busy}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50"
            style={{ backgroundColor: NAVY }}>
            {busy
              ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Icon icon="tabler:send" className="w-4 h-4" />}
            {busy ? (isEn ? "Sending…" : "Skickar…") : (isEn ? "Send contract" : "Skicka kontrakt")}
          </button>
        </div>
      </div>
    </div>
  )
}
