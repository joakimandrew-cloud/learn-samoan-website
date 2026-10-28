/**
 * Plain geometric tiles in the course colour. They sit where the Tongan site
 * draws its approved kupesi motifs. Samoan has no approved pattern or logo yet
 * (DECISIONS: logo pending), so nothing cultural is drawn here; an approved
 * Samoan pattern can replace these shapes in this one file.
 */
import { useEffect, useRef, useState } from 'react'

const TILE_KEYS = ['block', 'ring', 'dot', 'bar']

function Shape({ kind }) {
  if (kind === 'ring') return <path className="kp-fg" fillRule="evenodd" d="M22 22h56v56H22z M36 36v28h28V36z" />
  if (kind === 'dot') return <circle className="kp-fg" cx="50" cy="50" r="24" />
  if (kind === 'bar') return <path className="kp-fg" d="M22 40h56v20H22z" />
  return <path className="kp-fg" d="M30 30h40v40H30z" />
}

export function Tile({ kind = 'block', invert = false, framed = false, size, className = '', style }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`kp-tile kp-${kind} ${invert ? 'is-invert' : ''} ${framed ? 'is-framed' : ''} ${className}`}
      style={{ width: size, height: size, ...style }}
      aria-hidden="true"
    >
      <rect width="100" height="100" className="kp-bg" />
      <Shape kind={kind} />
    </svg>
  )
}

export function TileBand({ tile = 56, seq = ['block', 'ring'], className = '', animate = true, count }) {
  const ref = useRef(null)
  const [n, setN] = useState(count || 24)
  const [seen, setSeen] = useState(!animate)

  useEffect(() => {
    if (count) return
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setN(Math.ceil(e.contentRect.width / tile) + 1))
    ro.observe(el)
    return () => ro.disconnect()
  }, [tile, count])

  useEffect(() => {
    if (!animate) return
    const el = ref.current
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } }, { threshold: .2 })
    io.observe(el)
    return () => io.disconnect()
  }, [animate])

  return (
    <div ref={ref} className={`kp-band ${seen ? 'is-seen' : ''} ${className}`} style={{ '--tile': `${tile}px` }} aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <Tile key={i} kind={seq[i % seq.length]} invert={i % 2 === 1} size={tile} style={{ '--i': i }} />
      ))}
    </div>
  )
}
