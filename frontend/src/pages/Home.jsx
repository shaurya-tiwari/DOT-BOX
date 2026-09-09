import { useState, useEffect } from 'react'
import { pingServer } from '../api'

export default function Home({ navigate }) {
  const [serverStatus, setServerStatus] = useState('Connecting to server...')

  useEffect(() => {
    let cancelled = false
    async function tryPing(attempt = 0) {
      try {
        await pingServer()
        if (!cancelled) setServerStatus('Connected to server')
      } catch {
        if (cancelled) return
        if (attempt < 5) {
          setServerStatus('Waking up server… (this takes ~30s on first visit)')
          setTimeout(() => tryPing(attempt + 1), 5000)
        } else {
          setServerStatus('Server unavailable — please try again later')
        }
      }
    }
    tryPing()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="page fade-in" style={{ position: 'relative' }}>
      {/* Logo */}
      <div className="logo">
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          <span className="logo-dot" />
          <span className="logo-dot" />
          <span className="logo-dot" />
        </div>
        <h1 className="text-display" style={{ textAlign: 'center' }}>
          DOT<span style={{ color: 'var(--accent)' }}>·</span>BOX
        </h1>
        <p className="text-body text-muted" style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          Real-time multiplayer Dots &amp; Boxes
        </p>
      </div>

      {/* Actions */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <button id="btn-create" className="btn btn-primary" onClick={() => navigate('create')}>
          ✦ Create Game
        </button>
        <div className="divider">or</div>
        <button id="btn-join" className="btn btn-ghost" onClick={() => navigate('join')}>
          Enter Room Code
        </button>
      </div>

      {/* Footer hint */}
      <p className="text-small text-muted" style={{ textAlign: 'center' }}>
        Share a room code with a friend to play together
      </p>

      {/* Server Status Indicator */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '0.85rem',
        fontWeight: '500',
        color: 'var(--ink-muted)',
        pointerEvents: 'none'
      }}>
        {serverStatus}
      </div>
    </div>
  )
}
