"use client"

import { Icon } from "@iconify/react"

const NAVY = "rgb(5,22,80)"

interface BankIdPendingDialogProps {
  isEn: boolean
  employeeName: string
  onClose: () => void
}

export default function BankIdPendingDialog({ isEn, employeeName, onClose }: BankIdPendingDialogProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-6 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgb(239,246,255)" }}>
            <Icon icon="tabler:shield-lock" className="w-7 h-7" style={{ color: NAVY }} />
          </div>
          <h2 className="text-base font-bold text-gray-900">BankID</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            {isEn
              ? `A BankID signing request will be sent to ${employeeName || "the employee"} once BankID integration is connected. For now, this contract has been sent for signature and marked as pending BankID.`
              : `En BankID-signeringsförfrågan skickas till ${employeeName || "medarbetaren"} när BankID-integrationen är ansluten. Kontraktet har skickats för signering och markerats som väntande på BankID.`}
          </p>
          <div className="w-full rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 text-xs text-gray-400 mt-2">
            {isEn ? "BankID integration coming soon." : "BankID-integration kommer snart."}
          </div>
          <button onClick={onClose}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ backgroundColor: NAVY }}>
            {isEn ? "Got it" : "Uppfattat"}
          </button>
        </div>
      </div>
    </div>
  )
}
