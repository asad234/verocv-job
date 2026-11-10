"use client"

// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/admin/views/ManagerEdit.tsx   (NEW)
// WHAT IT DOES:   Business admin → edit a manager (view "manager_edit").
//   Name, title, login (work) email, private email, phones, department,
//   access level, account status. Saves with PATCH /api/company/admin/managers/:id
//   and goes back to the profile.
// ══════════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react"
import type React from "react"
import { Icon } from "@iconify/react"
import { useBusinessAdmin } from "../Businessadmincontext"
import { useBusinessAdminTranslations } from "@/utils/Businessadmintranslations"
import { managersApi, type ManagerEditInput, type ManagerStatus } from "@/utils/adminManagers"
import { NAVY, STATUS_STYLE, initials, txFor } from "./managersText"

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
const inputCls = (err?: string) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-sm text-gray-800 bg-white outline-none transition-all focus:ring-2 ${err ? "border-red-300 focus:ring-red-100" : "border-gray-200 focus:ring-blue-100 focus:border-blue-300"}`

function Field({ label, required, hint, error, children, className = "" }: { label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
      {error ? <p className="text-xs text-red-600 mt-1">{error}</p> : hint ? <p className="text-xs text-gray-400 mt-1">{hint}</p> : null}
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4">
        <Icon icon={icon} className="w-4 h-4" style={{ color: NAVY }} />{title}
      </h2>
      {children}
    </section>
  )
}

export default function ManagerEdit() {
  const { t, language } = useBusinessAdminTranslations()
  const tx = txFor(language)
  const { selectedManagerId, setView, openManagerProfile } = useBusinessAdmin()
  const accessOptions: string[] = Array.isArray((t as any)?.accessOptions) ? (t as any).accessOptions : []

  const [form, setForm] = useState<ManagerEditInput | null>(null)
  const [original, setOriginal] = useState<ManagerEditInput | null>(null)
  const [name, setName] = useState("")
  const [loadError, setLoadError] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof ManagerEditInput, string>>>({})
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState("")

  useEffect(() => {
    if (!selectedManagerId) return
    managersApi
      .get(selectedManagerId)
      .then((p) => {
        const f: ManagerEditInput = {
          firstName: p.firstName, lastName: p.lastName, email: p.email, privateEmail: p.privateEmail,
          phone: p.phone, mobilePhone: p.mobilePhone, jobTitle: p.jobTitle, department: p.department,
          accessLevel: p.accessLevel, status: p.status,
        }
        setForm(f)
        setOriginal(f)
        setName(p.name)
      })
      .catch(() => setLoadError(true))
  }, [selectedManagerId])

  const backToProfile = () => (selectedManagerId ? openManagerProfile(selectedManagerId) : setView("managers_list"))

  if (!selectedManagerId || loadError) {
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={() => setView("managers_list")} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 mb-4">
          <Icon icon="tabler:arrow-left" className="w-4 h-4" />{tx.back}
        </button>
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-sm text-gray-600">{tx.loadProfileFailed}</div>
      </div>
    )
  }
  if (!form || !original) {
    return <div className="max-w-4xl mx-auto py-16 flex justify-center"><Icon icon="tabler:loader-2" className="w-6 h-6 animate-spin text-gray-400" /></div>
  }

  const set = <K extends keyof ManagerEditInput>(k: K, v: ManagerEditInput[K]) => {
    setForm((f) => (f ? { ...f, [k]: v } : f))
    setErrors((e) => ({ ...e, [k]: undefined }))
    setSubmitError("")
  }
  const dirty = JSON.stringify(form) !== JSON.stringify(original)
  const emailChanged = form.email.trim().toLowerCase() !== original.email.toLowerCase()

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    if (!form.firstName.trim()) errs.firstName = tx.required
    if (!form.lastName.trim()) errs.lastName = tx.required
    if (!form.email.trim()) errs.email = tx.required
    else if (!isEmail(form.email)) errs.email = tx.invalidEmail
    if (form.privateEmail.trim() && !isEmail(form.privateEmail)) errs.privateEmail = tx.invalidEmail
    setErrors(errs)
    if (Object.keys(errs).length) return setSubmitError(tx.checkFields)

    // Only send what changed.
    const patch: Partial<ManagerEditInput> = {}
    for (const k of Object.keys(form) as (keyof ManagerEditInput)[]) if (form[k] !== original[k]) (patch as any)[k] = form[k]
    if (patch.firstName === undefined && patch.lastName !== undefined) patch.firstName = form.firstName
    if (patch.lastName === undefined && patch.firstName !== undefined) patch.lastName = form.lastName

    setSaving(true)
    setSubmitError("")
    try {
      await managersApi.update(selectedManagerId, patch)
      backToProfile()
    } catch (err: any) {
      const fe = err?.fieldErrors ?? {}
      const mapped: typeof errors = {}
      for (const [k, v] of Object.entries(fe)) mapped[k as keyof ManagerEditInput] = v === "taken" ? tx.taken : v === "invalid" ? tx.invalidEmail : tx.required
      setErrors(mapped)
      setSubmitError(Object.keys(mapped).length ? tx.checkFields : tx.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} noValidate className="max-w-4xl mx-auto">
      <button type="button" onClick={backToProfile} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 mb-4">
        <Icon icon="tabler:arrow-left" className="w-4 h-4" />{tx.backToProfile}
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0" style={{ backgroundColor: NAVY }}>{initials(`${form.firstName} ${form.lastName}` || name)}</div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{tx.editTitle(name)}</h1>
          <p className="text-sm text-gray-500">{tx.editSubtitle}</p>
        </div>
      </div>

      <div className="space-y-5">
        <Section title={tx.personal} icon="tabler:user">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={tx.firstName} required error={errors.firstName}>
              <input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} className={inputCls(errors.firstName)} />
            </Field>
            <Field label={tx.lastName} required error={errors.lastName}>
              <input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} className={inputCls(errors.lastName)} />
            </Field>
            <Field label={tx.jobTitle} className="sm:col-span-2">
              <input value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} className={inputCls()} />
            </Field>
          </div>
        </Section>

        <Section title={tx.contactDetails} icon="tabler:address-book">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={tx.workEmail} required error={errors.email} className="sm:col-span-2">
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls(errors.email)} />
              {emailChanged && !errors.email && (
                <p className="mt-2 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  <Icon icon="tabler:alert-triangle" className="w-4 h-4 flex-shrink-0" />{tx.loginChange}
                </p>
              )}
            </Field>
            <Field label={tx.privateEmail} error={errors.privateEmail} className="sm:col-span-2">
              <input type="email" value={form.privateEmail} onChange={(e) => set("privateEmail", e.target.value)} className={inputCls(errors.privateEmail)} />
            </Field>
            <Field label={tx.phone}>
              <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls()} />
            </Field>
            <Field label={tx.mobile}>
              <input type="tel" value={form.mobilePhone} onChange={(e) => set("mobilePhone", e.target.value)} className={inputCls()} />
            </Field>
          </div>
        </Section>

        <Section title={tx.workAccess} icon="tabler:shield-cog">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={tx.department}>
              <input value={form.department} onChange={(e) => set("department", e.target.value)} className={inputCls()} />
            </Field>
            <Field label={tx.access}>
              {accessOptions.length ? (
                <select value={form.accessLevel} onChange={(e) => set("accessLevel", e.target.value)} className={`${inputCls()} cursor-pointer`}>
                  {!accessOptions.includes(form.accessLevel) && <option value={form.accessLevel}>{form.accessLevel || "—"}</option>}
                  {accessOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input value={form.accessLevel} onChange={(e) => set("accessLevel", e.target.value)} className={inputCls()} />
              )}
            </Field>
            <Field label={tx.statusLabel} className="sm:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup">
                {(["active", "inactive", "pending"] as ManagerStatus[]).map((s) => (
                  <label key={s} className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${form.status === s ? "border-blue-300 bg-blue-50/50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name="status" checked={form.status === s} onChange={() => set("status", s)} className="mt-1" style={{ accentColor: NAVY }} />
                    <span>
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_STYLE[s].dot }} />{tx.status[s]}
                      </span>
                      <span className="block text-xs text-gray-500 mt-0.5">{tx.statusHint[s]}</span>
                    </span>
                  </label>
                ))}
              </div>
            </Field>
          </div>
        </Section>

        {submitError && (
          <div role="alert" className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
            <Icon icon="tabler:alert-circle" className="w-4 h-4" />{submitError}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pb-4">
          <button type="button" onClick={backToProfile} className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">{tx.cancel}</button>
          <button type="submit" disabled={saving || !dirty} className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md" style={{ backgroundColor: NAVY }}>
            <Icon icon={saving ? "tabler:loader-2" : "tabler:device-floppy"} className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
            {saving ? tx.saving : tx.save}
          </button>
        </div>
      </div>
    </form>
  )
}
