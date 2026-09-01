/** Generate all dot coordinates for a grid of size n×n */
export function generateDots(gridSize) {
  const dots = []
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      dots.push({ r, c })
    }
  }
  return dots
}

/** Returns wall ID from two dot positions, or null if not adjacent */
export function wallIdFromDots(r1, c1, r2, c2) {
  if (r1 === r2 && Math.abs(c1 - c2) === 1) {
    // horizontal wall — spans between (r, minC) and (r, minC+1)
    return `h-${r1}-${Math.min(c1, c2)}`
  }
  if (c1 === c2 && Math.abs(r1 - r2) === 1) {
    // vertical wall — spans between (minR, c) and (minR+1, c)
    return `v-${Math.min(r1, r2)}-${c1}`
  }
  return null
}

/** True if two dots are orthogonally adjacent */
export function isAdjacent(r1, c1, r2, c2) {
  return (
    (r1 === r2 && Math.abs(c1 - c2) === 1) ||
    (c1 === c2 && Math.abs(r1 - r2) === 1)
  )
}

/** Parse a box ID like "b-2-3" → { r: 2, c: 3 } */
export function parseBoxId(boxId) {
  const [, r, c] = boxId.split('-')
  return { r: Number(r), c: Number(c) }
}

/** All 4 wall IDs for a box at (r, c) */
export function boxWalls(r, c) {
  return {
    top:    `h-${r}-${c}`,
    bottom: `h-${r + 1}-${c}`,
    left:   `v-${r}-${c}`,
    right:  `v-${r}-${c + 1}`,
  }
}
