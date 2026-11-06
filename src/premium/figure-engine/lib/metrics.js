// Tile sizes and text measuring. Widths are read from a real DOM span in the real
// font, so a tile fits its word exactly at either width.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const FONT_FAMILY = "'Source Serif 4 Variable', 'Source Serif 4', Georgia, serif"
const cache = new Map()
let probe = null

function ensureProbe() {
  if (probe) return probe
  probe = document.createElement('span')
  probe.setAttribute('aria-hidden', 'true')
  probe.style.cssText = `position:absolute;left:-9999px;top:-9999px;visibility:hidden;white-space:pre;font-family:${FONT_FAMILY};font-style:italic;font-weight:500;font-size:100px;font-optical-sizing:auto;line-height:1`
  document.body.appendChild(probe)
  return probe
}

/** Width of a Sāmoan word in tile type at a font size. */
export function textWidth(text, fs) {
  const key = `${text}@${fs}`
  if (cache.has(key)) return cache.get(key)
  const el = ensureProbe()
  el.style.fontSize = `${fs}px`
  el.textContent = text
  const w = el.getBoundingClientRect().width
  cache.set(key, w)
  return w
}

/** Re-render once the tile face has loaded, since widths change with it. */
export function useTileFont() {
  const [epoch, setEpoch] = useState(0)
  useEffect(() => {
    let live = true
    const refresh = () => {
      cache.clear()
      if (live) setEpoch(e => e + 1)
    }
    const faces = document.fonts
    if (!faces) return undefined
    Promise.all([
      faces.load(`italic 500 30px 'Source Serif 4 Variable'`),
      faces.load(`italic 500 24px 'Source Serif 4 Variable'`),
    ]).then(refresh, refresh)
    faces.ready.then(refresh, refresh)
    return () => { live = false }
  }, [])
  return epoch
}

/** The inner width of an element, kept current. */
export function useWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return undefined
    const read = () => setWidth(node.clientWidth)
    read()
    const ro = new ResizeObserver(read)
    ro.observe(node)
    return () => ro.disconnect()
  }, [])
  return [ref, width]
}

/** Tile geometry at this stage width. Direction.md part 4: 30 px in 56, 24 px in 44. */
export function tileSizes(width) {
  const phone = width > 0 && width < 480
  return phone
    ? { fs: 24, h: 44, pad: 11, gap: 6, r: 10, arc: 32, label: 22, ghost: 22, mark: 20, phone: true }
    : { fs: 30, h: 56, pad: 15, gap: 8, r: 10, arc: 40, label: 24, ghost: 30, mark: 22, phone: false }
}

/** Fits a figure's size set to its stage. A wide stage grows the tiles until the widest row
 *  nearly fills it, up to 38 px type, and shrinks a long row a little, to no less than 24 px, so
 *  it stays on one line. A phone shrinks to no less than 20 px type. A row that would still not
 *  fit stays at full size and wraps to a second line. */
const scaleSizes = (base, k) => ({
  ...base,
  fs: Math.round(base.fs * k * 10) / 10,
  h: Math.round(base.h * k),
  pad: Math.round(base.pad * k),
  gap: Math.max(4, Math.round(base.gap * k)),
  ghost: Math.round(base.ghost * k),
  arc: Math.round(base.arc * Math.max(k, 1)),
})

export function fitSizes(base, widest, width) {
  if (!widest || !width) return base
  const scale = k => scaleSizes(base, k)
  if (width >= 480) {
    const grow = Math.min(38 / base.fs, (width * 0.92) / widest)
    if (grow > 1.02) return scale(grow)
    if (widest <= width) return base
    const k = width / widest
    return k < 24 / base.fs ? base : scale(k * 0.985)
  }
  if (widest <= width) return base
  const k = width / widest
  // A touch under the exact fit, since sizes round to whole pixels and must not push a row to wrap.
  return k < 20 / base.fs ? base : scale(k * 0.985)
}

/** The smallest tile type on a phone when a row fits one line only with its labels on two lines. */
const PHONE_MIN_FS = 17
/** The smallest tile type on a wide stage when a long row fits one line only by shrinking further
 *  than fitSizes allows (24 px): 20 px, a touch above the chapter's reading text at that width
 *  (.ls-intro is 19 to 21 px), so a tile word never reads smaller than the prose beside it. */
const DESKTOP_MIN_FS = 20

/** Fits a Row's or a Fork's sizes to a phone stage (pilot fix, Engine-Limits.md rows 1 and 6).
 *  `widthsAt(s)` gives the width of each of the figure's lines (each state or case) at sizes `s`.
 *  The first try is fitSizes as it always was; a figure whose lines all fit that way is unchanged.
 *  Otherwise its role labels may take two lines (each column then about its tile plus a little)
 *  and the type may step down to 17 px, so every line fits one line where it can. A Fork's cases
 *  are separate sentences (`partial`): when one cannot fit even so, the cases that can are fitted
 *  and the rest wrap as before. A Row's states are one sentence changing, so a Row is fitted whole
 *  or not at all. When the new fit puts no more lines on one line than the first try, the first try
 *  stands. `twoLines(s)` says whether any label takes two lines at `s`. One size holds for the
 *  whole figure. */
export function fitRow(base, widthsAt, width, twoLines, partial = false, wrapAt = null) {
  const widest = s => Math.max(...widthsAt(s))
  const first = fitSizes(base, widest(base), width)
  if (!width || widest(first) <= width) return first
  const desktop = width >= 480
  const fitting = s => widthsAt(s).filter(w => w <= width).length
  const total = widthsAt(base).length
  // One try at a set of sizes: the type steps down to the floor (17 px on a phone, 20 px on a wide
  // stage) until the lines worth fitting fit.
  const tier = extra => {
    const wrap = { ...base, ...extra }
    const at = k => (k >= 1 ? wrap : { ...scaleSizes(wrap, k), ...extra })
    const kMin = (desktop ? DESKTOP_MIN_FS : PHONE_MIN_FS) / base.fs
    // The lines worth fitting: those that fit at the smallest type.
    const floorWidths = widthsAt(at(kMin))
    const want = floorWidths.map((w, i) => (w <= width ? i : -1)).filter(i => i >= 0)
    if (!want.length || (!partial && want.length < floorWidths.length)) return null
    let k = 1
    for (let i = 0; i < 10; i++) {
      const widths = widthsAt(at(k))
      const w = Math.max(...want.map(j => widths[j]))
      if (w <= width) break
      k = Math.max(kMin, Math.min(1, k) * (width / w) * 0.99)
    }
    const s = fitting(at(k)) >= want.length ? at(k) : at(kMin)
    return twoLines(s) ? { ...s, labelExtra: LABEL_LINE } : s
  }
  const best = [first]
  // Step 9 batch 3 (Engine-Limits.md): a wide stage shrinks a long row as a phone does, labels on one
  // line, so an eight-tile row sits on one line at 1440 where it can (32.3). A row that fit before
  // keeps its sizes exactly: this runs only for a row fitSizes left wrapping.
  if (desktop) {
    const wide = tier({})
    if (wide) best.push(wide)
    // Step 9 batch 4: desktop labels are now measured in the face they are drawn in (row.js labelBox),
    // so a long row that fit only on under-measured labels (37.2 case 2) may take two-line labels, then
    // packed ones, as a phone does, before it wraps. Tried only where the tries above leave a line wrapping.
    const most = () => best.reduce((a, b) => (fitting(b) > fitting(a) ? b : a))
    if (fitting(most()) < total) {
      const two = tier({ wrapLabels: true })
      if (two) best.push(two)
    }
    if (fitting(most()) < total) {
      const packed = tier({ wrapLabels: 'all', pack: true })
      if (packed) best.push(packed)
    }
    return most()
  }
  const second = tier({ wrapLabels: true })
  if (second) best.push(second)
  // Step 9 batch 2 (Engine-Limits.md row 26): where two-line labels in their own columns still
  // leave a line too wide, the labels may reach past their tile over a neighbour whose label is
  // narrower (`pack`), and every label that can take two lines does (`wrapLabels: 'all'`). Tried
  // only after the tier above, so a figure that fit before keeps its sizes exactly.
  if (!second || fitting(second) < total) {
    const third = tier({ wrapLabels: 'all', pack: true })
    if (third) best.push(third)
  }
  // The try that puts the most lines on one line; on a tie, the earlier one.
  const chosen = best.reduce((a, b) => (fitting(b) > fitting(a) ? b : a))
  if (!wrapAt || fitting(chosen) >= total) return chosen
  return shrinkBeforeWrap(base, chosen, width, twoLines, wrapAt, fitting)
}

/** Step 9 batch 4 (Engine-Limits.md): a phone row that still wraps shrinks first, toward the 17 px
 *  floor, and only then wraps. Before this a row that could not fit one line even at the floor
 *  wrapped at full size (41.3, 47.1, 37.2). The type steps down only as far as it still saves a
 *  line: the largest size whose wrapped lines are as few as the floor's. And a single tile wider
 *  than the stage even at the floor (a long phrase tile, 36.1) shrinks the figure below the floor
 *  until it fits, since a tile that runs off the card cannot be read at all.
 *  `wrapAt(s)` gives { lines, widest }: the figure's lines when wrapped at this stage, and its
 *  widest wrapped line. One size still holds for the whole figure. */
function shrinkBeforeWrap(base, chosen, width, twoLines, wrapAt, fitting) {
  const extra = { wrapLabels: 'all', pack: true }
  const at = k => {
    const s = { ...scaleSizes({ ...base, ...extra }, k), ...extra }
    return twoLines(s) ? { ...s, labelExtra: LABEL_LINE } : s
  }
  const kMin = PHONE_MIN_FS / base.fs
  const kNow = Math.min(1, chosen.fs / base.fs)
  let pick = chosen
  const now = wrapAt(chosen)
  const low = wrapAt(at(kMin))
  if (low.lines < now.lines) {
    let lo = kMin
    let hi = kNow
    for (let i = 0; i < 9; i++) {
      const mid = (lo + hi) / 2
      if (wrapAt(at(mid)).lines <= low.lines) lo = mid
      else hi = mid
    }
    const s = at(lo)
    if (fitting(s) >= fitting(chosen)) pick = s
  }
  const spill = wrapAt(pick).widest
  if (spill > width) pick = at((pick.fs / base.fs) * (width / spill) * 0.98)
  return pick
}

/** The height a label's second line adds (.ft-label.is-two sets 13 px lines). */
export const LABEL_LINE = 13

/** The distance from one wrapped row of tiles to the next: a Row's and a Fork's alike. */
export const lineHeightOfRow = s => s.h + 40 + (s.labelExtra || 0)

/** One line of wrapped English. A single line keeps its 30 px; see .ft-en.is-wrap. */
export const EN_WRAP_LINE = 22

/** Width of interface text in a given CSS font, for placing a line of English beside a row. */
let canvas = null
export function uiWidth(text, font) {
  if (typeof document === 'undefined') return 0
  canvas = canvas || document.createElement('canvas').getContext('2d')
  canvas.font = font
  return canvas.measureText(text).width
}

/** Width of a tile's label in the label face .ft-label sets (Barlow Condensed 600, capitals, tracked).
 *  The book's role labels are longer than one-word labels, so a tile's column is at least this wide
 *  and no two labels meet (reviews/lesson-simplify-2026-11-06/Build-Notes.md). */
export function labelWidth(text, phone) {
  if (!text) return 0
  const t = String(text).replace(/\*/g, '').toUpperCase()
  const fs = phone ? 10.5 : 11.5
  const track = phone ? 0.08 : 0.12
  return uiWidth(t, `600 ${fs}px 'Barlow Condensed', 'Arial Narrow', sans-serif`) + t.length * fs * track
}

/** The width a label needs on two lines, split where it balances them best: at a space, or after
 *  the hyphen of a long compound (POINTING- / BACK WORD), where the browser breaks it too. A hyphen
 *  after fewer than five letters (NOT-, FROM-) never splits, so short compounds stay whole. */
export function labelTwoLineWidth(text, phone, anyHyphen = false) {
  const t = String(text)
  const splits = []
  // `anyHyphen`: the packed phone fit (fitRow's last try) may split a short compound too (NOT- / WORD).
  const longEnough = anyHyphen ? /\p{L}{2}-$/u : /\p{L}{5}-$/u
  for (let i = 1; i < t.length; i++) {
    if (t[i] === ' ') splits.push([t.slice(0, i), t.slice(i + 1)])
    else if (t[i - 1] === '-' && longEnough.test(t.slice(0, i))) splits.push([t.slice(0, i), t.slice(i)])
  }
  if (!splits.length) return labelWidth(text, phone)
  return Math.min(...splits.map(([a, b]) => Math.max(labelWidth(a, phone), labelWidth(b, phone))))
}

/** Width of a figure's English line, in the font .ft-en sets at this stage width. */
export function enWidth(text, width) {
  return uiWidth(String(text), `500 ${width < 480 ? 15.5 : 16}px 'Inter Variable', Inter, sans-serif`) + 2
}

/** The lines an English sentence takes when it wraps on this stage. */
export function enLineCount(text, width) {
  if (!text || enWidth(text, width) <= width) return 1
  let lines = 1
  let current = ''
  String(text).split(' ').forEach(word => {
    const next = current ? `${current} ${word}` : word
    if (current && enWidth(next, width) > width) { lines += 1; current = word } else current = next
  })
  return lines
}
