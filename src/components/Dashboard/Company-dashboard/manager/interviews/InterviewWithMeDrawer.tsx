"use client"

// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/manager/interviews/InterviewWithMeDrawer.tsx   (NEW)
// WHAT IT DOES:   Read-only side panel for an interview the business admin booked WITH
//                 you (you are the candidate). Opened from your Interviews calendar.
//                 No notes / evaluation / reschedule — those belong to the interviewer.
// ══════════════════════════════════════════════════════════════════════

import { useEffect } from "react"
import { Icon } from "@iconify/react"
import type { InterviewWithMe } from "@/utils/interviewsWithMeApi"
import { FORMAT_CFG, MEET_GREEN, STATUS_STYLE, fmtLongDate, fmtTime, initials } from "./interviewShared"

export const WITH_ME_STYLE = { bg: "rgb(245,243,255)", border: "rgb(221,214,254)", text: "rgb(109,40,217)" }

export default function InterviewWithMeDrawer({ interview: iv, isEn, onClose }: { interview: InterviewWithMe; isEn: boolean; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", k)
    return () => window.removeEventListener("keydown", k)
  }, [onClose])

  const ss = STATUS_STYLE[iv.status]
  const fmt = FORMAT_CFG[iv.format]
  const active = iv.status === "scheduled"
  const end = new Date(new Date(iv.startAt).getTime() + iv.durationMinutes * 60_000)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside role="dialog" aria-modal="true" aria-label={iv.position} className="relative w-full sm:max-w-md h-full bg-white shadow-2xl flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 flex items-start gap-3">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: WITH_ME_STYLE.text }}>
            {initials(iv.withMe.bookedBy || "?")}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: WITH_ME_STYLE.text }}>
              {isEn ? "You're being interviewed" : "Du blir intervjuad"}
            </p>
            <h2 className="font-bold text-gray-900 truncate">{iv.position || (isEn ? "Interview" : "Intervju")}</h2>
            <p className="text-sm text-gray-500 truncate">{isEn ? "With" : "Med"} {iv.withMe.bookedBy}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100" aria-label={isEn ? "Close" : "Stäng"}>
            <Icon icon="tabler:x" className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border"
            style={{ color: ss.text, backgroundColor: ss.bg, borderColor: ss.border }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ss.dot }} />{isEn ? ss.en : ss.sv}
          </span>

          <div className="space-y-2 text-gray-700">
            <p className={`flex items-center gap-2 ${iv.status === "cancelled" ? "line-through text-gray-400" : ""}`}>
              <Icon icon="tabler:calendar" className="w-4 h-4 text-gray-400" />
              {fmtLongDate(iv.startAt, isEn)} · {fmtTime(iv.startAt)}–{fmtTime(end)}
            </p>
            <p className="flex items-center gap-2"><Icon icon={fmt.icon} className="w-4 h-4 text-gray-400" />{isEn ? fmt.en : fmt.sv}</p>
            {active && iv.format === "in_person" && iv.location && (
              <p className="flex items-start gap-2"><Icon icon="tabler:map-pin" className="w-4 h-4 mt-0.5 text-gray-400" />{iv.location}</p>
            )}
            {active && iv.format === "phone" && iv.withMe.phone && (
              <p className="flex items-center gap-2"><Icon icon="tabler:phone" className="w-4 h-4 text-gray-400" />
                {isEn ? `You'll be called on ${iv.withMe.phone}` : `Du blir uppringd på ${iv.withMe.phone}`}</p>
            )}
            {iv.rescheduledAt && iv.previousStartAt && active && (
              <p className="flex items-center gap-2 text-amber-700"><Icon icon="tabler:clock-edit" className="w-4 h-4" />
                {isEn ? "Moved — was" : "Flyttad — var"} {fmtLongDate(iv.previousStartAt, isEn)} {fmtTime(iv.previousStartAt)}</p>
            )}
            {iv.status === "cancelled" && iv.withMe.cancelReason && (
              <p className="flex items-start gap-2 text-red-700"><Icon icon="tabler:info-circle" className="w-4 h-4 mt-0.5" />{iv.withMe.cancelReason}</p>
            )}
          </div>

          {iv.withMe.message && (
            <div className="p-3 rounded-xl bg-gray-50 text-gray-700 whitespace-pre-wrap">
              <p className="text-xs font-semibold text-gray-500 mb-1">{isEn ? "Message" : "Meddelande"}</p>
              {iv.withMe.message}
            </div>
          )}

          {active && iv.meetingLink && (
            <a href={iv.meetingLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: MEET_GREEN }}>
              <Icon icon="tabler:video" className="w-4 h-4" />{isEn ? "Join meeting" : "Anslut till mötet"}
            </a>
          )}

          <p className="flex items-start gap-2 text-xs text-gray-500 rounded-lg bg-gray-50 px-3 py-2">
            <Icon icon="tabler:lock" className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            {isEn
              ? `Booked by ${iv.withMe.bookedBy}. Only they can move or cancel it.`
              : `Bokad av ${iv.withMe.bookedBy}. Bara hen kan flytta eller avboka den.`}
          </p>
        </div>
      </aside>
    </div>
  )
}
