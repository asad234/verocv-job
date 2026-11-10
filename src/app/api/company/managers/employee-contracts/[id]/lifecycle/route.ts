// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/company/managers/employee-contracts/[id]/lifecycle/route.ts
// URL:            POST  /api/company/managers/employee-contracts/:id/lifecycle
// WHAT IT DOES:   Manager: renew, extend or terminate a contract (POST).
//
// If your app folder has no "(frontend)" group, use the same path without it:
//   src/app/api/company/managers/employee-contracts/[id]/lifecycle/route.ts
// (Folders in parentheses don't change the URL. "[id]" is a real folder name.)
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { relId, requireManagerId } from '@/utils/server/Contractaccess'

// POST — renew / extend / terminate.
// body: { type: 'renewed' | 'extended' | 'terminated', endDate?: string, note?: string }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const managerId = await requireManagerId(req)
    if (managerId === null) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })

    const body = (await req.json().catch(() => ({}))) as {
      type?: string
      endDate?: string
      note?: string
    }
    const type = body.type
    if (type !== 'renewed' && type !== 'extended' && type !== 'terminated') {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 })
    }

    const payload = await getPayload({ config })
    const contract: any = await payload.findByID({
      collection: 'employee-contracts',
      id,
      depth: 0,
      overrideAccess: true,
      disableErrors: true,
    })
    if (!contract || Number(relId(contract.manager)) !== managerId) {
      return NextResponse.json({ message: 'Contract not found' }, { status: 404 })
    }
    if (contract.status === 'terminated') {
      return NextResponse.json(
        { message: 'This contract has already been terminated' },
        { status: 409 },
      )
    }
    if (type === 'terminated' && contract.status === 'draft') {
      return NextResponse.json({ message: 'Delete the draft instead' }, { status: 409 })
    }
    if (type !== 'terminated' && contract.status !== 'active') {
      return NextResponse.json(
        { message: 'Only active contracts can be renewed or extended' },
        { status: 409 },
      )
    }

    let endDate: string | undefined
    if (type !== 'terminated') {
      const d = body.endDate ? new Date(body.endDate) : null
      if (!d || Number.isNaN(d.getTime())) {
        return NextResponse.json({ message: 'A valid new end date is required' }, { status: 400 })
      }
      endDate = d.toISOString()
    }

    const note =
      typeof body.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 1000) : null
    const updated = await payload.update({
      collection: 'employee-contracts',
      id,
      overrideAccess: true,
      data: {
        ...(endDate ? { endDate } : {}),
        history: [...(contract.history ?? []), { type, date: new Date().toISOString(), note }],
      } as any,
    })

    return NextResponse.json({ contract: updated }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to update contract lifecycle:', error)
    return NextResponse.json({ message: 'Failed to update contract' }, { status: 500 })
  }
}
