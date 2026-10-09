/**
 * Figure: printed forms placed along a line (time, distance, degree) or on a
 * small map (directions, positions). Choose a form, by tapping it or with
 * the arrow keys, to read its printed example in the panel underneath. One
 * form is chosen at a time; nothing moves by itself.
 *
 * A line runs left to right, from `axis.from` to `axis.to`. When the figure
 * is too narrow for its labels to sit side by side, it stands the line on
 * end instead (top = from, bottom = to), labels to the right of it.
 *
 * data: {
 *   layout?: 'line' | 'map',              default 'line'
 *   axis?: { from, to },                  the ends of a line (free English)
 *   points: [{ x: 0..100, y?: 0..100 (map only), label, gloss, sm?, en?, note? }]
 * }
 */
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion as Motion } from 'motion/react'
import T from '../T.jsx'
import { Md } from '../lesson/InlineMarkdown.jsx'
import { anchorFor, gaps, lineFits, orderPoints, stepOnLine, stepOnMap } from './scale-logic.js'
import '../../styles/ix-scale.css'

// Kept in step with ix-scale.css: the rail before 0 and after 100 (more at
// the arrowhead end), and the space between the rail and each end label.
const INSET = 18
const INSET_ARROW = 34
const END_GAP = 12
// Narrower than this, a line always stands on end.
const MIN_LINE = 440

const NAV_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'])
const plain = s => String(s ?? '').replace(/\*/g, '')
const ease = [.16, 1, .3, 1]

export default function Scale({ data, id }) {
  const layout = data.layout === 'map' ? 'map' : 'line'
  const points = useMemo(() => orderPoints(data.points, layout), [data.points, layout])
  const from = data.axis?.from
  const to = data.axis?.to
  const [chosen, setChosen] = useState(0)
  // First guess from the window, so a phone opens on the upright line; the
  // measurement below settles it.
  const [upright, setUpright] = useState(() => typeof window !== 'undefined' && window.innerWidth < 560)
  const rootRef = useRef(null)
  const rulerRef = useRef(null)
  const buttons = useRef([])

  // Measure the labels (in a hidden ruler, so the answer never depends on
  // which way the line is drawn) and stand the line on end when they would
  // collide or run past its ends.
  useEffect(() => {
    if (layout !== 'line') return
    const root = rootRef.current
    const ruler = rulerRef.current
    if (!root || !ruler || typeof ResizeObserver === 'undefined') return
    let live = true
    const measure = () => {
      if (!live) return
      const width = el => el?.offsetWidth || 0
      const ends = [...ruler.querySelectorAll('.ix-scale-end-t')].reduce((sum, el) => sum + width(el) + END_GAP, 0)
      const widths = [...ruler.querySelectorAll('.ix-scale-ruler-pt')].map(pt => Math.max(width(pt.children[0]), width(pt.children[1])))
      const span = root.clientWidth - ends - INSET - INSET_ARROW
      setUpright(root.clientWidth < MIN_LINE || !lineFits(points.map(p => p.x), widths, span, { inset: INSET }))
    }
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    document.fonts?.ready?.then(measure)
    return () => { live = false; observer.disconnect() }
  }, [layout, points, from, to])

  if (!points.length) return null
  const on = Math.min(chosen, points.length - 1)
  const current = points[on]

  const move = (event, i) => {
    if (!NAV_KEYS.has(event.key) || event.altKey || event.ctrlKey || event.metaKey) return
    event.preventDefault()
    const to = layout === 'map' && event.key.startsWith('Arrow') ? stepOnMap(points, i, event.key) : stepOnLine(points.length, i, event.key)
    setChosen(to)
    buttons.current[to]?.focus()
  }

  if (layout === 'map') {
    return (
      <div className="ix-scale is-map" ref={rootRef}>
        <div className="ix-scale-map" role="group" aria-label="Map">
          <div className="ix-scale-field">
            {points.map((p, i) => (
              <button
                key={p.key}
                ref={el => { buttons.current[i] = el }}
                type="button"
                className={`ix-scale-pin${on === i ? ' is-on' : ''}`}
                style={{ '--x': p.x, '--y': p.y }}
                aria-pressed={on === i}
                onClick={() => setChosen(i)}
                onKeyDown={e => move(e, i)}
              >
                {on === i && <Motion.span className="ix-scale-pin-fill" aria-hidden="true" initial={{ opacity: 0, scale: .82 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .35, ease }} />}
                <T className="ix-scale-pin-sm">{p.label}</T>
                <span className="ix-scale-gloss">{p.gloss}</span>
              </button>
            ))}
          </div>
        </div>
        <Detail point={current} />
      </div>
    )
  }

  const spacing = gaps(points.map(p => p.x))
  return (
    <div className={`ix-scale is-line${upright ? ' is-upright' : ''}`} ref={rootRef} style={{ '--n': points.length }}>
      <div className="ix-scale-axis">
        {from && <span className="ix-scale-end is-from"><span className="ix-scale-end-t"><Md text={from} /></span></span>}
        <div className="ix-scale-rail" role="group" aria-label={from && to ? `${plain(from)} to ${plain(to)}` : 'Scale'}>
          <span className="ix-scale-line" aria-hidden="true" />
          {points.map((p, i) => (
            <Fragment key={p.key}>
              <span className="ix-scale-gap" style={{ '--g': spacing[i] }} aria-hidden="true" />
              <button
                ref={el => { buttons.current[i] = el }}
                type="button"
                className={`ix-scale-pt is-${anchorFor(p.x)}${on === i ? ' is-on' : ''}`}
                style={{ '--x': p.x }}
                aria-pressed={on === i}
                onClick={() => setChosen(i)}
                onKeyDown={e => move(e, i)}
              >
                <span className="ix-scale-chip"><T>{p.label}</T></span>
                <span className="ix-scale-dot" aria-hidden="true">
                  {on === i && <Motion.span layoutId={`ix-scale-${id}`} className="ix-scale-fill" transition={{ type: 'spring', stiffness: 420, damping: 38 }} />}
                </span>
                <span className="ix-scale-gloss">{p.gloss}</span>
              </button>
            </Fragment>
          ))}
          <span className="ix-scale-gap" style={{ '--g': spacing[points.length] }} aria-hidden="true" />
        </div>
        {to && <span className="ix-scale-end is-to"><span className="ix-scale-end-t"><Md text={to} /></span></span>}
      </div>
      <div className="ix-scale-ruler" ref={rulerRef} aria-hidden="true">
        {from && <span className="ix-scale-end"><span className="ix-scale-end-t"><Md text={from} /></span></span>}
        {to && <span className="ix-scale-end"><span className="ix-scale-end-t"><Md text={to} /></span></span>}
        {points.map(p => (
          <span className="ix-scale-ruler-pt" key={p.key}>
            <span className="ix-scale-chip"><T>{p.label}</T></span>
            <span className="ix-scale-gloss">{p.gloss}</span>
          </span>
        ))}
      </div>
      <Detail point={current} />
    </div>
  )
}

/* The chosen form's printed example, large, with its English and the note.
   A form with no example shows itself and its gloss. */
function Detail({ point }) {
  return (
    <div className="ix-scale-detail" aria-live="polite" aria-atomic="true">
      <AnimatePresence mode="wait" initial={false}>
        <Motion.div key={point.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .22, ease }}>
          <div className="cb-out ix-scale-out">
            {point.sm ? (
              <>
                <p className="ix-scale-kicker"><T>{point.label}</T> <span>{point.gloss}</span></p>
                <p className="cb-sentence ix-scale-sentence"><T>{point.sm}</T></p>
                <p className="cb-en ix-scale-en">{point.en}</p>
              </>
            ) : (
              <>
                <p className="cb-sentence ix-scale-sentence"><T>{point.label}</T></p>
                <p className="cb-en ix-scale-en">{point.gloss}</p>
              </>
            )}
            {point.note && <p className="ix-scale-note"><Md text={point.note} /></p>}
          </div>
        </Motion.div>
      </AnimatePresence>
    </div>
  )
}
