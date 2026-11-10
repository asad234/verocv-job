"use client"

import { Icon } from "@iconify/react"
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"

interface RevokeAccessDialogProps {
  managerName: string
  onConfirm: () => void
  onCancel: () => void
  revoking?: boolean
}

/**
 * Confirmation dialog shown before revoking a manager's access from
 * MyAccount's "Manager Access" section. Kept as its own component so
 * MyAccount.tsx doesn't have to carry the extra markup inline.
 *
 * Translation keys used here (add these to useDashboardTranslations if
 * missing — each has an English fallback so nothing breaks meanwhile):
 *   revokeDialogTitle, revokeDialogDesc, revokeNotifyNote,
 *   keepAccessBtn, yesRevokeBtn, revokingLabel
 */
export default function RevokeAccessDialog({
  managerName,
  onConfirm,
  onCancel,
  revoking = false,
}: RevokeAccessDialogProps) {
  const { t } = useDashboardTranslations() as { t: any }

  const title = t?.revokeDialogTitle
    ? `${t.revokeDialogTitle} ${managerName || "this manager"}?`
    : `Revoke ${managerName || "this manager"}'s access?`

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={revoking ? undefined : onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 max-w-sm w-full">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "rgb(254,242,242)" }}>
          <Icon icon="tabler:alert-triangle" className="w-6 h-6 text-red-500" />
        </div>

        <h3 className="text-center text-gray-900 font-semibold text-base mb-2">
          {title}
        </h3>
        <p className="text-center text-gray-500 text-sm mb-3 leading-relaxed">
          {t?.revokeDialogDesc ?? "They will no longer be able to view your CVs, portfolio, or personal information."}
        </p>
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5 mb-6">
          <Icon icon="tabler:bell" className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 text-left leading-relaxed">
            {t?.revokeNotifyNote ?? "The manager will automatically be notified that their access has been revoked."}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={revoking}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {t?.keepAccessBtn ?? "No, keep access"}
          </button>
          <button
            onClick={onConfirm}
            disabled={revoking}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            style={{ backgroundColor: "rgb(220,38,38)" }}
          >
            {revoking && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {revoking ? (t?.revokingLabel ?? "Revoking…") : (t?.yesRevokeBtn ?? "Yes, revoke")}
          </button>
        </div>
      </div>
    </div>
  )
}
