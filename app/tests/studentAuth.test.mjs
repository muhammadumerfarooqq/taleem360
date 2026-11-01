// Boundary tests for the class-student identity rules. No test framework needed.
// Run from the app/ folder (Node 22 or newer):   node tests/studentAuth.test.mjs
import assert from 'node:assert/strict'
import * as S from '../src/lib/studentAuth.ts'

let n = 0
const ok = (name, fn) => {
  fn()
  n++
  console.log('  ok  ', name)
}

ok('class code: upper case, only letters and digits, 6 characters', () => {
  assert.equal(S.normalizeClassCode(' vf4-bd2 '), 'VF4BD2')
  assert.equal(S.normalizeClassCode('abcdefgh'), 'ABCDEF')
  assert.equal(S.normalizeClassCode(''), '')
})

ok('roll: trim, upper case, collapse spaces', () => {
  assert.equal(S.normalizeRoll('  12a  '), '12A')
  assert.equal(S.normalizeRoll('a   b'), 'A B')
})

ok('roll: leading zeros stripped only when all digits', () => {
  assert.equal(S.normalizeRoll('007'), '7')
  assert.equal(S.normalizeRoll('0'), '0')
  assert.equal(S.normalizeRoll('000'), '0')
  assert.equal(S.normalizeRoll('0100'), '100')
  assert.equal(S.normalizeRoll('007A'), '007A') // not all digits: kept
  assert.equal(S.normalizeRoll('A007'), 'A007')
})

ok('roll: checkRoll accepts and rejects', () => {
  assert.deepEqual(S.checkRoll(' 07 '), { ok: true, value: '7' })
  assert.deepEqual(S.checkRoll('12-a/3'), { ok: true, value: '12-A/3' })
  assert.equal(S.checkRoll('').ok, false)
  assert.equal(S.checkRoll('   ').ok, false)
  assert.equal(S.checkRoll('A'.repeat(20)).ok, true)
  assert.equal(S.checkRoll('A'.repeat(21)).ok, false) // too long
  assert.equal(S.checkRoll('1 2').ok, false) // an inner space is not an allowed character
  assert.equal(S.checkRoll('12.5').ok, false)
  assert.equal(S.checkRoll('12@5').ok, false)
  assert.equal(S.checkRoll("1'; drop").ok, false)
  assert.equal(S.checkRoll('٣').ok, false) // non-ASCII digit
})

ok('pseudo email: same person, same address, however they type it', () => {
  const a = S.pseudoEmail('vf4bd2', '007')
  assert.equal(a, S.pseudoEmail(' VF4-BD2 ', '7'))
  assert.equal(a, S.pseudoEmail('VF4BD2', ' 7 '))
  assert.ok(a.endsWith('@' + S.CLASS_LOGIN_DOMAIN))
  assert.notEqual(a, S.pseudoEmail('VF4BD2', '8')) // another roll
  assert.notEqual(a, S.pseudoEmail('VF4BD3', '7')) // another class
})

ok('pseudo email: safe characters only', () => {
  const e = S.pseudoEmail('AB12CD', '12-A/3')
  assert.match(e, /^[a-z0-9._-]+@[a-z0-9.-]+$/)
  assert.equal(e.split('@')[0], 'ab12cd.12-a_3')
})

ok('isClassLoginEmail', () => {
  assert.equal(S.isClassLoginEmail(S.pseudoEmail('VF4BD2', '7')), true)
  assert.equal(S.isClassLoginEmail('SARA@' + S.CLASS_LOGIN_DOMAIN.toUpperCase()), true)
  assert.equal(S.isClassLoginEmail('sara@gmail.com'), false)
  assert.equal(S.isClassLoginEmail('x@evil-' + S.CLASS_LOGIN_DOMAIN), false)
  assert.equal(S.isClassLoginEmail(null), false)
  assert.equal(S.isClassLoginEmail(undefined), false)
})

ok('pin: exactly 6 digits', () => {
  for (const bad of ['', '12345', '1234567', '12345a', '12 456', '１２３４５７']) assert.equal(S.validatePin(bad).ok, false, bad)
  assert.equal(S.validatePin('482915').ok, true)
  assert.equal(S.validatePin('000001').ok, true) // not trivial
  assert.equal(S.validatePin('135790').ok, true)
})

ok('pin: all the same digit is rejected', () => {
  for (let d = 0; d <= 9; d++) assert.equal(S.validatePin(String(d).repeat(6)).ok, false, String(d))
})

ok('pin: ascending and descending runs are rejected', () => {
  for (const bad of ['123456', '012345', '234567', '345678', '456789', '567890', '654321', '987654', '543210', '109876']) {
    assert.equal(S.validatePin(bad).ok, false, bad)
  }
  assert.equal(S.validatePin('123457').ok, true)
  assert.equal(S.validatePin('123465').ok, true)
  assert.equal(S.validatePin('135246').ok, true)
})

ok('name: trimmed, 2 to 60 characters', () => {
  assert.deepEqual(S.checkName('  Sara   Khan '), { ok: true, value: 'Sara Khan' })
  assert.equal(S.checkName('A').ok, false)
  assert.equal(S.checkName('  A ').ok, false)
  assert.equal(S.checkName('Al').ok, true)
  assert.equal(S.checkName('x'.repeat(60)).ok, true)
  assert.equal(S.checkName('x'.repeat(61)).ok, false)
  assert.equal(S.checkName('سارہ خان').ok, true) // Urdu names are fine
})

ok('name: letters of any language, marks, space, hyphen, apostrophe and full stop are allowed', () => {
  assert.equal(S.checkName("Anne-Marie O'Neil").ok, true)
  assert.equal(S.checkName('Dr. Sara Khan').ok, true)
  assert.equal(S.checkName('O’Brien').ok, true) // curly apostrophe
  assert.equal(S.checkName('José Müller').ok, true)
  assert.equal(S.checkName('محمد عمر فاروق').ok, true) // Urdu
  assert.equal(S.checkName('عائشہ').ok, true) // Urdu with a combining mark
  assert.equal(S.checkName('ée').ok, true) // base letter + combining accent
})

ok('name: digits, symbols, backtick, angle brackets and other punctuation are rejected', () => {
  for (const bad of ['Sara`Khan', 'Sara1', 'Sara_Khan', '<b>Sara</b>', 'Sara;DROP', 'Sara@Khan', 'Sara/Khan', 'Sara​Khan', 'Sara😀']) {
    assert.equal(S.checkName(bad).ok, false, bad)
  }
  assert.equal(S.checkName('..').ok, false) // no letter at all
  assert.equal(S.checkName("-'").ok, false)
})

ok('name: length counts characters, 2 to 60, after trimming', () => {
  assert.equal(S.checkName('  ع  ').ok, false) // one letter
  assert.equal(S.checkName('عا').ok, true)
  assert.equal(S.checkName('ع'.repeat(60)).ok, true)
  assert.equal(S.checkName('ع'.repeat(61)).ok, false)
  assert.equal(S.checkName(' ' + String.fromCharCode(9, 10) + ' ').ok, false) // only a tab and a newline
  assert.deepEqual(S.checkName('  سارہ ' + String.fromCharCode(9) + ' خان '), { ok: true, value: 'سارہ خان' })
})

console.log(n + ' groups of checks passed')
