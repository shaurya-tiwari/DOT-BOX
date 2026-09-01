import { useState } from 'react'
import { joinGame } from '../api'

export default function JoinGame({ navigate }) {
  const [name, setName]       = useState('')
  const [code, setCode]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleJoin() {
    if (!name.trim()) { setError('Please enter your name'); return }
    if (code.trim().length !== 6) { setError('Room code must be 6 characters'); return }
    setError('')
    setLoading(true)
    try {
      const data = await joinGame(code.trim(), name.trim())
      // IMPORTANT: Navigate to 'waiting' (not 'game') so the WebSocket handshake
      // completes properly. WaitingRoom auto-redirects both players once
      // game_state.status === 'playing' is received.
      navigate('waiting', {
        roomId: data.room_id,
        playerId: data.player_id,
        playerName: name.trim(),
        isJoiner: true,
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
        <h2 className="text-title" style={{ marginBottom: '0.25rem' }}>Join Game</h2>
        <p className="text-body text-muted">Enter a room code to join a friend's game.</p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="input-group">
          <label className="input-label">Your Name</label>
          <input
            id="input-name-join"
            className={`input ${error.includes('name') ? 'input-error' : ''}`}
            placeholder="e.g. Rahul"
            value={name}
            maxLength={20}
            onChange={e => { setName(e.target.value); setError('') }}
          />
        </div>

        <div className="input-group">
          <label className="input-label">Room Code</label>
          <input
            id="input-room-code"
            className={`input mono ${error.includes('code') || error.includes('Room') || error.includes('6') ? 'input-error' : ''}`}
            placeholder="ABC123"
            value={code}
            maxLength={6}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
          />
        </div>

        {error && <p className="input-hint">{error}</p>}

        <button id="btn-join-confirm" className="btn btn-primary" onClick={handleJoin} disabled={loading}>
          {loading ? 'Joining…' : 'Join Room →'}
        </button>
      </div>
    </div>
  )
}
