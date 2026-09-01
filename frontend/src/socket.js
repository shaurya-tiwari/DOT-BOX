const WS_BASE = 'ws://localhost:8000'

const BACKOFF = [1000, 2000, 4000, 8000, 16000] // ms between reconnect attempts

export class GameSocket {
  constructor(roomId, playerId, onMessage, { onOpen, onClose, onStateChange } = {}) {
    this.roomId = roomId
    this.playerId = playerId
    this.onMessage = onMessage
    this.onOpen = onOpen || (() => {})
    this.onClose = onClose || (() => {})
    this.onStateChange = onStateChange || (() => {})
    this.ws = null
    this._destroyed = false
    this._retryCount = 0
    this._retryTimer = null
    this.state = 'idle' // idle | connecting | open | reconnecting | closed
  }

  _setState(s) {
    this.state = s
    this.onStateChange(s)
  }

  connect() {
    if (this._destroyed) return this
    this._setState('connecting')
    const url = `${WS_BASE}/ws/${this.roomId}/${this.playerId}`
    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      this._retryCount = 0
      this._setState('open')
      this.onOpen()
    }

    this.ws.onmessage = (e) => {
      try { this.onMessage(JSON.parse(e.data)) } catch (_) {}
    }

    this.ws.onerror = (err) => {
      console.warn('[DOT-BOX] WebSocket error', err)
    }

    this.ws.onclose = () => {
      if (this._destroyed) {
        this._setState('closed')
        this.onClose()
        return
      }
      // Auto-reconnect
      const delay = BACKOFF[Math.min(this._retryCount, BACKOFF.length - 1)]
      this._retryCount++
      this._setState('reconnecting')
      console.log(`[DOT-BOX] Reconnecting in ${delay}ms (attempt ${this._retryCount})…`)
      this._retryTimer = setTimeout(() => {
        if (!this._destroyed) this.connect()
      }, delay)
    }

    return this
  }

  sendMove(wallId) {
    this._send({ type: 'make_move', wall_id: wallId })
  }

  sendRematch() {
    this._send({ type: 'rematch' })
  }

  sendBackToLobby() {
    this._send({ type: 'back_to_lobby' })
  }

  sendStartGame() {
    this._send({ type: 'start_game' })
  }

  _send(payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload))
    }
  }

  disconnect() {
    this._destroyed = true
    clearTimeout(this._retryTimer)
    if (this.ws) {
      this.ws.onclose = null // prevent reconnect loop on intentional close
      this.ws.close()
      this.ws = null
    }
    this._setState('closed')
  }
}
