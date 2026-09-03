export default function Header({ isMyTurn = false }) {
  return (
    <div
      className="game-header"
      style={{
        justifyContent: 'center',
        background: isMyTurn ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
        borderBottom: isMyTurn ? '2px solid rgba(34, 197, 94, 0.35)' : '2px solid transparent',
        transition: 'background 0.4s ease, border-color 0.4s ease',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
        DOT<span style={{ color: isMyTurn ? '#16a34a' : 'var(--accent)' }}>·</span>BOX
      </span>
    </div>
  )
}
