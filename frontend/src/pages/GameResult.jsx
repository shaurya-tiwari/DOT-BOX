export default function GameResult({ game, playerId, playerName, onRematch, onHome, inline }) {
  const winner = game?.winner
  const myPlayer  = game?.players?.find(p => p.player_id === playerId)
  const oppPlayer = game?.players?.find(p => p.player_id !== playerId)

  const isWinner = winner === playerId
  const isDraw   = winner === 'draw'

  const emoji  = isDraw ? '🤝' : isWinner ? '🏆' : '😔'
  const title  = isDraw ? "It's a draw!" : isWinner ? 'You won!' : `${oppPlayer?.name || 'Opponent'} won`
  const subMsg = isDraw
    ? 'Great game! Both players scored equally.'
    : isWinner
    ? 'Excellent play — you captured the most boxes!'
    : 'Better luck next time!'

  const content = (
    <div className="card" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '1.25rem', textAlign: 'center', maxWidth: 360, width: '100%'
    }}>
      <div style={{ fontSize: '3rem', lineHeight: 1 }}>{emoji}</div>
      <div>
        <h2 className="text-title">{title}</h2>
        <p className="text-body text-muted" style={{ marginTop: '0.25rem' }}>{subMsg}</p>
      </div>

      {/* Final scores */}
      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
        {game.players?.map((p, i) => (
          <div key={p.player_id} style={{ textAlign: 'center' }}>
            <div className="text-display" style={{
              fontSize: '2.5rem',
              color: i === 0 ? 'var(--warm)' : 'var(--cool)'
            }}>
              {p.score}
            </div>
            <div className="text-small text-muted">{p.name}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
        <button id="btn-rematch" className="btn btn-accent" onClick={onRematch}>
          ↺ Play Again
        </button>
        <button id="btn-go-home" className="btn btn-ghost" onClick={onHome}>
          ← Go Home
        </button>
      </div>
    </div>
  )

  if (inline) {
    return (
      <div className="result-overlay">
        {content}
      </div>
    )
  }

  return (
    <div className="page fade-in">
      {content}
    </div>
  )
}
