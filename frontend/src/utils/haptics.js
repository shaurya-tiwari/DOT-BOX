/**
 * Haptic feedback utility — wraps Web Vibration API.
 * Safe to call on any device; silently no-ops if API is unavailable.
 *
 * Production rules:
 *  - Single vibrate() call per action (no double-call motor glitch).
 *  - Per-slot cooldown via a pre-seeded Map — O(1) lookup, zero prototype
 *    pollution risk (plain objects inherit toString/constructor/etc.).
 *  - navigator.vibrate() returns false gracefully when called pre-gesture
 *    on modern browsers, so we do NOT hard-gate on a primed flag.
 *  - primeVibration() is a best-effort unlock for older Android browsers.
 */

const supported =
  typeof navigator !== 'undefined' &&
  typeof navigator.vibrate === 'function'

/** Whether vibration has been unlocked by a user gesture */
let primed = false

/**
 * DSA: Map with pre-seeded keys for all haptic slots.
 * - O(1) get/set (hash map internally)
 * - No prototype chain — plain objects inherit built-ins like
 *   "toString", "constructor" which would corrupt a `{}` lookup.
 * - Fixed key set makes the API surface explicit and auditable.
 */
const lastFired = new Map([
  ['myTurn', 0],
  ['scored',  0],
  ['placed',  0],
])

/**
 * Internal: fire a vibration pattern only if the cooldown for `slot` has elapsed.
 * @param {'myTurn'|'scored'|'placed'} slot
 * @param {number|number[]} pattern
 * @param {number} cooldownMs
 */
function fire(slot, pattern, cooldownMs) {
  if (!supported) return
  const now = Date.now()
  if (now - lastFired.get(slot) < cooldownMs) return
  lastFired.set(slot, now)
  try {
    navigator.vibrate(pattern)
  } catch {
    // safety net — some browsers throw instead of returning false
  }
}

/**
 * Best-effort unlock for older Android browsers that require an explicit
 * user gesture before navigator.vibrate() activates.
 * Call once inside any touchstart/click handler.
 */
export function primeVibration() {
  if (!supported || primed) return
  try {
    navigator.vibrate(1) // imperceptible 1ms pulse — satisfies gesture gate
    primed = true
  } catch {
    // not critical — fire() will still attempt on every call
  }
}

/** Two firm pulses — fires when your turn starts. 600 ms cooldown. */
export function vibrateMyTurn() {
  fire('myTurn', [80, 50, 80], 600)
}

/** Ascending double-tap — fires when you close a box. 300 ms cooldown. */
export function vibrateScored() {
  fire('scored', [40, 60, 80], 300)
}

/** Single short tap — fires on successful wall placement. 150 ms cooldown. */
export function vibratePlaced() {
  fire('placed', [25], 150)
}
