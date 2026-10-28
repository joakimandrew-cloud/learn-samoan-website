/**
 * Banner tiles, approved by Andrew on 2026-10-28 (design-concepts/tile-references/
 * preview.html, the 12-tile banner):
 * block = broad four-petal flower with inset triangles (reference 2.jpg);
 * ring = nested four-petal outline (reference 4.jpg).
 * References: ../design-concepts/tile-references/ in the parent workspace. The
 * names are descriptive; the references carry no traditional names or source URLs.
 * dot and bar are still the plain placeholders; their drafts are unapproved and
 * kept in tile-references/drafts/. Colour, inversion and chapter tints come only
 * from the kp-bg / kp-fg CSS.
 */
import { useEffect, useRef, useState } from 'react'

const TILE_KEYS = ['block', 'ring', 'dot', 'bar']

function Shape({ kind }) {
  if (kind === 'ring') return (
    <>
      {[0, 90, 180, 270].map(angle => (
        <g key={angle} transform={`rotate(${angle} 50 50)`}>
          <path className="kp-fg" fillRule="evenodd" d="M50 50C28 49 9 29 7 6C30 8 49 28 50 50Z M13 12C29 16 42 29 46 43C34 32 24 22 13 12Z M12 14C16 30 29 43 43 46C32 34 22 24 12 14Z" />
          <path className="kp-fg" d="M25 4H32C40 11 46 20 50 28C54 20 60 11 68 4H75C63 14 56 26 50 38C44 26 37 14 25 4Z" />
          <path className="kp-fg" d="M42 4H47L50 8L53 4H58L50 17Z" />
        </g>
      ))}
      <path className="kp-fg" d="M50 46C52.2 46 54 47.8 54 50S52.2 54 50 54S46 52.2 46 50S47.8 46 50 46Z" />
    </>
  )
  if (kind === 'dot') return <circle className="kp-fg" cx="50" cy="50" r="24" />
  if (kind === 'bar') return <path className="kp-fg" d="M22 40h56v20H22z" />
  return (
    <>
      {[0, 90, 180, 270].map(angle => (
        <g key={angle} transform={`rotate(${angle} 50 50)`}>
          {/* Even-odd is limited to the intended petal slit and triangle inset. */}
          <path className="kp-fg" fillRule="evenodd" d="M50 50C29 49 8 30 4 4C30 8 49 29 50 50Z M45 45C41 44 37 40 36 36C40 37 44 41 45 45Z" />
          <path className="kp-fg" fillRule="evenodd" d="M30 6H70L50 31Z M36 10L50 17L64 10L50 26Z" />
        </g>
      ))}
      <path className="kp-fg" d="M50 47C51.7 47 53 48.3 53 50S51.7 53 50 53S47 51.7 47 50S48.3 47 50 47Z" />
    </>
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
