// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/managers/team-time-off/[id]/route.ts   (NEW)
// URL:            PATCH /api/company/managers/team-time-off/:id  { action: "approve" | "decline", note? }
// WHAT IT DOES:   A manager answers an employee's days-off request. Any manager the employee
//                 shares full access with (or who covers for one) may answer; the first answer
//                 counts. Declining needs a short reason (the employee sees it).
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireManagerActor } from '@/utils/server/managerDelegation'
import { relId, toRequestDto } from '@/utils/server/managerAvailability'
import { managedEmployees, personNames } from '@/utils/server/teamAvailability'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const actor = await requireManagerActor(req)
    if (!actor) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const action = body?.action
    if (action !== 'approve' && action !== 'decline')
      return NextResponse.json({ message: 'Unknown action' }, { status: 400 })
    const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 1000) : ''
    if (action === 'decline' && !note)
      return NextResponse.json({ message: 'Write a short reason', field: 'note' }, { status: 400 })

    const payload = await getPayload({ config })
    const doc: any = await payload.findByID({
      collection: 'time-off-requests',
      id,
      depth: 0,
      overrideAccess: true,
      disableErrors: true,
    })
    const { employees } = await managedEmployees(payload, actor.id)
    if (!doc || !employees.has(String(relId(doc.manager))))
      return NextResponse.json({ message: 'Request not found' }, { status: 404 })
    if (doc.status !== 'pending')
      return NextResponse.json(
        { message: 'This request has already been handled' },
        { status: 409 },
      )

    const updated = await payload.update({
      collection: 'time-off-requests',
      id,
      data: {
        status: action === 'approve' ? 'approved' : 'declined',
        decidedBy: actor.id,
        decidedAt: new Date().toISOString(),
        decisionNote: note,
      } as any,
      overrideAccess: true,
    })
    const names = await personNames(payload, [relId(doc.manager), actor.id])
    return NextResponse.json({ data: toRequestDto(updated, names) }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to decide team time off request:', error)
    return NextResponse.json({ message: 'Failed to save the decision' }, { status: 500 })
  }
}
