import { useState } from 'react'

export default function Header({ roomId, playerCount = 0 }) {
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

      <div style={{ display: 'flex', align: 'center', gap: '0.5rem' }}>
        {/* Player count indicator */}
        <div className="player-count-badge" title={`${playerCount} of 2 players connected`}>
          <span className={`player-count-dot ${playerCount >= 1 ? 'on' : ''}`} />
          <span className={`player-count-dot ${playerCount >= 2 ? 'on' : ''}`} />
          <span className="text-small" style={{ color: playerCount >= 2 ? 'var(--ink)' : 'var(--ink-muted)' }}>
            {playerCount}/2
          </span>
        </div>

        <div className="room-badge">
          <span className="text-muted text-small">Room</span>
          <span className="room-code">{roomId}</span>
          <button id="btn-header-copy" className="copy-btn" onClick={copy} title="Copy code">
            {copied ? '✓' : '⧉'}
          </button>
        </div>
      </div>

      {copied && <div className="toast">Code copied!</div>}
    </div>
  )
}
