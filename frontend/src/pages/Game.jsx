import { useEffect, useRef, useState, useCallback } from 'react'
import { GameSocket } from '../socket'
import Header        from '../components/Header'
import { ScoreRow } from '../components/ScoreBoard'
import GameBoard     from '../components/GameBoard'
import GameResult    from './GameResult'
import ConfirmModal  from '../components/ConfirmModal'

export default function Game({ navigate, gameData, setGameData }) {
  const { roomId, playerId, playerName } = gameData || {}

  const [game, setGame]                 = useState(gameData?.gameState || null)
  const isHost = game?.players?.[0]?.player_id === playerId
  const [disconnectedPlayer, setDisconnectedPlayer] = useState(null)
  const [socketState, setSocketState]   = useState('connecting')
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [pendingMove, setPendingMove]   = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    if (!roomId || !playerId) return

    const socket = new GameSocket(roomId, playerId,
      (msg) => {
        if (msg.type === 'game_state') {
          const g = msg.game
          setGame(g)
          setPendingMove(false)
          if (g.status === 'lobby') {
            navigate('waiting', { roomId, playerId, playerName, gameState: g, isInLobby: true })
          }
        } else if (msg.type === 'player_disconnected') {
          setDisconnectedPlayer(msg.player_name || 'Opponent')
        } else if (msg.type === 'player_connected') {
          if (msg.player_id !== playerId) setDisconnectedPlayer(null)
        } else if (msg.type === 'error') {
          console.warn('[DOT-BOX] Server error:', msg.message)
          setPendingMove(false)
          if (msg.message === 'Room not found') {
            socketRef.current?.disconnect()
            navigate('home')
          }
        }
      },
      { onStateChange: setSocketState, onOpen: () => setDisconnectedPlayer(null) }
    )
    socket.connect()
    socketRef.current = socket
    return () => socket.disconnect()
  }, [roomId, playerId])

  const handleMove = useCallback((wallId) => {
    if (pendingMove) return
    setPendingMove(true)
    socketRef.current?.sendMove(wallId)
  }, [pendingMove])
  
  const handleLeaveClick   = useCallback(() => setShowLeaveModal(true), [])
  const handleLeaveConfirm = useCallback(() => {
    setShowLeaveModal(false)
    socketRef.current?.sendLeaveRoom()
    navigate('home')
  }, [])

  if (!game) {
    return (
      <div className="page">
        <div className="spinner" />
        <p className="text-small text-muted">Connecting…</p>
      </div>
    )
  }

  const { players = [], current_turn, status } = game
  const isMyTurn   = current_turn === playerId && status === 'playing'
  const canMove    = isMyTurn && !pendingMove
  const turnPlayer = players.find(p => p.player_id === current_turn)
  const turnLabel  = status === 'playing'
    ? isMyTurn ? 'Your turn' : `${turnPlayer?.name || 'Opponent'}'s turn`
    : status === 'finished' ? 'Game over' : ''

  return (
    <div className="page-game-root fade-in">
      {/* ── Top bar ── */}
      <div className="game-top">
        <Header roomId={roomId} playerCount={players.length} />

        {socketState === 'reconnecting' && (
          <div className="reconnect-banner">🔄 Reconnecting…</div>
        )}
        {disconnectedPlayer && socketState === 'open' && (
          <div className="disconnect-banner">⚠ {disconnectedPlayer} disconnected</div>
        )}

        {/* Turn pill */}
        <div className="turn-line">
          <span className={`turn-dot-small ${isMyTurn ? 'my' : 'their'}`} />
          <span className="turn-label">{turnLabel}</span>
        </div>

        {/* Scores for ALL player counts — compact row above the board */}
        <ScoreRow players={players} playerId={playerId} currentTurn={current_turn} />
      </div>

      {/* ── Board — full width, no side panels ── */}
      <div className="game-main" style={{ padding: '0 4px' }}>
        <div className="game-center" style={{ width: '100%' }}>
          <GameBoard
            game={game}
            playerId={playerId}
            isMyTurn={canMove}
            onMove={handleMove}
          />
        </div>
      </div>

      {/* ── Host controls ── */}
      {isHost && status !== 'finished' && (
        <div className="game-bottom">
          <div className="host-controls" style={{ maxWidth: 480, margin: '0 auto' }}>
            <span className="host-badge">👑 Host</span>
            <div className="host-actions">
              <button id="btn-host-lobby" className="host-btn" onClick={() => socketRef.current?.sendBackToLobby()}>
                ↩ Back to Lobby
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Game over overlay ── */}
      {status === 'finished' && (
        <GameResult
          game={game}
          playerId={playerId}
          playerName={playerName}
          isHost={isHost}
          onBackToLobby={() => socketRef.current?.sendBackToLobby()}
          onHome={handleLeaveClick}
          inline
        />
      )}

      {/* ── Confirm modal ── */}
      {showLeaveModal && (
        <ConfirmModal
          title="Leave this room?"
          message="You will leave the game and return to the home screen."
          confirmLabel="✕ Yes, leave room"
          cancelLabel="No, stay"
          onConfirm={handleLeaveConfirm}
          onCancel={() => setShowLeaveModal(false)}
          danger={true}
        />
      )}
    </div>
  )
}
