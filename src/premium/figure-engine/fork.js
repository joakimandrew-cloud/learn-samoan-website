// The Fork engine: one question, two lanes, a sentence with an empty slot. The
// slot is empty, a ring moves to the word the question looks at, the answering
// lane lights, the form travels down its branch into the slot, the English
// arrives. forkFrame is a pure function of time, as rowFrame is.
//
// Widened for Sāmoan (Direction.md part 4): a case with nothing to ring asks about
// meaning, and its ring beat takes no time; and a Fork of readings has no slot. Its
// lanes carry labels, not forms; one tile is marked `reads` (the same shape, two
// jobs), the ring travels from it to the neighbour that decides, the lane lights,
// and the reading tile takes its role and label in place of a form dropping in.
//
// Step 9 batch 3: a slot with no form (`{ slot: true }`) is an empty place that stays open, so a
// lane under `ownSlots` can show that its sentence holds no word there (Chapter 22: *ai* fills the
// fronted lane's slot, the end lane's stays empty); and `ring: true` on two neighbouring tiles
// rings the pair as one (Chapter 33: *ʻAua* and *le*).
import { clamp01, land, lerp, ramp, travel } from './lib/motion.js'
import { EN_WRAP_LINE, fitRow, lineHeightOfRow, textWidth, tileSizes } from './lib/metrics.js'
import { labelBox, packLine } from './row.js'

const FIRST = { enter: [500, 200], ring: [800, 300], lane: [500, 200], drop: [800, 200], en: [350, 500] }
const SECOND = { enter: [400, 150], ring: [600, 200], lane: [350, 150], drop: [600, 150], en: [300, 300] }
// A third case and on: the reader knows the shape by now, so a three-case scene stays under 8 s (5.2 ran 8.2 s).
const LATER = { enter: [350, 150], ring: [500, 150], lane: [300, 150], drop: [500, 150], en: [250, 250] }
const ORDER = ['enter', 'ring', 'lane', 'drop', 'en']

/** A case with nothing to ring has no ring beat worth waiting through: the question is about meaning. */
const hasRing = c => c.row.some(item => item.ring) || c.ringPerson != null

/** `withLimit`: the figure has a limit row, which rises after the last case as a Row's does. */
export function forkTimeline(scene, withLimit = false) {
  let at = 150
  const beats = []
  const spans = []
  scene.cases.forEach((c, index) => {
    const timing = index === 0 ? FIRST : index === 1 ? SECOND : LATER
    const spanStart = at
    ORDER.forEach(kind => {
      const [go, hold] = kind === 'ring' && !hasRing(c) ? [0, 0] : timing[kind]
      beats.push({ kind, caseIndex: index, start: at, travelEnd: at + go, end: at + go + hold })
      at += go + hold
    })
    spans.push({ lane: c.lane, start: spanStart, end: at })
  })
  if (withLimit) {
    beats.push({ kind: 'limit', start: at, travelEnd: at + 620, end: at + 920 })
    at += 920
  }
  return {
    beats,
    spans,
    duration: at,
    rests: beats.filter(b => b.kind !== 'enter' && b.end > b.start).map(b => b.end),
  }
}

/** The label a case-row tile shows, or null for none. A ring or a reading shows its role's label
 *  unless it names one; a slot shows the label set on it or on its form (`label: true` is the
 *  form's role label); any other tile shows a label it names, so a marker always shows its own. */
export function forkLabelOf(item) {
  const face = item.slot ? item.form : item
  if (item.slot) {
    const named = typeof item.label === 'string' ? item.label : typeof face?.label === 'string' ? face.label : null
    if (named) return { role: face?.role ?? 'quiet', label: named }
    return item.label === true && face ? { role: face.role, label: undefined } : null
  }
  if (item.ring || item.reads) return { role: item.role, label: typeof item.label === 'string' ? item.label : undefined }
  return typeof item.label === 'string' && item.label ? { role: item.role, label: item.label } : null
}

/** The box the ring goes round: the ringed tile, or two or more neighbouring ringed tiles on one
 *  line taken as one (Step 9 batch 3). check:figures holds ringed tiles to neighbours. */
export function ringBox(items) {
  const ringed = items.filter(item => item.ring)
  if (ringed.length <= 1) return ringed[0] || null
  const line = ringed.filter(item => item.y === ringed[0].y)
  const left = Math.min(...line.map(item => item.x))
  const right = Math.max(...line.map(item => item.x + item.w))
  return { x: left, y: ringed[0].y, w: right - left, ring: true }
}

/** One scene's rows at one size. Tiles wrap to a new line only when `limit` is passed, as a plain row's do. */
function placeCases(scene, s, limit = Infinity) {
  const lineH = lineHeightOfRow(s)
  return scene.cases.map(c => {
    let x = 0
    let line = 0
    let total = 0
    let packed = []
    const items = c.row.map(item => {
      const face = item.slot ? item.form : item
      // An empty slot (no form) is a place held open: as wide as a short word.
      const w = face ? textWidth(face.text, s.fs) + s.pad * 2 : Math.round(s.h * 1.25)
      // A tile whose label shows (forkLabelOf) gets a column as wide as its label.
      const shown = forkLabelOf(item)
      const box = shown ? labelBox(shown, s, w) : null
      const col = shown ? Math.max(w, box.room) : w
      const placed = { ...item, w, x: 0, y: 0, labelLines: box?.lines ?? 1, labelW: box?.width ?? 0 }
      if (s.pack) {
        // Packed phone sizes (fitRow's last try): a label may reach over a neighbour (packLine).
        const room = box?.room ?? 0
        if (packed.length && packLine([...packed.map(p => p.item), { w, room }], s.gap).widest > limit) {
          line += 1
          packed = []
        }
        packed.push({ placed, item: { w, room } })
        const { xs, widest } = packLine(packed.map(p => p.item), s.gap)
        packed.forEach((p, i) => { p.placed.x = xs[i] })
        placed.y = line * lineH
        total = Math.max(total, widest)
        return placed
      }
      if (x > 0 && x + col > limit) { line += 1; x = 0 }
      placed.x = x + (col - w) / 2
      placed.y = line * lineH
      total = Math.max(total, x + col)
      x += col + s.gap
      return placed
    })
    return { items, total, lines: line + 1 }
  })
}

/** One size for the whole figure, so Another example never changes the tile size. */
export function forkSizes(def, width) {
  const base = tileSizes(width)
  const widthsAt = s => def.scenes.flatMap(scene => placeCases(scene, s).map(c => c.total))
  const twoLines = s => def.scenes.some(scene => placeCases(scene, s).some(c => c.items.some(item => item.labelLines > 1)))
  // The cases' lines once wrapped at this stage, for shrink-before-wrap (Step 9 batch 4).
  const wrapAt = s => {
    const rows = def.scenes.flatMap(scene => placeCases(scene, s, width))
    return { lines: rows.reduce((a, r) => a + r.lines, 0), widest: Math.max(...rows.map(r => r.total)) }
  }
  return fitRow(base, widthsAt, width, twoLines, true, wrapAt)
}

/** The most lines any case in the figure needs, so Another example never changes the stage's height. */
export function forkLines(def, width, s) {
  return Math.max(...def.scenes.flatMap(scene => placeCases(scene, s, width).map(c => c.lines)))
}

export function forkLayouts(scene, width, s) {
  const rows = placeCases(scene, s, width)
  rows.forEach(r => {
    const x0 = Math.max(0, (width - r.total) / 2)
    r.items.forEach(item => { item.x += x0 })
  })
  return { rows, s }
}

/** How many lines a lane's forms take once they wrap inside the lane. */
function laneFormLines(lane, laneW, fs, gap) {
  const room = laneW - 6 // forms may use the lane's padding, up to 3 px from its border
  let x = 0
  let lines = 1
  ;(lane.forms || []).forEach(form => {
    const w = textWidth(form, fs)
    if (x > 0 && x + w > room) { lines += 1; x = 0 }
    x += w + gap
  })
  return lines
}

export function forkGeometry(s, width, def, lines = 1, enLines = 1) {
  const phone = width < 480
  const count = def.lanes.length
  const peopleH = def.people ? (phone ? 92 : 104) : 0
  const laneGap = phone ? 8 : 12
  const laneW = (width - laneGap * (count - 1)) / count
  const formFs = phone ? 21 : 25
  const formLines = Math.max(...def.lanes.map(lane => laneFormLines(lane, laneW, formFs, phone ? 12 : 16)))
  // Lanes of readings carry a label and no forms, so they stand lower.
  const labelsOnly = def.lanes.every(lane => !lane.forms?.length)
  const laneH = labelsOnly ? (phone ? 60 : 56) : (phone ? 76 : 84) + (formLines - 1) * (formFs + 8)
  const branchH = phone ? 44 : 56
  const laneBottom = peopleH + laneH
  const rowTop = laneBottom + branchH
  const labelTop = rowTop + (lines - 1) * lineHeightOfRow(s) + s.h + 7
  const enTop = labelTop + s.label + (s.labelExtra || 0) + 4
  const laneX = i => i * (laneW + laneGap) + laneW / 2
  // `ownSlots`: each lane owns the slot of its own cases, wherever it stands in the row, so only the
  // lit lane draws a branch, and only once it lights (Chapter 3: one form after the verb, one before).
  return { ownSlots: Boolean(def.ownSlots), count, peopleH, laneH, laneGap, laneW, laneX, branchH, laneBottom, rowTop, labelTop, enTop, height: enTop + 30 + (enLines - 1) * EN_WRAP_LINE }
}

/** A branch from a lane's foot to the slot. A slot on a wrapped line is reached down the side of
 *  the lines above it and along the gap over its own line, so the branch never runs behind a tile. */
function branchPath(x0, y0, slot, row, geometry, width) {
  const x1 = slot.x + slot.w / 2
  const y1 = geometry.rowTop + slot.y - 2
  const straight = () => {
    const midY = (y0 + y1) / 2
    return `M ${x0} ${y0} C ${x0} ${midY + 6}, ${x1} ${midY - 6}, ${x1} ${y1}`
  }
  const above = row.items.filter(item => item.y < slot.y)
  if (!above.length) return straight()
  const left = Math.min(...above.map(item => item.x)) - 7
  const right = Math.max(...above.map(item => item.x + item.w)) + 7
  const canLeft = left >= 3
  const canRight = right <= width - 3
  if (!canLeft && !canRight) return straight()
  const cx = canLeft && (!canRight || Math.abs(x1 - left) <= Math.abs(x1 - right)) ? left : right
  const top = geometry.rowTop - 6
  const gapY = geometry.rowTop + slot.y - 10
  const dir = x1 >= cx ? 1 : -1
  const r = Math.min(8, Math.abs(x1 - cx) / 2)
  const midY = (y0 + top) / 2
  return `M ${x0} ${y0} C ${x0} ${midY + 6}, ${cx} ${midY - 6}, ${cx} ${top} L ${cx} ${gapY - r} Q ${cx} ${gapY}, ${cx + dir * r} ${gapY} L ${x1 - dir * r} ${gapY} Q ${x1} ${gapY}, ${x1} ${Math.min(y1, gapY + r)} L ${x1} ${y1}`
}

export function forkFrame(scene, timeline, t, layout, geometry, width = Infinity) {
  const { beats } = timeline
  const caseCount = scene.cases.length
  let caseIndex = 0
  for (const b of beats) if (b.kind === 'enter' && t >= b.start) caseIndex = b.caseIndex
  const beat = kind => beats.find(b => b.kind === kind && b.caseIndex === caseIndex)
  const P = kind => {
    const b = beat(kind)
    return ramp(t, b.start, b.travelEnd)
  }

  const enter = P('enter')
  // The turn between cases: the old sentence out, the new one in.
  let shownCase = caseIndex
  let rowOpacity = 1
  if (caseIndex > 0 && enter < 0.4) {
    shownCase = caseIndex - 1
    rowOpacity = 1 - ramp(enter, 0, 0.4)
  } else if (caseIndex > 0) {
    rowOpacity = ramp(enter, 0.4, 1)
  } else {
    rowOpacity = 1
  }
  const previous = shownCase !== caseIndex
  const c = scene.cases[shownCase]
  const row = layout.rows[shownCase]
  const { s } = layout

  const ringP = previous ? 1 : P('ring')
  const laneP = previous ? 1 : P('lane')
  const dropP = previous ? 1 : P('drop')
  const enP = previous ? 1 : P('en')

  const reading = row.items.find(item => item.reads) || null
  const slot = row.items.find(item => item.slot) || reading
  const target = ringBox(row.items)
  // Where the branches end: the slot, else the ringed word, else the middle of the sentence's first
  // line. A case with no slot and no reading (a ring alone, or nothing to point at) never crashes.
  const firstLine = row.items.filter(item => item.y === 0)
  const middle = firstLine.length ? (Math.min(...firstLine.map(i => i.x)) + Math.max(...firstLine.map(i => i.x + i.w))) / 2 : width / 2
  const anchor = slot || target || { x: Number.isFinite(middle) ? middle : 0, y: 0, w: 0 }
  const ringE = travel(ramp(ringP, 0.05, 1))
  // The ring travels from the slot to the word that decides; with no slot it fades in on that word.
  const ringFrom = slot || target
  const ring = target ? {
    x: lerp(ringFrom.x, target.x, ringE),
    y: lerp(ringFrom.y, target.y, ringE),
    w: lerp(ringFrom.w, target.w, ringE),
    opacity: ramp(ringP, 0, 0.12),
  } : null

  // People, where a figure has them: the ring asks about one mark, then a frame lands on each member.
  const personRing = c.ringPerson != null ? { index: c.ringPerson, opacity: ramp(ringP, 0.1, 0.5) * (1 - ramp(laneP, 0.2, 0.8)) } : null
  const frames = c.group ? { members: c.group, opacity: travel(laneP) * rowOpacity } : null

  const litNow = c.lane
  const lit = {}
  lit[litNow] = travel(laneP)
  if (previous) lit[litNow] = 1 - ramp(enter, 0, 0.4)

  // The form travels from the foot of its lane to the slot.
  const laneX = geometry.laneX(c.lane)
  const dropE = travel(ramp(dropP, 0.05, 1))
  const form = slot && !reading && slot.form ? {
    face: slot.form,
    x: lerp(laneX - slot.w / 2, slot.x, dropE),
    y: lerp(geometry.laneBottom - s.h * 0.55, geometry.rowTop + slot.y, dropE),
    w: slot.w,
    opacity: ramp(dropP, 0, 0.14),
    scale: lerp(0.86, 1, dropE),
  } : null

  const branches = Array.from({ length: geometry.count }, (_, lane) => {
    const progress = lane === litNow ? travel(laneP) * (previous ? 1 - ramp(enter, 0, 0.4) : 1) : 0
    // A lane that owns its own slot draws nothing into another lane's slot, lit or not.
    if (geometry.ownSlots && lane !== litNow) return { lane, d: null, progress: 0, track: false }
    return {
      lane,
      d: branchPath(geometry.laneX(lane), geometry.laneBottom, anchor, row, geometry, width),
      progress,
      track: !geometry.ownSlots || progress > 0,
    }
  })

  const en = enP > 0 ? { text: c.en, opacity: enP * rowOpacity, y: (1 - land(enP)) * 8 } : null

  return {
    caseIndex: shownCase,
    caseCount,
    c,
    row,
    rowOpacity,
    ring,
    lit,
    form,
    branches,
    en,
    // A slot a form fills fades as the form lands; an empty slot stays drawn.
    slotOpacity: slot?.slot && !slot.form ? 1 : clamp01(1 - ramp(dropP, 0.8, 1)),
    readP: reading ? travel(ramp(dropP, 0, 0.7)) : 1,
    ringLabel: ramp(ringP, 0.7, 1),
    personRing,
    frames,
    s,
  }
}
