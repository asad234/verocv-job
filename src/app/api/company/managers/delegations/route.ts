// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/company/managers/delegations/route.ts
// URL:            GET  /api/company/managers/delegations   → { outgoing, incoming, history }
//                 POST /api/company/managers/delegations   → ask a colleague to cover for me
// WHAT IT DOES:   Substitute managers. Always about the LOGGED-IN manager —
//                 never the workspace they might be covering.
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  DELEGATION_REASONS,
  delegationState,
  isOpenState,
  type DelegationReason,
} from '@/utils/delegations'
import {
  companyManagerIds,
  loadPeople,
  requireManagerActor,
  toDelegationDto,
} from '@/utils/server/managerDelegation'

const relId = (v: any) => (v == null || v === '' ? null : typeof v === 'object' ? v.id : v)

const parseDate = (v: unknown): string | null | 'invalid' => {
  if (v == null || v === '') return null
  const d = new Date(String(v))
  return Number.isNaN(d.getTime()) ? 'invalid' : d.toISOString()
}

export async function GET(req: NextRequest) {
  try {
    const actor = await requireManagerActor(req)
    if (!actor) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })

    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'manager-delegations',
      where: { or: [{ owner: { equals: actor.id } }, { delegate: { equals: actor.id } }] },
      sort: '-createdAt',
      limit: 100,
      depth: 0,
      overrideAccess: true,
    })

    const people = await loadPeople(
      payload,
      (docs as any[]).flatMap((d) => [relId(d.owner), relId(d.delegate)]),
    )
    const all = (docs as any[]).map((d) => toDelegationDto(d, people))
    const mine = (d: (typeof all)[number]) => d.owner.id === String(actor.id)

    return NextResponse.json(
      {
        me: String(actor.id),
        outgoing: all.find((d) => mine(d) && isOpenState(d.state)) ?? null,
        incoming: all.filter((d) => !mine(d) && isOpenState(d.state)),
        history: all.filter((d) => !isOpenState(d.state)).slice(0, 20),
      },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to load delegations:', error)
    return NextResponse.json({ message: 'Failed to load substitutes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireManagerActor(req)
    if (!actor) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const delegateId = Number(body.delegateId)
    if (!Number.isFinite(delegateId) || delegateId <= 0) {
      return NextResponse.json({ message: 'Choose a manager to cover for you' }, { status: 400 })
    }
    if (delegateId === actor.id) {
      return NextResponse.json({ message: "You can't choose yourself" }, { status: 400 })
    }

    const reason: DelegationReason = DELEGATION_REASONS.includes(body.reason as DelegationReason)
      ? (body.reason as DelegationReason)
      : 'other'
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 1000) : ''
    const startsAt = parseDate(body.startsAt)
    const endsAt = parseDate(body.endsAt)
    if (startsAt === 'invalid' || endsAt === 'invalid') {
      return NextResponse.json({ message: 'Please enter valid dates' }, { status: 400 })
    }
    if (endsAt && new Date(endsAt).getTime() <= Date.now()) {
      return NextResponse.json({ message: 'The end date must be in the future' }, { status: 400 })
    }
    if (startsAt && endsAt && endsAt <= startsAt) {
      return NextResponse.json(
        { message: 'The end date must be after the start date' },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config })

    // The substitute must be a manager in the same company.
    const { ids: colleagues } = await companyManagerIds(payload, actor.id)
    if (!colleagues.includes(delegateId)) {
      return NextResponse.json(
        { message: 'You can only choose a manager in your own company' },
        { status: 400 },
      )
    }

    // One substitute at a time.
    const { docs: open } = await payload.find({
      collection: 'manager-delegations',
      where: {
        and: [{ owner: { equals: actor.id } }, { status: { in: ['pending', 'accepted'] } }],
      },
      limit: 10,
      depth: 0,
      overrideAccess: true,
    })
    if ((open as any[]).some((d) => isOpenState(delegationState(d)))) {
      return NextResponse.json(
        {
          message: 'You already have a substitute. End or cancel it before choosing someone else.',
        },
        { status: 409 },
      )
    }

    const doc = await payload.create({
      collection: 'manager-delegations',
      data: {
        owner: actor.id,
        delegate: delegateId,
        status: 'pending',
        reason,
        message,
        startsAt,
        endsAt,
      } as any,
      overrideAccess: true,
    })

    const people = await loadPeople(payload, [actor.id, delegateId])
    return NextResponse.json({ data: toDelegationDto(doc, people) }, { status: 201 })
  } catch (error) {
    console.error('❌ Failed to create delegation:', error)
    return NextResponse.json({ message: 'Failed to send the request' }, { status: 500 })
  }
}
