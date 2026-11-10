// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/company/managers/delegations/[id]/handover/route.ts
// URL:            GET /api/company/managers/delegations/:id/handover
// WHAT IT DOES:   Everything a substitute needs to take over a colleague's team,
//                 in ONE response — read straight from the database, so it works
//                 no matter how the other manager routes are written:
//
//   per employee:  contact details, emergency contact, employment details,
//                  CVs, portfolio, cover letters, contracts, interviews
//   plus:          the absent manager's other upcoming interviews (candidates)
//
//   Who may read it: the substitute (once they've accepted, until it ends) and
//   the absent manager themself (to see what they're handing over).
//
//   Respects what each employee agreed to share (invitation access level) and
//   what they've hidden from managers ("Hide from manager" on CVs/portfolio).
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { delegationState } from '@/utils/delegations'
import { normalizeEmploymentDetails } from '@/utils/employmentDetails'
import { loadPeople, requireManagerActor, toDelegationDto } from '@/utils/server/managerDelegation'

const relId = (v: any) => (v == null || v === '' ? null : typeof v === 'object' ? v.id : v)
const str = (v: unknown) => (typeof v === 'string' ? v : '')

/**
 * CVs, portfolios and cover letters live in collections whose names differ
 * between projects. Use the first slug that exists, linked to the user by the
 * first field that works. Missing → that section is simply null ("not available").
 */
const CV_SLUGS = ['cvs', 'cv', 'resumes', 'cv-data']
const PORTFOLIO_SLUGS = ['portfolio-items', 'portfolios', 'portfolio']
const LETTER_SLUGS = ['cover-letters', 'coverLetters', 'cover-letter']
const USER_FIELDS = ['user', 'userId', 'owner']

async function findForUsers(
  payload: any,
  slugs: string[],
  userIds: number[],
): Promise<any[] | null> {
  const existing = slugs.filter((s) => payload.collections?.[s])
  for (const slug of existing) {
    for (const field of USER_FIELDS) {
      try {
        const { docs } = await payload.find({
          collection: slug,
          where: { [field]: { in: userIds } },
          limit: 5000,
          depth: 0,
          overrideAccess: true,
        })
        return (docs as any[]).map((d) => ({ ...d, __owner: String(relId(d[field])) }))
      } catch {
        // field doesn't exist on this collection — try the next one
      }
    }
  }
  return null
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireManagerActor(req)
    if (!actor) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })

    const { id } = await params
    const payload = await getPayload({ config })
    const d: any = await payload
      .findByID({ collection: 'manager-delegations', id, depth: 0, overrideAccess: true })
      .catch(() => null)

    const ownerId = Number(relId(d?.owner))
    const isDelegate = d && Number(relId(d.delegate)) === actor.id
    const isOwner = d && ownerId === actor.id
    if (!d || (!isDelegate && !isOwner))
      return NextResponse.json({ message: 'Not found' }, { status: 404 })

    const state = delegationState(d)
    if (isDelegate && state !== 'active' && state !== 'scheduled') {
      return NextResponse.json(
        { message: 'The handover is only available while you are covering' },
        { status: 403 },
      )
    }

    /* ── The absent manager's team: accepted invitations ── */
    const { docs: invites } = await payload.find({
      collection: 'employee-invitations',
      where: { and: [{ manager: { equals: ownerId } }, { status: { equals: 'accepted' } }] },
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })
    const team = (invites as any[])
      .map((i) => ({
        id: Number(relId(i.employee)),
        accessLevel: (i.accessLevel || 'full') as 'full' | 'cv_only' | 'portfolio_only',
        acceptedAt: i.respondedAt ?? null,
        invitationEmail: str(i.employeeEmail),
      }))
      .filter((t) => Number.isFinite(t.id))
    const ids = [...new Set(team.map((t) => t.id))]

    /* ── Everything about them, in parallel ── */
    const none = { docs: [] as any[] }
    const [users, personal, employment, contracts, interviews, cvs, portfolio, letters] =
      await Promise.all([
        ids.length
          ? payload.find({
              collection: 'users',
              where: { id: { in: ids } },
              limit: ids.length,
              depth: 0,
              overrideAccess: true,
            })
          : none,
        ids.length
          ? payload
              .find({
                collection: 'personal-information',
                where: { user: { in: ids } },
                limit: ids.length * 2,
                depth: 0,
                overrideAccess: true,
              })
              .catch(() => none)
          : none,
        ids.length
          ? payload
              .find({
                collection: 'employment-details',
                where: { user: { in: ids } },
                limit: ids.length * 2,
                depth: 0,
                overrideAccess: true,
              })
              .catch(() => none)
          : none,
        payload
          .find({
            collection: 'employee-contracts',
            where: { manager: { equals: ownerId } },
            sort: '-createdAt',
            limit: 2000,
            depth: 0,
            overrideAccess: true,
          })
          .catch(() => none),
        payload
          .find({
            collection: 'interviews',
            where: { manager: { equals: ownerId } },
            sort: 'startAt',
            limit: 2000,
            depth: 0,
            overrideAccess: true,
          })
          .catch(() => none),
        ids.length ? findForUsers(payload, CV_SLUGS, ids) : Promise.resolve([]),
        ids.length ? findForUsers(payload, PORTFOLIO_SLUGS, ids) : Promise.resolve([]),
        ids.length ? findForUsers(payload, LETTER_SLUGS, ids) : Promise.resolve([]),
      ])

    const byUser = <T>(docs: any[], key = 'user') => {
      const m = new Map<string, T[]>()
      for (const doc of docs) {
        const k = String(doc.__owner ?? relId(doc[key]))
        if (!m.has(k)) m.set(k, [])
        m.get(k)!.push(doc)
      }
      return m
    }
    const userById = new Map((users.docs as any[]).map((u) => [String(u.id), u]))
    const piBy = byUser<any>(personal.docs as any[])
    const edBy = byUser<any>(employment.docs as any[])
    const contractsBy = byUser<any>(contracts.docs as any[], 'employee')
    const interviewsBy = byUser<any>(interviews.docs as any[], 'employee')
    const cvBy = cvs ? byUser<any>(cvs) : null
    const pfBy = portfolio ? byUser<any>(portfolio) : null
    const clBy = letters ? byUser<any>(letters) : null
    const now = Date.now()

    const employees = team.map((t) => {
      const key = String(t.id)
      const u: any = userById.get(key) ?? {}
      const pi: any = piBy.get(key)?.[0] ?? null
      const full = t.accessLevel === 'full'
      const cvOk = full || t.accessLevel === 'cv_only'
      const pfOk = full || t.accessLevel === 'portfolio_only'
      const name =
        [pi?.firstName, pi?.lastName].filter(Boolean).join(' ').trim() ||
        u.name ||
        u.email ||
        t.invitationEmail

      const empInterviews = (interviewsBy.get(key) ?? []).map((iv: any) => ({
        id: String(iv.id),
        position: str(iv.position),
        startAt: iv.startAt,
        status: iv.status ?? 'scheduled',
        format: iv.format ?? 'video',
        upcoming: iv.status === 'scheduled' && new Date(iv.startAt).getTime() > now,
      }))

      return {
        id: key,
        name,
        email: u.email ?? t.invitationEmail,
        accessLevel: t.accessLevel,
        acceptedAt: t.acceptedAt,
        title: full ? str(pi?.title) : '',
        contact:
          full && pi
            ? {
                phone: str(pi.phoneNumber),
                workPhone: str(pi.workPhoneNumber),
                privateEmail: str(pi.privateEmail),
                workEmail: str(pi.workEmail),
                address: str(pi.homeAddress),
                linkedIn: str(pi.socialLinks?.linkedIn),
              }
            : null,
        emergencyContact:
          full && pi?.emergencyContact && Object.values(pi.emergencyContact).some(Boolean)
            ? {
                name: [pi.emergencyContact.firstName, pi.emergencyContact.lastName]
                  .filter(Boolean)
                  .join(' '),
                relationship: str(pi.emergencyContact.relationship),
                phone: str(pi.emergencyContact.phoneNumber),
                email: str(pi.emergencyContact.email),
              }
            : null,
        employment:
          full && edBy.get(key)?.[0] ? normalizeEmploymentDetails(edBy.get(key)![0]).data : null,
        contracts: full
          ? (contractsBy.get(key) ?? []).map((c: any) => ({
              id: String(c.id),
              title: str(c.title) || str(c.contractType),
              status: c.displayStatus || c.status,
              contractType: str(c.contractType),
              startDate: c.startDate ?? null,
              endDate: c.endDate ?? null,
              signedAt: c.signedAt ?? null,
              managerSignedAt: c.managerSignedAt ?? null,
            }))
          : null,
        interviews: full ? empInterviews : null,
        // Items the employee hid from managers stay hidden.
        cvs:
          cvOk && cvBy
            ? (cvBy.get(key) ?? [])
                .filter((c) => !c.hidden)
                .map((c) => ({
                  id: String(c.id),
                  name: str(c.name) || 'CV',
                  updatedAt: c.updatedAt,
                }))
            : null,
        portfolio:
          pfOk && pfBy
            ? (pfBy.get(key) ?? [])
                .filter((p) => !p.hidden)
                .map((p) => ({ id: String(p.id), title: str(p.title), type: str(p.type) }))
            : null,
        coverLetters:
          cvOk && clBy
            ? (clBy.get(key) ?? []).map((l) => ({
                id: String(l.id),
                jobTitle: str(l.jobTitle),
                companyName: str(l.companyName),
                createdAt: l.createdAt,
              }))
            : null,
      }
    })

    // Interviews with candidates who aren't (yet) on the team.
    const otherInterviews = (interviews.docs as any[])
      .filter((iv) => !relId(iv.employee) || !ids.includes(Number(relId(iv.employee))))
      .filter((iv) => iv.status === 'scheduled' && new Date(iv.startAt).getTime() > now)
      .map((iv) => ({
        id: String(iv.id),
        candidateName: str(iv.candidateName),
        position: str(iv.position),
        startAt: iv.startAt,
        format: iv.format ?? 'video',
      }))

    const people = await loadPeople(payload, [ownerId, relId(d.delegate)])
    return NextResponse.json(
      {
        delegation: toDelegationDto(d, people),
        employees: employees.sort((a, b) => a.name.localeCompare(b.name, 'sv')),
        otherInterviews,
        sections: {
          cvs: cvs !== null,
          portfolio: portfolio !== null,
          coverLetters: letters !== null,
        },
        generatedAt: new Date().toISOString(),
      },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to build handover:', error)
    return NextResponse.json({ message: 'Failed to load the handover' }, { status: 500 })
  }
}
