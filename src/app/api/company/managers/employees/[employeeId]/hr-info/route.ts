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

// GET — full employee profile view for the manager:
//  - personalInformation: the employee's complete personal-information record
//    (contact details, presentations, social links, emergency contact, etc.) —
//    this is the employee's own data, owned and edited by them, shown here
//    for reference.
//  - employmentDetails: the employee's self-reported employment-details record
//    (office location, home address, present title, salary/fee rate, etc.) —
//    also the employee's own data, read-only here.
//  - experience / skills / certifications / references / languages / projects:
//    pulled from the employee's most recently updated CV — also the
//    employee's own data.
//  - hrInfo: the manager-editable record (employment info, events, leave
//    balance) — this is the only part the manager can actually change.
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

    const [hrResult, personalInfoResult, cvResult, employmentDetailsResult] = await Promise.all([
      payload.find({
        collection: 'employee-hr-info',
        where: { user: { equals: employeeId } },
        limit: 1,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'personal-information',
        where: { user: { equals: employeeId } },
        limit: 1,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'cvs',
        where: { user: { equals: employeeId } },
        sort: '-updatedAt',
        limit: 1,
        depth: 1,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'employment-details',
        where: { user: { equals: employeeId } },
        limit: 1,
        overrideAccess: true,
      }),
    ])

    const hrInfo = hrResult.docs[0] ?? null
    const personalInfo = personalInfoResult.docs[0] ?? null
    const primaryCv = cvResult.docs[0] ?? null
    const employmentDetails = employmentDetailsResult.docs[0] ?? null

    return NextResponse.json(
      {
        hrInfo,
        personalInformation: personalInfo
          ? {
              firstName: personalInfo.firstName,
              lastName: personalInfo.lastName,
              title: personalInfo.title,
              homeAddress: personalInfo.homeAddress,
              phoneNumber: personalInfo.phoneNumber,
              workPhoneNumber: personalInfo.workPhoneNumber,
              privateEmail: personalInfo.privateEmail,
              workEmail: personalInfo.workEmail,
              dateOfBirth: personalInfo.dateOfBirth,
              gender: personalInfo.gender,
              professionalPresentation: personalInfo.professionalPresentation,
              personalPresentation: personalInfo.personalPresentation,
              socialLinks: personalInfo.socialLinks ?? null,
              emergencyContact: personalInfo.emergencyContact ?? null,
            }
          : null,
        cv: primaryCv
          ? {
              name: primaryCv.name,
              experience: primaryCv.experience ?? [],
              skills: primaryCv.skills ?? [],
              certifications: primaryCv.certifications ?? [],
              references: primaryCv.references ?? [],
              languages: primaryCv.languages ?? [],
              projects: primaryCv.projects ?? [],
            }
          : null,
        employmentDetails: employmentDetails
          ? {
              employmentRate: employmentDetails.employmentRate,
              canTravel: employmentDetails.canTravel,
              officeLocation: employmentDetails.officeLocation,
              employmentDate: employmentDetails.employmentDate,
              homeAddress: employmentDetails.homeAddress,
              presentTitle: employmentDetails.presentTitle,
              workArea: employmentDetails.workArea,
              preferredLocation: employmentDetails.preferredLocation,
              secondaryLocation: employmentDetails.secondaryLocation,
              assignmentAbroad: employmentDetails.assignmentAbroad,
              salaryLevel: employmentDetails.salaryLevel,
              salaryCurrency: employmentDetails.salaryCurrency,
              feeRate: employmentDetails.feeRate,
              feeCurrency: employmentDetails.feeCurrency,
              feeRateType: employmentDetails.feeRateType,
            }
          : null,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('❌ Failed to load employee profile:', error)
    return NextResponse.json({ message: 'Failed to load employee profile' }, { status: 500 })
  }
}

// PATCH — manager edits the manager-owned HR fields (employmentInfo,
// upcomingEvents, leaveBalance). Never touches personal-information or cvs —
// those remain the employee's own data.
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

    const payload = await getPayload({ config })

    const allowed = await requireAcceptedEmployee(payload, managerId, employeeId)
    if (!allowed) {
      return NextResponse.json(
        { message: 'This employee has not accepted an invitation from you' },
        { status: 403 },
      )
    }

    const raw = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return NextResponse.json({ message: 'Invalid body' }, { status: 400 })
    }

    // Only the three manager-owned fields — anything else in the body (e.g.
    // `user`, to move the record to another employee) is ignored.
    const data: Record<string, unknown> = {}
    if (raw.employmentInfo !== undefined) {
      if (raw.employmentInfo !== null && typeof raw.employmentInfo !== 'object')
        return NextResponse.json({ message: 'employmentInfo must be an object' }, { status: 400 })
      data.employmentInfo = raw.employmentInfo
    }
    if (raw.upcomingEvents !== undefined) {
      if (!Array.isArray(raw.upcomingEvents))
        return NextResponse.json({ message: 'upcomingEvents must be a list' }, { status: 400 })
      data.upcomingEvents = raw.upcomingEvents
    }
    if (raw.leaveBalance !== undefined) {
      if (raw.leaveBalance !== null && typeof raw.leaveBalance !== 'object')
        return NextResponse.json({ message: 'leaveBalance must be an object' }, { status: 400 })
      data.leaveBalance = raw.leaveBalance
    }

    const existing = await payload.find({
      collection: 'employee-hr-info',
      where: { user: { equals: employeeId } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    // `as any`: the shapes are checked above and Payload validates every field
    // (required titles, event types, dates…) against the collection on save —
    // its generated types just can't see that through Record<string, unknown>.
    let result
    const current = existing.docs[0]
    if (current) {
      result = await payload.update({
        collection: 'employee-hr-info',
        id: current.id,
        data: data as any,
        overrideAccess: true,
      })
    } else {
      result = await payload.create({
        collection: 'employee-hr-info',
        data: { ...data, user: employeeId } as any,
        overrideAccess: true,
      })
    }

    return NextResponse.json({ data: result }, { status: 200 })
  } catch (error) {
    // Payload's own validation (e.g. an event without a title) → 400 with its message.
    if ((error as any)?.name === 'ValidationError') {
      return NextResponse.json(
        {
          message: (error as any).message || 'Invalid HR info',
          errors: (error as any).data?.errors,
        },
        { status: 400 },
      )
    }
    console.error('❌ Failed to update employee HR info:', error)
    return NextResponse.json({ message: 'Failed to update employee info' }, { status: 500 })
  }
}
