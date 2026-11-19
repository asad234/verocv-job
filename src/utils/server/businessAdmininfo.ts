// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/server/businessAdminInfo.ts   (NEW — server only)
// Shared by the photo + logo routes.
// Payload validates the WHOLE record on every save, so an old phone number with spaces
// or dashes ("+46 70-123 45 67") makes even a photo upload fail. withCleanPhones() adds
// the cleaned numbers (digits + leading "+") to the save, which also fixes them for good.
// ══════════════════════════════════════════════════════════════════════

import { sanitizePhone } from '@/utils/phone'

export async function findOrCreateAdminInfo(payload: any, userId: number) {
  const { docs } = await payload.find({
    collection: 'business-admin-info',
    where: { user: { equals: userId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (docs[0]) return docs[0]
  return payload.create({
    collection: 'business-admin-info',
    data: { user: userId },
    overrideAccess: true,
    depth: 0,
  })
}

/** Digits (+ leading "+") — or null when there is no number. */
const clean = (v: unknown): string | null =>
  typeof v === 'string' && v.trim() ? sanitizePhone(v) : null

/** `data` for payload.update + the record's phone numbers cleaned. `companyPatch` is merged into company. */
export function withCleanPhones<T extends Record<string, any>>(
  doc: any,
  data: T,
  companyPatch?: Record<string, any>,
): T & { phone: string | null; company: any } {
  const company: any = { ...(doc.company ?? {}), ...(companyPatch ?? {}) }
  delete company.id
  company.companyPhone = clean(company.companyPhone)
  return { ...data, phone: clean(doc.phone), company }
}
