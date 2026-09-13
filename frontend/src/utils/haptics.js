/**
 * Haptic feedback utility — wraps Web Vibration API.
 * Safe to call on any device; silently no-ops if API is unavailable.
 *
 * IMPORTANT: Many mobile browsers require a user gesture (tap/click)
 * before navigator.vibrate() is allowed. Call primeVibration() once
 * inside any touchstart/click handler to unlock the API.
 */

const supported = typeof navigator !== 'undefined' && 'vibrate' in navigator

/** Whether vibration has been unlocked by a user gesture */
let primed = false

/**
 * Call this ONCE inside a user-gesture event handler (touchstart, click, etc.)
 * to unlock the Vibration API on browsers that require user activation.
 * Uses a 1ms vibration that is imperceptible but satisfies the gesture gate.
 */
export function primeVibration() {
  if (!supported || primed) return
  try {
    navigator.vibrate(1) // imperceptible 1ms pulse to unlock the API
    primed = true
  } catch {
    // silently ignore — device doesn't support vibration
  }
}

/** Firm double-tap — used when your turn starts */
export function vibrateMyTurn() {
  if (!supported) return
  // Cancel any ongoing vibration first, then fire a fresh pattern
  navigator.vibrate(0)
  navigator.vibrate([80, 50, 80]) // two firm pulses — impossible to miss
}

/** Double tap — used when you score a box */
export function vibrateScored() {
  if (!supported) return
  navigator.vibrate([40, 60, 80])
}

/** Light tap — used on successful wall placement */
export function vibratePlaced() {
  if (!supported) return
  navigator.vibrate([25])
}
