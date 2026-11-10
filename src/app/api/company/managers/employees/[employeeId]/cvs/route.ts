import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireManagerId } from '@/utils/server/managerDelegation'

// Confirms the employee has an accepted invitation from this specific manager.
// Same gate pattern as the portfolio route — this is the ONLY permission check.
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

// GET — list an accepted employee's CVs (read-only)
//
// CVs the employee has marked `hidden` are filtered out here, server-side,
// before the manager ever sees them — same as the portfolio route. The
// employee controls what's shared, and that control must not depend on the
// client-side UI.
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
      collection: 'cvs',
      where: {
        and: [{ user: { equals: employeeId } }, { hidden: { not_equals: true } }],
      },
      sort: '-updatedAt',
      limit: 100,
      depth: 1,
      overrideAccess: true,
    })

    return NextResponse.json({ data: result.docs }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to load employee CVs:', error)
    return NextResponse.json({ message: 'Failed to load CVs' }, { status: 500 })
  }
}

// POST — manager creates a new (blank, named) CV owned by the employee.
//
// IMPORTANT LIMITATION: this creates a real row in `cvs` with the employee as
// owner, but there is no visual CV-builder UI wired up here — this repo's CV
// editor almost certainly reads the logged-in session's own user id to know
// whose CV it's editing, so it can't safely be reused as-is to edit a
// DIFFERENT person's CV without changes to that editor component (which
// wasn't available to build against). The employee will see this CV appear
// in their own CV list immediately since it's a normal row they own.
export async function POST(
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

    const { name } = (await req.json()) as { name?: string }
    if (!name?.trim()) {
      return NextResponse.json({ message: 'CV name is required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    const allowed = await requireAcceptedEmployee(payload, managerId, employeeId)
    if (!allowed) {
      return NextResponse.json(
        { message: 'This employee has not accepted an invitation from you' },
        { status: 403 },
      )
    }

    // Seed personalInfo.firstName/lastName from the employee's own account
    // name, since those are required fields on the cvs collection.
    const employeeDoc = await payload.findByID({
      collection: 'users',
      id: employeeId,
      overrideAccess: true,
      disableErrors: true,
    })
    const nameParts = (employeeDoc?.name || '').split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    const created = await payload.create({
      collection: 'cvs',
      data: {
        user: employeeId,
        name: name.trim(),
        personalInfo: { firstName, lastName },
      },
      overrideAccess: true,
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('❌ Failed to create CV for employee:', error)
    return NextResponse.json({ message: 'Failed to create CV' }, { status: 500 })
  }
}
