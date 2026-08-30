// Individual dot — click/drag handler is on the parent SVG
export default function Dot({ cx, cy, isActive, r = 5 }) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={isActive ? 7 : r}
      fill="var(--ink)"
      style={{ transition: 'r 0.1s ease' }}
    />
  )
}
