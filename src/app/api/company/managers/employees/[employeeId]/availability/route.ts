import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireManagerId } from '@/utils/server/managerDelegation'

async function requireAcceptedEmployee(payload: any, managerId: number, employeeId: number) {
  const result = await payload.find({
    collection: 'employee-invitations',
    where: {
      and: [
        { manager: { equals: managerId } },
        { employee: { equals: employeeId } },
        { status: { equals: 'accepted' } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  })
  return result.docs.length > 0
}

// GET — read-only: an accepted employee's availability calendar, for the
// manager's side-panel overview. Same gate as every other manager-facing
// employee route: only works with an accepted invitation between this exact
// manager/employee pair. Unlike /api/calendar-availability (the employee's
// own self-service endpoint), this never trusts a client-supplied user id —
// identity comes entirely from the session token.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> },
) {
  try {
    const { employeeId: employeeIdParam } = await params

    const managerId = await requireManagerId(req)
    if (managerId === null) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    }

    const employeeId = Number(employeeIdParam)
    if (!Number.isFinite(employeeId)) {
      return NextResponse.json({ message: 'Invalid employee id' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    const allowed = await requireAcceptedEmployee(payload, managerId, employeeId)
    if (!allowed) {
      return NextResponse.json(
        { message: 'This employee has not accepted an invitation from you' },
        { status: 403 },
      )
    }

    const result = await payload.find({
      collection: 'availability',
      where: { user: { equals: employeeId } },
      limit: 1,
      overrideAccess: true,
    })

    const doc = result.docs[0] ?? null

    return NextResponse.json({ dateStatus: doc?.dateStatus ?? [] }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to load employee availability:', error)
    return NextResponse.json({ message: 'Failed to load availability' }, { status: 500 })
  }
}

// PATCH — manager updates (or creates, if it doesn't exist yet) an accepted
// employee's availability calendar. Body: { dateStatus: [{ date, status }] }
// using the collection's real status values: 'booked' | 'available' |
// 'vacation' | 'none'. Same accepted-invitation gate as GET.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> },
) {
  try {
    const { employeeId: employeeIdParam } = await params

    const managerId = await requireManagerId(req)
    if (managerId === null) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    }

    const employeeId = Number(employeeIdParam)
    if (!Number.isFinite(employeeId)) {
      return NextResponse.json({ message: 'Invalid employee id' }, { status: 400 })
    }

    const body = (await req.json()) as {
      dateStatus?: Array<{ date: string; status: 'booked' | 'available' | 'vacation' | 'none' }>
    }
    if (!Array.isArray(body.dateStatus)) {
      return NextResponse.json({ message: 'dateStatus array is required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    const allowed = await requireAcceptedEmployee(payload, managerId, employeeId)
    if (!allowed) {
      return NextResponse.json(
        { message: 'This employee has not accepted an invitation from you' },
        { status: 403 },
      )
    }

    const existing = await payload.find({
      collection: 'availability',
      where: { user: { equals: employeeId } },
      limit: 1,
      overrideAccess: true,
    })

    let result
    if (existing.docs.length > 0 && existing.docs[0]) {
      result = await payload.update({
        collection: 'availability',
        id: existing.docs[0].id,
        data: { dateStatus: body.dateStatus },
        overrideAccess: true,
      })
    } else {
      result = await payload.create({
        collection: 'availability',
        data: { user: employeeId, dateStatus: body.dateStatus },
        overrideAccess: true,
      })
    }

    return NextResponse.json({ dateStatus: result.dateStatus ?? [] }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to update employee availability:', error)
    return NextResponse.json({ message: 'Failed to update availability' }, { status: 500 })
  }
}
