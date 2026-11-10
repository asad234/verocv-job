// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/company/managers/delegations/candidates/route.ts
// URL:            GET /api/company/managers/delegations/candidates?q=lena
// WHAT IT DOES:   Managers in MY company I can ask to cover for me, matched on
//                 first name / last name / email / job title (accent-insensitive).
//                 Empty q = all of them. reason: 'no_company' | 'no_managers' | null
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  companyManagerIds,
  loadPeople,
  requireManagerActor,
} from '@/utils/server/managerDelegation'

const fold = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export async function GET(req: NextRequest) {
  try {
    const actor = await requireManagerActor(req)
    if (!actor) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })

    const payload = await getPayload({ config })
    const { ids, reason } = await companyManagerIds(payload, actor.id)
    if (!ids.length)
      return NextResponse.json(
        { data: [], total: 0, reason: reason ?? 'no_managers' },
        { status: 200 },
      )

    const people = await loadPeople(payload, ids)
    const words = fold(req.nextUrl.searchParams.get('q') ?? '')
      .split(/\s+/)
      .filter(Boolean)
    const list = [...people.values()]
      .filter((p) => {
        const hay = fold(`${p.name} ${p.email} ${p.jobTitle ?? ''}`)
        return words.every((w) => hay.includes(w))
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'sv'))

    return NextResponse.json(
      { data: list, total: people.size, reason: null },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to search managers:', error)
    return NextResponse.json({ message: 'Failed to search managers' }, { status: 500 })
  }
}
