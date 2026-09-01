// 5-player color palette (matches GameBoard)
const P_COLORS = ['#5C4033', '#2C4A5C', '#2D6A4F', '#6B3FA0', '#C0392B']

/**
 * ScoreSide — vertical score panel for one player (left/right flanking board).
 * Used for 2-player layout.
 */
export function ScoreSide({ player, playerId, currentTurn, side }) {
  const isMe     = player?.player_id === playerId
  const isActive = player?.player_id === currentTurn
  const idx      = side === 'left' ? 0 : 1

  if (!player) {
    return (
      <div className={`score-side score-side-${side} empty`}>
        <div className="score-side-num">—</div>
        <div className="score-side-name">Waiting…</div>
      </div>
    )
  }

  const shortName = player.name.length > 9 ? player.name.slice(0, 8) + '…' : player.name
  const color = P_COLORS[idx] || '#888'

  return (
    <div
      className={`score-side score-side-${side} ${isActive ? 'active' : ''}`}
      style={{ borderLeftColor: side === 'left' ? color : undefined, borderRightColor: side === 'right' ? color : undefined }}
    >
      <div className="score-side-num" style={{ color }}>{player.score ?? 0}</div>
      <div className="score-side-name">{shortName}</div>
      {isMe && <div className="score-side-you">you</div>}
    </div>
  )
}

/**
 * ScoreRow — horizontal compact row for 3–5 players, sits above the board.
 */
export function ScoreRow({ players = [], playerId, currentTurn }) {
  return (
    <div className="score-row">
      {players.map((p, i) => {
        const isMe     = p.player_id === playerId
        const isActive = p.player_id === currentTurn
        const color    = P_COLORS[i] || '#888'
        const shortName = p.name.length > 8 ? p.name.slice(0, 7) + '…' : p.name
        return (
          <div
            key={p.player_id}
            className={`score-row-cell ${isActive ? 'active' : ''}`}
            style={{ borderTopColor: color }}
          >
            <div className="score-row-num" style={{ color }}>{p.score ?? 0}</div>
            <div className="score-row-name">
              {shortName}{isMe ? <span className="score-row-you"> (you)</span> : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Default export — auto-selects layout based on player count
export default function ScoreBoard({ game, playerId }) {
  const { players = [], current_turn } = game
  if (players.length <= 2) return null  // Side panels used in Game.jsx for 2P
  return <ScoreRow players={players} playerId={playerId} currentTurn={current_turn} />
}
