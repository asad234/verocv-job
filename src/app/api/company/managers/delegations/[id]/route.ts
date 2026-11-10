// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/company/managers/delegations/[id]/route.ts
// URL:            PATCH /api/company/managers/delegations/:id   { action }
// WHAT IT DOES:   accept / decline  — the substitute answers a pending request
//                 cancel            — the absent manager withdraws a pending request
//                 end               — either side ends an accepted one
//                                     ("I'm back" / "I'm no longer covering")
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { delegationState } from '@/utils/delegations'
import { loadPeople, requireManagerActor, toDelegationDto } from '@/utils/server/managerDelegation'

const relId = (v: any) => (v == null || v === '' ? null : typeof v === 'object' ? v.id : v)
const ACTIONS = ['accept', 'decline', 'cancel', 'end'] as const
type Action = (typeof ACTIONS)[number]

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireManagerActor(req)
    if (!actor) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })

    const { id } = await params
    const { action } = (await req.json().catch(() => ({}))) as { action?: Action }
    if (!action || !ACTIONS.includes(action)) {
      return NextResponse.json({ message: 'Unsupported action' }, { status: 400 })
    }

    const payload = await getPayload({ config })
    const doc: any = await payload
      .findByID({ collection: 'manager-delegations', id, depth: 0, overrideAccess: true })
      .catch(() => null)

    const isOwner = doc && Number(relId(doc.owner)) === actor.id
    const isDelegate = doc && Number(relId(doc.delegate)) === actor.id
    if (!doc || (!isOwner && !isDelegate)) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 })
    }

    const state = delegationState(doc)
    const now = new Date().toISOString()
    let data: Record<string, unknown> | null = null

    if (action === 'accept' || action === 'decline') {
      if (!isDelegate)
        return NextResponse.json(
          { message: 'Only the invited manager can answer' },
          { status: 403 },
        )
      if (state !== 'pending')
        return NextResponse.json(
          { message: 'This request has already been answered or has expired' },
          { status: 409 },
        )
      data = { status: action === 'accept' ? 'accepted' : 'declined', respondedAt: now }
    } else if (action === 'cancel') {
      if (!isOwner)
        return NextResponse.json(
          { message: 'Only the manager who asked can cancel' },
          { status: 403 },
        )
      if (state !== 'pending')
        return NextResponse.json(
          { message: 'Only a request waiting for an answer can be cancelled' },
          { status: 409 },
        )
      data = { status: 'cancelled', endedAt: now, endedBy: 'owner' }
    } else {
      // end — the substitute stops covering, or the absent manager is back.
      if (state !== 'active' && state !== 'scheduled') {
        return NextResponse.json(
          { message: 'This substitute arrangement is not running' },
          { status: 409 },
        )
      }
      data = { status: 'ended', endedAt: now, endedBy: isOwner ? 'owner' : 'delegate' }
    }

    const updated = await payload.update({
      collection: 'manager-delegations',
      id,
      data: data as any,
      overrideAccess: true,
    })
    const people = await loadPeople(payload, [relId(doc.owner), relId(doc.delegate)])
    return NextResponse.json({ data: toDelegationDto(updated, people) }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to update delegation:', error)
    return NextResponse.json({ message: 'Failed to update the request' }, { status: 500 })
  }
}
