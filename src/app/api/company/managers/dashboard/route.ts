import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getPayload } from 'payload'
import config from '@payload-config'

async function requireManagerId(req: NextRequest): Promise<number | null> {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.PAYLOAD_SECRET,
  })
  const role = token?.roles as string | undefined
  if (!token?.id || role !== 'client-manager') return null
  const id = Number(token.id)
  return Number.isFinite(id) ? id : null
}

// GET — summary data for the manager's home dashboard:
//  - employeeStats: counts of accepted / pending / declined invitations
//  - recentCvs: the N most recently updated CVs across ALL accepted
//    employees (not per-employee — this is the cross-employee aggregate the
//    per-employee /cvs route doesn't provide)
export async function GET(req: NextRequest) {
  try {
    const managerId = await requireManagerId(req)
    if (managerId === null) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    }

    const payload = await getPayload({ config })

    const invitations = await payload.find({
      collection: 'employee-invitations',
      where: { manager: { equals: managerId } },
      limit: 500,
      overrideAccess: true,
    })

    const accepted = invitations.docs.filter((d: any) => d.status === 'accepted')
    const pending = invitations.docs.filter((d: any) => d.status === 'pending')
    const declined = invitations.docs.filter((d: any) => d.status === 'declined')

    const acceptedEmployeeIds = accepted
      .map((d: any) => (typeof d.employee === 'object' ? d.employee?.id : d.employee))
      .filter((id: unknown) => id !== undefined && id !== null)

    let recentCvs: Array<{
      id: string
      name: string
      template?: string
      updatedAt: string
      employeeId: string
      employeeName: string
    }> = []

    if (acceptedEmployeeIds.length > 0) {
      const cvResult = await payload.find({
        collection: 'cvs',
        where: { user: { in: acceptedEmployeeIds } },
        sort: '-updatedAt',
        limit: 6,
        depth: 1,
        overrideAccess: true,
      })

      recentCvs = cvResult.docs.map((cv: any) => {
        const employeeId = typeof cv.user === 'object' ? cv.user?.id : cv.user
        const employeeName = typeof cv.user === 'object' ? cv.user?.name : undefined
        return {
          id: String(cv.id),
          name: cv.name,
          template: cv.template,
          updatedAt: cv.updatedAt,
          employeeId: String(employeeId),
          employeeName: employeeName || 'Unknown',
          skillsCount: Array.isArray(cv.skills) ? cv.skills.length : 0,
          experienceCount: Array.isArray(cv.experience) ? cv.experience.length : 0,
        }
      })
    }

    return NextResponse.json(
      {
        employeeStats: {
          accepted: accepted.length,
          pending: pending.length,
          declined: declined.length,
        },
        recentCvs,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('❌ Failed to load manager dashboard data:', error)
    return NextResponse.json({ message: 'Failed to load dashboard data' }, { status: 500 })
  }
}
