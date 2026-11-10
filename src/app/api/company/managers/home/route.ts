// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/managers/home/route.ts   (NEW)
// URL:            GET /api/company/managers/home
// WHAT IT DOES:   What the manager sees first on Dashboard → Home (right column):
//   • today     — my status today (from My availability) + team numbers
//   • todos     — things to act on: contracts to sign / countersign, interviews that
//                 need an outcome, contracts ending soon, contracts / invitations waiting
//                 a long time, answers to my days-off requests
//   • interviews — my interviews the next 7 days (+ interviews booked WITH me)
//   • members   — my employees: contract status, CVs (+ last updated), portfolio
//                 (only what their access level lets me see; hidden items aren't counted)
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getPayload } from 'payload'
import config from '@payload-config'
import { addDaysStr, dayCell, todayStr } from '@/utils/managerAvailability'
import {
  findAvailabilityDoc,
  managerNames,
  toMyAvailability,
  toRequestDto,
} from '@/utils/server/managerAvailability'
import { managedEmployees } from '@/utils/server/teamAvailability'
import type {
  ManagerHomeData,
  HomeTodo,
  HomeInterview,
  HomeMember,
  MemberContract,
} from '@/utils/managerHome'

const ALL = { pagination: false, depth: 0, overrideAccess: true } as const
const relId = (v: any) => (v == null || v === '' ? null : typeof v === 'object' ? v.id : v)
const safeFind = (payload: any, args: any) =>
  payload.find({ ...ALL, ...args }).catch(() => ({ docs: [] }))
const DAY = 86_400_000

/** ISO → Europe/Stockholm YYYY-MM-DD */
const dayOf = (iso?: string | null) =>
  iso
    ? new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Europe/Stockholm',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(iso))
    : null

const lastSent = (c: any): string | null => {
  const s = (c.history ?? [])
    .filter((h: any) => h?.type === 'sent' && h.date)
    .map((h: any) => String(h.date))
    .sort()
  return s.length ? s[s.length - 1]! : (c.createdAt ?? null)
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || process.env.PAYLOAD_SECRET,
    })
    const me = Number(token?.id)
    if (!token?.id || !Number.isFinite(me) || token.roles !== 'client-manager') {
      return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    }
    const myEmail = typeof token.email === 'string' ? token.email.trim().toLowerCase() : ''
    const payload = await getPayload({ config })
    const now = Date.now()
    const today = todayStr()
    const nowIso = new Date(now).toISOString()
    const weekAgo = new Date(now - 7 * DAY).toISOString()
    const twoWeeksAgo = new Date(now - 14 * DAY).toISOString()
    const inAWeek = new Date(now + 7 * DAY).toISOString()

    const [invites, teamContracts, myContracts, myInterviews, withMe, timeOff, availDoc] =
      await Promise.all([
        safeFind(payload, {
          collection: 'employee-invitations',
          where: { manager: { equals: me } },
        }),
        safeFind(payload, { collection: 'employee-contracts', where: { manager: { equals: me } } }),
        // Contracts sent TO me (e.g. from my business admin)
        safeFind(payload, {
          collection: 'employee-contracts',
          where: { and: [{ employee: { equals: me } }, { status: { not_equals: 'draft' } }] },
        }),
        // My interviews: upcoming week + past two weeks (for "needs an outcome")
        safeFind(payload, {
          collection: 'interviews',
          where: {
            and: [
              { manager: { equals: me } },
              { status: { equals: 'scheduled' } },
              { startAt: { greater_than: twoWeeksAgo } },
              { startAt: { less_than: inAWeek } },
            ],
          },
          sort: 'startAt',
        }),
        // Interviews booked WITH me (by my business admin)
        safeFind(payload, {
          collection: 'interviews',
          where: {
            and: [
              { manager: { not_equals: me } },
              { status: { equals: 'scheduled' } },
              { startAt: { greater_than_equal: nowIso } },
              { startAt: { less_than: inAWeek } },
              {
                or: [
                  { employee: { equals: me } },
                  ...(myEmail ? [{ candidateEmail: { equals: myEmail } }] : []),
                ],
              },
            ],
          },
          sort: 'startAt',
        }),
        safeFind(payload, {
          collection: 'time-off-requests',
          where: {
            and: [
              { manager: { equals: me } },
              { endDate: { greater_than_equal: addDaysStr(today, -14) } },
            ],
          },
        }),
        findAvailabilityDoc(payload, me).catch(() => null),
      ])

    const todos: HomeTodo[] = []
    const inv = invites.docs as any[]
    const contracts = teamContracts.docs as any[]

    /* ── contracts from my business admin waiting for MY signature ── */
    for (const c of myContracts.docs as any[]) {
      if (c.status !== 'terminated' && !c.signedAt) {
        todos.push({
          key: `sign_my:${c.id}`,
          kind: 'sign_my_contract',
          level: 'high',
          contractId: String(c.id),
          title: c.title ?? '',
          at: lastSent(c),
        })
      }
    }
    /* ── employees signed — I countersign ── */
    for (const c of contracts) {
      if (c.status !== 'terminated' && c.status !== 'draft' && c.signedAt && !c.managerSignedAt) {
        todos.push({
          key: `countersign:${c.id}`,
          kind: 'countersign',
          level: 'high',
          contractId: String(c.id),
          title: c.title ?? '',
          name: c.signedByName || c.employeeName || '',
          at: c.signedAt,
        })
      }
    }
    /* ── interviews that happened but have no outcome ── */
    const needOutcome = (myInterviews.docs as any[]).filter(
      (v) => Date.parse(v.startAt) + Number(v.durationMinutes ?? 45) * 60_000 < now,
    )
    if (needOutcome.length) {
      todos.push({
        key: 'interview_outcome',
        kind: 'interview_outcome',
        level: 'medium',
        count: needOutcome.length,
        name: needOutcome[0].candidateName ?? '',
        at: needOutcome[0].startAt,
      })
    }
    /* ── active contracts ending within 30 days ── */
    const until = addDaysStr(today, 30)
    for (const c of contracts) {
      const end = dayOf(c.endDate)
      if (
        c.status !== 'terminated' &&
        c.signedAt &&
        c.managerSignedAt &&
        end &&
        end >= today &&
        end <= until
      ) {
        todos.push({
          key: `expiring:${c.id}`,
          kind: 'contract_expiring',
          level: 'medium',
          contractId: String(c.id),
          title: c.title ?? '',
          name: c.employeeName || '',
          at: c.endDate,
        })
      }
    }
    /* ── contracts waiting for the employee for 7+ days ── */
    const waiting = contracts.filter(
      (c) =>
        c.status !== 'terminated' &&
        c.status !== 'draft' &&
        !c.signedAt &&
        (lastSent(c) ?? nowIso) < weekAgo,
    )
    if (waiting.length)
      todos.push({
        key: 'waiting_employee',
        kind: 'waiting_employee',
        level: 'low',
        count: waiting.length,
      })
    /* ── invitations nobody answered for 7+ days ── */
    const oldInvites = inv.filter((i) => i.status === 'pending' && String(i.createdAt) < weekAgo)
    if (oldInvites.length)
      todos.push({
        key: 'invites_pending',
        kind: 'invites_pending',
        level: 'low',
        count: oldInvites.length,
      })
    /* ── my days-off requests answered in the last 7 days ── */
    for (const r of timeOff.docs as any[]) {
      if (
        (r.status === 'approved' || r.status === 'declined') &&
        r.decidedBy &&
        r.decidedAt &&
        String(r.decidedAt) > weekAgo
      ) {
        todos.push({
          key: `time_off:${r.id}:${r.status}`,
          kind: 'time_off_answered',
          level: 'low',
          title: r.type,
          at: r.startDate,
          status: r.status,
          note: r.decisionNote ?? '',
        })
      }
    }
    /* ── my employees' days-off requests waiting for me ── */
    const { employees: managed } = await managedEmployees(payload, me)
    if (managed.size) {
      const { docs: teamReqs } = await payload
        .find({
          collection: 'time-off-requests',
          where: {
            and: [{ manager: { in: [...managed.keys()] } }, { status: { equals: 'pending' } }],
          },
          sort: 'startDate',
          limit: 50,
          depth: 0,
          overrideAccess: true,
        })
        .catch(() => ({ docs: [] }))
      if (teamReqs.length)
        todos.push({
          key: 'team_time_off',
          kind: 'team_time_off',
          level: 'high',
          count: teamReqs.length,
          at: (teamReqs as any[])[0].startDate,
        })
    }
    const LEVEL = { high: 0, medium: 1, low: 2 }
    todos.sort(
      (a, b) =>
        LEVEL[a.level] - LEVEL[b.level] || String(a.at ?? '').localeCompare(String(b.at ?? '')),
    )

    /* ── interviews the next 7 days ── */
    const toItem = (v: any, withMe: boolean): HomeInterview => ({
      id: String(v.id),
      name: v.candidateName ?? '',
      position: v.position ?? '',
      startAt: v.startAt,
      durationMinutes: Number(v.durationMinutes ?? 45),
      format: v.format ?? 'video',
      meetingLink: v.meetingLink ?? null,
      location: v.format === 'in_person' ? (v.location ?? '') : '',
      withMe,
    })
    const bookers = [...new Set((withMe.docs as any[]).map((v) => String(relId(v.manager))))]
    const bookerNames = bookers.length ? await managerNames(payload, bookers) : new Map()
    const interviews = [
      ...(myInterviews.docs as any[])
        .filter((v) => Date.parse(v.startAt) + Number(v.durationMinutes ?? 45) * 60_000 >= now)
        .map((v) => toItem(v, false)),
      ...(withMe.docs as any[]).map((v) => ({
        ...toItem(v, true),
        name: bookerNames.get(String(relId(v.manager)))?.name ?? '',
      })),
    ].sort((a, b) => a.startAt.localeCompare(b.startAt))

    /* ── today + team ── */
    const avail = toMyAvailability(availDoc)
    const reqDtos = (timeOff.docs as any[])
      .filter((r) => r.status === 'approved' || r.status === 'pending')
      .map((r) => toRequestDto(r, new Map()))
    const cell = dayCell(
      today,
      avail.weekly,
      { status: avail.status, statusUntil: avail.statusUntil, today },
      reqDtos,
    )
    const team = new Set(
      inv
        .filter((i) => i.status === 'accepted' && relId(i.employee) != null)
        .map((i) => String(relId(i.employee))),
    )

    /* ── my employees ── */
    const accepted = inv.filter((i) => i.status === 'accepted' && relId(i.employee) != null)
    const memberIds = [...new Set(accepted.map((i) => String(relId(i.employee))))]
    const [mUsers, mInfos, mCvs, mPort] = memberIds.length
      ? await Promise.all([
          safeFind(payload, { collection: 'users', where: { id: { in: memberIds } } }),
          safeFind(payload, {
            collection: 'personal-information',
            where: { user: { in: memberIds } },
          }),
          safeFind(payload, {
            collection: 'cvs',
            where: { and: [{ user: { in: memberIds } }, { hidden: { not_equals: true } }] },
          }),
          safeFind(payload, {
            collection: 'portfolio',
            where: { and: [{ user: { in: memberIds } }, { hidden: { not_equals: true } }] },
          }),
        ])
      : [{ docs: [] }, { docs: [] }, { docs: [] }, { docs: [] }]
    const userBy = new Map((mUsers.docs as any[]).map((u) => [String(u.id), u]))
    const infoBy = new Map((mInfos.docs as any[]).map((p) => [String(relId(p.user)), p]))
    const contractState = (c: any): MemberContract => {
      if (c.status === 'draft') return 'draft'
      if (c.status === 'terminated') return 'terminated'
      if (!c.signedAt) return 'awaiting_employee'
      if (!c.managerSignedAt) return 'awaiting_me'
      const end = dayOf(c.endDate)
      if (end && end < today) return 'ended'
      if (end && end <= until) return 'ending'
      return 'active'
    }
    const members: HomeMember[] = memberIds.map((id) => {
      const i = accepted.find((x) => String(relId(x.employee)) === id)!
      const level: HomeMember['accessLevel'] =
        i.accessLevel === 'cv_only' || i.accessLevel === 'portfolio_only' ? i.accessLevel : 'full'
      const u: any = userBy.get(id)
      const p: any = infoBy.get(id)
      const latest = contracts
        .filter((c) => String(relId(c.employee)) === id)
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0]
      const cvs = (mCvs.docs as any[]).filter((c) => String(relId(c.user)) === id)
      const seeCvs = level !== 'portfolio_only'
      const seePortfolio = level !== 'cv_only'
      return {
        id,
        name:
          [p?.firstName, p?.lastName].filter(Boolean).join(' ').trim() ||
          u?.name ||
          u?.email ||
          i.employeeEmail ||
          '—',
        email: u?.email ?? i.employeeEmail ?? '',
        joinedAt: i.respondedAt ?? null,
        accessLevel: level,
        contract: latest ? contractState(latest) : 'none',
        contractId: latest ? String(latest.id) : null,
        contractEndsAt: latest?.endDate ?? null,
        cvs: seeCvs ? cvs.length : null,
        lastCvAt: seeCvs
          ? cvs
              .map((c) => String(c.updatedAt ?? c.createdAt ?? ''))
              .sort()
              .pop() || null
          : null,
        portfolio: seePortfolio
          ? (mPort.docs as any[]).filter((x) => String(relId(x.user)) === id).length
          : null,
      }
    })
    // Needs something first (sign, no contract, no CV …), then by name.
    const urgency = (m: HomeMember) =>
      m.contract === 'awaiting_me'
        ? 0
        : m.contract === 'ending'
          ? 1
          : m.contract === 'none' || m.contract === 'draft'
            ? 2
            : m.contract === 'awaiting_employee'
              ? 3
              : m.cvs === 0
                ? 4
                : 5
    members.sort((a, b) => urgency(a) - urgency(b) || a.name.localeCompare(b.name, 'sv'))

    const data: ManagerHomeData = {
      today: {
        date: today,
        kind: cell.kind,
        ...(cell.timeOffType ? { timeOffType: cell.timeOffType } : {}),
        hours: cell.hours ?? null,
        statusNote: avail.statusNote,
      },
      team: {
        employees: team.size,
        pendingInvites: inv.filter((i) => i.status === 'pending').length,
        activeContracts: contracts.filter(
          (c) =>
            c.status !== 'terminated' &&
            c.signedAt &&
            c.managerSignedAt &&
            (!dayOf(c.endDate) || dayOf(c.endDate)! >= today),
        ).length,
        interviewsThisWeek: interviews.length,
      },
      todos,
      interviews,
      members,
    }
    return NextResponse.json(
      { data },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to load manager home:', error)
    return NextResponse.json({ message: 'Failed to load' }, { status: 500 })
  }
}
