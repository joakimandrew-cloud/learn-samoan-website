/**
 * Siapo motifs, newly drawn as bold vectors to match the approved cover:
 * block = faʻa ʻaveau (starfish), ring = faʻa masina (solid ring),
 * dot = faʻa tuli / faʻa vae tuli (four lens petals), bar = faʻa ʻaliʻao (triangle).
 * Sources and rights: ../design-concepts/siapo-sources/README.md (parent workspace).
 * Inset silhouettes retain the cover's forms at small sizes; all colour comes
 * from the existing kp-bg / kp-fg layers, including inversion and chapter tints.
 */
import { useEffect, useRef, useState } from 'react'

const TILE_KEYS = ['block', 'ring', 'dot', 'bar']

function Shape({ kind }) {
  if (kind === 'ring') return <path className="kp-fg" fillRule="evenodd" d="M50 12a38 38 0 1 1 0 76a38 38 0 1 1 0-76Z M50 35a15 15 0 1 1 0 30a15 15 0 1 1 0-30Z" />
  if (kind === 'dot') return (
    <path className="kp-fg" d="M50 50C48 24 26 10 8 8C10 26 24 48 50 50Z M50 50C52 24 74 10 92 8C90 26 76 48 50 50Z M50 50C52 76 74 90 92 92C90 74 76 52 50 50Z M50 50C48 76 26 90 8 92C10 74 24 52 50 50Z" />
  )
  if (kind === 'bar') return <path className="kp-fg" d="M50 12L88 84H12Z" />
  return (
    <path className="kp-fg" d="M50 50C46 29 29 12 8 8C12 29 29 46 50 50Z M50 50C54 29 71 12 92 8C88 29 71 46 50 50Z M50 50C54 71 71 88 92 92C88 71 71 54 50 50Z M50 50C46 71 29 88 8 92C12 71 29 54 50 50Z M50 8L57 32L50 50L43 32Z M92 50L68 57L50 50L68 43Z M50 92L43 68L50 50L57 68Z M8 50L32 43L50 50L32 57Z" />
  )
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
