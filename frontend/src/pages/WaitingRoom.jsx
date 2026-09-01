import { useEffect, useRef, useState } from 'react'
import { GameSocket } from '../socket'

export default function WaitingRoom({ navigate, gameData }) {
  const { roomId, playerId, playerName } = gameData || {}
  const socketRef = useRef(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!roomId || !playerId) return

    const socket = new GameSocket(roomId, playerId, (msg) => {
      if (msg.type === 'game_state' && msg.game.status === 'playing') {
        navigate('game', { gameState: msg.game })
      }
    })
    socket.connect()
    socketRef.current = socket

    return () => socket.disconnect()
  }, [roomId, playerId])

  function copyCode() {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="page fade-in">
      <div className="logo" style={{ textAlign: 'center' }}>
        <h2 className="text-title">Waiting for opponent…</h2>
        <p className="text-body text-muted" style={{ marginTop: '0.5rem' }}>
          Share this room code with your friend
        </p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
        {/* Room code display */}
        <div style={{ textAlign: 'center' }}>
          <p className="input-label" style={{ marginBottom: '0.5rem' }}>Room Code</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="room-code text-display" style={{ fontSize: '2.5rem', letterSpacing: '0.15em' }}>
              {roomId}
            </span>
            <button
              id="btn-copy-code"
              className="copy-btn"
              title={copied ? 'Copied!' : 'Copy code'}
              onClick={copyCode}
              style={{ fontSize: '1.25rem' }}
            >
              {copied ? '✓' : '⧉'}
            </button>
          </div>
        </div>

        {/* Animated waiting spinner */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div className="spinner" />
          <p className="text-small text-muted">You are <strong>{playerName}</strong> · Player 1</p>
        </div>

        <button
          id="btn-copy-link"
          className="btn btn-ghost"
          onClick={copyCode}
        >
          {copied ? '✓ Copied!' : '⧉ Copy Room Code'}
        </button>
      </div>

      <button className="btn btn-ghost btn-sm" style={{ width: 'auto' }}
        onClick={() => navigate('home')}>
        ← Cancel
      </button>

      {copied && <div className="toast">Room code copied!</div>}
    </div>
  )
}
