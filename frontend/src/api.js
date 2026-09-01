const BASE = 'http://localhost:8000'

export async function createGame(playerName, gridSize, maxPlayers = 2) {
  const res = await fetch(`${BASE}/api/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player_name: playerName, grid_size: gridSize, max_players: maxPlayers }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to create game')
  }
  return res.json()
}

export async function joinGame(roomId, playerName) {
  const res = await fetch(`${BASE}/api/games/${roomId.toUpperCase()}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player_name: playerName }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to join game')
  }
  return res.json()
}

export async function getGame(roomId) {
  const res = await fetch(`${BASE}/api/games/${roomId.toUpperCase()}`)
  if (!res.ok) throw new Error('Game not found')
  return res.json()
}
