// The identity model for CLASS STUDENTS. Pure functions, no network.
//
// A class student has no email. They are known by (class code, roll number) and prove it with a 6-digit PIN.
// Under the hood that is a normal Supabase Auth user whose email is a hidden "pseudo email" built from the
// class code and the roll number, and whose password is the PIN. The pseudo email is never shown, never mailed.
//
// normalizeRoll() follows EXACTLY the same rules as the database function join_class_with_roll
// (backend/db/migrations/2026-11-01_roll_numbers.sql). If you change one, change the other.

export type Check<T> = { ok: true; value: T } | { ok: false; message: string }

// The domain of the hidden login addresses. A setting, not a secret. The letters before the @ are made from the
// class code and roll number, so this domain never needs a real mailbox. If Supabase refuses the domain
// ("email address is invalid"), set VITE_CLASS_LOGIN_DOMAIN to a domain you own.
const FALLBACK_DOMAIN = 'students.taleem360.example'
const envDomain = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_CLASS_LOGIN_DOMAIN
export const CLASS_LOGIN_DOMAIN = (envDomain && envDomain.trim() ? envDomain.trim() : FALLBACK_DOMAIN).toLowerCase()

export const CLASS_CODE_LENGTH = 6
export const PIN_LENGTH = 6
export const ROLL_MAX = 20
export const NAME_MIN = 2
export const NAME_MAX = 60

/** Upper case, letters and digits only, at most 6 characters. */
export function normalizeClassCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CLASS_CODE_LENGTH)
}

/**
 * Roll number rules (same as the SQL):
 *   1. trim, upper case, collapse runs of spaces into one space
 *   2. if it is all digits, strip leading zeros ("007" -> "7", "000" -> "0")
 * The result may still be invalid: see checkRoll().
 */
export function normalizeRoll(raw: string): string {
  let r = raw.trim().toUpperCase().replace(/\s+/g, ' ')
  if (/^[0-9]+$/.test(r)) r = r.replace(/^0+(?=[0-9])/, '')
  return r
}

const ROLL_ALLOWED = /^[A-Z0-9/-]+$/

/** Normalise and check a roll number: 1 to 20 characters, only A-Z, 0-9, dash and slash. */
export function checkRoll(raw: string): Check<string> {
  const roll = normalizeRoll(raw)
  if (!roll) return { ok: false, message: 'Please enter your roll number.' }
  if (roll.length > ROLL_MAX) return { ok: false, message: `A roll number can have at most ${ROLL_MAX} characters.` }
  if (!ROLL_ALLOWED.test(roll)) return { ok: false, message: 'A roll number can only use letters, numbers, a dash (-) and a slash (/).' }
  return { ok: true, value: roll }
}

/** The hidden login address for (class code, roll number). Both are normalised first. Needs a valid roll. */
export function pseudoEmail(classCode: string, roll: string): string {
  const code = normalizeClassCode(classCode).toLowerCase()
  const r = normalizeRoll(roll).toLowerCase().replace(/\//g, '_') // "/" is not safe in an address
  return `${code}.${r}@${CLASS_LOGIN_DOMAIN}`
}

/** True for a hidden class-login address. Use it to make sure such an address is never shown. */
export function isClassLoginEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase().endsWith(`@${CLASS_LOGIN_DOMAIN}`)
}

/** Exactly 6 digits, and not an obvious one (all the same digit, or a run up or down such as 123456 or 654321). */
export function validatePin(pin: string): Check<string> {
  if (!new RegExp(`^[0-9]{${PIN_LENGTH}}$`).test(pin)) {
    return { ok: false, message: `Your PIN must be exactly ${PIN_LENGTH} digits.` }
  }
  const d = pin.split('').map(Number)
  const steps = d.slice(1).map((n, i) => (n - d[i] + 10) % 10) // difference to the previous digit, 0 to 9
  const allSame = steps.every((s) => s === 0)
  const up = steps.every((s) => s === 1) // 123456, 012345, 567890 (9 then 0 counts as the next step)
  const down = steps.every((s) => s === 9) // 654321, 987654, 109876
  if (allSame || up || down) {
    return { ok: false, message: 'That PIN is too easy to guess. Do not use one repeated digit or a run like 123456.' }
  }
  return { ok: true, value: pin }
}

// Letters of any script (Urdu included), combining marks, space, hyphen, apostrophe (straight or curly), full stop.
const NAME_ALLOWED = /^[\p{L}\p{M} '’.-]+$/u

/**
 * A full name: trimmed, inner spaces collapsed, 2 to 60 characters, with at least one letter.
 * Only letters (any language), marks, spaces, "-", "'" and "." are allowed: no digits, no symbols, no backtick.
 */
export function checkName(raw: string): Check<string> {
  const name = raw.trim().replace(/\s+/g, ' ')
  const length = Array.from(name).length // count characters, not UTF-16 units
  if (length < NAME_MIN) return { ok: false, message: `Please enter your full name (at least ${NAME_MIN} letters).` }
  if (length > NAME_MAX) return { ok: false, message: `Your name can have at most ${NAME_MAX} letters.` }
  if (!NAME_ALLOWED.test(name) || !/\p{L}/u.test(name)) {
    return { ok: false, message: 'Your name can only use letters, spaces, a dash (-), an apostrophe and a full stop (.).' }
  }
  return { ok: true, value: name }
}
