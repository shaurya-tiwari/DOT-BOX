import { useEffect, useRef, useState, useCallback } from 'react'
import { GameSocket } from '../socket'
import Header from '../components/Header'
import { ScoreRow } from '../components/ScoreBoard'
import GameBoard from '../components/GameBoard'
import GameResult from './GameResult'
import ConfirmModal from '../components/ConfirmModal'
import { vibrateMyTurn, primeVibration } from '../utils/haptics'

export default function Game({ navigate, gameData, _setGameData }) {
  const { roomId, playerId, playerName } = gameData || {}

  const [game, setGame] = useState(gameData?.gameState || null)
  // isHost passed explicitly from WaitingRoom; fallback to players[0] for reconnect
  const isHost = gameData?.isHost ?? (game?.players?.[0]?.player_id === playerId)
  const [disconnectedPlayer, setDisconnectedPlayer] = useState(null)
  const [socketState, setSocketState] = useState('connecting')
  const [pendingMove, setPendingMove] = useState(false)

  // Modal state: null | 'leave' | 'backToRoom'
  const [modal, setModal] = useState(null)

  const socketRef = useRef(null)

  // ── Prime Vibration API on first user interaction ─────────────────────────
  // Many mobile browsers block navigator.vibrate() until a user gesture occurs.
  // The host clicks "Start Game" (gesture) so their phone works, but non-host
  // players haven't tapped anything on the Game page yet. This one-time listener
  // fires an imperceptible 1ms vibration on the FIRST touch/click to unlock the
  // API for ALL players.
  useEffect(() => {
    const handler = () => {
      primeVibration()
      window.removeEventListener('touchstart', handler, true)
      window.removeEventListener('click', handler, true)
    }
    window.addEventListener('touchstart', handler, { capture: true, once: true })
    window.addEventListener('click', handler, { capture: true, once: true })
    return () => {
      window.removeEventListener('touchstart', handler, true)
      window.removeEventListener('click', handler, true)
    }
  }, [])

  // ── Haptic feedback: vibrate when turn becomes yours ──────────────────────
  // Track the actual current_turn player ID (not a derived boolean) to avoid
  // glitchy double-fires from the server sending 2 game_state messages on
  // WebSocket connect (personal send + room broadcast).
  const isMyTurn = game?.current_turn === playerId && game?.status === 'playing'
  const prevTurnRef = useRef(null)
  const vibrateTimerRef = useRef(null)

  useEffect(() => {
    const currentTurn = game?.status === 'playing' ? game?.current_turn : null

    // Only vibrate when turn genuinely CHANGES to this player
    if (currentTurn === playerId && prevTurnRef.current !== playerId) {
      // Debounce: server often sends 2 game_state messages in rapid succession
      // (personal + broadcast). Wait 100ms to let them settle, then vibrate once.
      clearTimeout(vibrateTimerRef.current)
      vibrateTimerRef.current = setTimeout(() => {
        vibrateTimerRef.current = null
        vibrateMyTurn()
      }, 100)
    } else if (currentTurn !== playerId) {
      // Turn moved away from us — cancel any pending vibration
      clearTimeout(vibrateTimerRef.current)
    }

    prevTurnRef.current = currentTurn
    return () => clearTimeout(vibrateTimerRef.current)
  }, [game?.current_turn, game?.status, playerId])

  // ── Browser back button + tab close protection ────────────────────────────
  useEffect(() => {
    // Push a dummy history entry so back button stays on this page
    window.history.pushState({ dotbox: 'game' }, '')

    const onPopState = (_e) => {
      // User pressed browser back — push state again and show our modal
      window.history.pushState({ dotbox: 'game' }, '')
      setModal('leave')
    }

    const onBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = ''  // Chrome requires this
    }

    window.addEventListener('popstate', onPopState)
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [])

  // ── Socket connection ─────────────────────────────────────────────────────
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
    // Safety timeout — unlock if server never responds (network issue)
    setTimeout(() => setPendingMove(false), 5000)
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

  // Guard: if gameData is missing (stale tab/bookmark), redirect home
  if (!roomId || !playerId) {
    navigate('home')
    return null
  }

  if (!game) {
    return (
      <div className="page">
        <div className="spinner" />
        <p className="text-small text-muted">Connecting…</p>
      </div>
    )
  }

  const { players = [], current_turn, status } = game
  const canMove = isMyTurn && !pendingMove
  const turnPlayer = players.find(p => p.player_id === current_turn)
  // Guard: if current_turn points to a player who left (remove_player race),
  // show a safe fallback instead of "undefined's turn"
  const turnLabel = status === 'playing'
    ? isMyTurn
      ? 'Your turn'
      : turnPlayer
        ? `${turnPlayer.name}'s turn`
        : 'Waiting…'   // server is catching up after a player left
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
