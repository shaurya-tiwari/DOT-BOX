import { useEffect, useRef, useState } from 'react'
import { GameSocket } from '../socket'
import Header        from '../components/Header'
import TurnIndicator from '../components/TurnIndicator'
import ScoreBoard    from '../components/ScoreBoard'
import GameBoard     from '../components/GameBoard'
import GameResult    from './GameResult'

export default function Game({ navigate, gameData, setGameData }) {
  const { roomId, playerId, playerName } = gameData || {}
  const [game, setGame]               = useState(gameData?.gameState || null)
  const [disconnected, setDisconnected] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    if (!roomId || !playerId) return

    const socket = new GameSocket(roomId, playerId, (msg) => {
      if (msg.type === 'game_state') {
        setGame(msg.game)
      } else if (msg.type === 'player_disconnected') {
        setDisconnected(true)
      }
    })
    socket.connect()
    socketRef.current = socket

    return () => socket.disconnect()
  }, [roomId, playerId])

  function handleMove(wallId) {
    socketRef.current?.sendMove(wallId)
  }

  function handleRematch() {
    socketRef.current?.sendRematch()
  }

  if (!game) {
    return (
      <div className="page">
        <div className="spinner" />
        <p className="text-small text-muted">Connecting…</p>
      </div>
    )
  }

  const isMyTurn = game.current_turn === playerId && game.status === 'playing'
  const myPlayer  = game.players?.find(p => p.player_id === playerId)
  const oppPlayer = game.players?.find(p => p.player_id !== playerId)

  return (
    <div className="page page-game fade-in">
      <Header roomId={roomId} />

      {disconnected && (
        <div className="disconnect-banner">⚠ Opponent disconnected</div>
      )}

      <TurnIndicator
        isMyTurn={isMyTurn}
        myName={myPlayer?.name || playerName}
        oppName={oppPlayer?.name || 'Opponent'}
        status={game.status}
      />

      <div className="board-container">
        <GameBoard
          game={game}
          playerId={playerId}
          isMyTurn={isMyTurn}
          onMove={handleMove}
        />
      </div>

      <ScoreBoard
        game={game}
        playerId={playerId}
      />

      {game.status === 'finished' && (
        <GameResult
          game={game}
          playerId={playerId}
          playerName={playerName}
          onRematch={handleRematch}
          onHome={() => navigate('home')}
          inline
        />
      )}
    </div>
  )
}
