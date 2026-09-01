import { useState } from 'react'
import { createGame } from '../api'

const SIZES = [
  { value: 3, label: '3×3', sub: '4 boxes' },
  { value: 4, label: '4×4', sub: '9 boxes' },
  { value: 5, label: '5×5', sub: '16 boxes' },
]

export default function CreateGame({ navigate }) {
  const [name, setName] = useState('')
  const [size, setSize] = useState(4)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!name.trim()) { setError('Please enter your name'); return }
    setError('')
    setLoading(true)
    try {
      const data = await createGame(name.trim(), size)
      navigate('waiting', {
        roomId: data.room_id,
        playerId: data.player_id,
        playerName: name.trim(),
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
        <p className="text-body text-muted">Set up a new room and invite a friend.</p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

        <div className="input-group">
          <label className="input-label">Grid Size</label>
          <div className="grid-options">
            {SIZES.map(s => (
              <button
                key={s.value}
                id={`grid-${s.value}`}
                className={`grid-option ${size === s.value ? 'selected' : ''}`}
                onClick={() => setSize(s.value)}
              >
                {s.label}
                <span className="grid-sub">{s.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {error && <p className="input-hint">{error}</p>}

        <button id="btn-create-confirm" className="btn btn-accent" onClick={handleCreate} disabled={loading}>
          {loading ? 'Creating…' : 'Create Room →'}
        </button>
      </div>
    </div>
  )
}
