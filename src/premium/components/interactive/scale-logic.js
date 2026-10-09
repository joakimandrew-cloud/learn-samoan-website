/**
 * Pure helpers for the Scale figure (Scale.jsx): the order a reader meets
 * the points in, where a label sits against its dot, the spacing of the
 * vertical line, whether a horizontal line has room for its labels, and the
 * arrow-key moves on a map. No React here, so the figure file exports its
 * component only and these can be tested on their own.
 */

const clamp = v => Math.min(100, Math.max(0, Number.isFinite(Number(v)) ? Number(v) : 0))

// Points in reading order, each keeping its index in the data as `key`:
// along a line by x; on a map by row (y), then across (x).
export function orderPoints(points, layout = 'line') {
  const list = (points || []).map((p, i) => ({ ...p, x: clamp(p.x), y: clamp(p.y), key: i }))
  return list.sort(layout === 'map' ? (a, b) => a.y - b.y || a.x - b.x : (a, b) => a.x - b.x)
}

// Where a marker's labels sit against its dot on the horizontal line:
// centred, unless the dot is so near an end that a centred label would run
// past it, when the label starts (or ends) at the dot instead.
export function anchorFor(x) {
  return x < 8 ? 'start' : x > 92 ? 'end' : 'center'
}

// The vertical line keeps the proportions of the horizontal one: the share
// of free space before each point, then after the last. Points at the same
// place get a share of 0 (the rows' own height keeps them apart).
export function gaps(xs) {
  const out = []
  let prev = 0
  for (const x of xs) { out.push(Math.max(0, x - prev)); prev = x }
  out.push(Math.max(0, 100 - prev))
  return out
}

// How far a label of width w reaches left and right of its dot.
function reach(w, anchor) {
  if (anchor === 'start') return { left: 6, right: w - 6 }
  if (anchor === 'end') return { left: w - 6, right: 6 }
  return { left: w / 2, right: w / 2 }
}

/**
 * Whether the horizontal line has room for every label.
 *   xs      the points' positions along the line (0..100), sorted
 *   widths  each point's widest label in px (its Samoan form or its gloss)
 *   span    the px width the positions spread over
 *   inset   the px of rail beyond 0 and 100 at each end
 *   pad     the least px between two neighbouring labels
 */
export function lineFits(xs, widths, span, { inset = 0, pad = 10 } = {}) {
  if (!(span > 0) || xs.length !== widths.length) return false
  const at = xs.map(x => (x / 100) * span)
  const r = xs.map((x, i) => reach(widths[i], anchorFor(x)))
  for (let i = 0; i < xs.length; i += 1) {
    if (r[i].left > at[i] + inset) return false
    if (r[i].right > span - at[i] + inset) return false
    if (i > 0 && r[i - 1].right + r[i].left + pad > at[i] - at[i - 1]) return false
  }
  return true
}

const DIRECTIONS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }

/**
 * The point an arrow key moves to on a map: the nearest one that lies that
 * way, counting a step off to the side twice as far as a step straight on.
 * Stays put when nothing lies that way. `points` carry x and y (0..100,
 * y down); `from` is an index into them.
 */
export function stepOnMap(points, from, key) {
  const d = DIRECTIONS[key]
  const a = points[from]
  if (!d || !a) return from
  let best = from
  let bestScore = Infinity
  points.forEach((p, i) => {
    if (i === from) return
    const dx = p.x - a.x
    const dy = p.y - a.y
    const ahead = dx * d[0] + dy * d[1]
    if (ahead <= 0) return
    const aside = Math.abs(dx * d[1]) + Math.abs(dy * d[0])
    const score = ahead + 2 * aside
    if (score < bestScore) { best = i; bestScore = score }
  })
  return best
}

/** The point an arrow key moves to along a line (or Home and End). */
export function stepOnLine(count, from, key) {
  if (key === 'Home') return 0
  if (key === 'End') return count - 1
  if (key === 'ArrowLeft' || key === 'ArrowUp') return Math.max(0, from - 1)
  if (key === 'ArrowRight' || key === 'ArrowDown') return Math.min(count - 1, from + 1)
  return from
}
