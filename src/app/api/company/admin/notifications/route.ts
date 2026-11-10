// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/notifications/route.ts   (REPLACE — adds time off)
// URL:            GET /api/company/admin/notifications → { data: AdminNotice[] }
// WHAT IT DOES:   What the business admin's bell shows (newest first):
//   • contract_to_sign  a manager has signed your contract → sign it to complete it
//   • employee_joined   an employee accepted an invitation from one of your managers
//   • employee_left     an employee removed a manager's access
//   • cover_started / cover_ended   substitute arrangements between your managers
//   • time_off_request  a manager asks for days off → decide it (stays until handled)
//   • time_off_reported a manager reported sick / VAB
//   Only your own managers (a platform admin: all). Events from the last 14 days.
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { relId, requireCompanyAdmin } from '@/utils/server/adminmanagers'
import { adminManagerNames } from '@/utils/server/adminEmployees'
import type { AdminNotice } from '@/utils/adminNotifications'

const WINDOW_MS = 14 * 24 * 60 * 60 * 1000

export async function GET(req: NextRequest) {
  try {
    const admin = await requireCompanyAdmin(req)
    if (!admin) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    const payload = await getPayload({ config })
    const since = new Date(Date.now() - WINDOW_MS).toISOString()

    const managers = await adminManagerNames(payload, admin)
    const managerIds = [...managers.keys()]
    const mName = (id: unknown) => managers.get(String(relId(id))) ?? ''

    const [contractsRes, invitesRes, delegationsRes, timeOffRes] = await Promise.all([
      // Your contracts to managers: the manager signed, you haven't yet.
      payload.find({
        collection: 'employee-contracts',
        where: {
          and: [
            { manager: { equals: admin.id } },
            { signedAt: { exists: true } },
            { managerSignedAt: { exists: false } },
            { status: { not_equals: 'terminated' } },
          ],
        },
        sort: '-signedAt',
        limit: 50,
        depth: 0,
        overrideAccess: true,
      }),
      managerIds.length
        ? payload.find({
            collection: 'employee-invitations',
            where: {
              and: [
                { manager: { in: managerIds } },
                { respondedAt: { greater_than: since } },
                {
                  or: [
                    { status: { equals: 'accepted' } },
                    {
                      and: [
                        { status: { equals: 'declined' } },
                        { revokedBy: { equals: 'employee' } },
                      ],
                    },
                  ],
                },
              ],
            },
            sort: '-respondedAt',
            limit: 100,
            depth: 0,
            overrideAccess: true,
          })
        : { docs: [] },
      managerIds.length
        ? payload
            .find({
              collection: 'manager-delegations',
              where: {
                and: [
                  { owner: { in: managerIds } },
                  {
                    or: [
                      { respondedAt: { greater_than: since } },
                      { endedAt: { greater_than: since } },
                    ],
                  },
                ],
              },
              limit: 100,
              depth: 0,
              overrideAccess: true,
            })
            .catch(() => ({ docs: [] }))
        : { docs: [] },
      // Days off: everything pending + sick / VAB reported in the window.
      managerIds.length
        ? payload
            .find({
              collection: 'time-off-requests',
              where: {
                and: [
                  { manager: { in: managerIds } },
                  {
                    or: [
                      { status: { equals: 'pending' } },
                      {
                        and: [
                          { status: { equals: 'approved' } },
                          { type: { in: ['sick', 'vab'] } },
                          { createdAt: { greater_than: since } },
                        ],
                      },
                    ],
                  },
                ],
              },
              sort: '-createdAt',
              limit: 100,
              depth: 0,
              overrideAccess: true,
            })
            .catch(() => ({ docs: [] }))
        : { docs: [] },
    ])

    // Employee names: personal information first, then the account.
    const invites = invitesRes.docs as any[]
    const empIds = [
      ...new Set(
        invites
          .map((i) => relId(i.employee))
          .filter((v) => v != null)
          .map(String),
      ),
    ]
    const [users, infos] = empIds.length
      ? await Promise.all([
          payload.find({
            collection: 'users',
            where: { id: { in: empIds } },
            limit: empIds.length,
            depth: 0,
            overrideAccess: true,
          }),
          payload
            .find({
              collection: 'personal-information',
              where: { user: { in: empIds } },
              limit: empIds.length * 2,
              depth: 0,
              overrideAccess: true,
            })
            .catch(() => ({ docs: [] })),
        ])
      : [{ docs: [] }, { docs: [] }]
    const userBy = new Map((users.docs as any[]).map((u) => [String(u.id), u]))
    const infoBy = new Map((infos.docs as any[]).map((p) => [String(relId(p.user)), p]))
    const eName = (id: unknown, fallback = '') => {
      const key = String(relId(id))
      const p: any = infoBy.get(key)
      const u: any = userBy.get(key)
      return (
        [p?.firstName, p?.lastName].filter(Boolean).join(' ').trim() ||
        u?.name ||
        u?.email ||
        fallback
      )
    }

    const data: AdminNotice[] = []

    for (const c of contractsRes.docs as any[]) {
      data.push({
        key: `contract_to_sign:${c.id}`,
        kind: 'contract_to_sign',
        at: c.signedAt,
        persistent: true,
        contractId: String(c.id),
        contractTitle: c.title ?? '',
        managerId: relId(c.employee) != null ? String(relId(c.employee)) : undefined,
        managerName: c.signedByName || c.employeeName || mName(c.employee),
      })
    }

    for (const i of invites) {
      const joined = i.status === 'accepted'
      data.push({
        key: `${joined ? 'employee_joined' : 'employee_left'}:${i.id}:${i.respondedAt}`,
        kind: joined ? 'employee_joined' : 'employee_left',
        at: i.respondedAt,
        persistent: false,
        managerId: String(relId(i.manager)),
        managerName: mName(i.manager),
        employeeId: relId(i.employee) != null ? String(relId(i.employee)) : undefined,
        employeeName: eName(i.employee, i.employeeEmail || i.email || ''),
      })
    }

    for (const d of delegationsRes.docs as any[]) {
      const base = {
        persistent: false,
        managerId: String(relId(d.owner)),
        managerName: mName(d.owner),
        substituteName: mName(d.delegate) || '—',
      }
      if (
        d.respondedAt &&
        d.respondedAt > since &&
        (d.status === 'accepted' || d.status === 'ended')
      ) {
        data.push({
          ...base,
          key: `cover_started:${d.id}`,
          kind: 'cover_started',
          at: d.respondedAt,
        })
      }
      if (d.status === 'ended' && d.endedAt && d.endedAt > since) {
        data.push({ ...base, key: `cover_ended:${d.id}`, kind: 'cover_ended', at: d.endedAt })
      }
    }

    for (const r of timeOffRes.docs as any[]) {
      const pending = r.status === 'pending'
      data.push({
        key: `${pending ? 'time_off_request' : 'time_off_reported'}:${r.id}`,
        kind: pending ? 'time_off_request' : 'time_off_reported',
        at: r.createdAt,
        persistent: pending,
        managerId: String(relId(r.manager)),
        managerName: mName(r.manager),
        requestId: String(r.id),
        timeOffType: r.type,
        startDate: r.startDate,
        endDate: r.endDate,
        halfDay: r.halfDay ?? 'none',
        workingDays: Number(r.workingDays ?? 0),
      })
    }

    data.sort(
      (a, b) =>
        Number(b.persistent) - Number(a.persistent) || String(b.at).localeCompare(String(a.at)),
    )
    return NextResponse.json(
      { data },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to load admin notifications:', error)
    return NextResponse.json({ message: 'Failed to load notifications' }, { status: 500 })
  }
}
