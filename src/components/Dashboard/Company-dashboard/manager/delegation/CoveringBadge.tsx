"use client"

// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/manager/delegation/CoveringBadge.tsx  (NEW)
// WHAT IT DOES:   <CoveringBadge>  — small amber chip "Lena's team" on employees,
//                 contracts and interviews that belong to a colleague you cover.
//                 <CoveringNotice> — one line at the top of a page:
//                 "You're also seeing Lena Larsson's team while covering (until 31 Oct)."
// ══════════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react"
import { Icon } from "@iconify/react"
import { firstName, loadCoveredOwners, type CoveredOwner, type CoveringFor } from "@/utils/coveredTeam"
import { DELEGATIONS_CHANGED_EVENT } from "@/utils/delegations"

type Lang = "en" | "sv"

export function CoveringBadge({ coveringFor, language, compact = false }: {
  coveringFor?: CoveringFor | null
  language: Lang | string
  compact?: boolean
}) {
  if (!coveringFor) return null
  const isEn = language !== "sv"
  const first = firstName(coveringFor.name)
  return (
    <span
      title={isEn ? `From ${coveringFor.name}'s team — you're covering for them` : `Från ${coveringFor.name}s team — du täcker upp`}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold whitespace-nowrap flex-shrink-0"
    >
      <Icon icon="tabler:user-share" className="w-3 h-3" />
      {compact ? first : isEn ? `${first}'s team` : `${first}s team`}
    </span>
  )
}

export function CoveringNotice({ language }: { language: Lang | string }) {
  const [owners, setOwners] = useState<CoveredOwner[]>([])
  const isEn = language !== "sv"

  useEffect(() => {
    const load = () => loadCoveredOwners().then(setOwners).catch(() => setOwners([]))
    load()
    window.addEventListener(DELEGATIONS_CHANGED_EVENT, load)
    return () => window.removeEventListener(DELEGATIONS_CHANGED_EVENT, load)
  }, [])

  if (!owners.length) return null
  const fmt = (v: string) => new Date(v).toLocaleDateString(isEn ? "en-GB" : "sv-SE", { day: "numeric", month: "short" })
  const names = owners.map((o) => (o.endsAt ? `${o.name} (${isEn ? "until" : "till"} ${fmt(o.endsAt)})` : o.name)).join(", ")

  return (
    <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
      <Icon icon="tabler:user-share" className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>
        {isEn
          ? <>You're covering for <b>{names}</b> — their team is shown here too, marked with an amber badge.</>
          : <>Du täcker upp för <b>{names}</b> — deras team visas också här, märkt med en gul etikett.</>}
      </span>
    </div>
  )
}
