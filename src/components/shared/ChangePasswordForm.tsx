"use client"

// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/shared/ChangePasswordForm.tsx   (NEW)
// WHAT IT DOES:   "Change password" form used by
//                   • Account Settings → Security        (endpoint /api/user/password)
//                   • Manager Settings → Security        (endpoint /api/company/managers/settings/password)
//                 Current / new / confirm, show-hide, live requirement checklist,
//                 server errors shown on the right field. Accounts that sign in
//                 with Google / LinkedIn / GitHub get an explanation instead.
// ══════════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react"
import { Icon } from "@iconify/react"

const NAVY = "rgb(5,22,80)"
type Lang = "en" | "sv"
type FieldKey = "currentPassword" | "newPassword" | "confirmPassword"

const TX = {
  en: {
    title: "Change password",
    subtitle: "You'll use the new password the next time you sign in.",
    current: "Current password",
    next: "New password",
    confirm: "Confirm new password",
    show: "Show passwords",
    hide: "Hide passwords",
    rule8: "At least 8 characters",
    ruleNum: "A number",
    ruleSym: "A symbol (e.g. ! ? # %)",
    noMatch: "Passwords do not match.",
    submit: "Update password",
    saving: "Updating…",
    done: "Password updated.",
    missing: "Enter your current password.",
    weak: "The new password doesn't meet the requirements.",
    same: "The new password must be different from the current one.",
    wrong: "Current password is incorrect.",
    locked: "Too many wrong attempts. Your account is locked for 10 minutes.",
    failed: "Failed to update password. Please try again.",
    oauthTitle: (p: string) => `You sign in with ${p}`,
    oauthBody: (p: string) => `Your account has no VeroCV password — ${p} handles your sign-in. To change it, change your ${p} password.`,
  },
  sv: {
    title: "Byt lösenord",
    subtitle: "Du använder det nya lösenordet nästa gång du loggar in.",
    current: "Nuvarande lösenord",
    next: "Nytt lösenord",
    confirm: "Bekräfta nytt lösenord",
    show: "Visa lösenord",
    hide: "Dölj lösenord",
    rule8: "Minst 8 tecken",
    ruleNum: "En siffra",
    ruleSym: "Ett specialtecken (t.ex. ! ? # %)",
    noMatch: "Lösenorden matchar inte.",
    submit: "Uppdatera lösenord",
    saving: "Uppdaterar…",
    done: "Lösenordet uppdaterades.",
    missing: "Ange ditt nuvarande lösenord.",
    weak: "Det nya lösenordet uppfyller inte kraven.",
    same: "Det nya lösenordet måste skilja sig från det nuvarande.",
    wrong: "Nuvarande lösenord är fel.",
    locked: "För många felaktiga försök. Kontot är låst i 10 minuter.",
    failed: "Kunde inte uppdatera lösenordet. Försök igen.",
    oauthTitle: (p: string) => `Du loggar in med ${p}`,
    oauthBody: (p: string) => `Ditt konto har inget VeroCV-lösenord — ${p} sköter inloggningen. Byt lösenord hos ${p} i stället.`,
  },
}

export default function ChangePasswordForm({
  endpoint = "/api/user/password",
  language = "en",
  onSuccess,
}: {
  endpoint?: string
  language?: Lang | string
  /** e.g. show a toast — the form also shows its own success line. */
  onSuccess?: (message: string) => void
}) {
  const tx = TX[language === "sv" ? "sv" : "en"]
  const [values, setValues] = useState<Record<FieldKey, string>>({ currentPassword: "", newPassword: "", confirmPassword: "" })
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<{ field?: FieldKey; text: string } | null>(null)
  const [done, setDone] = useState(false)
  const [provider, setProvider] = useState<string | null>(null) // set → OAuth account, no form

  useEffect(() => {
    let cancelled = false
    fetch(endpoint, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => { if (!cancelled && s && s.canChange === false) setProvider(s.provider || s.authType || "Google") })
      .catch(() => { })
    return () => { cancelled = true }
  }, [endpoint])

  const rules = [
    { ok: values.newPassword.length >= 8, label: tx.rule8 },
    { ok: /\d/.test(values.newPassword), label: tx.ruleNum },
    { ok: /[^A-Za-z0-9]/.test(values.newPassword), label: tx.ruleSym },
  ]
  const matches = !!values.confirmPassword && values.confirmPassword === values.newPassword
  const canSubmit = !!values.currentPassword && rules.every((r) => r.ok) && matches && !saving

  const set = (k: FieldKey, v: string) => { setValues((s) => ({ ...s, [k]: v })); setError(null); setDone(false) }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setDone(false)
    if (!values.currentPassword) return setError({ field: "currentPassword", text: tx.missing })
    if (!rules.every((r) => r.ok)) return setError({ field: "newPassword", text: tx.weak })
    if (!matches) return setError({ field: "confirmPassword", text: tx.noMatch })
    if (values.newPassword === values.currentPassword) return setError({ field: "newPassword", text: tx.same })

    setSaving(true)
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: values.currentPassword, newPassword: values.newPassword }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (body?.code === "oauth") { setProvider(body?.message?.match(/with (\w+)/)?.[1] ?? "Google"); return }
        const byCode: Record<string, string> = { missing: tx.missing, weak: tx.weak, same: tx.same, wrong: tx.wrong, locked: tx.locked }
        setError({ field: body?.field, text: byCode[body?.code] ?? (language === "sv" ? tx.failed : body?.message || tx.failed) })
        return
      }
      setValues({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setShow(false)
      setDone(true)
      onSuccess?.(tx.done)
    } catch {
      setError({ text: tx.failed })
    } finally {
      setSaving(false)
    }
  }

  if (provider) {
    return (
      <div className="max-w-md">
        <h2 className="text-lg font-semibold text-gray-800">{tx.title}</h2>
        <div className="mt-4 flex items-start gap-3 p-4 rounded-xl border border-blue-100 bg-blue-50/60">
          <Icon icon="tabler:info-circle" className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: NAVY }} />
          <div>
            <p className="text-sm font-semibold text-gray-800">{tx.oauthTitle(provider)}</p>
            <p className="text-sm text-gray-600 mt-0.5">{tx.oauthBody(provider)}</p>
          </div>
        </div>
      </div>
    )
  }

  const input = (k: FieldKey, label: string, icon: string, autoComplete: string) => (
    <div>
      <label htmlFor={`pw-${k}`} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <Icon icon={icon} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          id={`pw-${k}`}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          value={values[k]}
          onChange={(e) => set(k, e.target.value)}
          aria-invalid={error?.field === k || undefined}
          className={`w-full pl-9 pr-10 py-2.5 text-sm border rounded-xl bg-white outline-none transition-all focus:ring-2 ${error?.field === k ? "border-red-300 focus:ring-red-100" : "border-gray-200 focus:ring-blue-200 focus:border-blue-300"
            }`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((v) => !v)}
          aria-label={show ? tx.hide : tx.show}
          title={show ? tx.hide : tx.show}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
        >
          <Icon icon={show ? "tabler:eye-off" : "tabler:eye"} className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  return (
    <form onSubmit={submit} className="max-w-md space-y-5" noValidate>
      <div>
        <h2 className="text-lg font-semibold text-gray-800">{tx.title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{tx.subtitle}</p>
      </div>

      {input("currentPassword", tx.current, "tabler:lock", "current-password")}

      <div>
        {input("newPassword", tx.next, "tabler:lock-plus", "new-password")}
        <ul className="mt-2 space-y-1">
          {rules.map((r) => (
            <li key={r.label} className={`flex items-center gap-2 text-xs ${r.ok ? "text-green-700" : "text-gray-400"}`}>
              <Icon icon={r.ok ? "tabler:circle-check-filled" : "tabler:circle"} className="w-3.5 h-3.5 flex-shrink-0" />
              {r.label}
            </li>
          ))}
        </ul>
      </div>

      <div>
        {input("confirmPassword", tx.confirm, matches ? "tabler:lock-check" : "tabler:lock", "new-password")}
        {values.confirmPassword && !matches && <p className="mt-1 text-xs text-red-600">{tx.noMatch}</p>}
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
          <Icon icon="tabler:alert-circle" className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error.text}
        </div>
      )}
      {done && (
        <div role="status" className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100 text-sm text-green-700">
          <Icon icon="tabler:circle-check-filled" className="w-4 h-4 flex-shrink-0" />
          {tx.done}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: NAVY }}
      >
        <Icon icon={saving ? "tabler:loader-2" : "tabler:lock-check"} className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
        {saving ? tx.saving : tx.submit}
      </button>
    </form>
  )
}
