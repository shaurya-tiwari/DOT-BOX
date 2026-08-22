import { useEffect, useRef, useState } from 'react'
import logo from '../assets/dotbox-logo-dark.png'
import './SplashScreen.css'

export default function SplashScreen({ onFinish }) {
  const [risen,   setRisen]   = useState(false)
  const [isOpen,  setIsOpen]  = useState(false)
  const [fadingOut, setFadingOut] = useState(false)

  // The whole spinning unit (logo + text together)
  const unitRef  = useRef(null)
  const rafRef   = useRef(null)
  const angleRef = useRef(0)
  const speedRef = useRef(0)
  const stageRef = useRef('idle')

  /* ── JS-driven smooth spin → decelerate → snap ── */
  const runSpin = () => {
    stageRef.current = 'spinning'
    let last = null

    const tick = (ts) => {
      if (last !== null) {
        const dt = Math.min(ts - last, 50)

        if (stageRef.current === 'spinning') {
          // Accelerate
          speedRef.current = Math.min(speedRef.current + dt * 0.001, 0.30)
          angleRef.current += speedRef.current * dt

          if (unitRef.current) {
            unitRef.current.style.transition = 'none'
            unitRef.current.style.transform  =
              `perspective(800px) rotateX(-12deg) rotateY(${angleRef.current}deg)`
          }
          rafRef.current = requestAnimationFrame(tick)

        } else if (stageRef.current === 'decelerating') {
          // Decelerate smoothly
          speedRef.current = Math.max(speedRef.current - dt * 0.0012, 0)
          angleRef.current += speedRef.current * dt

          if (speedRef.current === 0) {
            stageRef.current = 'stopped'
            // Snap to nearest full rotation (faces front)
            const snap = Math.round(angleRef.current / 360) * 360
            if (unitRef.current) {
              unitRef.current.style.transition = 'transform 0.5s cubic-bezier(0.25,1,0.5,1)'
              unitRef.current.style.transform  =
                `perspective(800px) rotateX(-12deg) rotateY(${snap}deg)`
            }
            return
          }

          if (unitRef.current) {
            unitRef.current.style.transition = 'none'
            unitRef.current.style.transform  =
              `perspective(800px) rotateX(-12deg) rotateY(${angleRef.current}deg)`
          }
          rafRef.current = requestAnimationFrame(tick)
        }
      }
      last = ts
    }

    rafRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => {
    const t = [
      setTimeout(() => setRisen(true),                        80),
      setTimeout(() => runSpin(),                            350),
      setTimeout(() => { stageRef.current = 'decelerating' }, 2200),
      setTimeout(() => setIsOpen(true),                     3000),
      setTimeout(() => setFadingOut(true),                  5400),
      setTimeout(() => onFinish?.(),                        6100),
    ]
    return () => {
      t.forEach(clearTimeout)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [onFinish])

  return (
    <div className={`sp-overlay${fadingOut ? ' sp-out' : ''}`}>
      <div className="sp-scanlines" />

      <div className="sp-scene">

        {/* ── Rising wrapper (handles vertical entry) ── */}
        <div className={`sp-riser${risen ? ' risen' : ''}`}>

          {/* ── Spinning unit: logo + text rotate TOGETHER ── */}
          <div
            className="sp-unit"
            ref={unitRef}
            style={{ transform: 'perspective(800px) rotateX(-12deg) rotateY(0deg)' }}
          >
            {/* Logo image */}
            <img
              src={logo}
              alt="DOT-BOX logo"
              className="sp-logo"
            />

            {/* DOT-BOX text — spins with the logo */}
            <div className={`sp-label${isOpen ? ' label-glow' : ''}`}>
              DOT-BOX
            </div>
          </div>

          {/* Lid flies off when box opens (outside spinner so it goes own way) */}
          <div className={`sp-lid${isOpen ? ' lid-up' : ''}`} />

          {/* Glow burst when box opens */}
          <div className={`sp-burst${isOpen ? ' burst-on' : ''}`} />
        </div>

        {/* Ground shadow */}
        <div className={`sp-shadow${risen ? ' shadow-on' : ''}`} />
      </div>
    </div>
  )
}
