// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/managerHome.ts   (NEW — shared by the API and Dashboard → Home)
// ══════════════════════════════════════════════════════════════════════

import type { DayKind, TimeOffType } from '@/utils/managerAvailability'

export type HomeTodoKind =
  | 'sign_my_contract' //   a contract from my business admin waits for my signature
  | 'countersign' //        an employee signed — I sign to complete it
  | 'interview_outcome' //  interviews that happened but aren't marked held / no-show
  | 'contract_expiring' //  an active contract ends within 30 days
  | 'waiting_employee' //   contracts waiting 7+ days for the employee
  | 'invites_pending' //    invitations unanswered for 7+ days
  | 'time_off_answered' //  my days-off request was approved / declined
  | 'team_time_off' //      my employees' days-off requests waiting for my answer

export interface HomeTodo {
  key: string
  kind: HomeTodoKind
  level: 'high' | 'medium' | 'low'
  contractId?: string
  title?: string
  name?: string
  at?: string | null
  count?: number
  status?: 'approved' | 'declined'
  note?: string
}

export interface HomeInterview {
  id: string
  name: string // the candidate — or, for withMe, who booked it
  position: string
  startAt: string
  durationMinutes: number
  format: 'video' | 'phone' | 'in_person' | string
  meetingLink: string | null
  location: string
  /** Booked WITH me (e.g. by my business admin) */
  withMe: boolean
}

/** Where an employee's latest contract with me is right now. */
export type MemberContract =
  | 'none'
  | 'draft'
  | 'awaiting_employee'
  | 'awaiting_me'
  | 'active'
  | 'ending'
  | 'ended'
  | 'terminated'

export interface HomeMember {
  id: string
  name: string
  email: string
  joinedAt: string | null
  accessLevel: 'full' | 'cv_only' | 'portfolio_only'
  contract: MemberContract
  contractId: string | null
  contractEndsAt: string | null
  /** null = you don't have access to their CVs / portfolio */
  cvs: number | null
  lastCvAt: string | null
  portfolio: number | null
}

export interface ManagerHomeData {
  today: {
    date: string
    kind: DayKind
    timeOffType?: TimeOffType
    hours: string | null
    statusNote: string
  }
  team: {
    employees: number
    pendingInvites: number
    activeContracts: number
    interviewsThisWeek: number
  }
  todos: HomeTodo[]
  interviews: HomeInterview[]
  /** My employees — the ones needing something first */
  members: HomeMember[]
}
