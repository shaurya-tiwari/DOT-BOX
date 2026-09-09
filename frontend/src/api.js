const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const TIMEOUT_MS = 10000

async function safeFetch(url, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out — server may be waking up. Please try again.')
    }
    throw new Error('Network error — check your internet connection and try again.')
  } finally {
    clearTimeout(timer)
  }
}

export async function pingServer() {
  const res = await safeFetch(`${BASE}/api/health`)
  if (!res.ok) throw new Error('Failed to ping server')
  return res.json()
}

export async function createGame(playerName, gridSize, maxPlayers = 2) {
  const res = await safeFetch(`${BASE}/api/games`, {
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
  const res = await safeFetch(`${BASE}/api/games/${roomId.toUpperCase()}/join`, {
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
  const res = await safeFetch(`${BASE}/api/games/${roomId.toUpperCase()}`)
  if (!res.ok) throw new Error('Game not found')
  return res.json()
}
