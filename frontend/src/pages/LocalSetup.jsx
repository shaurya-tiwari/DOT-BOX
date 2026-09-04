import { useState } from 'react'

export default function LocalSetup({ navigate }) {
  const [playerCount, setPlayerCount] = useState(2)
  const [gridSize,    setGridSize]    = useState(4)

  function startGame() {
    navigate('local-game', { playerCount, gridSize })
  }

  const playerOptions = [2, 3, 4, 5, 6]
  const gridOptions   = [
    { size: 3, label: '3×3', sub: 'Quick' },
    { size: 4, label: '4×4', sub: 'Classic' },
    { size: 5, label: '5×5', sub: 'Long' },
  ]

  return (
    <div className="page fade-in">
      {/* Logo */}
      <div className="logo">
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          <span className="logo-dot" />
          <span className="logo-dot" />
          <span className="logo-dot" />
        </div>
        <h1 className="text-display" style={{ textAlign: 'center' }}>
          LOCAL<span style={{ color: 'var(--accent)' }}>·</span>PLAY
        </h1>
        <p className="text-body text-muted" style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          Pass &amp; play on one device
        </p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Number of Players */}
        <div className="input-group">
          <label className="input-label">Number of Players</label>
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
            {playerOptions.map(n => (
              <button
                key={n}
                id={`btn-players-${n}`}
                className={`grid-option${playerCount === n ? ' selected' : ''}`}
                onClick={() => setPlayerCount(n)}
                style={{ flex: 1 }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Size */}
        <div className="input-group">
          <label className="input-label">Grid Size</label>
          <div className="grid-options">
            {gridOptions.map(({ size, label, sub }) => (
              <button
                key={size}
                id={`btn-grid-${size}`}
                className={`grid-option${gridSize === size ? ' selected' : ''}`}
                onClick={() => setGridSize(size)}
              >
                {label}
                <span className="grid-sub">{sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Players Preview */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
          justifyContent: 'center', padding: '0.25rem 0'
        }}>
          {Array.from({ length: playerCount }, (_, i) => (
            <span key={i} style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              background: 'var(--bg)',
              border: '1.5px solid var(--border)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--ink-muted)',
            }}>
              Player {i + 1}
            </span>
          ))}
        </div>

        <button id="btn-start-local" className="btn btn-primary" onClick={startGame}>
          ✦ Start Game
        </button>
      </div>

      <button
        id="btn-back-home"
        className="btn btn-ghost btn-sm"
        onClick={() => navigate('home')}
        style={{ width: 'auto' }}
      >
        ← Back
      </button>
    </div>
  )
}
