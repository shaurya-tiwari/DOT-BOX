import { useState } from 'react'
import { createGame } from '../api'

const SIZES = [
  { value: 20, label: '20×20', sub: '361 boxes' },
  { value: 18, label: '18×18', sub: '289 boxes' },
  { value: 16, label: '16×16', sub: '225 boxes' },
  { value: 14, label: '14×14', sub: '169 boxes' },
  { value: 12, label: '12×12', sub: '121 boxes' },
  { value: 10, label: '10×10', sub: '81 boxes'  },
  { value: 8,  label: '8×8',  sub: '49 boxes'  },
  { value: 6,  label: '6×6',  sub: '25 boxes'  },
]

const PLAYER_COUNTS = [2, 3, 4, 5]

export default function CreateGame({ navigate }) {
  const [name, setName]             = useState('')
  const [size, setSize]             = useState(6)   // minimum as default
  const [maxPlayers, setMaxPlayers] = useState(2)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleCreate() {
    if (!name.trim()) { setError('Please enter your name'); return }
    setError('')
    setLoading(true)
    try {
      const data = await createGame(name.trim(), size, maxPlayers)
      navigate('waiting', {
        roomId: data.room_id,
        playerId: data.player_id,
        playerName: name.trim(),
        maxPlayers: data.max_players,
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page fade-in">
      <div style={{ width: '100%' }}>
        <button className="btn btn-ghost btn-sm" style={{ width: 'auto', marginBottom: '1.5rem' }}
          onClick={() => navigate('home')}>
          ← Back
        </button>
        <h2 className="text-title" style={{ marginBottom: '0.25rem' }}>Create Game</h2>
        <p className="text-body text-muted">Set up a new room and invite friends.</p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Name */}
        <div className="input-group">
          <label className="input-label">Your Name</label>
          <input
            id="input-name-create"
            className={`input ${error && !name.trim() ? 'input-error' : ''}`}
            placeholder="e.g. Aashish"
            value={name}
            maxLength={20}
            onChange={e => { setName(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
        </div>

        {/* Max Players */}
        <div className="input-group">
          <label className="input-label">Max Players</label>
          <div className="player-count-options">
            {PLAYER_COUNTS.map(n => (
              <button
                key={n}
                id={`players-${n}`}
                className={`player-count-btn ${maxPlayers === n ? 'selected' : ''}`}
                onClick={() => setMaxPlayers(n)}
              >
                <span className="player-count-num">{n}</span>
                <span className="player-count-sub">
                  {n === 2 ? '1v1' : n === 3 ? '3P' : n === 4 ? '4P' : '5P'}
                </span>
              </button>
            ))}
          </div>
          <p className="text-small text-muted" style={{ marginTop: '0.375rem' }}>
            Game starts when host clicks Start (min 2 joined)
          </p>
        </div>

        {/* Grid Size */}
        <div className="input-group">
          <label className="input-label">Grid Size</label>
          <div className="grid-options-grid">
            {SIZES.map(s => (
              <button
                key={s.value}
                id={`grid-${s.value}`}
                className={`grid-option-big ${size === s.value ? 'selected' : ''}`}
                onClick={() => setSize(s.value)}
              >
                <div className="grid-option-label">{s.label}</div>
                <div className="grid-option-sub">{s.sub}</div>
                {size === s.value && <div className="grid-option-check">✓</div>}
              </button>
            ))}
          </div>
          <p className="text-small text-muted" style={{ marginTop: '0.5rem' }}>
            Selected: <strong>{size}×{size}</strong> — {(size - 1) * (size - 1)} boxes total
          </p>
        </div>

        {error && <p className="input-hint">{error}</p>}

        <button id="btn-create-confirm" className="btn btn-accent" onClick={handleCreate} disabled={loading}>
          {loading ? 'Creating…' : 'Create Room →'}
        </button>
      </div>
    </div>
  )
}
