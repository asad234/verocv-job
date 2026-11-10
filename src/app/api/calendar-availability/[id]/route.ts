// FILE LOCATION:  src/app/api/calendar-availability/[id]/route.ts   (REPLACE — only your own calendar)
// PATCH { dateStatus } · DELETE ("Clear calendar")
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/authOptions'

type Ctx = { params: Promise<{ id: string }> }
const relId = (v: any) => (v && typeof v === 'object' ? v.id : v)

async function ownDoc(id: string) {
  const session = await getServerSession(authOptions)
  const userId = Number((session?.user as any)?.id)
  if (!Number.isFinite(userId) || userId <= 0)
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const payload = await getPayload({ config })
  const doc: any = await payload.findByID({
    collection: 'availability',
    id,
    depth: 0,
    overrideAccess: true,
    disableErrors: true,
  })
  if (!doc || Number(relId(doc.user)) !== userId)
    return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  return { payload, doc }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const r = await ownDoc(id)
    if ('error' in r) return r.error
    const body = await req.json().catch(() => null)
    if (!body || !Array.isArray(body.dateStatus))
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 })
    const updated = await r.payload.update({
      collection: 'availability',
      id,
      data: { dateStatus: body.dateStatus } as any,
      overrideAccess: true,
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating calendar availability:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const r = await ownDoc(id)
    if ('error' in r) return r.error
    await r.payload.delete({ collection: 'availability', id, overrideAccess: true })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting availability:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
