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

// GET — list employees who have accepted this manager's invitation
// (i.e. whose portfolios this manager is allowed to view)
export async function GET(req: NextRequest) {
  try {
    const managerId = await requireManagerId(req)
    if (managerId === null) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    }

    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'employee-invitations',
      where: {
        and: [{ manager: { equals: managerId } }, { status: { equals: 'accepted' } }],
      },
      sort: '-respondedAt',
      limit: 100,
      overrideAccess: true,
    })

    const data = result.docs.map((doc: any) => {
      const employeeId = typeof doc.employee === 'object' ? doc.employee?.id : doc.employee
      const employeeName = typeof doc.employee === 'object' ? doc.employee?.name : undefined
      return {
        employeeId: String(employeeId),
        employeeName: employeeName || '',
        employeeEmail: doc.employeeEmail,
        acceptedAt: doc.respondedAt ?? null,
      }
    })

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to list accepted employees:', error)
    return NextResponse.json({ message: 'Failed to load employees' }, { status: 500 })
  }
}
