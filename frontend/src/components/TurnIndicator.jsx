export default function TurnIndicator({ isMyTurn, myName, oppName, status }) {
  if (status === 'waiting') {
    return (
      <div className="turn-badge their-turn">
        <div className="turn-dot" style={{ background: 'var(--muted)' }} />
        Waiting for opponent…
      </div>
    )
  }

  if (status === 'finished') {
    return (
      <div className="turn-badge their-turn">
        Game over
      </div>
    )
  }

  return (
    <div className={`turn-badge ${isMyTurn ? 'my-turn' : 'their-turn'}`}>
      <div className="turn-dot" />
      {isMyTurn ? 'Your turn' : `${oppName}'s turn`}
    </div>
  )
}
