"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/manager/views/ManagerContractSign.tsx
// WHAT IT DOES:   Manager signing page — opened from ManagerContracts (card button,
//                 ⋯ menu "Sign contract", or the manager notification bell).
//                 Shows the full contract + the employee's signature, and lets the
//                 manager sign with VeroCV signing. Completes the contract.
// ══════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react"
import { Icon } from "@iconify/react"
import type { EmployeeContract } from "@/utils/contractsStore"
import { loadContract, signContractAsManager, managerSignedPdfUrl } from "@/utils/contractsApi"
import { loadWebFontsForPreview } from "@/utils/pdfFonts"
import ContractDocumentView, { ContractDocumentData } from "@/components/Dashboard/Contracts/ContractDocumentView"
import SignatureCanvas, { SignatureResult } from "../SignatureCanvas"
const NAVY = "rgb(5,22,80)"
const GREEN = "rgb(22,163,74)"

interface ManagerContractSignProps {
  contractId: string
  isEn: boolean
  onClose: () => void
  /** Called with the updated contract after a successful signature. */
  onSigned: (contract: EmployeeContract) => void
}

function fmtDateTime(d: string, isEn: boolean) {
  return new Date(d).toLocaleString(isEn ? "en-GB" : "sv-SE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

const toDocumentData = (c: EmployeeContract): ContractDocumentData => ({
  title: c.title ?? "",
  sections: c.sections,
  documentStyle: c.documentStyle,
  companyName: c.companyName ?? "",
  orgNumber: c.orgNumber,
  companyAddress: c.companyAddress,
  contactPerson: c.contactPerson,
  employeeName: c.employeeName,
  personalNumber: c.personalNumber,
  employeeAddress: c.employeeAddress,
  signingPlace: c.signingPlace,
  signingDate: c.signingDate,
  employeeSignature: {
    name: c.signedByName ?? c.employeeName,
    signedAt: c.signedAt,
    dataUrl: c.signatureDataUrl ?? null,
    method: c.bankIdSignedAt ? "bankid" : "verocv",
  },
  employerSignature: { name: c.managerSignedByName ?? "", signedAt: c.managerSignedAt ?? null, dataUrl: c.managerSignatureDataUrl ?? null },
  companyLogo: c.companyLogo ?? null,
})

export default function ManagerContractSign({ contractId, isEn, onClose, onSigned }: ManagerContractSignProps) {
  const [contract, setContract] = useState<EmployeeContract | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [fullName, setFullName] = useState("")
  const [signature, setSignature] = useState<SignatureResult>({ dataUrl: null, typedName: null })
  const [consent, setConsent] = useState(false)
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { loadWebFontsForPreview() }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const c = await loadContract(contractId)
      setContract(c)
      setFullName(prev => prev || c.contactPerson || "")
    } catch (e) {
      setLoadError((e as Error).message || (isEn ? "Couldn't load the contract." : "Kunde inte ladda kontraktet."))
    } finally {
      setLoading(false)
    }
  }, [contractId, isEn])

  useEffect(() => { load() }, [load])

  // Close with Escape (not while signing)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !signing) onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose, signing])

  const handleSign = async () => {
    if (!contract) return
    setError(null)
    if (fullName.trim().length < 2) {
      setError(isEn ? "Enter your full name." : "Ange ditt fullständiga namn.")
      return
    }
    if (!signature.dataUrl) {
      setError(isEn ? "Draw or type your signature." : "Rita eller skriv din signatur.")
      return
    }
    if (!consent) {
      setError(isEn ? "Confirm that you sign on behalf of the employer." : "Bekräfta att du signerar för arbetsgivarens räkning.")
      return
    }
    setSigning(true)
    try {
      const updated = await signContractAsManager(contract.id, {
        fullName: fullName.trim(),
        signatureDataUrl: signature.dataUrl,
        typedName: signature.typedName,
        consent: true,
      })
      // Keep the loaded sections/style — the sign response only carries the summary.
      const merged: EmployeeContract = { ...contract, ...updated, sections: contract.sections, documentStyle: contract.documentStyle }
      setContract(merged)
      onSigned(merged)
      // Tell the notification bell the "sign this contract" notice is done.
      window.dispatchEvent(new Event("verocv:contracts-changed"))
    } catch (e) {
      setError((e as Error).message || (isEn ? "Signing failed. Please try again." : "Signeringen misslyckades. Försök igen."))
    } finally {
      setSigning(false)
    }
  }

  const fullySigned = !!contract?.signedAt && !!contract?.managerSignedAt
  const waitingForEmployee = !!contract && !contract.signedAt
  const title = contract?.title || (isEn ? "Employment contract" : "Anställningsavtal")

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onClose} disabled={signing}
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 flex-shrink-0 disabled:opacity-40">
              <Icon icon="tabler:arrow-left" className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-gray-800 truncate">
                {isEn ? "Sign contract" : "Signera kontrakt"} — {title}
              </h1>
              <p className="text-xs text-gray-400 truncate">{contract?.employeeName ?? ""}</p>
            </div>
          </div>
          {fullySigned && contract && (
            <a href={managerSignedPdfUrl(contract.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white flex-shrink-0"
              style={{ backgroundColor: NAVY }}>
              <Icon icon="tabler:file-download" className="w-3.5 h-3.5" />
              {isEn ? "Signed PDF" : "Signerad PDF"}
            </a>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {loading ? (
          <div className="py-24 flex items-center justify-center gap-2 text-sm text-gray-400">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
            {isEn ? "Loading contract…" : "Laddar kontrakt…"}
          </div>
        ) : loadError || !contract ? (
          <div className="py-16 text-center">
            <Icon icon="tabler:file-alert" className="w-10 h-10 text-red-300 mx-auto mb-3" />
            <p className="text-sm text-red-600 font-medium">{loadError ?? (isEn ? "Contract not found." : "Kontraktet hittades inte.")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Sign panel — first on mobile */}
            <div className="space-y-4 lg:col-span-1 lg:order-2 lg:sticky lg:top-20">

              {/* Employee signature status */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                  {isEn ? "Employee signature" : "Medarbetarens signatur"}
                </p>
                {contract.signedAt ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon icon="tabler:circle-check-filled" className="w-4 h-4 text-green-500" />
                      <p className="text-sm font-medium text-gray-800">{contract.signedByName || contract.employeeName}</p>
                    </div>
                    {contract.signatureDataUrl ? (
                      <div className="rounded-xl border border-gray-100 bg-gray-50 p-2 mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={contract.signatureDataUrl} alt="" className="max-h-14 mx-auto" />
                      </div>
                    ) : contract.bankIdSignedAt ? (
                      <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 mb-2 flex items-center gap-2 text-xs font-semibold text-blue-900">
                        <Icon icon="tabler:shield-check" className="w-4 h-4" />
                        {isEn ? "Signed with BankID" : "Signerat med BankID"}
                      </div>
                    ) : null}
                    <p className="text-xs text-gray-500">{fmtDateTime(contract.signedAt, isEn)}</p>
                  </>
                ) : (
                  <p className="text-xs text-amber-600 flex items-center gap-1.5">
                    <Icon icon="tabler:clock" className="w-3.5 h-3.5" />
                    {isEn ? "The employee hasn't signed yet." : "Medarbetaren har inte signerat ännu."}
                  </p>
                )}
              </div>

              {/* Manager action */}
              {fullySigned ? (
                <div className="bg-white rounded-2xl border-2 p-5" style={{ borderColor: "rgb(187,247,208)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="tabler:rosette-discount-check-filled" className="w-6 h-6" style={{ color: GREEN }} />
                    <p className="text-sm font-bold text-gray-800">{isEn ? "Contract fully signed" : "Kontraktet är fullständigt signerat"}</p>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {isEn
                      ? `Both parties have signed. ${contract.employeeName || "The employee"} has been notified, and the signed PDF has been saved.`
                      : `Båda parter har signerat. ${contract.employeeName || "Medarbetaren"} har meddelats, och den signerade PDF:en har sparats.`}
                  </p>
                  {contract.managerSignedAt && (
                    <p className="text-xs text-gray-400 mt-2">
                      {contract.managerSignedByName} · {fmtDateTime(contract.managerSignedAt, isEn)}
                    </p>
                  )}
                  <a href={managerSignedPdfUrl(contract.id)}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ backgroundColor: NAVY }}>
                    <Icon icon="tabler:file-download" className="w-4 h-4" />
                    {isEn ? "Download signed PDF" : "Ladda ned signerad PDF"}
                  </a>
                  <button onClick={onClose}
                    className="mt-2 w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                    {isEn ? "Back to contracts" : "Tillbaka till kontrakt"}
                  </button>
                </div>
              ) : waitingForEmployee || contract.status === "terminated" ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-5 text-xs text-gray-500">
                  {contract.status === "terminated"
                    ? (isEn ? "This contract has been terminated and can't be signed." : "Detta kontrakt har avslutats och kan inte signeras.")
                    : (isEn ? "You can sign once the employee has signed." : "Du kan signera när medarbetaren har signerat.")}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border-2 p-5 space-y-4" style={{ borderColor: "rgb(221,214,254)" }}>
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon icon="tabler:signature" className="w-5 h-5" style={{ color: "rgb(109,40,217)" }} />
                      <p className="text-sm font-semibold text-gray-800">{isEn ? "Your signature" : "Din signatur"}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {isEn
                        ? "The employee has signed. Sign as the employer to complete the contract."
                        : "Medarbetaren har signerat. Signera som arbetsgivare för att slutföra kontraktet."}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{isEn ? "Your full name" : "Ditt fullständiga namn"}</label>
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} disabled={signing} maxLength={120}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50" />
                  </div>

                  <SignatureCanvas isEn={isEn} defaultName={fullName} disabled={signing} onChange={setSignature} />

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} disabled={signing}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 flex-shrink-0" />
                    <span className="text-xs text-gray-600 leading-relaxed">
                      {isEn
                        ? `I sign this contract on behalf of ${contract.companyName || "the employer"} and confirm that I am authorised to do so. My electronic signature is legally binding.`
                        : `Jag signerar detta kontrakt för ${contract.companyName || "arbetsgivarens"} räkning och bekräftar att jag är behörig att göra det. Min elektroniska signatur är juridiskt bindande.`}
                    </span>
                  </label>

                  {error && (
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl border border-red-200 bg-red-50 text-xs text-red-600">
                      <Icon icon="tabler:alert-circle" className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <button onClick={handleSign} disabled={signing}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
                    style={{ backgroundColor: NAVY }}>
                    {signing
                      ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      : <Icon icon="tabler:signature" className="w-4 h-4" />}
                    {signing ? (isEn ? "Signing…" : "Signerar…") : (isEn ? "Sign & complete contract" : "Signera & slutför kontraktet")}
                  </button>
                </div>
              )}
            </div>

            {/* The contract */}
            <div className="lg:col-span-2 lg:order-1">
              <ContractDocumentView data={toDocumentData(contract)} isEn={isEn} id="manager-contract-document" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
