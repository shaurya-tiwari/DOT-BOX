import { useRef, useState, useCallback, useEffect } from 'react'
import { wallIdFromDots, isAdjacent } from '../utils/board'

// Player color palette — up to 5 players
const P_COLORS      = ['#5C4033', '#2C4A5C', '#2D6A4F', '#6B3FA0', '#C0392B']
const P_FILLS       = [
  'rgba(92,64,51,0.15)',
  'rgba(44,74,92,0.15)',
  'rgba(45,106,79,0.15)',
  'rgba(107,63,160,0.15)',
  'rgba(192,57,43,0.15)',
]
const P_LINE_COLORS = ['#7A5240', '#3A6080', '#3D8F68', '#8A55C0', '#D44F40']

// Tracks newly-placed wall IDs for entry animation
const ANIM_DURATION = 140 // ms

export default function GameBoard({ game, playerId, isMyTurn, onMove }) {
  const svgRef   = useRef(null)
  const [drag, setDrag] = useState(null) // { startR, startC, curX, curY }
  const [newWalls, setNewWalls] = useState(new Set()) // wall IDs that are still animating in
  const prevWallsRef = useRef(new Set())

  const { grid_size: n = 4, walls = [], wall_owners = {}, boxes = {}, players = [] } = game

  // Board fills as much screen as possible — large grids need every pixel
  const PADDING  = 12
  const maxW     = Math.min(window.innerWidth  - 16, 720)
  const maxH     = Math.min(window.innerHeight * 0.72, 720)
  const CELL     = Math.max(18, Math.min(maxW / (n - 1), maxH / (n - 1)))
  const SVG_SIZE = CELL * (n - 1) + PADDING * 2

  // Track newly-added walls for draw-in animation
  useEffect(() => {
    const currentSet = new Set(walls)
    const added = new Set()
    for (const w of currentSet) {
      if (!prevWallsRef.current.has(w)) added.add(w)
    }
    prevWallsRef.current = currentSet
    if (added.size > 0) {
      setNewWalls(added)
      const t = setTimeout(() => setNewWalls(new Set()), ANIM_DURATION + 50)
      return () => clearTimeout(t)
    }
  }, [walls])

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

  // Player color/fill/name lookup by player_id
  const playerColorMap = {}
  const playerLineMap  = {}
  const playerFillMap  = {}
  const playerNameMap  = {}
  players.forEach((p, i) => {
    playerColorMap[p.player_id] = P_COLORS[i] || '#888'
    playerLineMap[p.player_id]  = P_LINE_COLORS[i] || '#888'
    playerFillMap[p.player_id]  = P_FILLS[i] || 'rgba(130,130,130,0.12)'
    playerNameMap[p.player_id]  = p.name
  })

  // My player color for drag preview
  const myColor = playerLineMap[playerId] || 'var(--muted)'

  const wallsSet = new Set(walls)

  // Preview: snap to nearest adjacent dot if close enough
  let previewX2 = drag?.curX
  let previewY2 = drag?.curY
  let snapTarget = null
  if (drag) {
    const snap = nearestDot(drag.curX, drag.curY)
    if (snap && snap.d < CELL * 0.6 && isAdjacent(drag.startR, drag.startC, snap.r, snap.c)) {
      const p = dotPos(snap.r, snap.c)
      previewX2 = p.x
      previewY2 = p.y
      snapTarget = snap
    }
  }
  const isSnapped = snapTarget !== null

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
      {/* ── CSS for wall draw-in animation ── */}
      <defs>
        <style>{`
          @keyframes wallDrawIn {
            from { stroke-dashoffset: 200; opacity: 0.4; }
            to   { stroke-dashoffset: 0;   opacity: 1; }
          }
          .wall-new {
            stroke-dasharray: 200;
            animation: wallDrawIn ${ANIM_DURATION}ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
          }
          @keyframes boxPop {
            0%   { transform: scale(0.7); opacity: 0; }
            60%  { transform: scale(1.08); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          .box-pop {
            transform-box: fill-box;
            transform-origin: center;
            animation: boxPop 220ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
        `}</style>
      </defs>

      {/* ── Box fills ── */}
      {Object.entries(boxes).map(([boxId, pid]) => {
        const [, br, bc] = boxId.split('-')
        const { x, y }  = dotPos(Number(br), Number(bc))
        const fill       = playerFillMap[pid] || 'rgba(150,150,150,0.12)'
        const color      = playerColorMap[pid] || '#888'
        const name       = playerNameMap[pid] || '?'
        // Truncate name to fit in cell
        const displayName = name.length > 4 ? name.slice(0, 3) + '…' : name
        return (
          <g key={boxId} className="box-pop">
            <rect
              x={x + 3} y={y + 3}
              width={CELL - 6} height={CELL - 6}
              fill={fill} rx={6}
            />
            <text
              x={x + CELL / 2} y={y + CELL / 2 + 1}
              textAnchor="middle" dominantBaseline="middle"
              fill={color} fontSize={Math.max(11, CELL * 0.22)}
              fontWeight="700" fontFamily="Inter, sans-serif"
              pointerEvents="none"
            >
              {displayName}
            </text>
          </g>
        )
      })}

      {/* ── Drawn walls (colored by player who drew them) ── */}
      {Array.from(wallsSet).map(wallId => {
        const [orient, r, c] = wallId.split('-')
        const p1 = dotPos(Number(r), Number(c))
        const p2 = orient === 'h'
          ? dotPos(Number(r), Number(c) + 1)
          : dotPos(Number(r) + 1, Number(c))
        const ownerColor = playerLineMap[wall_owners[wallId]] || 'var(--ink)'
        const isNew = newWalls.has(wallId)
        // Scale stroke width with cell size
        const sw = Math.max(2.5, Math.min(4, CELL * 0.07))
        return (
          <line
            key={wallId}
            className={isNew ? 'wall-new' : ''}
            x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke={ownerColor}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        )
      })}

      {/* ── Drag preview line ── */}
      {drag && (
        <line
          x1={dotPos(drag.startR, drag.startC).x}
          y1={dotPos(drag.startR, drag.startC).y}
          x2={previewX2} y2={previewY2}
          stroke={isSnapped ? myColor : 'var(--muted)'}
          strokeWidth={isSnapped ? 3.5 : 2.5}
          strokeDasharray={isSnapped ? 'none' : '8 5'}
          strokeLinecap="round"
          opacity={isSnapped ? 0.7 : 0.5}
          pointerEvents="none"
        />
      )}

      {/* ── Dots ── */}
      {Array.from({ length: n }, (_, r) =>
        Array.from({ length: n }, (_, c) => {
          const { x, y } = dotPos(r, c)
          const isStart   = drag && drag.startR === r && drag.startC === c
          const isSnapEnd = snapTarget && snapTarget.r === r && snapTarget.c === c
          // Scale dot radius: very small, precise dots
          const dotR      = Math.max(1.5, Math.min(3,   CELL * 0.065))
          const dotActive = Math.max(2.5, Math.min(4.5, CELL * 0.10))
          return (
            <circle
              key={`${r}-${c}`}
              cx={x} cy={y}
              r={isStart || isSnapEnd ? dotActive : dotR}
              fill={isStart ? myColor : 'var(--ink)'}
              style={{ transition: 'r 0.1s ease' }}
            />
          )
        })
      )}

    </svg>
  )
}
