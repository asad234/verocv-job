"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/shared/MyAdminCard.tsx   (NEW — manager side)
// The manager's business admin: profile photo, name, title, contact + the company logo.
// Drop it on any manager page:   <MyAdminCard />   (or <MyAdminCard compact /> for a small row)
// Data: GET /api/company/managers/my-admin (via useMyAdmin). Renders nothing when the
// manager has no business admin.
// ══════════════════════════════════════════════════════════════════════

import { Icon } from "@iconify/react"
import ProfilePhoto from "@/components/shared/ProfilePhoto"
import { useMyAdmin } from "@/utils/adminProfile"

const NAVY = "rgb(5,22,80)"

export default function MyAdminCard({
  compact = false, language = "sv", onChat,
}: { compact?: boolean; language?: "sv" | "en"; onChat?: (adminId: string) => void }) {
  const admin = useMyAdmin()
  const en = language === "en"

  if (admin === undefined) return <div className="h-24 rounded-2xl bg-white border border-gray-200 animate-pulse" />
  if (!admin) return null

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <ProfilePhoto src={admin.avatar} name={admin.name} size={36} />
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-800 truncate">{admin.name}</div>
          <div className="text-xs text-gray-500 truncate">{[admin.jobTitle || (en ? "Business Admin" : "Företagsadmin"), admin.company.name].filter(Boolean).join(" · ")}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
        {admin.company.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={admin.company.logo} alt={admin.company.name} className="h-8 w-auto max-w-[120px] object-contain" />
        ) : (
          <Icon icon="tabler:building" className="w-6 h-6 text-gray-300" />
        )}
        <span className="text-sm font-semibold truncate" style={{ color: NAVY }}>{admin.company.name}</span>
      </div>
      <div className="p-5 flex items-center gap-4">
        <ProfilePhoto src={admin.avatar} name={admin.name} size={72} />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{en ? "Your business admin" : "Din företagsadmin"}</div>
          <div className="text-lg font-bold text-gray-900 truncate">{admin.name}</div>
          {admin.jobTitle && <div className="text-sm text-gray-500 truncate">{admin.jobTitle}</div>}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
            {admin.email && <a href={`mailto:${admin.email}`} className="inline-flex items-center gap-1 hover:underline"><Icon icon="tabler:mail" className="w-3.5 h-3.5" />{admin.email}</a>}
            {admin.phone && <a href={`tel:${admin.phone}`} className="inline-flex items-center gap-1 hover:underline"><Icon icon="tabler:phone" className="w-3.5 h-3.5" />{admin.phone}</a>}
          </div>
        </div>
        {onChat && (
          <button onClick={() => onChat(admin.id)} className="px-3 py-2 rounded-lg text-xs font-semibold text-white flex-shrink-0 inline-flex items-center gap-1" style={{ backgroundColor: NAVY }}>
            <Icon icon="tabler:message-circle" className="w-4 h-4" />{en ? "Chat" : "Chatta"}
          </button>
        )}
      </div>
    </div>
  )
}
