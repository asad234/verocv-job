"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import { useManagerTranslations } from "@/utils/Managertranslations"

const NAVY = "rgb(5,22,80)"

export default function InviteEmployeeCard() {
  const { t } = useManagerTranslations()

  const [email, setEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSend = async () => {
    if (!email.trim()) return
    setSending(true)
    setMessage(null)
    try {
      const res = await fetch("/api/company/managers/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage({ type: "error", text: data?.message || t.failedToSendInvitation })
        return
      }
      setMessage({ type: "success", text: `${t.invitationSentTo} ${email.trim()}.` })
      setEmail("")
    } catch {
      setMessage({ type: "error", text: t.failedToSendInvitation })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg" style={{ backgroundColor: NAVY }}>
          <Icon icon="tabler:send" className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">{t.inviteCardTitle}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {t.inviteCardDesc}
          </p>
        </div>
      </div>

      {message && (
        <div className={`mb-3 rounded-xl px-3 py-2 text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.inviteEmailPlaceholder}
          className="flex-1 px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
          onKeyDown={(e) => { if (e.key === "Enter") handleSend() }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !email.trim()}
          className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2 hover:shadow-md transition-all"
          style={{ backgroundColor: NAVY }}
        >
          {sending && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {sending ? t.sendingLabel : t.inviteBtn}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2">{t.inviteFooterNote}</p>
    </div>
  )
}
