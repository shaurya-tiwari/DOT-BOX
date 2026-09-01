import { useState } from 'react'

export default function Header({ roomId }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="game-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
          DOT<span style={{ color: 'var(--accent)' }}>·</span>BOX
        </span>
      </div>

      <div className="room-badge">
        <span className="text-muted text-small">Room</span>
        <span className="room-code">{roomId}</span>
        <button id="btn-header-copy" className="copy-btn" onClick={copy} title="Copy code">
          {copied ? '✓' : '⧉'}
        </button>
      </div>

      {copied && <div className="toast">Code copied!</div>}
    </div>
  )
}
