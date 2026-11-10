// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/chat/contacts/route.ts   (NEW)
// URL:            GET /api/chat/contacts → { data: ChatPerson[] }
// WHAT IT DOES:   Everyone the logged-in person may start a chat with
//                 (see utils/server/chat.ts for the rules), sorted by name.
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { chatContacts, loadChatPeople, requireChatUser } from '@/utils/server/chat'

export async function GET(req: NextRequest) {
  try {
    const me = await requireChatUser(req)
    if (!me) return NextResponse.json({ message: 'Not authorized' }, { status: 401 })
    const payload = await getPayload({ config })

    const contacts = await chatContacts(payload, me, true)
    const ids = [...contacts.keys()]
    const vias = [...contacts.values()].map((c) => c.via).filter((v): v is number => v != null)
    const people = await loadChatPeople(payload, [...ids, ...vias])

    const data = ids
      .map((id) => {
        const p = people.get(String(id))
        if (!p) return null
        const c = contacts.get(id)!
        return {
          ...p,
          relation: c.relation,
          via: c.via != null ? people.get(String(c.via))?.name : undefined,
        }
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.name.localeCompare(b.name, 'sv'))

    return NextResponse.json(
      { data },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to load chat contacts:', error)
    return NextResponse.json({ message: 'Failed to load contacts' }, { status: 500 })
  }
}
