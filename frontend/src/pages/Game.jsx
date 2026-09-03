import { useEffect, useRef, useState, useCallback } from 'react'
import { GameSocket } from '../socket'
import Header        from '../components/Header'
import { ScoreRow }  from '../components/ScoreBoard'
import GameBoard     from '../components/GameBoard'
import GameResult    from './GameResult'
import ConfirmModal  from '../components/ConfirmModal'

export default function Game({ navigate, gameData, setGameData }) {
  const { roomId, playerId, playerName } = gameData || {}

  const [game, setGame]                         = useState(gameData?.gameState || null)
  // isHost passed explicitly from WaitingRoom; fallback to players[0] for reconnect
  const isHost = gameData?.isHost ?? (game?.players?.[0]?.player_id === playerId)
  const [disconnectedPlayer, setDisconnectedPlayer] = useState(null)
  const [socketState, setSocketState]           = useState('connecting')
  const [pendingMove, setPendingMove]           = useState(false)

  // Modal state: null | 'leave' | 'backToRoom'
  const [modal, setModal] = useState(null)

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

  // Exit game — player leaves silently, game continues for others
  const handleLeaveConfirm = useCallback(() => {
    setModal(null)
    socketRef.current?.sendLeaveRoom()
    navigate('home')
  }, [])

  // Host: back to room lobby — all players go back to waiting room
  const handleBackToRoomConfirm = useCallback(() => {
    setModal(null)
    socketRef.current?.sendBackToLobby()
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
        <Header isMyTurn={isMyTurn} />

        {socketState === 'reconnecting' && (
          <div className="reconnect-banner">🔄 Reconnecting…</div>
        )}
        {disconnectedPlayer && socketState === 'open' && (
          <div className="disconnect-banner">⚠ {disconnectedPlayer} disconnected</div>
        )}

        {/* Scores — player points */}
        <ScoreRow players={players} playerId={playerId} currentTurn={current_turn} />

        {/* Turn pill — below scores */}
        <div className={`turn-line${isMyTurn ? ' my-turn' : ''}`}>
          <span className={`turn-dot-small ${isMyTurn ? 'my' : 'their'}`} />
          <span className="turn-label">{turnLabel}</span>
        </div>
      </div>

      {/* ── Board ── */}
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

      {/* ── Bottom action bar — always visible for all players ── */}
      {status !== 'finished' && (
        <div className="game-bottom">
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'center',
            maxWidth: 480,
            margin: '0 auto',
            padding: '0.25rem 1rem',
          }}>
            {/* Every player gets Exit Game */}
            <button
              id="btn-exit-game"
              className="btn btn-ghost btn-sm"
              onClick={() => setModal('leave')}
            >
              ✕ Exit Game
            </button>

            {/* Host only: Back to Room */}
            {isHost && (
              <button
                id="btn-back-to-room"
                className="btn btn-ghost btn-sm"
                onClick={() => setModal('backToRoom')}
              >
                ↩ Back to Room
              </button>
            )}
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
          onHome={() => setModal('leave')}
          inline
        />
      )}

      {/* ── Exit Game confirm modal ── */}
      {modal === 'leave' && (
        <ConfirmModal
          title="Exit game?"
          message="You'll leave the game and go home. The game will continue for other players."
          confirmLabel="✕ Yes, exit"
          cancelLabel="Stay"
          onConfirm={handleLeaveConfirm}
          onCancel={() => setModal(null)}
          danger={true}
        />
      )}

      {/* ── Back to Room confirm modal (host only) ── */}
      {modal === 'backToRoom' && (
        <ConfirmModal
          title="Back to Room?"
          message="This will take ALL players back to the waiting room and end the current game."
          confirmLabel="↩ Yes, back to room"
          cancelLabel="Keep playing"
          onConfirm={handleBackToRoomConfirm}
          onCancel={() => setModal(null)}
          danger={false}
        />
      )}
    </div>
  )
}
