// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/admin/views/managersText.ts   (NEW)
// WHAT IT DOES:   Swedish + English texts for Managers list, Manager profile,
//                 Edit manager and the Delete manager dialog.
// ══════════════════════════════════════════════════════════════════════

import type { DeleteReason, ManagerStatus } from '@/utils/adminManagers'

export type Lang = 'sv' | 'en'
export const NAVY = 'rgb(5,22,80)'

const en = {
  // list
  title: 'Managers',
  subtitle: 'Everyone who manages a team in your company.',
  create: 'Create manager',
  statTotal: 'Managers',
  statActive: 'Active',
  statEmployees: 'Employees',
  statPending: 'Pending invitations',
  search: 'Search name, email or department…',
  all: 'All',
  sortName: 'Name A–Z',
  sortNewest: 'Newest first',
  sortTeam: 'Largest team',
  colManager: 'Manager',
  colDepartment: 'Department',
  colStatus: 'Status',
  colTeam: 'Team',
  colLastActive: 'Last active',
  colActions: '',
  employees: (n: number) => (n === 1 ? '1 employee' : `${n} employees`),
  pending: (n: number) => `${n} pending`,
  chat: 'Message',
  profile: 'Profile',
  edit: 'Edit',
  delete: 'Delete',
  noManagers: 'No managers yet',
  noManagersHint: 'Create your first manager to start building teams.',
  noMatches: 'No managers match your search.',
  clearFilters: 'Clear filters',
  loadFailed: "Couldn't load managers.",
  retry: 'Try again',
  deleted: (n: string) => `${n} was deleted.`,
  saved: 'Changes saved.',
  never: 'Never',
  justNow: 'Just now',
  minAgo: (n: number) => `${n} min ago`,
  hAgo: (n: number) => `${n} h ago`,
  daysAgo: (n: number) => `${n} days ago`,
  status: { active: 'Active', inactive: 'Inactive', pending: 'Pending' } as Record<
    ManagerStatus,
    string
  >,
  // profile
  back: 'Back to managers',
  backToProfile: 'Back to profile',
  contact: 'Contact',
  workEmail: 'Work email (login)',
  privateEmail: 'Private email',
  phone: 'Phone',
  mobile: 'Mobile',
  address: 'Address',
  work: 'Role & department',
  jobTitle: 'Job title',
  department: 'Department',
  company: 'Company',
  access: 'Access level',
  managingSince: 'Managing since',
  teamSize: 'Team size',
  focus: 'Department focus',
  goals: 'Team goals',
  bio: 'About',
  team: 'Team',
  noTeam: 'No employees have accepted an invitation yet.',
  activity: 'Activity',
  contracts: 'Contracts',
  upcomingInterviews: 'Upcoming interviews',
  created: 'Account created',
  lastActive: 'Last active',
  loadProfileFailed: "Couldn't load this manager.",
  // edit
  editTitle: (n: string) => `Edit ${n}`,
  editSubtitle: 'Changes are saved to the manager’s account and settings.',
  personal: 'Personal details',
  firstName: 'First name',
  lastName: 'Last name',
  contactDetails: 'Contact details',
  loginChange:
    'The manager logs in with this email. If you change it, tell them — their old login stops working.',
  workAccess: 'Work & access',
  statusLabel: 'Account status',
  statusHint: {
    active: 'Can log in and work as normal.',
    inactive: 'Marked as inactive (e.g. on leave).',
    pending: 'Account set up but not started yet.',
  } as Record<ManagerStatus, string>,
  save: 'Save changes',
  saving: 'Saving…',
  cancel: 'Cancel',
  required: 'Required',
  invalidEmail: 'Enter a valid email address',
  taken: 'Another account already uses this email',
  checkFields: 'Please check the highlighted fields.',
  saveFailed: "Couldn't save the changes.",
  // delete
  delTitle: (n: string) => `Delete ${n}?`,
  delWarning: 'This permanently deletes the manager. It cannot be undone.',
  delRemoves: 'Will be deleted',
  delRemovesList: [
    'Their account and login',
    'Their profile and settings',
    'All their chats',
    'Their connections to employees (employees keep their own accounts)',
    'Substitute arrangements and calendar connection',
  ],
  delKeeps: 'Will be kept',
  delKeepsList: ['Contracts and interviews (records for the employees)'],
  delReason: 'Why is this manager being deleted?',
  reasons: {
    fired: 'Fired / dismissed',
    left_job: 'Left the job',
    contract_ended: 'Contract ended',
    created_by_mistake: 'Created by mistake',
    other: 'Other',
  } as Record<DeleteReason, string>,
  delNote: 'Describe the reason',
  delNoteOptional: 'Note (optional)',
  delConfirmLabel: 'To confirm, type',
  delButton: 'Delete manager permanently',
  deleting: 'Deleting…',
  delFailed: "Couldn't delete the manager.",
  delReasonRequired: 'Choose a reason',
}

const sv: typeof en = {
  title: 'Chefer',
  subtitle: 'Alla som leder ett team i ert företag.',
  create: 'Skapa chef',
  statTotal: 'Chefer',
  statActive: 'Aktiva',
  statEmployees: 'Medarbetare',
  statPending: 'Väntande inbjudningar',
  search: 'Sök namn, e-post eller avdelning…',
  all: 'Alla',
  sortName: 'Namn A–Ö',
  sortNewest: 'Nyast först',
  sortTeam: 'Störst team',
  colManager: 'Chef',
  colDepartment: 'Avdelning',
  colStatus: 'Status',
  colTeam: 'Team',
  colLastActive: 'Senast aktiv',
  colActions: '',
  employees: (n: number) => (n === 1 ? '1 medarbetare' : `${n} medarbetare`),
  pending: (n: number) => `${n} väntar`,
  chat: 'Meddelande',
  profile: 'Profil',
  edit: 'Redigera',
  delete: 'Ta bort',
  noManagers: 'Inga chefer än',
  noManagersHint: 'Skapa din första chef för att börja bygga team.',
  noMatches: 'Inga chefer matchar din sökning.',
  clearFilters: 'Rensa filter',
  loadFailed: 'Kunde inte ladda chefer.',
  retry: 'Försök igen',
  deleted: (n: string) => `${n} har tagits bort.`,
  saved: 'Ändringarna är sparade.',
  never: 'Aldrig',
  justNow: 'Nyss',
  minAgo: (n: number) => `${n} min sedan`,
  hAgo: (n: number) => `${n} tim sedan`,
  daysAgo: (n: number) => `${n} dagar sedan`,
  status: { active: 'Aktiv', inactive: 'Inaktiv', pending: 'Väntande' },
  back: 'Tillbaka till chefer',
  backToProfile: 'Tillbaka till profilen',
  contact: 'Kontakt',
  workEmail: 'Jobbmejl (inloggning)',
  privateEmail: 'Privat e-post',
  phone: 'Telefon',
  mobile: 'Mobil',
  address: 'Adress',
  work: 'Roll & avdelning',
  jobTitle: 'Titel',
  department: 'Avdelning',
  company: 'Företag',
  access: 'Behörighet',
  managingSince: 'Chef sedan',
  teamSize: 'Teamstorlek',
  focus: 'Avdelningens fokus',
  goals: 'Teammål',
  bio: 'Om',
  team: 'Team',
  noTeam: 'Inga medarbetare har accepterat en inbjudan än.',
  activity: 'Aktivitet',
  contracts: 'Kontrakt',
  upcomingInterviews: 'Kommande intervjuer',
  created: 'Konto skapat',
  lastActive: 'Senast aktiv',
  loadProfileFailed: 'Kunde inte ladda chefen.',
  editTitle: (n: string) => `Redigera ${n}`,
  editSubtitle: 'Ändringarna sparas på chefens konto och inställningar.',
  personal: 'Personuppgifter',
  firstName: 'Förnamn',
  lastName: 'Efternamn',
  contactDetails: 'Kontaktuppgifter',
  loginChange:
    'Chefen loggar in med den här adressen. Om du ändrar den, meddela chefen — den gamla inloggningen slutar fungera.',
  workAccess: 'Arbete & behörighet',
  statusLabel: 'Kontostatus',
  statusHint: {
    active: 'Kan logga in och arbeta som vanligt.',
    inactive: 'Markerad som inaktiv (t.ex. ledig).',
    pending: 'Kontot är skapat men chefen har inte börjat än.',
  },
  save: 'Spara ändringar',
  saving: 'Sparar…',
  cancel: 'Avbryt',
  required: 'Obligatoriskt',
  invalidEmail: 'Ange en giltig e-postadress',
  taken: 'Ett annat konto använder redan den här adressen',
  checkFields: 'Kontrollera de markerade fälten.',
  saveFailed: 'Kunde inte spara ändringarna.',
  delTitle: (n: string) => `Ta bort ${n}?`,
  delWarning: 'Chefen tas bort permanent. Det går inte att ångra.',
  delRemoves: 'Tas bort',
  delRemovesList: [
    'Konto och inloggning',
    'Profil och inställningar',
    'Alla chattar',
    'Kopplingar till medarbetare (medarbetarna behåller sina konton)',
    'Ställföreträdare och kalenderkoppling',
  ],
  delKeeps: 'Behålls',
  delKeepsList: ['Kontrakt och intervjuer (underlag för medarbetarna)'],
  delReason: 'Varför tas chefen bort?',
  reasons: {
    fired: 'Avskedad / uppsagd',
    left_job: 'Har slutat',
    contract_ended: 'Kontraktet har löpt ut',
    created_by_mistake: 'Skapades av misstag',
    other: 'Annat',
  },
  delNote: 'Beskriv anledningen',
  delNoteOptional: 'Anteckning (valfritt)',
  delConfirmLabel: 'Bekräfta genom att skriva',
  delButton: 'Ta bort chefen permanent',
  deleting: 'Tar bort…',
  delFailed: 'Kunde inte ta bort chefen.',
  delReasonRequired: 'Välj en anledning',
}

export const MANAGER_TX = { en, sv }
export type ManagersTx = typeof en
export const txFor = (language: string | undefined): ManagersTx => (language === 'en' ? en : sv)

export const STATUS_STYLE: Record<ManagerStatus, { bg: string; text: string; dot: string }> = {
  active: { bg: 'rgb(240,253,244)', text: 'rgb(21,128,61)', dot: 'rgb(34,197,94)' },
  inactive: { bg: 'rgb(241,245,249)', text: 'rgb(71,85,105)', dot: 'rgb(148,163,184)' },
  pending: { bg: 'rgb(255,251,235)', text: 'rgb(161,98,7)', dot: 'rgb(245,158,11)' },
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('') || '?'

export function relativeTime(iso: string | null, tx: ManagersTx, language: string) {
  if (!iso) return tx.never
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (min < 2) return tx.justNow
  if (min < 60) return tx.minAgo(min)
  const h = Math.round(min / 60)
  if (h < 24) return tx.hAgo(h)
  const d = Math.round(h / 24)
  if (d < 14) return tx.daysAgo(d)
  return new Date(iso).toLocaleDateString(language === 'en' ? 'en-GB' : 'sv-SE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export const formatDate = (iso: string | null, language: string) =>
  iso
    ? new Date(iso).toLocaleDateString(language === 'en' ? 'en-GB' : 'sv-SE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—'
