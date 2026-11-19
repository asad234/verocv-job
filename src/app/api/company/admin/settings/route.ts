// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/settings/route.ts   (REPLACE)
// URL:            GET · PUT  /api/company/admin/settings
// WHAT IT DOES:   The business admin's own settings (collection "business-admin-info"):
//   GET → { data: { loginEmail, firstName, lastName, phone, jobTitle, avatar, company: {...} } }
//   PUT → body { firstName?, lastName?, phone?, jobTitle?, company?: {...} } → same shape
//   • Creates the record the first time (one per user), only whitelisted fields are saved.
//   • First + last name are also saved as the account name (shown in the header, chats…).
//   • Phone numbers: digits only (may start with +), 6–15 digits → otherwise 400 with `field`.
//     Spaces / dashes from older saved numbers are removed automatically.
//   • Company logo: the page may still send a data URL ("data:image/png;base64,…").
//     It is now uploaded to the media collection (S3) and only its URL is stored —
//     a whole image inside a text field is too long and fails Payload's validation.
//     JPG / PNG / GIF / WebP, max 2 MB. "" or null removes the logo.
//     An old logo that was saved as a data URL is moved to media on the next save.
//   • A logo problem never blocks the rest: if the image can't be uploaded (wrong type,
//     too big, storage down) everything else is saved and the reply has
//     `warning` + `warningField: "logo"`.
//   Password changes: /api/user/password (ChangePasswordForm).
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { relId, requireCompanyAdmin } from '@/utils/server/adminmanagers'
import { isValidPhone, sanitizePhone } from '@/utils/phone'
import { deleteMediaQuietly, imageFromDataUrl, saveImage } from '@/utils/server/imageUpload'

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined)
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
const bad = (message: string, field: string) => {
  console.warn(`⚠️ Admin settings not saved — ${field}: ${message}`)
  return NextResponse.json({ message, field }, { status: 400 })
}

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
    avatar: info?.avatar?.staticImage || null, // profile photo (uploaded via /settings/avatar)
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

/** Data URL → media upload. Returns the new logo value, or an error message (never throws). */
async function uploadLogo(
  payload: any,
  dataUrl: string,
): Promise<{ uploadImage: number; staticImage: string } | { error: string }> {
  const img = imageFromDataUrl(dataUrl, 'company-logo')
  if ('error' in img) return img
  try {
    const saved = await saveImage(payload, img, 'Company logo')
    return { uploadImage: saved.id, staticImage: saved.url }
  } catch (e) {
    console.error('⚠️ Company logo upload failed (the rest is still saved):', e)
    return { error: 'The logo could not be uploaded right now — the other changes were saved' }
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
        if (!v) return bad('This field is required', k)
        data[k] = v
      }
    }
    if ('phone' in body) {
      const phone = sanitizePhone(str(body.phone, 40) ?? '').trim()
      if (!isValidPhone(phone))
        return bad('Enter a valid phone number (6–15 digits only, may start with +)', 'phone')
      data.phone = phone
    }

    const payload = await getPayload({ config })
    const existing = await findInfo(payload, admin.id)
    let oldLogoMedia: unknown = null // deleted after a successful save when the logo changed
    let warning: string | null = null // a logo problem — reported, but the rest is saved

    if (body.company && typeof body.company === 'object') {
      const company: Record<string, any> = { ...(existing?.company ?? {}) }
      delete company.id
      for (const k of COMPANY_KEYS) {
        if (k in body.company)
          company[k] = str(body.company[k], k === 'companyAddress' ? 300 : 200) ?? ''
      }
      if (!company.companyName) return bad('Company name is required', 'companyName')
      if (company.companyEmail && !isEmail(company.companyEmail))
        return bad('Enter a valid company email', 'companyEmail')
      company.companyPhone = sanitizePhone(company.companyPhone ?? '').trim()
      if (!isValidPhone(company.companyPhone)) {
        return bad(
          'Enter a valid company phone number (6–15 digits only, may start with +)',
          'companyPhone',
        )
      }

      const logo = { ...(company.companyLogo ?? {}) }
      delete logo.id
      logo.uploadImage = relId(logo.uploadImage) ?? null

      if ('logo' in body.company) {
        const sent = body.company.logo
        if (sent === '' || sent === null) {
          oldLogoMedia = logo.uploadImage
          logo.uploadImage = null
          logo.staticImage = null
        } else if (typeof sent === 'string' && sent.startsWith('data:')) {
          const up = await uploadLogo(payload, sent)
          if ('error' in up) {
            warning = up.error // keep the logo as it was
          } else {
            oldLogoMedia = logo.uploadImage
            Object.assign(logo, up)
          }
        }
        // A plain URL (the logo already saved) is left as it is.
      }
      // Older records kept the whole image in staticImage — move it to media now,
      // otherwise Payload refuses the save ("Static Logo URL" too long).
      if (typeof logo.staticImage === 'string' && logo.staticImage.startsWith('data:')) {
        const up = await uploadLogo(payload, logo.staticImage)
        if ('error' in up) {
          // Can't move it right now — drop the oversized copy so the rest can be saved.
          logo.staticImage = null
          warning =
            warning ?? 'Your old logo could not be moved to storage — please upload it again'
        } else {
          Object.assign(logo, up)
        }
      }
      company.companyLogo = logo
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
      } catch (e: any) {
        // A validation problem won't go away by retrying — tell the page which field.
        if (e?.name === 'ValidationError' || e?.status === 400) {
          const errors = e?.data?.errors ?? []
          return bad(
            errors
              .map((x: any) => `${x.path}: ${x.message}`)
              .filter(Boolean)
              .join(' · ') || 'Some fields are invalid',
            errors[0]?.path ?? '',
          )
        }
        if (attempt === 2) throw e
        await new Promise((r) => setTimeout(r, 150))
      }
    }
    if (oldLogoMedia !== null) await deleteMediaQuietly(payload, oldLogoMedia)

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
    return NextResponse.json(
      { data: toDto(user, saved), ...(warning ? { warning, warningField: 'logo' } : {}) },
      { status: 200 },
    )
  } catch (error) {
    console.error('❌ Failed to save admin settings:', error)
    return NextResponse.json({ message: 'Failed to save settings' }, { status: 500 })
  }
}
