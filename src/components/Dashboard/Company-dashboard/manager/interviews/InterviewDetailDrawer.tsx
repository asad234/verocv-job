"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/manager/interviews/InterviewDetailDrawer.tsx
// WHAT IT DOES:   Side drawer for one interview: details, "Join Google Meet",
//                 interview notes and the evaluation form (both saved to the database),
//                 mark completed / no-show, reschedule, cancel.
// ══════════════════════════════════════════════════════════════════════

import type React from "react"
import { useEffect, useState } from "react"
import { Icon } from "@iconify/react"
import clsx from "clsx"
import {
  ApiError, saveInterviewEvaluation, saveInterviewNotes, setInterviewStatus, syncInterviewCalendar,
  type Evaluation, type Interview, type Recommendation,
} from "@/utils/interviewsApi"
import {
  FORMAT_CFG, MEET_GREEN, NAVY, RECOMMENDATION_CFG, STATUS_STYLE, endOf, fmtDate, fmtTime, initials,
} from "./interviewShared"

/* ─── Star rating input ─── */
const StarRating: React.FC<{ value: number; onChange: (v: number) => void; label: string; disabled?: boolean }> = ({ value, onChange, label, disabled }) => (
  <div>
    <p className="text-xs font-medium text-gray-600 mb-1.5">{label}</p>
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" disabled={disabled} onClick={() => onChange(n === value ? 0 : n)}
          aria-label={`${label}: ${n}`} className="w-7 h-7 flex items-center justify-center disabled:cursor-default">
          <Icon icon={n <= value ? "tabler:star-filled" : "tabler:star"} className={clsx("w-5 h-5 transition-colors", n <= value ? "text-amber-400" : "text-gray-200")} />
        </button>
      ))}
    </div>
  </div>
)

interface Props {
  interview: Interview
  isEn: boolean
  googleConnected: boolean
  onClose: () => void
  /** The interview changed (notes, evaluation, status, Meet link) — update the list. */
  onUpdated: (interview: Interview) => void
  onReschedule: (interview: Interview) => void
  onCancel: (interview: Interview) => void
  /** Cancelled / missed → book a new interview with the same candidate. */
  onBookAgain?: (interview: Interview) => void
}

export default function InterviewDetailDrawer({ interview, isEn, googleConnected, onClose, onUpdated, onReschedule, onCancel, onBookAgain }: Props) {
  const [tab, setTab] = useState<"notes" | "evaluation">(interview.status === "completed" ? "evaluation" : "notes")
  const [notes, setNotes] = useState(interview.notes)
  const [evaluation, setEvaluation] = useState<Evaluation>(interview.evaluation)
  const [saving, setSaving] = useState<"notes" | "evaluation" | "status" | "meet" | null>(null)
  const [savedFlash, setSavedFlash] = useState<"notes" | "evaluation" | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Another interview opened in the same drawer → reset the local form.
  useEffect(() => {
    setNotes(interview.notes)
    setEvaluation(interview.evaluation)
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interview.id])

  // Esc closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const ss = STATUS_STYLE[interview.status]
  const fmt = FORMAT_CFG[interview.format]
  const scheduled = interview.status === "scheduled"
  const notesDirty = notes !== interview.notes
  const evaluationDirty = JSON.stringify({ ...evaluation, evaluatedAt: null }) !== JSON.stringify({ ...interview.evaluation, evaluatedAt: null })
  const startsInMs = new Date(interview.startAt).getTime() - Date.now()
  const isSoonOrLive = startsInMs < 15 * 60_000 && endOf(interview.startAt, interview.durationMinutes).getTime() > Date.now()

  const run = async (kind: NonNullable<typeof saving>, fn: () => Promise<Interview>, flash?: "notes" | "evaluation") => {
    setSaving(kind)
    setError(null)
    try {
      onUpdated(await fn())
      if (flash) {
        setSavedFlash(flash)
        setTimeout(() => setSavedFlash(null), 1800)
      }
    } catch (e) {
      setError((e as Error).message || (isEn ? "Couldn't save." : "Kunde inte spara."))
      if (e instanceof ApiError && e.data?.interview) onUpdated(e.data.interview)
    } finally {
      setSaving(null)
    }
  }

  const saveNotes = () => run("notes", () => saveInterviewNotes(interview.id, notes), "notes")
  const saveEvaluation = () => run("evaluation", () => saveInterviewEvaluation(interview.id, evaluation), "evaluation")
  const markStatus = (status: "completed" | "no_show") =>
    run("status", async () => {
      // Unsaved notes are saved first so nothing typed is lost.
      if (notesDirty) await saveInterviewNotes(interview.id, notes)
      return (await setInterviewStatus(interview.id, status)).interview
    })
  const createMeet = () => run("meet", () => syncInterviewCalendar(interview.id))

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col">

        {/* Header */}
        <div className="px-6 pt-8 pb-5 flex-shrink-0" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, rgb(15,32,90) 100%)` }}>
          <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-all">
            <Icon icon="tabler:x" className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0 bg-white/10 border-2 border-white/20">
              {initials(interview.candidateName)}
            </div>
            <div className="min-w-0">
              <div className="text-lg font-bold text-white truncate">{interview.candidateName}</div>
              <div className="text-sm text-white/70 mt-0.5 truncate">{interview.position}</div>
              <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white border border-white/20">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ss.dot }} />
                {isEn ? ss.en : ss.sv}
              </span>
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="px-6 py-4 border-b border-gray-100 grid grid-cols-2 gap-3 text-xs flex-shrink-0">
          <div className="flex items-center gap-2 text-gray-600">
            <Icon icon="tabler:calendar" className="w-4 h-4 text-gray-400" />
            {fmtDate(interview.startAt, isEn)} · {fmtTime(interview.startAt)}–{fmtTime(endOf(interview.startAt, interview.durationMinutes))}
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Icon icon="tabler:clock" className="w-4 h-4 text-gray-400" />
            {interview.durationMinutes} min
          </div>
          <div className="flex items-center gap-2 text-gray-600 min-w-0">
            <Icon icon={fmt.icon} className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">
              {isEn ? fmt.en : fmt.sv}
              {interview.format === "phone" && interview.candidatePhone && ` · ${interview.candidatePhone}`}
              {interview.format === "in_person" && interview.location && ` · ${interview.location}`}
            </span>
          </div>
          <a href={`mailto:${interview.candidateEmail}`} className="flex items-center gap-2 text-gray-600 hover:text-blue-800 min-w-0">
            <Icon icon="tabler:mail" className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{interview.candidateEmail}</span>
          </a>
          {interview.google.synced && (
            <div className="col-span-2 flex items-center gap-2 text-gray-500">
              <Icon icon="logos:google-calendar" className="w-3.5 h-3.5" />
              <span>
                {isEn ? "In Google Calendar" : "I Google Kalender"}
                {interview.google.sendInvite && (isEn ? " · invitation sent to the candidate" : " · inbjudan skickad till kandidaten")}
              </span>
              {interview.google.htmlLink && (
                <a href={interview.google.htmlLink} target="_blank" rel="noopener noreferrer" className="ml-auto font-medium text-blue-800 hover:underline">
                  {isEn ? "Open event" : "Öppna händelse"}
                </a>
              )}
            </div>
          )}
          {scheduled && interview.rescheduledAt && interview.previousStartAt && (
            <div className="col-span-2 flex items-center gap-2 text-amber-700">
              <Icon icon="tabler:calendar-repeat" className="w-4 h-4" />
              {isEn
                ? `Moved from ${fmtDate(interview.previousStartAt, isEn)} ${fmtTime(interview.previousStartAt)}`
                : `Flyttad från ${fmtDate(interview.previousStartAt, isEn)} ${fmtTime(interview.previousStartAt)}`}
            </div>
          )}
          {interview.status === "cancelled" && interview.cancelReason && (
            <div className="col-span-2 text-gray-500"><span className="font-medium">{isEn ? "Reason:" : "Anledning:"}</span> {interview.cancelReason}</div>
          )}
        </div>

        {/* Google Meet */}
        {interview.format === "video" && scheduled && (
          <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0 space-y-2">
            {interview.meetingLink ? (
              <div className="flex items-center gap-2">
                <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer"
                  className={clsx("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-md",
                    isSoonOrLive && "ring-4 ring-green-100")}
                  style={{ backgroundColor: MEET_GREEN }}>
                  <Icon icon="logos:google-meet" className="w-4 h-4 bg-white rounded p-[1px]" />
                  {isEn ? "Join Google Meet" : "Anslut till Google Meet"}
                </a>
                <button onClick={() => navigator.clipboard?.writeText(interview.meetingLink ?? "")}
                  title={isEn ? "Copy link" : "Kopiera länk"}
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
                  <Icon icon="tabler:copy" className="w-4 h-4" />
                </button>
              </div>
            ) : googleConnected ? (
              <button onClick={createMeet} disabled={saving === "meet"}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 border-dashed border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-60">
                {saving === "meet"
                  ? <div className="w-4 h-4 border-2 border-green-300 border-t-green-700 rounded-full animate-spin" />
                  : <Icon icon="logos:google-meet" className="w-4 h-4" />}
                {isEn ? "Create Google Meet link" : "Skapa Google Meet-länk"}
              </button>
            ) : (
              <p className="text-xs text-gray-500 flex items-center gap-2">
                <Icon icon="tabler:info-circle" className="w-4 h-4 text-gray-400" />
                {isEn ? "Connect Google Calendar on the Interviews page to create a Google Meet link." : "Anslut Google Kalender på Intervjuer-sidan för att skapa en Google Meet-länk."}
              </p>
            )}
            {interview.google.syncError && (
              <p className="text-[11px] text-amber-700 flex items-start gap-1.5">
                <Icon icon="tabler:alert-triangle" className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {interview.google.syncError}
              </p>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 pt-4 border-b border-gray-100 flex-shrink-0">
          {(["notes", "evaluation"] as const).map(tb => (
            <button key={tb} onClick={() => setTab(tb)}
              className={clsx("flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all",
                tab === tb ? "border-blue-800 text-blue-900" : "border-transparent text-gray-400 hover:text-gray-600")}>
              {tb === "notes" ? (isEn ? "Interview Notes" : "Intervjuanteckningar") : (isEn ? "Evaluation Form" : "Utvärderingsformulär")}
              {((tb === "notes" && notesDirty) || (tb === "evaluation" && evaluationDirty)) && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
            </button>
          ))}
        </div>

        <div className="p-6 flex-1">
          {error && (
            <div className="flex items-start gap-2 mb-4 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
              <Icon icon="tabler:alert-circle" className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {tab === "notes" && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                {isEn
                  ? "Write down what was said during the interview — answers, examples the candidate gave, questions they asked, anything worth remembering."
                  : "Skriv ner vad som sades under intervjun — svar, exempel kandidaten gav, frågor de ställde, allt värt att komma ihåg."}
              </p>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={16}
                placeholder={isEn ? "Start typing notes during or after the interview…" : "Börja skriva anteckningar under eller efter intervjun…"}
                className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm resize-none outline-none focus:ring-2 focus:ring-blue-100 leading-relaxed" />
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] text-gray-400">
                  {savedFlash === "notes"
                    ? <span className="font-medium text-green-600 flex items-center gap-1"><Icon icon="tabler:check" className="w-3.5 h-3.5" />{isEn ? "Saved" : "Sparat"}</span>
                    : notesDirty ? (isEn ? "Unsaved changes" : "Osparade ändringar")
                      : interview.notesUpdatedAt ? `${isEn ? "Saved" : "Sparat"} ${fmtDate(interview.notesUpdatedAt, isEn)} ${fmtTime(interview.notesUpdatedAt)}` : ""}
                </span>
                <button onClick={saveNotes} disabled={saving === "notes" || !notesDirty}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                  style={{ backgroundColor: NAVY }}>
                  {saving === "notes" ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Icon icon="tabler:device-floppy" className="w-4 h-4" />}
                  {isEn ? "Save Notes" : "Spara Anteckningar"}
                </button>
              </div>
            </div>
          )}

          {tab === "evaluation" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StarRating label={isEn ? "Technical Skills" : "Tekniska Färdigheter"} value={evaluation.technicalRating}
                  onChange={v => setEvaluation(p => ({ ...p, technicalRating: v }))} />
                <StarRating label={isEn ? "Communication" : "Kommunikation"} value={evaluation.communicationRating}
                  onChange={v => setEvaluation(p => ({ ...p, communicationRating: v }))} />
                <StarRating label={isEn ? "Culture Fit" : "Kulturell Passform"} value={evaluation.cultureFitRating}
                  onChange={v => setEvaluation(p => ({ ...p, cultureFitRating: v }))} />
                <StarRating label={isEn ? "Overall Rating" : "Helhetsbetyg"} value={evaluation.overallRating}
                  onChange={v => setEvaluation(p => ({ ...p, overallRating: v }))} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">{isEn ? "Strengths" : "Styrkor"}</label>
                <textarea value={evaluation.strengths} onChange={e => setEvaluation(p => ({ ...p, strengths: e.target.value }))} rows={3}
                  placeholder={isEn ? "What stood out positively?" : "Vad stack ut positivt?"}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none outline-none focus:ring-2 focus:ring-blue-100" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">{isEn ? "Weaknesses / Concerns" : "Svagheter / Farhågor"}</label>
                <textarea value={evaluation.weaknesses} onChange={e => setEvaluation(p => ({ ...p, weaknesses: e.target.value }))} rows={3}
                  placeholder={isEn ? "Any gaps or concerns?" : "Några luckor eller farhågor?"}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none outline-none focus:ring-2 focus:ring-blue-100" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">{isEn ? "Recommendation" : "Rekommendation"}</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(Object.keys(RECOMMENDATION_CFG) as Exclude<Recommendation, null>[]).map(rec => {
                    const cfg = RECOMMENDATION_CFG[rec]
                    const active = evaluation.recommendation === rec
                    return (
                      <button key={rec} type="button" onClick={() => setEvaluation(p => ({ ...p, recommendation: active ? null : rec }))}
                        className="p-2 rounded-lg text-[10px] font-semibold border-2 transition-all text-center"
                        style={active
                          ? { backgroundColor: cfg.bg, borderColor: cfg.color, color: cfg.color }
                          : { borderColor: "rgb(243,244,246)", color: "rgb(156,163,175)" }}>
                        {isEn ? cfg.en : cfg.sv}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">{isEn ? "Additional Comments" : "Ytterligare Kommentarer"}</label>
                <textarea value={evaluation.additionalComments} onChange={e => setEvaluation(p => ({ ...p, additionalComments: e.target.value }))} rows={3}
                  placeholder={isEn ? "Anything else worth noting…" : "Något annat värt att notera…"}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none outline-none focus:ring-2 focus:ring-blue-100" />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <span className="text-[11px] text-gray-400">
                  {savedFlash === "evaluation"
                    ? <span className="font-medium text-green-600 flex items-center gap-1"><Icon icon="tabler:check" className="w-3.5 h-3.5" />{isEn ? "Saved" : "Sparat"}</span>
                    : evaluationDirty ? (isEn ? "Unsaved changes" : "Osparade ändringar")
                      : interview.evaluation.evaluatedAt ? `${isEn ? "Saved" : "Sparat"} ${fmtDate(interview.evaluation.evaluatedAt, isEn)} ${fmtTime(interview.evaluation.evaluatedAt)}` : ""}
                </span>
                <button onClick={saveEvaluation} disabled={saving === "evaluation" || !evaluationDirty}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                  style={{ backgroundColor: NAVY }}>
                  {saving === "evaluation" ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Icon icon="tabler:device-floppy" className="w-4 h-4" />}
                  {isEn ? "Save Evaluation" : "Spara Utvärdering"}
                </button>
              </div>
            </div>
          )}
        </div>

        {(interview.status === "cancelled" || interview.status === "no_show") && onBookAgain && (
          <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
            <button onClick={() => onBookAgain(interview)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-md"
              style={{ backgroundColor: NAVY }}>
              <Icon icon="tabler:calendar-plus" className="w-4 h-4" />
              {isEn ? `Book again with ${interview.candidateName}` : `Boka igen med ${interview.candidateName}`}
            </button>
          </div>
        )}

        {scheduled && (
          <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 space-y-2">
            <button onClick={() => markStatus("completed")} disabled={saving === "status"}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all disabled:opacity-60"
              style={{ borderColor: STATUS_STYLE.completed.border, backgroundColor: STATUS_STYLE.completed.bg, color: STATUS_STYLE.completed.text }}>
              <Icon icon="tabler:circle-check" className="w-4 h-4" />
              {isEn ? "Mark as Completed" : "Markera som Genomförd"}
            </button>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => onReschedule(interview)}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50">
                <Icon icon="tabler:calendar-repeat" className="w-3.5 h-3.5" />
                {isEn ? "Reschedule" : "Boka om"}
              </button>
              <button onClick={() => markStatus("no_show")} disabled={saving === "status"}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60">
                <Icon icon="tabler:user-x" className="w-3.5 h-3.5" />
                {isEn ? "No-show" : "Uteblev"}
              </button>
              <button onClick={() => onCancel(interview)}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-red-100 text-xs font-medium text-red-600 hover:bg-red-50">
                <Icon icon="tabler:calendar-x" className="w-3.5 h-3.5" />
                {isEn ? "Cancel" : "Avboka"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
