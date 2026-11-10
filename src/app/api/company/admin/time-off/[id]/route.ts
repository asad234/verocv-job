// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/time-off/[id]/route.ts   (NEW)
// URL:            PATCH /api/company/admin/time-off/:id   body { action: "approve" | "decline", note? }
// WHAT IT DOES:   The business admin decides a pending request from one of their managers.
//                 Declining needs a short reason (the manager sees it).
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { findOwnManager, requireCompanyAdmin } from '@/utils/server/adminmanagers'
import { managerNames, relId, toRequestDto } from '@/utils/server/managerAvailability'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const admin = await requireCompanyAdmin(req)
    if (!admin) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
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
    if (!doc || !(await findOwnManager(payload, admin, relId(doc.manager)))) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 })
    }
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
        decidedBy: admin.id,
        decidedAt: new Date().toISOString(),
        decisionNote: note,
      } as any,
      overrideAccess: true,
    })
    const names = await managerNames(payload, [relId(doc.manager), admin.id])
    return NextResponse.json({ data: toRequestDto(updated, names) }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to decide time off request:', error)
    return NextResponse.json({ message: 'Failed to save the decision' }, { status: 500 })
  }
}
