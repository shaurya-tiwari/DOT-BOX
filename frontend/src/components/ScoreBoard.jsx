export default function ScoreBoard({ game, playerId }) {
  const { players = [] } = game
  const p1 = players[0]
  const p2 = players[1]

  if (!p1) return null

  const myIdx = players.findIndex(p => p.player_id === playerId)

  return (
    <div className="scoreboard">
      <div className={`score-player p1 ${game.current_turn === p1?.player_id ? 'active' : ''}`}>
        <div className="score-num" style={{ color: 'var(--warm)' }}>{p1?.score ?? 0}</div>
        <div className="text-small text-muted" style={{ marginTop: '0.25rem' }}>
          {p1?.name}{myIdx === 0 ? ' (you)' : ''}
        </div>
      </div>

      <div className="score-vs">VS</div>

      <div className={`score-player p2 ${game.current_turn === p2?.player_id ? 'active' : ''}`}>
        <div className="score-num" style={{ color: 'var(--cool)' }}>{p2?.score ?? 0}</div>
        <div className="text-small text-muted" style={{ marginTop: '0.25rem' }}>
          {p2 ? p2.name : '—'}{myIdx === 1 ? ' (you)' : ''}
        </div>
      </div>
    </div>
  )
}
