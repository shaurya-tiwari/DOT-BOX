/**
 * Haptic feedback utility — wraps Web Vibration API.
 * Safe to call on any device; silently no-ops if API is unavailable.
 */

const supported = typeof navigator !== 'undefined' && 'vibrate' in navigator

/** Short single tap — used when your turn starts */
export function vibrateMyTurn() {
  if (!supported) return
  navigator.vibrate([60])           // one 60ms pulse — firm but short
}

/** Double tap — used when you score a box */
export function vibrateScored() {
  if (!supported) return
  navigator.vibrate([40, 60, 80])   // 40ms on, 60ms off, 80ms on
}

/** Light tap — used on successful wall placement */
export function vibratePlaced() {
  if (!supported) return
  navigator.vibrate([25])           // very light
}
