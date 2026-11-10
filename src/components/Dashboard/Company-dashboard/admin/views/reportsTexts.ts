// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/admin/views/reportsText.ts   (NEW)
// WHAT IT DOES:   Swedish / English texts for AdminReports (the title, description, periods
//                 and export buttons still come from Businessadmintranslations).
// ══════════════════════════════════════════════════════════════════════

import type { AttentionItem, ContractState, MyContractState } from '@/utils/adminReports'

const en = {
  updated: 'Updated',
  refresh: 'Refresh',
  loadFailed: "Couldn't load the report.",
  retry: 'Try again',
  attention: 'Needs your attention',
  allClear: 'All clear — nothing needs your attention right now.',
  showAll: (n: number) => `Show all (${n})`,
  showLess: 'Show less',
  open: 'Open',
  levels: { high: 'Act now', medium: 'Follow up', low: 'Good to know' },
  rightNow: 'Right now',
  managers: 'Managers',
  activeManagers: (n: number) => `${n} active in the period`,
  employees: 'Employees',
  activeContracts: 'Active contracts',
  pendingInvitations: 'Unanswered invitations',
  awayToday: 'Managers away today',
  kpi: {
    newEmployees: 'New employees',
    contractsSent: 'Contracts sent',
    contractsSigned: 'Contracts signed',
    interviewsHeld: 'Interviews held',
    cvsCreated: 'CVs created',
    daysOff: 'Manager days off',
  },
  vsPrev: 'vs. previous period',
  same: 'Same as previous period',
  activity: 'Activity',
  activityDesc: 'What happened in your managers’ teams, over the period.',
  noActivity: 'Nothing yet in this period',
  table: 'Managers',
  tableDesc: 'Click a manager to see their team.',
  col: {
    manager: 'Manager',
    today: 'Today',
    team: 'Team',
    contracts: 'Contracts',
    interviews: 'Interviews',
    cvs: 'CVs',
    daysOff: 'Days off',
    yourContract: 'Your contract',
  },
  activeWaiting: (a: number, w: number) => `${a} active${w ? ` · ${w} waiting` : ''}`,
  heldUpcoming: (h: number, u: number) => `${h} held${u ? ` · ${u} coming` : ''}`,
  newN: (n: number) => `+${n} new`,
  leftN: (n: number) => `−${n} left`,
  lastSeen: 'Last seen',
  never: 'Never signed in',
  todayWord: 'today',
  yesterday: 'yesterday',
  daysAgo: (n: number) => `${n} days ago`,
  noManagers: 'You have no managers yet.',
  createManager: 'Create a manager',
  team: 'Team',
  noTeam: 'No employees in this team yet.',
  joined: 'Joined',
  access: 'Access',
  contract: 'Contract',
  accessLevels: { full: 'Full', cv_only: 'CVs only', portfolio_only: 'Portfolio only' },
  profile: 'Profile',
  message: 'Message',
  contractsBtn: 'Contracts',
  pendingInvites: (n: number) => `${n} unanswered invitation${n === 1 ? '' : 's'}`,
  pendingTimeOff: (n: number) => `${n} days-off request${n === 1 ? '' : 's'} waiting`,
  pipeline: 'Employee contracts',
  pipelineDesc: 'Contracts your managers have with their employees — right now.',
  interviews: 'Interviews',
  interviewsDesc: 'Your managers’ interviews in the period.',
  timeOff: 'Manager days off',
  timeOffDesc: 'Approved working days in the period, by type.',
  none: 'None',
  outcome: {
    completed: 'Held',
    cancelled: 'Cancelled',
    noShow: 'No-show',
    upcoming: 'Next 7 days',
  },
  days: (n: number) => `${String(n).replace('.', ',')} d`,
  csvName: 'manager-report',
}

const sv: typeof en = {
  updated: 'Uppdaterad',
  refresh: 'Uppdatera',
  loadFailed: 'Kunde inte ladda rapporten.',
  retry: 'Försök igen',
  attention: 'Att hantera',
  allClear: 'Allt är hanterat — inget behöver din uppmärksamhet just nu.',
  showAll: (n: number) => `Visa alla (${n})`,
  showLess: 'Visa färre',
  open: 'Öppna',
  levels: { high: 'Gör nu', medium: 'Följ upp', low: 'Bra att veta' },
  rightNow: 'Just nu',
  managers: 'Chefer',
  activeManagers: (n: number) => `${n} aktiva under perioden`,
  employees: 'Medarbetare',
  activeContracts: 'Aktiva kontrakt',
  pendingInvitations: 'Obesvarade inbjudningar',
  awayToday: 'Chefer borta idag',
  kpi: {
    newEmployees: 'Nya medarbetare',
    contractsSent: 'Skickade kontrakt',
    contractsSigned: 'Signerade kontrakt',
    interviewsHeld: 'Genomförda intervjuer',
    cvsCreated: 'Skapade CV:n',
    daysOff: 'Chefers lediga dagar',
  },
  vsPrev: 'mot föregående period',
  same: 'Samma som föregående period',
  activity: 'Aktivitet',
  activityDesc: 'Vad som hänt i dina chefers team under perioden.',
  noActivity: 'Inget ännu under perioden',
  table: 'Chefer',
  tableDesc: 'Klicka på en chef för att se teamet.',
  col: {
    manager: 'Chef',
    today: 'Idag',
    team: 'Team',
    contracts: 'Kontrakt',
    interviews: 'Intervjuer',
    cvs: 'CV:n',
    daysOff: 'Lediga dagar',
    yourContract: 'Ditt kontrakt',
  },
  activeWaiting: (a: number, w: number) => `${a} aktiva${w ? ` · ${w} väntar` : ''}`,
  heldUpcoming: (h: number, u: number) => `${h} genomförda${u ? ` · ${u} kommande` : ''}`,
  newN: (n: number) => `+${n} nya`,
  leftN: (n: number) => `−${n} lämnat`,
  lastSeen: 'Senast aktiv',
  never: 'Har aldrig loggat in',
  todayWord: 'idag',
  yesterday: 'igår',
  daysAgo: (n: number) => `för ${n} dagar sedan`,
  noManagers: 'Du har inga chefer ännu.',
  createManager: 'Skapa en chef',
  team: 'Team',
  noTeam: 'Inga medarbetare i teamet ännu.',
  joined: 'Gick med',
  access: 'Åtkomst',
  contract: 'Kontrakt',
  accessLevels: { full: 'Full', cv_only: 'Endast CV', portfolio_only: 'Endast portfolio' },
  profile: 'Profil',
  message: 'Meddelande',
  contractsBtn: 'Kontrakt',
  pendingInvites: (n: number) =>
    n === 1 ? '1 obesvarad inbjudan' : `${n} obesvarade inbjudningar`,
  pendingTimeOff: (n: number) =>
    n === 1 ? '1 ledighetsförfrågan väntar' : `${n} ledighetsförfrågningar väntar`,
  pipeline: 'Medarbetarkontrakt',
  pipelineDesc: 'Kontrakt mellan dina chefer och deras medarbetare — just nu.',
  interviews: 'Intervjuer',
  interviewsDesc: 'Dina chefers intervjuer under perioden.',
  timeOff: 'Chefers ledighet',
  timeOffDesc: 'Godkända arbetsdagar under perioden, per typ.',
  none: 'Inga',
  outcome: {
    completed: 'Genomförda',
    cancelled: 'Inställda',
    noShow: 'Uteblev',
    upcoming: 'Närmaste 7 dagarna',
  },
  days: (n: number) => `${String(n).replace('.', ',')} d`,
  csvName: 'chefsrapport',
}

export const REPORTS_TEXT = { en, sv }
export type ReportsText = typeof en

export const CONTRACT_STATE_LABEL: Record<
  ContractState,
  { en: string; sv: string; color: string; bg: string }
> = {
  draft: { en: 'Draft', sv: 'Utkast', color: 'rgb(71,85,105)', bg: 'rgb(241,245,249)' },
  awaiting_employee: {
    en: 'Waiting for employee',
    sv: 'Väntar på medarbetare',
    color: 'rgb(146,64,14)',
    bg: 'rgb(255,251,235)',
  },
  awaiting_manager: {
    en: 'Manager to sign',
    sv: 'Chefen ska signera',
    color: 'rgb(109,40,217)',
    bg: 'rgb(245,243,255)',
  },
  active: { en: 'Active', sv: 'Aktivt', color: 'rgb(22,101,52)', bg: 'rgb(240,253,244)' },
  ended: { en: 'Ended', sv: 'Avslutat', color: 'rgb(100,116,139)', bg: 'rgb(248,250,252)' },
  terminated: { en: 'Terminated', sv: 'Uppsagt', color: 'rgb(185,28,28)', bg: 'rgb(254,242,242)' },
}

export const MY_CONTRACT_LABEL: Record<
  MyContractState,
  { en: string; sv: string; color: string; bg: string }
> = {
  none: { en: 'Not sent', sv: 'Ej skickat', color: 'rgb(185,28,28)', bg: 'rgb(254,242,242)' },
  draft: { en: 'Draft', sv: 'Utkast', color: 'rgb(146,64,14)', bg: 'rgb(255,251,235)' },
  awaiting_manager: {
    en: 'Manager to sign',
    sv: 'Chefen ska signera',
    color: 'rgb(146,64,14)',
    bg: 'rgb(255,251,235)',
  },
  awaiting_you: {
    en: 'You to sign',
    sv: 'Du ska signera',
    color: 'rgb(109,40,217)',
    bg: 'rgb(245,243,255)',
  },
  active: { en: 'Active', sv: 'Aktivt', color: 'rgb(22,101,52)', bg: 'rgb(240,253,244)' },
  ended: { en: 'Ended', sv: 'Avslutat', color: 'rgb(100,116,139)', bg: 'rgb(248,250,252)' },
  terminated: { en: 'Terminated', sv: 'Uppsagt', color: 'rgb(185,28,28)', bg: 'rgb(254,242,242)' },
}

/** Icon + one line of text for a "needs your attention" item. */
export function attentionCopy(
  a: AttentionItem,
  lang: 'en' | 'sv',
  typeLabel: (t: string) => string,
  fmtDate: (iso: string) => string,
) {
  const m = a.managerName || (lang === 'en' ? 'A manager' : 'En chef')
  const n = a.count ?? 0
  const when = a.at ? fmtDate(a.at) : ''
  const E = lang === 'en'
  switch (a.kind) {
    case 'contract_to_sign':
      return {
        icon: 'tabler:signature',
        text: E
          ? `${m} signed the contract — sign it to complete it`
          : `${m} har signerat kontraktet — signera för att slutföra det`,
        sub: a.title,
      }
    case 'time_off_pending':
      return {
        icon: 'tabler:calendar-question',
        text: E
          ? `${m} asks for ${typeLabel(a.title ?? '').toLowerCase()} from ${when}`
          : `${m} ansöker om ${typeLabel(a.title ?? '').toLowerCase()} från ${when}`,
        sub: E
          ? `${String(n).replace('.', ',')} working days`
          : `${String(n).replace('.', ',')} arbetsdagar`,
      }
    case 'manager_no_contract':
      return {
        icon: 'tabler:file-off',
        text: E ? `${m} has no contract from you yet` : `${m} har inget kontrakt från dig ännu`,
        sub: '',
      }
    case 'manager_contract_waiting':
      return {
        icon: 'tabler:hourglass',
        text: E
          ? `${m} hasn't signed your contract (sent ${when})`
          : `${m} har inte signerat ditt kontrakt (skickat ${when})`,
        sub: a.title,
      }
    case 'contract_expiring':
      return a.forManager
        ? {
            icon: 'tabler:calendar-due',
            text: E ? `${m}'s contract ends ${when}` : `${m}s kontrakt slutar ${when}`,
            sub: a.title,
          }
        : {
            icon: 'tabler:calendar-due',
            text: E
              ? `${a.employeeName}'s contract ends ${when}`
              : `${a.employeeName}s kontrakt slutar ${when}`,
            sub: E ? `Manager: ${m}` : `Chef: ${m}`,
          }
    case 'employee_contracts_waiting':
      return {
        icon: 'tabler:mail-forward',
        text: E
          ? `${n} of ${m}'s contracts have waited 7+ days for the employee`
          : `${n} av ${m}s kontrakt har väntat på medarbetaren i 7+ dagar`,
        sub: '',
      }
    case 'employee_contracts_to_sign':
      return {
        icon: 'tabler:pencil',
        text: E
          ? `${m} has ${n} signed contract${n === 1 ? '' : 's'} to countersign`
          : `${m} har ${n} ${n === 1 ? 'signerat kontrakt' : 'signerade kontrakt'} att kontrasignera`,
        sub: '',
      }
    case 'manager_inactive':
      return {
        icon: 'tabler:zzz',
        text: a.at
          ? E
            ? `${m} hasn't been active since ${when}`
            : `${m} har inte varit aktiv sedan ${when}`
          : E
            ? `${m} has never signed in`
            : `${m} har aldrig loggat in`,
        sub: '',
      }
    case 'invitations_pending':
      return {
        icon: 'tabler:mail-question',
        text: E
          ? `${n} of ${m}'s invitations unanswered for 7+ days`
          : `${n} av ${m}s inbjudningar obesvarade i 7+ dagar`,
        sub: '',
      }
    case 'interviews_today':
      return {
        icon: 'tabler:calendar-event',
        text: E
          ? `${n} interview${n === 1 ? '' : 's'} today`
          : `${n} intervju${n === 1 ? '' : 'er'} idag`,
        sub: '',
      }
  }
}
