import { useEffect, useState } from 'react'

const S = 160   // face size px
const H = S / 2 // half = translateZ

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('hidden')

  useEffect(() => {
    const ts = [
      setTimeout(() => setPhase('rising'),   80),
      setTimeout(() => setPhase('spinning'), 1000),
      setTimeout(() => setPhase('floating'), 2450),
      setTimeout(() => setPhase('text'),     2520),
      setTimeout(() => setPhase('exiting'),  3700),
      setTimeout(() => onComplete(),          4200),
    ]
    return () => ts.forEach(clearTimeout)
  }, [onComplete])

  /* ── Phase → cube transform / animation ─────────────────────────────────── */
  // Isometric dice start: show front + right + top
  const REST = 'rotateX(-28deg) rotateY(38deg)'

  let cubeTransform = REST
  let cubeAnimation = 'none'

  if (phase === 'spinning') {
    // RIGHT → LEFT: Y goes from +38 down to -322 (full rotation leftward)
    cubeAnimation = 'dice-spin-rtl 1.45s cubic-bezier(0.22, 0.61, 0.36, 1) forwards'
  } else if (phase === 'floating' || phase === 'text') {
    cubeTransform = 'rotateX(-28deg) rotateY(-322deg)'
    cubeAnimation = 'dice-idle-float 3.2s ease-in-out infinite'
  }

  const isRising  = phase !== 'hidden'
  const isExiting = phase === 'exiting'
  const showText  = phase === 'text' || phase === 'exiting'

  /* ── Dice face renderer ──────────────────────────────────────────────────── */
  function diceFace(transform, letter, letterColor, faceColor) {
    return (
      <div style={{
        position: 'absolute',
        width: S, height: S,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        background: faceColor,
        transform,
        borderRadius: 22,          // dice-style rounded corners
        border: '2.5px solid rgba(255,255,255,0.1)',
        boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.09), inset 0 -2px 0 rgba(0,0,0,0.3)',
        overflow: 'hidden',
      }}>
        {/* ── Corner pips (like a real dice) ── */}
        {[
          { top: 12, left: 12 },
          { top: 12, right: 12 },
          { bottom: 12, left: 12 },
          { bottom: 12, right: 12 },
        ].map((pos, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 9, height: 9,
            borderRadius: '50%',
            background: letterColor === '#D4874E'
              ? 'rgba(212,135,78,0.35)'
              : 'rgba(245,240,232,0.18)',
            ...pos,
          }} />
        ))}

        {/* ── The letter ── */}
        <span style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontWeight: 900,
          fontSize: 82,
          lineHeight: 1,
          color: letterColor,
          letterSpacing: '-0.06em',
          userSelect: 'none',
          position: 'relative', zIndex: 1,
          textShadow: letterColor === '#D4874E'
            ? '0 0 40px rgba(212,135,78,0.6), 0 2px 8px rgba(0,0,0,0.4)'
            : '0 0 30px rgba(245,240,232,0.25), 0 2px 8px rgba(0,0,0,0.5)',
        }}>
          {letter}
        </span>
      </div>
    )
  }

  const CREAM  = '#F5F0E8'
  const ORANGE = '#D4874E'

  // Face backgrounds — slightly different shades to sell the 3D
  const F_FRONT  = 'linear-gradient(145deg, #252525 0%, #1E1E1E 100%)'
  const F_BACK   = 'linear-gradient(145deg, #191919 0%, #141414 100%)'
  const F_RIGHT  = 'linear-gradient(145deg, #202020 0%, #181818 100%)'
  const F_LEFT   = 'linear-gradient(145deg, #2A2A2A 0%, #222222 100%)'
  const F_TOP    = 'linear-gradient(145deg, #2E2E2E 0%, #242424 100%)'
  const F_BOTTOM = 'linear-gradient(145deg, #131313 0%, #0F0F0F 100%)'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0C0C0C',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 64,
      opacity: isExiting ? 0 : 1,
      transition: isExiting ? 'opacity 0.52s ease' : 'none',
      pointerEvents: isExiting ? 'none' : 'auto',
    }}>

      {/* dot-grid backdrop */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(212,135,78,0.055) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      {/* ambient glow */}
      <div style={{
        position: 'absolute',
        width: 500, height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,135,78,0.13) 0%, transparent 66%)',
        pointerEvents: 'none',
        opacity: isRising ? 1 : 0,
        transition: 'opacity 0.7s ease',
      }} />

      {/* ── Rising wrapper ── */}
      <div style={{
        perspective: 1200,
        perspectiveOrigin: '50% 44%',
        transform: isRising ? 'translateY(0)' : 'translateY(115vh)',
        opacity: isRising ? 1 : 0,
        transition: isRising
          ? 'transform 0.82s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease'
          : 'none',
        position: 'relative', zIndex: 1,
      }}>

        {/* ── 3D Dice ── */}
        <div style={{
          width: S, height: S,
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: cubeTransform,
          animation: cubeAnimation,
          // cast drop shadow beneath dice
          filter: 'drop-shadow(0 32px 64px rgba(212,135,78,0.32))',
        }}>

          {/* FRONT  → D  (cream) */}
          {diceFace(`translateZ(${H}px)`,              'D', CREAM,  F_FRONT)}

          {/* BACK   → X  (orange) */}
          {diceFace(`rotateY(180deg) translateZ(${H}px)`, 'X', ORANGE, F_BACK)}

          {/* RIGHT  → O  (orange) */}
          {diceFace(`rotateY(90deg) translateZ(${H}px)`,  'O', ORANGE, F_RIGHT)}

          {/* LEFT   → B  (cream) */}
          {diceFace(`rotateY(-90deg) translateZ(${H}px)`, 'B', CREAM,  F_LEFT)}

          {/* TOP    → T  (cream) */}
          {diceFace(`rotateX(90deg) translateZ(${H}px)`,  'T', CREAM,  F_TOP)}

          {/* BOTTOM → O  (orange) */}
          {diceFace(`rotateX(-90deg) translateZ(${H}px)`, 'O', ORANGE, F_BOTTOM)}
        </div>
      </div>

      {/* ── DOT·BOX text reveal ── */}
      <div style={{
        textAlign: 'center',
        opacity: showText ? 1 : 0,
        transform: showText ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.88)',
        transition: showText
          ? 'opacity 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
          : 'none',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 900,
          fontSize: 'clamp(3.4rem, 12vw, 5.4rem)',
          letterSpacing: '-0.05em',
          color: '#F5F0E8',
          lineHeight: 1,
        }}>
          DOT<span style={{ color: '#D4874E' }}>·</span>BOX
        </div>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          fontSize: '0.78rem',
          color: 'rgba(245,240,232,0.38)',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          marginTop: '0.72rem',
        }}>
          Real-time Multiplayer
        </div>
      </div>

    </div>
  )
}
