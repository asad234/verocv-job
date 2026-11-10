// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/adminNotifications.ts   (NEW — shared by server + client)
// WHAT IT DOES:   Types for the business admin's notification bell
//                 (GET /api/company/admin/notifications).
// ══════════════════════════════════════════════════════════════════════

export type AdminNoticeKind =
  | 'contract_to_sign' // a manager signed your contract → your signature is needed (stays until you sign)
  | 'employee_joined' // an employee accepted an invitation from one of your managers
  | 'employee_left' // an employee removed a manager's access (left the team)
  | 'cover_started' // a manager is covering for another manager (substitute)
  | 'cover_ended' // that cover has ended
  | 'time_off_request' // a manager asks for days off → approve / decline (stays until handled)
  | 'time_off_reported' // a manager reported sick / VAB (approved straight away)

export interface AdminNotice {
  /** Stable id — used to remember "dismissed" in this browser. */
  key: string
  kind: AdminNoticeKind
  /** When it happened (ISO). */
  at: string
  /** contract_to_sign can't be dismissed — it disappears when you've signed. */
  persistent: boolean
  managerId?: string
  managerName?: string
  employeeId?: string
  employeeName?: string
  contractId?: string
  contractTitle?: string
  /** cover_*: the manager who covers (managerId/managerName = the one who is away). */
  substituteName?: string
  /** time_off_*: the request */
  requestId?: string
  timeOffType?: string
  startDate?: string
  endDate?: string
  halfDay?: string
  workingDays?: number
}
