"use client"

// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/admin/views/DeleteManagerDialog.tsx   (NEW)
// WHAT IT DOES:   "Delete manager" — GitHub-style:
//   1. warning: permanent, what is deleted / kept
//   2. why: fired · left the job · contract ended · created by mistake · other
//   3. type "delete manager <Name>" to unlock the button
//   The server checks the reason and the phrase again (DELETE /api/company/admin/managers/:id).
// ══════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from "react"
import { Icon } from "@iconify/react"
import { DELETE_REASONS, deletePhrase, managersApi, phraseMatches, type DeleteReason } from "@/utils/adminManagers"
import { initials, type ManagersTx } from "./managersText"

const RED = "rgb(220,38,38)"

export default function DeleteManagerDialog({
  manager,
  tx,
  onClose,
  onDeleted,
}: {
  manager: { id: string; name: string; email: string } | null
  tx: ManagersTx
  onClose: () => void
  onDeleted: (id: string) => void
}) {
  const [reason, setReason] = useState<DeleteReason | null>(null)
  const [note, setNote] = useState("")
  const [typed, setTyped] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setReason(null)
    setNote("")
    setTyped("")
    setError("")
    setBusy(false)
  }, [manager?.id])

  useEffect(() => {
    if (!manager) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onClose() }
    document.addEventListener("keydown", onKey)
    dialogRef.current?.focus()
    return () => document.removeEventListener("keydown", onKey)
  }, [manager, busy, onClose])

  if (!manager) return null

  const phrase = deletePhrase(manager.name)
  const matches = phraseMatches(typed, manager.name)
  const noteNeeded = reason === "other"
  const canDelete = !!reason && (!noteNeeded || !!note.trim()) && matches && !busy

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason) return setError(tx.delReasonRequired)
    if (!canDelete) return
    setBusy(true)
    setError("")
    try {
      await managersApi.remove(manager.id, { reason, note: note.trim() || undefined, confirm: typed })
      onDeleted(manager.id)
    } catch (err: any) {
      setError(err?.message || tx.delFailed)
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]" onClick={() => !busy && onClose()} />
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="del-mgr-title"
        className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl outline-none max-h-[92vh] overflow-y-auto"
      >
        <form onSubmit={submit}>
          {/* Header */}
          <div className="flex items-start gap-4 p-6 pb-4">
            <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 bg-red-50">
              <Icon icon="tabler:trash" className="w-5 h-5" style={{ color: RED }} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="del-mgr-title" className="text-lg font-bold text-gray-900">{tx.delTitle(manager.name)}</h2>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 min-w-0">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ backgroundColor: "rgb(5,22,80)" }}>{initials(manager.name)}</span>
                <span className="truncate">{manager.email}</span>
              </div>
            </div>
            <button type="button" onClick={onClose} disabled={busy} className="p-1.5 -m-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100" aria-label={tx.cancel}>
              <Icon icon="tabler:x" className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 space-y-5">
            {/* Warning */}
            <div className="rounded-xl border border-red-200 bg-red-50/70 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-red-700">
                <Icon icon="tabler:alert-triangle" className="w-4 h-4 flex-shrink-0" />
                {tx.delWarning}
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="font-semibold text-red-700 mb-1">{tx.delRemoves}</p>
                  <ul className="space-y-0.5 text-red-700/90">
                    {tx.delRemovesList.map((s) => <li key={s} className="flex gap-1.5"><Icon icon="tabler:minus" className="w-3 h-3 mt-0.5 flex-shrink-0" />{s}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-gray-700 mb-1">{tx.delKeeps}</p>
                  <ul className="space-y-0.5 text-gray-600">
                    {tx.delKeepsList.map((s) => <li key={s} className="flex gap-1.5"><Icon icon="tabler:check" className="w-3 h-3 mt-0.5 flex-shrink-0" />{s}</li>)}
                  </ul>
                </div>
              </div>
            </div>

            {/* Reason */}
            <fieldset>
              <legend className="text-sm font-semibold text-gray-800 mb-2">{tx.delReason}</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup">
                {DELETE_REASONS.map((r) => (
                  <label
                    key={r}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm cursor-pointer transition-colors ${reason === r ? "border-red-300 bg-red-50 text-red-800" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                  >
                    <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => { setReason(r); setError("") }} className="accent-red-600" />
                    {tx.reasons[r]}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Note */}
            <div>
              <label htmlFor="del-note" className="block text-sm font-medium text-gray-700 mb-1.5">
                {noteNeeded ? tx.delNote : tx.delNoteOptional}{noteNeeded && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <textarea
                id="del-note"
                rows={2}
                maxLength={1000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 resize-none"
              />
            </div>

            {/* Type to confirm */}
            <div>
              <label htmlFor="del-confirm" className="block text-sm text-gray-700 mb-1.5">
                {tx.delConfirmLabel}{" "}
                <code className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-900 font-semibold text-[13px] select-all">{phrase}</code>
              </label>
              <input
                id="del-confirm"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                onPaste={(e) => e.preventDefault()}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono outline-none focus:ring-2 ${matches ? "border-red-300 focus:ring-red-100" : "border-gray-200 focus:ring-gray-100"}`}
              />
            </div>

            {error && (
              <p role="alert" className="flex items-center gap-2 text-sm text-red-700">
                <Icon icon="tabler:alert-circle" className="w-4 h-4" />{error}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end p-6 pt-5 mt-1">
            <button type="button" onClick={onClose} disabled={busy} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
              {tx.cancel}
            </button>
            <button
              type="submit"
              disabled={!canDelete}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md transition-all"
              style={{ backgroundColor: RED }}
            >
              <Icon icon={busy ? "tabler:loader-2" : "tabler:trash"} className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} />
              {busy ? tx.deleting : tx.delButton}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
