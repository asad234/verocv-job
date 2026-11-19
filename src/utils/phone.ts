// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/phone.ts   (used in the browser AND by the collections)
// Phone numbers: digits only. One "+" is allowed as the very first character
// (for country codes, e.g. +46701234567). No letters, spaces or other signs. 6–15 digits.
// ══════════════════════════════════════════════════════════════════════

/** Keeps only digits (and one "+" at the start). Used while typing / pasting and when loading. */
export function sanitizePhone(value: string): string {
  const v = value.trim()
  const plus = v.startsWith('+') ? '+' : ''
  return (plus + v.replace(/\D/g, '')).slice(0, 16)
}

export function isValidPhone(value?: string | null): boolean {
  const v = (value ?? '').trim()
  if (!v) return true // empty = not filled in, that's fine
  return /^\+?\d{6,15}$/.test(v)
}

/** For Payload `validate` on text fields — the database only accepts digits (and a leading +). */
export function validatePhoneField(value: unknown): true | string {
  if (value === null || value === undefined) return true
  const v = String(value).trim()
  if (v === '' || /^\+?\d+$/.test(v)) return true
  return 'Enter a valid phone number (digits only, may start with +)'
}
