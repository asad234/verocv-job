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

// GET — list an accepted employee's cover letters (read-only)
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
      collection: 'coverLetters',
      where: { user: { equals: employeeId } },
      sort: '-createdAt',
      limit: 100,
      depth: 1,
      overrideAccess: true,
    })

    return NextResponse.json({ data: result.docs }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to load employee cover letters:', error)
    return NextResponse.json({ message: 'Failed to load cover letters' }, { status: 500 })
  }
}

// POST — manager creates a new cover letter owned by the employee.
// Same limitation as CV creation: this makes a real row, but there's no
// AI-generation/editor wiring here since that logic wasn't available to see.
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

    const body = (await req.json()) as {
      jobTitle?: string
      companyName?: string
      jobDescription?: string
      content?: string
      tone?: 'professional' | 'enthusiastic' | 'formal' | 'casual'
      cvId?: string
    }

    if (!body.jobTitle?.trim()) {
      return NextResponse.json({ message: 'Job title is required' }, { status: 400 })
    }
    if (!body.content?.trim()) {
      return NextResponse.json({ message: 'Content is required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    const allowed = await requireAcceptedEmployee(payload, managerId, employeeId)
    if (!allowed) {
      return NextResponse.json(
        { message: 'This employee has not accepted an invitation from you' },
        { status: 403 },
      )
    }

    const created = await payload.create({
      collection: 'coverLetters',
      data: {
        user: employeeId,
        jobTitle: body.jobTitle.trim(),
        companyName: body.companyName || '',
        jobDescription: body.jobDescription || '',
        content: body.content.trim(),
        tone: body.tone || 'professional',
        cv: body.cvId ? Number(body.cvId) : undefined,
      },
      overrideAccess: true,
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('❌ Failed to create cover letter for employee:', error)
    return NextResponse.json({ message: 'Failed to create cover letter' }, { status: 500 })
  }
}
