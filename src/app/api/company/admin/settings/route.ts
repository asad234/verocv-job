// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/settings/route.ts   (NEW)
// URL:            GET · PUT  /api/company/admin/settings
// WHAT IT DOES:   The business admin's own settings (collection "business-admin-info"):
//   GET → { data: { loginEmail, firstName, lastName, phone, jobTitle, company: {...} } }
//   PUT → body { firstName?, lastName?, phone?, jobTitle?, company?: {...} } → same shape
//   • Creates the record the first time (one per user), only whitelisted fields are saved.
//   • First + last name are also saved as the account name (shown in the header, chats…).
//   • Company logo: a PNG/JPEG/WebP/SVG data URL (≤ 1.5 MB) in company.companyLogo.staticImage,
//     or "" to remove it.
//   Password changes: /api/user/password (ChangePasswordForm).
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { relId, requireCompanyAdmin } from '@/utils/server/adminmanagers'

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined)
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
const LOGO_RE = /^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/
const MAX_LOGO_CHARS = 2_000_000 // ≈ 1.5 MB image

const COMPANY_KEYS = [
  'companyName',
  'orgNumber',
  'industry',
  'companySize',
  'companyEmail',
  'companyPhone',
  'companyWebsite',
  'companyAddress',
] as const

async function findInfo(payload: any, userId: number) {
  const { docs } = await payload.find({
    collection: 'business-admin-info',
    where: { user: { equals: userId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return (docs as any[])[0] ?? null
}

function toDto(user: any, info: any) {
  const c = info?.company ?? {}
  const [first, ...rest] = String(user?.name ?? '')
    .trim()
    .split(/\s+/)
  return {
    loginEmail: user?.email ?? '',
    firstName: info?.firstName || first || '',
    lastName: info?.lastName || rest.join(' '),
    phone: info?.phone ?? '',
    jobTitle: info?.jobTitle ?? '',
    company: {
      companyName: c.companyName ?? '',
      orgNumber: c.orgNumber ?? '',
      industry: c.industry ?? '',
      companySize: c.companySize ?? '',
      companyEmail: c.companyEmail ?? '',
      companyPhone: c.companyPhone ?? '',
      companyWebsite: c.companyWebsite ?? '',
      companyAddress: c.companyAddress ?? '',
      logo: c.companyLogo?.staticImage || null,
    },
  }
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireCompanyAdmin(req)
    if (!admin) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    const payload = await getPayload({ config })
    const [user, info] = await Promise.all([
      payload.findByID({ collection: 'users', id: admin.id, depth: 0, overrideAccess: true }),
      findInfo(payload, admin.id),
    ])
    return NextResponse.json(
      { data: toDto(user, info) },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to load admin settings:', error)
    return NextResponse.json({ message: 'Failed to load settings' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireCompanyAdmin(req)
    if (!admin) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object')
      return NextResponse.json({ message: 'Invalid body' }, { status: 400 })

    const data: Record<string, any> = {}
    for (const k of ['firstName', 'lastName', 'jobTitle'] as const) {
      if (k in body) {
        const v = str(body[k], 120)
        if (!v)
          return NextResponse.json({ message: 'This field is required', field: k }, { status: 400 })
        data[k] = v
      }
    }
    if ('phone' in body) data.phone = str(body.phone, 40) ?? ''

    const payload = await getPayload({ config })
    const existing = await findInfo(payload, admin.id)

    if (body.company && typeof body.company === 'object') {
      const company: Record<string, any> = { ...(existing?.company ?? {}) }
      delete company.id
      for (const k of COMPANY_KEYS) {
        if (k in body.company)
          company[k] = str(body.company[k], k === 'companyAddress' ? 300 : 200) ?? ''
      }
      if (!company.companyName)
        return NextResponse.json(
          { message: 'Company name is required', field: 'companyName' },
          { status: 400 },
        )
      if (company.companyEmail && !isEmail(company.companyEmail)) {
        return NextResponse.json(
          { message: 'Enter a valid company email', field: 'companyEmail' },
          { status: 400 },
        )
      }
      if ('logo' in body.company) {
        const logo = body.company.logo
        if (logo === '' || logo === null) {
          company.companyLogo = { ...(company.companyLogo ?? {}), staticImage: null }
        } else if (
          typeof logo === 'string' &&
          logo.length <= MAX_LOGO_CHARS &&
          LOGO_RE.test(logo)
        ) {
          company.companyLogo = { ...(company.companyLogo ?? {}), staticImage: logo }
        } else if (typeof logo === 'string' && logo.startsWith('data:')) {
          return NextResponse.json(
            {
              message: 'The logo must be a PNG, JPG, WebP or SVG image under 1.5 MB',
              field: 'logo',
            },
            { status: 400 },
          )
        }
        // A plain URL (the logo already saved) is left as it is.
        if (company.companyLogo) {
          delete company.companyLogo.id
          company.companyLogo.uploadImage = relId(company.companyLogo.uploadImage) ?? null
        }
      }
      data.company = company
    }

    // Create the record the first time; a hook elsewhere may create it at the same moment — retry as update.
    let saved: any = null
    for (let attempt = 0; attempt < 3 && !saved; attempt++) {
      const current = attempt === 0 ? existing : await findInfo(payload, admin.id)
      try {
        saved = current
          ? await payload.update({
              collection: 'business-admin-info',
              id: current.id,
              data,
              overrideAccess: true,
            })
          : await payload.create({
              collection: 'business-admin-info',
              data: { ...data, user: admin.id },
              overrideAccess: true,
            })
      } catch (e) {
        if (attempt === 2) throw e
        await new Promise((r) => setTimeout(r, 150))
      }
    }

    // Keep the account name in step (header, chats, contracts show it).
    let user: any = await payload.findByID({
      collection: 'users',
      id: admin.id,
      depth: 0,
      overrideAccess: true,
    })
    const fullName = [saved?.firstName, saved?.lastName].filter(Boolean).join(' ').trim()
    if (fullName && fullName !== user?.name) {
      user = await payload
        .update({
          collection: 'users',
          id: admin.id,
          data: { name: fullName } as any,
          overrideAccess: true,
        })
        .catch(() => user)
    }
    return NextResponse.json({ data: toDto(user, saved) }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to save admin settings:', error)
    return NextResponse.json({ message: 'Failed to save settings' }, { status: 500 })
  }
}
