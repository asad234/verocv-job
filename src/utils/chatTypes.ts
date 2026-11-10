// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/chatTypes.ts   (NEW — shared by server + client)
// WHAT IT DOES:   The shapes /api/chat/... sends back.
// ══════════════════════════════════════════════════════════════════════

export type ChatRole = 'employee' | 'manager' | 'admin'

/**
 * Why you can message this person (from YOUR point of view):
 *   manager        – they're your manager (you accepted their invitation)
 *   employee       – they're your employee
 *   colleague      – another manager in your company
 *   admin          – your company's admin
 *   covering       – an employee of a colleague you're covering for (`via` = colleague)
 *   team_manager   – (admins) a manager in your company
 *   team_employee  – (admins) an employee of one of your managers (`via` = manager)
 */
export type ChatRelation =
  | 'manager'
  | 'employee'
  | 'colleague'
  | 'admin'
  | 'covering'
  | 'team_manager'
  | 'team_employee'

/**
 * What a person chose:
 *   available      Available / online
 *   busy           Busy
 *   in_meeting     In a meeting
 *   away           Away / be right back
 *   out_of_office  Not at the office
 *   not_available  Not available (do not disturb)
 *   offline        Appear offline
 * What others SEE can also be 'offline' when someone chose 'available' but
 * hasn't had VeroCV open for a few minutes.
 */
export type PresenceStatus =
  | 'available'
  | 'busy'
  | 'in_meeting'
  | 'away'
  | 'out_of_office'
  | 'not_available'
  | 'offline'

export const PRESENCE_STATUSES: PresenceStatus[] = [
  'available',
  'busy',
  'in_meeting',
  'away',
  'out_of_office',
  'not_available',
  'offline',
]

export interface ChatPresence {
  /** What to show to others right now. */
  status: PresenceStatus
  /** Optional note, e.g. "Back at 14:00". */
  message?: string | null
  /** When the chosen status ends by itself (then back to Available). */
  until?: string | null
  /** Last time they had VeroCV open (only sent when shown as offline). */
  lastSeenAt?: string | null
}

/** Your own presence, as the picker needs it. */
export interface MyPresence extends ChatPresence {
  /** What you picked (status above is what others see). */
  chosen: PresenceStatus
}

export const PRESENCE_MESSAGE_MAX = 80

export interface ChatPerson {
  id: string
  name: string
  email: string
  role: ChatRole
  jobTitle?: string
  company?: string
  relation?: ChatRelation
  via?: string
  presence?: ChatPresence
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  body: string
  createdAt: string
}

export interface ChatConversation {
  id: string
  other: ChatPerson
  lastMessage: { body: string; senderId: string | null; at: string } | null
  unread: number
  /** When the other person last opened this chat → "Seen". */
  otherLastReadAt: string | null
  /** False when you're no longer connected (access revoked…) → read-only. */
  canSend: boolean
}

export const CHAT_MAX_LENGTH = 4000
export const CHAT_UNREAD_EVENT = 'veroCv:chat-unread-changed'
export const PRESENCE_CHANGED_EVENT = 'veroCv:presence-changed'
