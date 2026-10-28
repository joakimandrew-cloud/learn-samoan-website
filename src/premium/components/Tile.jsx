/**
 * Tiles drawn from Andrew's chosen references (design-concepts/tile-references/
 * in the parent workspace, reviewed in its preview.html):
 * block = broad four-petal flower with inset triangles (2.jpg), banner;
 * ring = nested four-petal outline (4.jpg), banner;
 * bar = long-tailed bird with swept wings (bird-long-tail.jpeg), flashcard corner.
 * dot stays the plain circle (the double-line star was rejected 2026-10-28).
 * The names are descriptive; the references carry no traditional names or URLs.
 * The lesson-end fish is its own component, LessonFish.jsx. Colour, inversion
 * and chapter tints come only from the kp-bg / kp-fg CSS.
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
  if (kind === 'bar') return (
    <path className="kp-fg" d="M6.4 34C12.4 29.6 18.8 25.6 24.8 20.4C27.2 18.8 28.8 16.8 30.4 16C31.6 15.2 32.8 16.8 34.4 18C36.4 19.6 38.8 21.2 41.2 22C42.4 22.8 42.8 21.2 43.2 19.6C43.6 18 44.4 15.2 45.6 14.8C47.2 14 49.2 19.2 51.2 22.4C56 20.8 60.4 18 62.4 14.8C63.6 13.2 64.8 13.6 66.4 14.8C72.8 20.4 80.4 24.4 92.4 31.2C94.4 32.4 94.4 34 93.2 35.2C92.4 36.4 91.2 36 89.6 35.2C82.4 30.8 75.6 26.8 70.8 25.6C66.8 24.4 63.2 25.2 60 27.2C54 30.8 52 37.2 50.8 44.8C49.6 54.4 49.6 64 49.6 73.2C49.6 77.2 50 79.6 50.4 82C50.8 84 49.2 85.2 48 85.6C46.4 85.6 45.6 84.8 45.6 83.2C45.2 81.2 46 79.2 46 76.8V57.2C46 48.8 46.4 43.6 45.2 38.8C44.4 34 41.2 31.2 36.8 28.8C33.6 26.8 30 27.6 26.4 28.4C19.6 29.6 13.6 33.2 7.6 37.2C6.8 37.6 6.4 36.8 6 36C5.6 35.2 6 34.4 6.4 34Z" />
  )
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
