"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import SignatureCanvas from "@/components/Dashboard/Company-dashboard/manager/views/SignatureCanvas"
import type { EmployeeContract } from "@/utils/contractsStore"

const NAVY = "rgb(5,22,80)"

interface EmployeeContractSigningPageProps {
  isEn: boolean
  contract: EmployeeContract
  onSigned: (result: { signatureDataUrl: string | null; signatureTypedName: string | null }) => void
}

export default function EmployeeContractSigningPage({ isEn, contract, onSigned }: EmployeeContractSigningPageProps) {
  const [signature, setSignature] = useState<{ dataUrl: string | null; typedName: string | null }>({ dataUrl: null, typedName: null })
  const [ack, setAck] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const hasSignature = Boolean(signature.dataUrl || signature.typedName)
  const canSubmit = hasSignature && ack

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      onSigned({ signatureDataUrl: signature.dataUrl, signatureTypedName: signature.typedName })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: NAVY }}>
            <Icon icon="tabler:signature" className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">
              {isEn ? "Sign Your Employment Agreement" : "Signera Ditt Anställningsavtal"}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">{contract.employeeName || (isEn ? "Employee" : "Medarbetare")}</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-3.5 flex items-start gap-2.5">
            <Icon icon="tabler:info-circle" className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: NAVY }} />
            <p className="text-xs text-gray-600 leading-relaxed">
              {isEn
                ? "By signing below, you confirm that you have read and agree to the terms of this employment agreement."
                : "Genom att signera nedan bekräftar du att du har läst och godkänner villkoren i detta anställningsavtal."}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">{isEn ? "Your Signature" : "Din Signatur"}</p>
            <SignatureCanvas isEn={isEn} defaultName={contract.employeeName} onChange={setSignature} />
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} className="w-4 h-4 mt-0.5" />
            <span className="text-xs text-gray-600 leading-relaxed">
              {isEn
                ? "I confirm that I have read and understood all sections of this employment agreement, and I agree to be bound by its terms."
                : "Jag bekräftar att jag har läst och förstått alla avsnitt i detta anställningsavtal, och att jag samtycker till att vara bunden av dess villkor."}
            </span>
          </label>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60">
          <button onClick={handleSubmit} disabled={!canSubmit || submitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: canSubmit ? "rgb(22,163,74)" : "#9ca3af" }}>
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Icon icon="tabler:signature" className="w-4 h-4" />
            )}
            {isEn ? "Sign Agreement" : "Signera Avtal"}
          </button>
        </div>
      </div>
    </div>
  )
}
