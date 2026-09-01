const WS_BASE = 'ws://localhost:8000'

export class GameSocket {
  constructor(roomId, playerId, onMessage) {
    this.roomId = roomId
    this.playerId = playerId
    this.onMessage = onMessage
    this.ws = null
  }

  connect() {
    this.ws = new WebSocket(`${WS_BASE}/ws/${this.roomId}/${this.playerId}`)
    this.ws.onmessage = (e) => {
      try {
        this.onMessage(JSON.parse(e.data))
      } catch (_) {}
    }
    this.ws.onerror = () => console.error('[DOT-BOX] WebSocket error')
    this.ws.onclose = () => console.log('[DOT-BOX] WebSocket closed')
    return this
  }

  sendMove(wallId) {
    this._send({ type: 'make_move', wall_id: wallId })
  }

  sendRematch() {
    this._send({ type: 'rematch' })
  }

  _send(payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload))
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}
