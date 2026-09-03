import { useEffect, useRef, useState } from 'react'
import { GameSocket } from '../socket'
import ConfirmModal from '../components/ConfirmModal'

export default function WaitingRoom({ navigate, gameData }) {
  const { roomId, playerId, playerName, isInLobby } = gameData || {}
  const socketRef = useRef(null)
  const [copied, setCopied] = useState(false)
  const [gameStatus, setGameStatus] = useState(isInLobby ? 'lobby' : 'waiting')
  const [maxPlayers, setMaxPlayers] = useState(gameData?.maxPlayers || gameData?.gameState?.max_players || 2)
  // When returning to lobby, init from gameState so player list doesn't flash
  const initPlayers = gameData?.gameState?.players?.length
    ? gameData.gameState.players.map(p => ({ player_id: p.player_id, player_name: p.name, connected: p.connected }))
    : [{ player_id: playerId, player_name: playerName, connected: true }]
  const [connectedPlayers, setConnectedPlayers] = useState(initPlayers)
  const [showJoinedToast, setShowJoinedToast] = useState(null)
  const [showLeaveModal, setShowLeaveModal] = useState(false)

  const isLobby = gameStatus === 'lobby'
  const isHost  = connectedPlayers[0]?.player_id === playerId
  const activePlayers = connectedPlayers.filter(p => p.connected)
  const [isStarting, setIsStarting] = useState(false)

  // ── Browser back button protection ────────────────────────────────────────
  useEffect(() => {
    window.history.pushState({ dotbox: 'waiting' }, '')

    const onPopState = () => {
      window.history.pushState({ dotbox: 'waiting' }, '')
      setShowLeaveModal(true)
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (!roomId || !playerId) return

    const socket = new GameSocket(roomId, playerId, (msg) => {
      if (msg.type === 'game_state') {
        const g = msg.game

        if (g.players?.length) {
          setConnectedPlayers(
            g.players.map(p => ({ player_id: p.player_id, player_name: p.name, connected: p.connected }))
          )
        }
        if (g.max_players) setMaxPlayers(g.max_players)
        setGameStatus(g.status)

        if (g.status === 'playing') {
          setIsStarting(false)
          // Compute isHost from live game data — NOT from React state which may be stale
          const amHost = g.players?.[0]?.player_id === playerId
          navigate('game', { gameState: g, isHost: amHost })
        }

      } else if (msg.type === 'player_connected') {
        if (msg.player_id !== playerId) {
          setConnectedPlayers(prev => {
            const exists = prev.some(p => p.player_id === msg.player_id)
            if (exists) {
              return prev.map(p => p.player_id === msg.player_id ? { ...p, connected: true } : p)
            }
            return [...prev, { player_id: msg.player_id, player_name: msg.player_name, connected: true }]
          })
          setShowJoinedToast(msg.player_name)
          setTimeout(() => setShowJoinedToast(null), 3000)
        }
      } else if (msg.type === 'error') {
        if (msg.message === 'Room not found') {
          socketRef.current?.disconnect()
          navigate('home')
        }
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

  function handleStartGame() {
    setIsStarting(true)
    socketRef.current?.sendStartGame()
  }

  // Leave button clicked → show confirmation modal
  function handleLeaveClick() {
    setShowLeaveModal(true)
  }

  // User confirmed leave
  function handleLeaveConfirm() {
    setShowLeaveModal(false)
    socketRef.current?.sendLeaveRoom()
    navigate('home')
  }

  const waitingForMore = activePlayers.length < maxPlayers && !isLobby

  const headerTitle = isLobby
    ? '🏠 Room Lobby'
    : waitingForMore
      ? 'Waiting for players…'
      : 'Starting game…'

  const headerSub = isLobby
    ? (maxPlayers === 2 ? 'Both players connected. Ready to play again?' : 'All players connected. Ready to play again?')
    : waitingForMore
      ? 'Share this room code with your friends'
      : (maxPlayers === 2 ? 'Both players connected! Get ready.' : 'All players connected! Get ready.')

  return (
    <div className="page fade-in">
      <div className="logo" style={{ textAlign: 'center' }}>
        <h2 className="text-title">{headerTitle}</h2>
        <p className="text-body text-muted" style={{ marginTop: '0.5rem' }}>
          {headerSub}
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

        {/* Live player list */}
        <div className="player-list" style={{ width: '100%' }}>
          <p className="input-label" style={{ marginBottom: '0.5rem' }}>
            Players ({connectedPlayers.length}/{maxPlayers})
          </p>
          {Array.from({ length: maxPlayers }, (_, i) => {
            const p = connectedPlayers[i]
            const isMe = p && p.player_id === playerId
            return (
              <div key={i} className={`player-slot ${p ? (p.connected ? 'filled' : 'empty') : 'empty'}`}>
                <div className={`player-avatar p${i + 1}`}>
                  {p ? Array.from(p.player_name)[0]?.toUpperCase() || '?' : '?'}
                </div>
                <div>
                  <div className="player-slot-name">
                    {p ? p.player_name : 'Waiting…'}
                    {isMe && <span className="you-badge"> (you)</span>}
                    {p && !isMe && i === 0 && <span className="you-badge"> 👑</span>}
                  </div>
                  <div className="text-small text-muted">
                    {p ? (p.connected ? `Player ${i + 1} · Connected` : `Disconnected`) : 'Not yet joined'}
                  </div>
                </div>
                {p && p.connected && <div className="player-connected-dot" />}
              </div>
            )
          })}
        </div>

        {/* Lobby: HOST ONLY — Start Game button */}
        {isLobby && activePlayers.length >= 2 && isHost && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              id="btn-start-game"
              className="btn btn-accent"
              onClick={handleStartGame}
              disabled={isStarting}
            >
              {isStarting ? 'Starting…' : '▶ Start Game!'}
            </button>
            <p className="text-small text-muted" style={{ textAlign: 'center' }}>
              👑 You are the host — only you can start
            </p>
          </div>
        )}

        {/* Lobby: GUEST — waiting for host to start */}
        {isLobby && activePlayers.length >= 2 && !isHost && (
          <div className="guest-waiting-msg">
            👑 Waiting for host to start the game…
          </div>
        )}

        {/* Waiting: spinner or ready pulse */}
        {!isLobby && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            {waitingForMore
              ? <div className="spinner" />
              : <div className="ready-pulse" />}
          </div>
        )}

        {/* Lobby: waiting for 2nd player to rejoin */}
        {isLobby && activePlayers.length < 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div className="spinner" />
            <p className="text-small text-muted">Waiting for opponent to reconnect…</p>
          </div>
        )}

        <button
          id="btn-copy-link"
          className="btn btn-ghost"
          onClick={copyCode}
        >
          {copied ? '✓ Copied!' : '⧉ Copy Room Code'}
        </button>
      </div>

      {/* Leave button — shows confirmation modal */}
      <button className="btn btn-ghost btn-sm" style={{ width: 'auto' }}
        onClick={handleLeaveClick}>
        ← {isLobby ? 'Leave Room' : 'Cancel'}
      </button>

      {/* Confirmation modal */}
      {showLeaveModal && (
        <ConfirmModal
          title="Leave this room?"
          message="You will leave the room and return to the home screen."
          confirmLabel="✕ Yes, leave room"
          cancelLabel="No, stay"
          onConfirm={handleLeaveConfirm}
          onCancel={() => setShowLeaveModal(false)}
          danger={true}
        />
      )}

      {copied && <div className="toast">Room code copied!</div>}
      {showJoinedToast && (
        <div className="toast toast-success">
          🎮 {showJoinedToast} joined the room!
        </div>
      )}
    </div>
  )
}
