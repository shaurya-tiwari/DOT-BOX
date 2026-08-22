import { useEffect, useRef, useState } from 'react'
import logo from '../assets/dotbox-logo-dark.png'
import './SplashScreen.css'

export default function SplashScreen({ onFinish }) {
  const [risen, setRisen] = useState(false)
  const [opened, setOpened] = useState(false)
  const [done, setDone] = useState(false)

  const unitRef = useRef(null)
  const rafRef = useRef(null)
  const angle = useRef(0)
  const speed = useRef(0)
  const spinning = useRef(false)

  function applyRotation() {
    if (!unitRef.current) return
    unitRef.current.style.transition = 'none'
    unitRef.current.style.transform = `perspective(800px) rotateX(-12deg) rotateY(${angle.current}deg)`
  }

  function spinLoop(ts, lastTs) {
    if (!lastTs) {
      rafRef.current = requestAnimationFrame((t) => spinLoop(t, ts))
      return
    }

    const dt = Math.min(ts - lastTs, 50)

    if (spinning.current) {
      speed.current = Math.min(speed.current + dt * 0.001, 0.3)
    } else {
      speed.current = Math.max(speed.current - dt * 0.0012, 0)
    }

    angle.current += speed.current * dt
    applyRotation()

    if (!spinning.current && speed.current === 0) {
      // snap to nearest full rotation so logo faces forward
      const snapped = Math.round(angle.current / 360) * 360
      unitRef.current.style.transition = 'transform 0.5s ease-out'
      unitRef.current.style.transform = `perspective(800px) rotateX(-12deg) rotateY(${snapped}deg)`
      return
    }

    rafRef.current = requestAnimationFrame((t) => spinLoop(t, ts))
  }

  useEffect(() => {
    const timers = [
      setTimeout(() => setRisen(true), 100),
      setTimeout(() => {
        spinning.current = true
        rafRef.current = requestAnimationFrame((ts) => spinLoop(ts, null))
      }, 400),
      setTimeout(() => { spinning.current = false }, 2200),
      setTimeout(() => setOpened(true), 3000),
      setTimeout(() => setDone(true), 5400),
      setTimeout(() => onFinish?.(), 6100),
    ]

    return () => {
      timers.forEach(clearTimeout)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div className={`splash ${done ? 'splash-exit' : ''}`}>
      <div className="scanlines" />

      <div className="scene">
        <div className={`riser ${risen ? 'riser-in' : ''}`}>
          <div
            className="spin-unit"
            ref={unitRef}
            style={{ transform: 'perspective(800px) rotateX(-12deg) rotateY(0deg)' }}
          >
            <img src={logo} alt="DOT-BOX" className="logo-img" />
            <p className={`logo-text ${opened ? 'glow' : ''}`}>DOT-BOX</p>
          </div>

          <div className={`lid ${opened ? 'lid-open' : ''}`} />
          <div className={`burst ${opened ? 'burst-pop' : ''}`} />
        </div>

        <div className={`ground-shadow ${risen ? 'shadow-in' : ''}`} />
      </div>
    </div>
  )
}
