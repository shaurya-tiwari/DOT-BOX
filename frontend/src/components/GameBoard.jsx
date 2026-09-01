import { useRef, useState, useCallback } from 'react'
import { wallIdFromDots, isAdjacent } from '../utils/board'

// Player palette
const P_COLORS = ['#5C4033', '#2C4A5C']
const P_FILLS  = ['rgba(92,64,51,0.18)', 'rgba(44,74,92,0.18)']

export default function GameBoard({ game, playerId, isMyTurn, onMove }) {
  const svgRef   = useRef(null)
  const [drag, setDrag] = useState(null) // { startR, startC, curX, curY }

  const { grid_size: n = 4, walls = [], boxes = {}, players = [] } = game

  // Responsive cell size
  const PADDING  = 36
  const maxW     = Math.min(window.innerWidth  - 64, 500)
  const maxH     = Math.min(window.innerHeight * 0.52, 500)
  const CELL     = Math.max(48, Math.min(maxW / (n - 1), maxH / (n - 1)))
  const SVG_SIZE = CELL * (n - 1) + PADDING * 2

  function dotPos(r, c) {
    return { x: c * CELL + PADDING, y: r * CELL + PADDING }
  }

  function nearestDot(svgX, svgY) {
    let best = null, bestD = Infinity
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const p = dotPos(r, c)
        const d = Math.hypot(svgX - p.x, svgY - p.y)
        if (d < bestD) { bestD = d; best = { r, c, d } }
      }
    }
    return best
  }

  function toSVGCoords(e) {
    const svg  = svgRef.current
    const rect = svg.getBoundingClientRect()
    const cx   = e.touches ? e.touches[0].clientX : e.clientX
    const cy   = e.touches ? e.touches[0].clientY : e.clientY
    const scaleX = SVG_SIZE / rect.width
    const scaleY = SVG_SIZE / rect.height
    return { x: (cx - rect.left) * scaleX, y: (cy - rect.top) * scaleY }
  }

  const onPointerDown = useCallback((e) => {
    if (!isMyTurn) return
    const { x, y } = toSVGCoords(e)
    const dot = nearestDot(x, y)
    if (dot && dot.d < CELL * 0.45) {
      setDrag({ startR: dot.r, startC: dot.c, curX: x, curY: y })
      e.currentTarget.setPointerCapture(e.pointerId)
    }
  }, [isMyTurn, n, CELL])

  const onPointerMove = useCallback((e) => {
    if (!drag) return
    const { x, y } = toSVGCoords(e)
    setDrag(d => ({ ...d, curX: x, curY: y }))
  }, [drag])

  const onPointerUp = useCallback((e) => {
    if (!drag) return
    const { x, y } = toSVGCoords(e)
    const end = nearestDot(x, y)
    if (end && isAdjacent(drag.startR, drag.startC, end.r, end.c)) {
      const wallId = wallIdFromDots(drag.startR, drag.startC, end.r, end.c)
      if (wallId && !walls.includes(wallId)) {
        onMove(wallId)
      }
    }
    setDrag(null)
  }, [drag, walls, onMove])

  // Player color lookup
  const playerColorMap = {}
  const playerFillMap  = {}
  players.forEach((p, i) => {
    playerColorMap[p.player_id] = P_COLORS[i] || '#999'
    playerFillMap[p.player_id]  = P_FILLS[i]  || 'rgba(150,150,150,0.15)'
  })

  const wallsSet = new Set(walls)

  // Preview snap: if dragging, snap preview line endpoint to nearest adjacent dot
  let previewX2 = drag?.curX
  let previewY2 = drag?.curY
  if (drag) {
    const snap = nearestDot(drag.curX, drag.curY)
    if (snap && snap.d < CELL * 0.6 && isAdjacent(drag.startR, drag.startC, snap.r, snap.c)) {
      const p = dotPos(snap.r, snap.c)
      previewX2 = p.x
      previewY2 = p.y
    }
  }

  return (
    <svg
      ref={svgRef}
      width={SVG_SIZE}
      height={SVG_SIZE}
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      style={{ touchAction: 'none', cursor: isMyTurn ? 'crosshair' : 'default', overflow: 'visible' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => setDrag(null)}
    >
      {/* ── Box fills ── */}
      {Object.entries(boxes).map(([boxId, pid]) => {
        const [, br, bc] = boxId.split('-')
        const { x, y }  = dotPos(Number(br), Number(bc))
        const fill       = playerFillMap[pid] || 'rgba(150,150,150,0.15)'
        const initials   = players.find(p => p.player_id === pid)?.name[0]?.toUpperCase() || '?'
        return (
          <g key={boxId}>
            <rect x={x} y={y} width={CELL} height={CELL}
              fill={fill} rx={4}
              style={{ transition: 'fill 0.2s ease' }}
            />
            <text
              x={x + CELL / 2} y={y + CELL / 2 + 1}
              textAnchor="middle" dominantBaseline="middle"
              fill={playerColorMap[pid]} fontSize={CELL * 0.28}
              fontWeight="700" fontFamily="Inter, sans-serif"
              pointerEvents="none" opacity={0.6}
            >
              {initials}
            </text>
          </g>
        )
      })}

      {/* ── Drawn walls ── */}
      {Array.from(wallsSet).map(wallId => {
        const [orient, r, c] = wallId.split('-')
        const p1 = dotPos(Number(r), Number(c))
        const p2 = orient === 'h'
          ? dotPos(Number(r), Number(c) + 1)
          : dotPos(Number(r) + 1, Number(c))
        return (
          <line key={wallId}
            x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke="var(--ink)" strokeWidth={3.5} strokeLinecap="round"
          />
        )
      })}

      {/* ── Drag preview ── */}
      {drag && (
        <line
          x1={dotPos(drag.startR, drag.startC).x}
          y1={dotPos(drag.startR, drag.startC).y}
          x2={previewX2} y2={previewY2}
          stroke="var(--muted)" strokeWidth={3}
          strokeDasharray="7 5" strokeLinecap="round"
          pointerEvents="none"
        />
      )}

      {/* ── Dots ── */}
      {Array.from({ length: n }, (_, r) =>
        Array.from({ length: n }, (_, c) => {
          const { x, y } = dotPos(r, c)
          const isStart  = drag && drag.startR === r && drag.startC === c
          return (
            <circle key={`${r}-${c}`}
              cx={x} cy={y}
              r={isStart ? 7 : 5}
              fill="var(--ink)"
              style={{ transition: 'r 0.1s ease' }}
            />
          )
        })
      )}
    </svg>
  )
}
