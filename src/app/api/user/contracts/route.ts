// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/user/contracts/route.ts
// URL:            GET  /api/user/contracts
// WHAT IT DOES:   Employee: list contracts sent to me (GET). Also used by the notification bell.
//
// If your app folder has no "(frontend)" group, use the same path without it:
//   src/app/api/user/contracts/route.ts
// (Folders in parentheses don't change the URL. "[id]" is a real folder name.)
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getPayload } from 'payload'
import config from '@payload-config'

async function requireUserId(req: NextRequest): Promise<number | null> {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.PAYLOAD_SECRET,
  })
  if (!token?.id) return null
  const id = Number(token.id)
  return Number.isFinite(id) ? id : null
}

const relId = (v: any) => (v == null ? null : typeof v === 'object' ? v.id : v)

// GET — contracts addressed to the logged-in employee (never drafts),
// newest first. Used by the Contracts page and the notification bell.
export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId(req)
    if (userId === null) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'employee-contracts',
      where: {
        and: [{ employee: { equals: userId } }, { status: { not_equals: 'draft' } }],
      },
      sort: '-createdAt',
      limit: 100,
      depth: 0,
      overrideAccess: true,
    })
    const docs = result.docs as any[]

    if (docs.length === 0) return NextResponse.json({ data: [] }, { status: 200 })

    const contractIds = docs.map((d) => d.id)
    const managerIds = [...new Set(docs.map((d) => relId(d.manager)).filter((v) => v != null))]

    const [contentResult, managersResult] = await Promise.all([
      payload.find({
        collection: 'contract-documents',
        where: { contract: { in: contractIds } },
        limit: contractIds.length,
        depth: 0,
        overrideAccess: true,
      }),
      managerIds.length > 0
        ? payload.find({
            collection: 'users',
            where: { id: { in: managerIds } },
            limit: managerIds.length,
            depth: 0,
            overrideAccess: true,
          })
        : Promise.resolve({ docs: [] as any[] }),
    ])

    const contentByContract = new Map<string, any>(
      (contentResult.docs as any[]).map((c) => [String(relId(c.contract)), c]),
    )
    const managerNames = new Map<string, string>(
      (managersResult.docs as any[]).map((u) => [String(u.id), u.name ?? '']),
    )

    // Every field the frontend reads must be listed here explicitly.
    const data = docs.map((d) => {
      const content = contentByContract.get(String(d.id))
      const sentEvents = (d.history ?? []).filter((h: any) => h?.type === 'sent')
      return {
        id: String(d.id),
        title: d.title ?? '',
        status: d.status,
        // Employee signed, employer hasn't → "waiting for employer", whatever was stored.
        displayStatus:
          d.signedAt && !d.managerSignedAt && d.status !== 'terminated'
            ? 'pending_manager_signature'
            : (d.displayStatus ?? d.status),
        contractType: d.contractType,
        employmentExtent: d.employmentExtent,
        startDate: d.startDate ?? null,
        endDate: d.endDate ?? null,
        signingMethod: d.signingMethod ?? null,
        signedAt: d.signedAt ?? null,
        managerSignedAt: d.managerSignedAt ?? null, // ← needed for "fully signed" + the bell
        sentAt: sentEvents.length > 0 ? sentEvents[sentEvents.length - 1].date : null,
        companyName: content?.companyName ?? '',
        positionTitle: content?.positionTitle || d.employeeTitle || '',
        managerName: managerNames.get(String(relId(d.manager))) ?? '',
      }
    })

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to load employee contracts:', error)
    return NextResponse.json({ message: 'Failed to load contracts' }, { status: 500 })
  }
}
