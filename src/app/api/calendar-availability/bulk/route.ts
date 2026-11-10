// FILE LOCATION:  src/app/api/calendar-availability/bulk/route.ts   (REPLACE)
// POST { updates: [{ date, status }] } — the days you dragged over in the calendar.
// Fix: days are matched on YYYY-MM-DD (saved dates come back as full timestamps, so the
// old exact match added a second entry for the same day). "none" removes the day.
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/authOptions'

const STATUSES = ['booked', 'available', 'vacation', 'none']

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = Number((session?.user as any)?.id)
    if (!Number.isFinite(userId) || userId <= 0)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null)
    const updates = Array.isArray(body?.updates) ? body.updates : null
    if (!updates) return NextResponse.json({ error: 'Updates are required' }, { status: 400 })

    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'availability',
      where: { user: { equals: userId } },
      limit: 1,
      overrideAccess: true,
    })
    let doc: any = docs[0]
    if (!doc)
      doc = await payload.create({
        collection: 'availability',
        data: { user: userId, dateStatus: [] } as any,
        overrideAccess: true,
      })

    const byDay = new Map<string, string>()
    for (const e of doc.dateStatus ?? []) byDay.set(String(e.date).slice(0, 10), e.status)
    for (const u of updates) {
      const day = String(u?.date ?? '').slice(0, 10)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !STATUSES.includes(u?.status)) continue
      if (u.status === 'none') byDay.delete(day)
      else byDay.set(day, u.status)
    }
    const dateStatus = [...byDay].map(([date, status]) => ({ date, status }))
    const result = await payload.update({
      collection: 'availability',
      id: doc.id,
      data: { dateStatus } as any,
      overrideAccess: true,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error performing bulk update:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
