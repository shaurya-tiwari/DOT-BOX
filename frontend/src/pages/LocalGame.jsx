import { useState, useCallback } from 'react'
import Header    from '../components/Header'
import GameBoard from '../components/GameBoard'

// 6-player color palette (stroke colors for scoreboard accents)
const PLAYER_COLORS = ['#5C4033', '#2C4A5C', '#3A5C2C', '#7A3B5C', '#5C5030', '#2C4A4A']

// Build initial game state from playerCount + gridSize
function buildGame(playerCount, gridSize) {
  const players = Array.from({ length: playerCount }, (_, i) => ({
    player_id: `local-${i + 1}`,
    name: `Player ${i + 1}`,
    score: 0,
  }))
  return {
    grid_size: gridSize,
    players,
    walls: [],
    boxes: {},
    status: 'playing',
    current_turn: players[0].player_id,
    winner: null,
  }
}

// Pure logic: check which boxes are completed after placing a wall
function checkBoxes(game, wallId) {
  const n = game.grid_size - 1
  const [orient, rStr, cStr] = wallId.split('-')
  const r = parseInt(rStr), c = parseInt(cStr)
  const candidates = orient === 'h' ? [[r - 1, c], [r, c]] : [[r, c - 1], [r, c]]
  const wallsSet = new Set(game.walls)
  const completed = []
  for (const [br, bc] of candidates) {
    if (br >= 0 && br < n && bc >= 0 && bc < n) {
      const boxId = `b-${br}-${bc}`
      if (!game.boxes[boxId]) {
        const top    = `h-${br}-${bc}`
        const bottom = `h-${br + 1}-${bc}`
        const left   = `v-${br}-${bc}`
        const right  = `v-${br}-${bc + 1}`
        if ([top, bottom, left, right].every(w => wallsSet.has(w))) {
          completed.push(boxId)
        }
      }
    }
  }
  return completed
}

// Apply a move, returns new immutable game state
function applyMove(game, wallId) {
  if (game.walls.includes(wallId) || game.status !== 'playing') return game

  const newWalls = [...game.walls, wallId]
  const tempGame = { ...game, walls: newWalls }
  const completed = checkBoxes(tempGame, wallId)

  const newBoxes = { ...game.boxes }
  const newPlayers = game.players.map(p => ({ ...p }))
  const currentPlayer = newPlayers.find(p => p.player_id === game.current_turn)

  for (const boxId of completed) {
    newBoxes[boxId] = game.current_turn
    if (currentPlayer) currentPlayer.score += 1
  }

  const scored = completed.length > 0
  const totalBoxes = (game.grid_size - 1) ** 2
  const isOver = Object.keys(newBoxes).length >= totalBoxes

  let nextTurn = game.current_turn
  if (!scored) {
    const idx = game.players.findIndex(p => p.player_id === game.current_turn)
    nextTurn = game.players[(idx + 1) % game.players.length].player_id
  }

  let status = 'playing'
  let winner = null
  if (isOver) {
    status = 'finished'
    const maxScore = Math.max(...newPlayers.map(p => p.score))
    const topPlayers = newPlayers.filter(p => p.score === maxScore)
    winner = topPlayers.length === 1 ? topPlayers[0].player_id : 'draw'
  }

  return {
    ...game,
    walls: newWalls,
    boxes: newBoxes,
    players: newPlayers,
    current_turn: nextTurn,
    status,
    winner,
  }
}

export default function LocalGame({ navigate, gameData }) {
  const { playerCount = 2, gridSize = 4 } = gameData || {}
  const [game, setGame] = useState(() => buildGame(playerCount, gridSize))

  // Map player_id → "P1", "P2" … for box labels
  const labelMap = {}
  game.players.forEach((p, i) => { labelMap[p.player_id] = `P${i + 1}` })

  const currentPlayer = game.players.find(p => p.player_id === game.current_turn)
  const currentIdx    = game.players.findIndex(p => p.player_id === game.current_turn)

  // All players always have "my turn" since it's the same device — but we lock
  // the board unless it's the expected player's turn (isMyTurn = always true, we
  // pass currentPlayer's id as playerId so board doesn't block)
  const handleMove = useCallback((wallId) => {
    setGame(prev => applyMove(prev, wallId))
  }, [])

  function handlePlayAgain() {
    setGame(buildGame(playerCount, gridSize))
  }

  const winnerPlayer = game.players.find(p => p.player_id === game.winner)
  const isDraw = game.winner === 'draw'

  return (
    <div className="page page-game fade-in">
      <Header roomId="LOCAL" />

      {/* Turn indicator */}
      {game.status === 'playing' && (
        <div className="turn-badge my-turn" style={{
          background: PLAYER_COLORS[currentIdx] || 'var(--ink)',
          borderColor: PLAYER_COLORS[currentIdx] || 'var(--ink)',
        }}>
          <div className="turn-dot" style={{ background: 'rgba(255,255,255,0.7)', animation: 'blink 1s ease-in-out infinite' }} />
          {currentPlayer?.name}&apos;s Turn
        </div>
      )}
      {game.status === 'finished' && (
        <div className="turn-badge their-turn">Game over</div>
      )}

      {/* Game board */}
      <div className="board-container">
        <GameBoard
          game={game}
          playerId={game.current_turn}
          isMyTurn={game.status === 'playing'}
          onMove={handleMove}
          labelMap={labelMap}
        />
      </div>

      {/* Local Scoreboard — all players */}
      <LocalScoreBoard game={game} />

      {/* Result overlay */}
      {game.status === 'finished' && (
        <div className="result-overlay">
          <div className="card" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: '1.25rem', textAlign: 'center', maxWidth: 380, width: '100%',
          }}>
            <div style={{ fontSize: '3rem', lineHeight: 1 }}>
              {isDraw ? '🤝' : '🏆'}
            </div>
            <div>
              <h2 className="text-title">
                {isDraw ? "It's a draw!" : `${winnerPlayer?.name} wins!`}
              </h2>
              <p className="text-body text-muted" style={{ marginTop: '0.25rem' }}>
                {isDraw
                  ? 'Great game! All tied up.'
                  : `${winnerPlayer?.name} captured the most boxes!`}
              </p>
            </div>

            {/* Final scores */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
              {game.players.map((p, i) => (
                <div key={p.player_id} style={{ textAlign: 'center', minWidth: 48 }}>
                  <div style={{
                    fontSize: '2rem', fontWeight: 800, lineHeight: 1,
                    color: PLAYER_COLORS[i] || 'var(--ink)',
                  }}>
                    {p.score}
                  </div>
                  <div className="text-small text-muted">P{i + 1}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
              <button id="btn-play-again" className="btn btn-accent" onClick={handlePlayAgain}>
                ↺ Play Again
              </button>
              <button id="btn-go-home-local" className="btn btn-ghost" onClick={() => navigate('home')}>
                ← Go Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Local Scoreboard: shows all players inline ────────────────────────────────
function LocalScoreBoard({ game }) {
  const { players = [], current_turn, status } = game
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.5rem',
      justifyContent: 'center',
      width: '100%',
    }}>
      {players.map((p, i) => {
        const isActive = current_turn === p.player_id && status === 'playing'
        return (
          <div key={p.player_id} style={{
            flex: '1 1 60px',
            minWidth: 60,
            textAlign: 'center',
            padding: '0.625rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            border: `1.5px solid ${isActive ? PLAYER_COLORS[i] : 'var(--border)'}`,
            background: 'var(--bg-card)',
            boxShadow: isActive ? `0 0 0 2px ${PLAYER_COLORS[i]}` : 'none',
            transition: 'all var(--transition)',
          }}>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              lineHeight: 1,
              color: PLAYER_COLORS[i] || 'var(--ink)',
            }}>
              {p.score}
            </div>
            <div className="text-small text-muted" style={{ marginTop: '0.25rem' }}>
              P{i + 1}
            </div>
          </div>
        )
      })}
    </div>
  )
}
