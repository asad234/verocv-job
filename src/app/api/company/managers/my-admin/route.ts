// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/managers/my-admin/route.ts   (NEW)
// URL:            GET /api/company/managers/my-admin
// For a manager: the business admin who created their account (users.createdBy),
// with the admin's profile photo and the company logo.
//   → { data: { id, name, jobTitle, email, phone, avatar, company: { name, logo, website, email, phone, address } } | null }
//   data is null when the manager has no business admin (e.g. created by the platform admin).
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { relId, sessionUser } from '@/utils/server/imageUpload'

export async function GET(req: NextRequest) {
  try {
    const me = await sessionUser(req)
    if (!me || me.role !== 'client-manager')
      return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    const payload = await getPayload({ config })

    const manager: any = await payload.findByID({
      collection: 'users',
      id: me.id,
      depth: 0,
      overrideAccess: true,
    })
    const adminId = relId(manager?.createdBy)
    const admin: any = adminId
      ? await payload
          .findByID({
            collection: 'users',
            id: adminId,
            depth: 0,
            overrideAccess: true,
            disableErrors: true,
          })
          .catch(() => null)
      : null
    if (!admin || admin.roles !== 'client-admin') {
      return NextResponse.json(
        { data: null },
        { headers: { 'Cache-Control': 'private, no-store' } },
      )
    }

    const { docs } = await payload.find({
      collection: 'business-admin-info',
      where: { user: { equals: admin.id } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const info: any = docs[0] ?? {}
    const c = info.company ?? {}
    const name =
      [info.firstName, info.lastName].filter(Boolean).join(' ').trim() || admin.name || admin.email

    return NextResponse.json(
      {
        data: {
          id: String(admin.id),
          name,
          jobTitle: info.jobTitle ?? '',
          email: admin.email ?? '',
          phone: info.phone ?? '',
          avatar: info.avatar?.staticImage || null,
          company: {
            name: c.companyName ?? '',
            logo: c.companyLogo?.staticImage || null,
            website: c.companyWebsite ?? '',
            email: c.companyEmail ?? '',
            phone: c.companyPhone ?? '',
            address: c.companyAddress ?? '',
          },
        },
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to load my admin:', error)
    return NextResponse.json({ message: 'Failed to load' }, { status: 500 })
  }
}
