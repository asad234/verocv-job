// FILE LOCATION:  src/app/api/calendar-availability/route.ts   (REPLACE — now only your own calendar)
// GET  ?userId=&year=  → your calendar (other users' calendars are no longer readable here)
// POST { dateStatus }  → saves YOUR calendar (the `user` in the body is ignored — it's always you)
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/authOptions'

const STATUSES = ['booked', 'available', 'vacation', 'none']

async function me() {
  const session = await getServerSession(authOptions)
  const id = Number((session?.user as any)?.id)
  return Number.isFinite(id) && id > 0 ? id : null
}

export async function GET(req: NextRequest) {
  try {
    const userId = await me()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const asked = req.nextUrl.searchParams.get('userId')
    if (asked && Number(asked) !== userId) return NextResponse.json({ docs: [] })
    const year = req.nextUrl.searchParams.get('year')

    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'availability',
      where: { user: { equals: userId } },
      limit: 1,
      overrideAccess: true,
    })
    if (!result.docs.length) return NextResponse.json({ docs: [] })
    const doc: any = result.docs[0]
    if (year) {
      const dateStatus = (doc.dateStatus || []).filter((ds: any) =>
        String(ds.date ?? '').startsWith(`${year}-`),
      )
      return NextResponse.json({ docs: [{ ...doc, dateStatus }] })
    }
    return NextResponse.json({ docs: [doc] })
  } catch (error) {
    console.error('Error fetching calendar availability:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await me()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json().catch(() => null)
    if (!body || !Array.isArray(body.dateStatus))
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 })

    // One entry per day ("none" = cleared).
    const byDay = new Map<string, string>()
    for (const e of body.dateStatus) {
      const day = String(e?.date ?? '').slice(0, 10)
      if (/^\d{4}-\d{2}-\d{2}$/.test(day) && STATUSES.includes(e?.status)) byDay.set(day, e.status)
    }
    const dateStatus = [...byDay]
      .filter(([, s]) => s !== 'none')
      .map(([date, status]) => ({ date, status }))

    const payload = await getPayload({ config })
    const existing = await payload.find({
      collection: 'availability',
      where: { user: { equals: userId } },
      limit: 1,
      overrideAccess: true,
    })
    const saved = existing.docs.length
      ? await payload.update({
          collection: 'availability',
          id: existing.docs[0]!.id,
          data: { dateStatus } as any,
          overrideAccess: true,
        })
      : await payload.create({
          collection: 'availability',
          data: { user: userId, dateStatus } as any,
          overrideAccess: true,
        })
    return NextResponse.json(saved)
  } catch (error) {
    console.error('Error saving calendar availability:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
