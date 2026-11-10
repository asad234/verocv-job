// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/managers/[id]/route.ts   (NEW)
// URL:            GET    /api/company/admin/managers/:id   → { data: ManagerProfile }
//                 PATCH  /api/company/admin/managers/:id   body: Partial<ManagerEditInput> → { data }
//                 DELETE /api/company/admin/managers/:id   body: { reason, note?, confirm }
//                        confirm must be exactly "delete manager <First Last>" (case-insensitive)
// WHAT IT DOES:   One manager of the logged-in business admin.
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  DELETE_REASONS,
  deletePhrase,
  phraseMatches,
  type ManagerStatus,
} from '@/utils/adminManagers'
import {
  deleteManagerCompletely,
  findManagerInfo,
  findOwnManager,
  requireCompanyAdmin,
  toProfile,
  toRow,
} from '@/utils/server/adminmanagers'

type Ctx = { params: Promise<{ id: string }> }
const noStore = { 'Cache-Control': 'private, no-store' }
const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined)
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 254
const STATUSES: ManagerStatus[] = ['active', 'inactive', 'pending']

async function load(req: NextRequest, ctx: Ctx) {
  const admin = await requireCompanyAdmin(req)
  if (!admin) return { error: NextResponse.json({ message: 'Not authorized' }, { status: 403 }) }
  const { id } = await ctx.params
  const payload = await getPayload({ config })
  const manager = await findOwnManager(payload, admin, id)
  if (!manager)
    return { error: NextResponse.json({ message: 'Manager not found' }, { status: 404 }) }
  return { admin, payload, manager }
}

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const r = await load(req, ctx)
    if ('error' in r) return r.error
    return NextResponse.json(
      { data: await toProfile(r.payload, r.manager) },
      { status: 200, headers: noStore },
    )
  } catch (error) {
    console.error('❌ Failed to load manager:', error)
    return NextResponse.json({ message: 'Failed to load manager' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const r = await load(req, ctx)
    if ('error' in r) return r.error
    const { payload, manager } = r
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ message: 'Invalid request' }, { status: 400 })

    const firstName = str(body.firstName, 80)
    const lastName = str(body.lastName, 80)
    const email = str(body.email, 254)?.toLowerCase()
    const privateEmail = str(body.privateEmail, 254)?.toLowerCase()
    const status = str(body.status, 20) as ManagerStatus | undefined

    const fieldErrors: Record<string, string> = {}
    if (firstName !== undefined && !firstName) fieldErrors.firstName = 'required'
    if (lastName !== undefined && !lastName) fieldErrors.lastName = 'required'
    if (email !== undefined && !isEmail(email)) fieldErrors.email = email ? 'invalid' : 'required'
    if (privateEmail && !isEmail(privateEmail)) fieldErrors.privateEmail = 'invalid'
    if (status !== undefined && !STATUSES.includes(status)) fieldErrors.status = 'invalid'
    if (email && email !== String(manager.email).toLowerCase()) {
      const { docs } = await payload.find({
        collection: 'users',
        where: { email: { equals: email } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      if ((docs as any[]).some((d) => String(d.id) !== String(manager.id)))
        fieldErrors.email = 'taken'
    }
    if (Object.keys(fieldErrors).length)
      return NextResponse.json(
        { message: 'Please check the highlighted fields', fieldErrors },
        { status: 400 },
      )

    // users: login email, name, access, status
    const info = await findManagerInfo(payload, manager.id)
    const first = firstName ?? info?.firstName ?? String(manager.name || '').split(' ')[0]
    const last =
      lastName ??
      info?.lastName ??
      String(manager.name || '')
        .split(' ')
        .slice(1)
        .join(' ')
    const userData: Record<string, unknown> = { name: `${first} ${last}`.trim() }
    if (email !== undefined) userData.email = email
    if (body.accessLevel !== undefined) userData.accessLevel = str(body.accessLevel, 60) ?? ''
    if (status !== undefined) userData.status = status
    // authType is passed along: the Users beforeValidate hook resets it when missing.
    await payload.update({
      collection: 'users',
      id: manager.id,
      data: { ...userData, authType: manager.authType || 'credentials' } as any,
      overrideAccess: true,
    })

    // manager-info: the manager's own settings record
    const infoData: Record<string, unknown> = { firstName: first, lastName: last }
    if (email !== undefined) infoData.email = email
    if (privateEmail !== undefined) infoData.privateEmail = privateEmail || null
    for (const k of ['phone', 'mobilePhone', 'jobTitle'] as const)
      if (body[k] !== undefined) infoData[k] = str(body[k], 120) ?? ''
    if (body.department !== undefined)
      infoData.department = {
        ...(info?.department ?? {}),
        department: str(body.department, 120) ?? '',
      }
    if (info)
      await payload.update({
        collection: 'manager-info',
        id: info.id,
        data: infoData as any,
        overrideAccess: true,
      })
    else
      await payload.create({
        collection: 'manager-info',
        data: { user: manager.id, ...infoData } as any,
        overrideAccess: true,
      })

    const fresh = await payload.findByID({
      collection: 'users',
      id: manager.id,
      depth: 0,
      overrideAccess: true,
    })
    return NextResponse.json(
      { data: await toProfile(payload, fresh) },
      { status: 200, headers: noStore },
    )
  } catch (error) {
    console.error('❌ Failed to update manager:', error)
    return NextResponse.json({ message: 'Failed to update manager' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const r = await load(req, ctx)
    if ('error' in r) return r.error
    const { admin, payload, manager } = r
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null

    const reason = str(body?.reason, 40)
    const note = str(body?.note, 1000) ?? ''
    const confirm = str(body?.confirm, 300) ?? ''
    const name = toRow(manager, await findManagerInfo(payload, manager.id)).name

    if (!reason || !(DELETE_REASONS as readonly string[]).includes(reason))
      return NextResponse.json(
        { message: 'Choose why the manager is being deleted', fieldErrors: { reason: 'required' } },
        { status: 400 },
      )
    if (reason === 'other' && !note)
      return NextResponse.json(
        { message: 'Describe the reason', fieldErrors: { note: 'required' } },
        { status: 400 },
      )
    if (!phraseMatches(confirm, name))
      return NextResponse.json(
        {
          message: `Type "${deletePhrase(name)}" to confirm`,
          fieldErrors: { confirm: 'mismatch' },
        },
        { status: 400 },
      )

    const removed = await deleteManagerCompletely(payload, Number(manager.id))

    // Who / why / when — best effort (works once ManagerDeletions is in payload.config).
    await payload
      .create({
        collection: 'manager-deletions',
        data: {
          managerName: name,
          managerEmail: manager.email,
          managerId: Number(manager.id),
          reason,
          note,
          deletedBy: admin.id,
          removed,
        } as any,
        overrideAccess: true,
      })
      .catch((e: any) =>
        console.warn('⚠️ Manager deleted, but the deletion log was not saved:', e?.message),
      )

    console.log(
      `🗑️ Manager ${name} <${manager.email}> deleted by admin ${admin.id} (reason: ${reason})`,
    )
    return NextResponse.json({ ok: true, removed }, { status: 200, headers: noStore })
  } catch (error) {
    console.error('❌ Failed to delete manager:', error)
    return NextResponse.json({ message: 'Failed to delete manager' }, { status: 500 })
  }
}
