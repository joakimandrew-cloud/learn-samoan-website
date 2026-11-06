// The row engine behind Move, Swap and Add and Drop. rowTimeline says when each
// beat runs; rowFrame says where everything is at time t. rowFrame is pure: the
// same scene, time and layout always give the same frame, with no state and no
// CSS animation, so any frame can be rendered exactly.
import { HOLD_MS, OPEN_MS, ROLL_MS, TRAVEL_MS, clamp01, land, leave, lerp, ramp, travel } from './lib/motion.js'
import { EN_WRAP_LINE, fitRow, labelTwoLineWidth, labelWidth, lineHeightOfRow, shrinkToHold, textWidth, tileSizes, uiWidth } from './lib/metrics.js'
import { ROLE_LABEL } from './key.js'

const TRAVEL = { move: TRAVEL_MS, add: TRAVEL_MS, drop: TRAVEL_MS, swap: ROLL_MS, en: 420, limit: 620, slot: 620, line: TRAVEL_MS }
const HOLD = { move: HOLD_MS, add: HOLD_MS, drop: HOLD_MS, swap: HOLD_MS, en: 380, limit: 300, slot: 300, line: 300 }

export function rowTimeline(scene) {
  let at = OPEN_MS
  let state = 0
  const beats = scene.beats.map(beat => {
    const from = state
    if (beat.to != null) state = beat.to
    // A swap that also drops tiles (`drop: [...]`) takes a drop's time, so the dropped words leave as a drop's do.
    const travelMs = beat.drop ? Math.max(TRAVEL[beat.kind] ?? TRAVEL_MS, TRAVEL.drop) : TRAVEL[beat.kind] ?? TRAVEL_MS
    const b = {
      ...beat,
      from,
      toState: state,
      start: at,
      travelEnd: at + travelMs,
      end: at + travelMs + (HOLD[beat.kind] ?? HOLD_MS),
    }
    at = b.end
    return b
  })
  return { beats, duration: at, rests: beats.map(b => b.end) }
}

const SLOT_W = { fs30: 112, fs24: 96 }

/** A tile that turns over in place keeps one width, so its neighbours really hold still. */
function heldIds(scene) {
  const held = new Set()
  for (const beat of scene.beats) {
    if (beat.kind === 'swap') [].concat(beat.tile).forEach(id => held.add(id))
    if (beat.roll) held.add(beat.roll)
  }
  return held
}

function tileWidth(id, face, s, scene, held) {
  if (id === 'GHOST') return s.ghost
  if (id === 'SLOT') return s.fs >= 28 ? SLOT_W.fs30 : SLOT_W.fs24
  if (held.has(id)) return Math.max(...scene.tiles[id].map(item => textWidth(item.text, s.fs))) + s.pad * 2
  return textWidth(face.text, s.fs) + s.pad * 2
}

/** A label wider than its tile by more than this may take two lines, on a phone row that needs it. */
const LABEL_SLACK = 10

/** A tile's label: the room its column needs, and whether it takes two lines. A blank label
 *  (`label: ''`) hides that tile's label and takes no room. Labels go onto two lines only when the
 *  sizes allow it (fitRow sets `wrapLabels` for a phone row that fits one line no other way). */
export function labelBox(face, s, tileW = 0) {
  const text = face ? face.label ?? ROLE_LABEL[face.role] : null
  if (!text) return { room: 0, lines: 1, width: 0 }
  // The label face follows the stage, not the tile type: a desktop row shrunk under 28 px still draws
  // its labels at the desktop size (Step 9 batch 4: at 1440 Chapter 37's labels ran together).
  const phone = s.phone ?? s.fs < 28
  const one = labelWidth(text, phone) + 6
  const all = s.wrapLabels === 'all'
  if (!s.wrapLabels || (!all && one <= tileW + LABEL_SLACK)) return { room: one, lines: 1, width: one }
  const two = labelTwoLineWidth(text, phone, all) + 6
  return two < one ? { room: two, lines: 2, width: two } : { room: one, lines: 1, width: one }
}

/** The room a tile's label needs: its column is at least this wide, so no two labels meet. */
export function labelRoom(face, s, tileW = 0) {
  return labelBox(face, s, tileW).room
}

/** Does any tile of the figure take a two-line label at these sizes? */
function rowTwoLines(def, s) {
  return def.scenes.some(scene => {
    const held = heldIds(scene)
    return scene.states.some(state => state.some(([id, f]) => {
      if (id === 'GHOST' || id === 'SLOT') return false
      const w = tileWidth(id, scene.tiles[id][f], s, scene, held)
      return labelBox(scene.tiles[id][f], s, w).lines > 1
    }))
  })
}

/** The least room between two labels' boxes in a packed row (each box already carries 3 px a side). */
const LABEL_GAP = 2

/** The room between a tile and an attached tile that joins it with no space (Step 9 batch 3: an
 *  ending such as *=a*, `attach: true` on its face): the two boxes nearly touch, so they read as one
 *  word in two pieces, and the ending can still move as its own tile. */
export const ATTACH_GAP = 2

/** Where an attached tile's label sits: under its tile, or pushed right just far enough to clear the
 *  label of the tile it joins. `prevLabelRight` is that label's right edge, `centre` the tile's. */
const attachLabelDx = (prevLabelRight, room, centre) => (room ? Math.max(0, prevLabelRight + LABEL_GAP + room / 2 - centre) : 0)

/** Packs a line of tiles: each tile centre as close to the last as its tile and its label allow, so a
 *  long label may reach over a neighbour whose own label is narrower. `items` are { w, room }, with
 *  room the label's width; gives each item's tile x, and the line's width. */
export function packLine(items, gap) {
  let prev = null
  let widest = 0
  const ldxs = []
  const xs = items.map(item => {
    let c
    let ldx = 0
    if (prev && item.attach) {
      // An attached tile sits against the one before it; its label clears that tile's label.
      c = prev.c + (prev.w + item.w) / 2 + ATTACH_GAP
      ldx = prev.room ? attachLabelDx(prev.c + prev.ldx + prev.room / 2, item.room, c) : 0
    } else {
      c = prev ? prev.c + Math.max((prev.w + item.w) / 2 + gap, prev.room && item.room ? prev.ldx + (prev.room + item.room) / 2 + LABEL_GAP : 0) : Math.max(item.w, item.room) / 2
    }
    prev = { ...item, c, ldx }
    ldxs.push(ldx)
    widest = Math.max(widest, c + item.w / 2, c + ldx + item.room / 2)
    return c - item.w / 2
  })
  return { xs, ldxs, widest }
}

/** One scene's rows at one size. Tiles wrap to a new line only when `limit` is passed. Each tile
 *  sits centred in a column as wide as the tile or its label, whichever is wider; at packed phone
 *  sizes (`s.pack`, fitRow's last try) a label may reach over a neighbour instead (packLine). */
function placeStates(scene, s, limit = Infinity, hold = true) {
  const greedy = scene.states.map(state => placeState(scene, s, limit, state))
  if (!hold || limit === Infinity || scene.states.length < 2) return greedy
  // Step 10 (Engine-Limits.md row 54): a Row holds its wrap decision across the states of a scene,
  // so no tile jumps from one line to the next as the sentence changes (40.1 at 390: the main
  // clause rose to line one in the GHOST state and dropped back when ʻĀ landed). The plans tried:
  // each state's own line breaks applied to every state (the rest state's first, so a judged last
  // frame keeps its lines where it can), then all of them together. The first plan under which
  // every tile that stays (a Move's tile may change line) keeps its line, with no line added to the
  // scene, is used; with none, each state wraps on its own as before.
  const stable = maps => {
    if (maps.every(m => m.__breaks.length === 0)) return true
    const moved = new Set((scene.beats || []).filter(b => b.kind === 'move').flatMap(b => [].concat(b.tile)))
    const ys = {}
    maps.forEach(m => Object.keys(m).forEach(id => {
      if (id.startsWith('__') || id === 'GHOST' || id === 'SLOT' || moved.has(id)) return
      ;(ys[id] = ys[id] || new Set()).add(m[id].y)
    }))
    return Object.values(ys).every(set => set.size === 1)
  }
  if (stable(greedy)) return greedy
  const most = maps => Math.max(...maps.map(m => m.__lines))
  const plans = [...greedy].reverse().map(m => m.__breaks.join('\u0000'))
  plans.push(greedy.flatMap(m => m.__breaks).join('\u0000'))
  for (const plan of new Set(plans)) {
    const forced = new Set(plan ? plan.split('\u0000') : [])
    const held = scene.states.map(state => placeState(scene, s, limit, state, forced))
    if (most(held) <= most(greedy) && stable(held)) return held
  }
  // No plan holds at this size; rowSizes then steps the type down until one does (heldAt).
  return Object.assign(greedy, { unheld: true })
}

/** Does every scene of the figure hold its line breaks at sizes `s` on a stage `width` wide? */
const heldAt = (def, width) => s => def.scenes.every(scene => !placeStates(scene, s, width).unheld)

function placeState(scene, s, limit, state, forced = null) {
  const held = heldIds(scene)
  const lineH = lineHeightOfRow(s)
  const breaks = []
  {
    const map = {}
    let x = 0
    let line = 0
    let widest = 0
    let packed = []
    let prev = null
    const measure = ([id, faceIndex]) => {
      const face = id === 'GHOST' || id === 'SLOT' ? null : scene.tiles[id][faceIndex]
      const w = tileWidth(id, face, s, scene, held)
      const faces = face ? scene.tiles[id] : []
      const room = Math.max(0, ...faces.map(item => labelRoom(item, s, w)))
      return { face, w, room, attach: Boolean(face?.attach) }
    }
    const sized = state.map(measure)
    /** The tiles attached after index i: they wrap with it, so the wrap test counts them. */
    const followers = i => {
      const out = []
      for (let k = i + 1; k < sized.length && sized[k].attach; k++) out.push(sized[k])
      return out
    }
    state.forEach(([id, faceIndex], i) => {
      const { face, w, room } = sized[i]
      const col = Math.max(w, room)
      // An attached tile (an ending, `attach: true`) stays on its host's line, against it.
      const attach = sized[i].attach && prev != null && prev.line === line
      if (s.pack) {
        const item = { w, room, attach }
        const next = packLine([...packed.map(p => p.item), item, ...followers(i).map(f => ({ w: f.w, room: f.room, attach: true }))], s.gap)
        if (packed.length && !attach && (next.widest > limit || forced?.has(id))) {
          line += 1
          packed = []
          breaks.push(id)
        }
        packed.push({ id, item })
        const { xs, ldxs, widest: lineW } = packLine(packed.map(p => p.item), s.gap)
        packed.forEach((p, i) => { if (map[p.id]) { map[p.id].x = xs[i]; map[p.id].ldx = ldxs[i] } })
        map[id] = { x: xs[xs.length - 1], y: line * lineH, w, face, faceIndex, ldx: ldxs[ldxs.length - 1] }
        prev = { line }
        widest = Math.max(widest, lineW)
        return
      }
      if (attach) {
        const tx = prev.x + prev.w + ATTACH_GAP
        const ldx = prev.room ? attachLabelDx(prev.labelRight, room, tx + w / 2) : 0
        map[id] = { x: tx, y: line * lineH, w, face, faceIndex, ldx }
        const right = Math.max(tx + w, tx + w / 2 + ldx + room / 2)
        widest = Math.max(widest, right)
        x = Math.max(x, right + s.gap)
        prev = { line, x: tx, w, room, labelRight: room ? tx + w / 2 + ldx + room / 2 : prev.labelRight }
        return
      }
      const tail = followers(i).reduce((sum, f) => sum + ATTACH_GAP + Math.max(f.w, f.room), 0)
      if (x > 0 && (x + col + tail > limit || forced?.has(id))) { line += 1; x = 0; breaks.push(id) }
      map[id] = { x: x + (col - w) / 2, y: line * lineH, w, face, faceIndex }
      prev = { line, x: x + (col - w) / 2, w, room, labelRight: x + col / 2 + room / 2 }
      widest = Math.max(widest, x + col)
      x += col + s.gap
    })
    map.__w = widest
    map.__lines = line + 1
    map.__breaks = breaks
    return map
  }
}

/** One size for the whole figure, so Another example never changes the tile size. */
export function rowSizes(def, width) {
  const base = tileSizes(width)
  const widthsAt = s => def.scenes.flatMap(scene => placeStates(scene, s).map(m => m.__w))
  // The figure's lines once wrapped at this stage, for shrink-before-wrap (Step 9 batch 4).
  const wrapAt = s => {
    // Sized on each state's own wrap, as before Step 10, so holding the wrap (placeStates) never
    // changes a figure's type size: it only keeps a staying tile on its line.
    const maps = def.scenes.flatMap(scene => placeStates(scene, s, width, false))
    return { lines: maps.reduce((a, m) => a + m.__lines, 0), widest: Math.max(...maps.map(m => m.__w)) }
  }
  const twoLines = s => rowTwoLines(def, s)
  // Quality round after Step 12 (Engine-Limits.md): a wrapped row whose widest state holds a gap
  // (33.2: =a leaves a GHOST on faʻatau) could find no breaks that every state keeps at the size
  // sized on each state's own wrap, so a staying tile changed line. Such a figure, and only such a
  // figure, steps its type down until the breaks decided with the gap in place hold in every state.
  return shrinkToHold(base, fitRow(base, widthsAt, width, twoLines, false, wrapAt), width, twoLines, heldAt(def, width))
}

/** Each state's tile positions. The block is centred on the stage at the width of its widest
 *  state, and every state starts from that same left edge, so a tile that holds still does. */
export function rowLayouts(scene, width, s) {
  const layouts = placeStates(scene, s, width)
  const widest = Math.max(...layouts.map(m => m.__w))
  const lines = Math.max(...layouts.map(m => m.__lines))
  const x0 = Math.max(0, (width - widest) / 2)
  layouts.forEach(map => {
    Object.keys(map).forEach(id => { if (!id.startsWith('__')) map[id].x += x0 })
  })
  return { layouts, s, widest, x0, lines, stageW: width }
}

/** The lines a run of words takes when it wraps at `room`, each word measured by `measure`. */
function wrapLines(text, measure, room) {
  let lines = 1
  let current = ''
  String(text).split(/\s+/).filter(Boolean).forEach(word => {
    const next = current ? `${current} ${word}` : word
    if (current && measure(next) > room) { lines += 1; current = word } else current = next
  })
  return lines
}

const BEFORE_EN_FONT = `400 14px 'Inter Variable', Inter, sans-serif`

/** The muted starting line above a Row (Step 9 batch 4, Engine-Limits.md): on one line when it fits,
 *  else stacked, the Sāmoan over its English, each wrapping inside the stage (it never wrapped
 *  before, so a long line ran off the card: 38.1, 39.1, 45.1). On a phone a sentence over 40 letters
 *  stacks as it always did. One block for every scene, so the stage never changes height. Gives
 *  { two, height }: whether it stacks, and the room it takes above the row (26 px a line before). */
export function beforeBlock(def, width, left = 8) {
  const scenes = def.scenes.filter(scene => scene.before)
  if (!scenes.length) return { two: false, height: 0 }
  const sayW = text => textWidth(text, 17)
  const enW = text => uiWidth(text, BEFORE_EN_FONT)
  const oneLine = scene => sayW(scene.before.say) + (scene.before.en ? 8 + enW(scene.before.en) : 0)
  const phone = width < 480
  const two = scenes.some(scene => (phone && scene.before.say.length + (scene.before.en ?? '').length > 40) || oneLine(scene) > width)
  if (!two) return { two: false, height: 26 }
  // The stacked block starts `left` px in (at most 8: Figure.jsx), and keeps 1 px clear of the right edge.
  const room = width - Math.min(8, Math.max(0, left)) - 1
  const height = Math.max(...scenes.map(scene => wrapLines(scene.before.say, sayW, room) * 24 + (scene.before.en ? wrapLines(scene.before.en, enW, room) * 20 : 0) + 4))
  return { two: true, height }
}

/** Geometry of the stage's rows, shared with the render. `scenes` is one scene or all of a
 *  figure's: given all, the headroom and English gap are the tallest scene's, so every scene of
 *  the figure keeps one height and its row at one place. */
export function rowGeometry(s, scenes, twoLineBefore = false, lines = 1, reserveBefore = false, enLines = 1) {
  const all = [].concat(scenes)
  // `twoLineBefore` is the stacked starting line's height in px (beforeBlock), or true for 48 as before.
  const stackedH = typeof twoLineBefore === 'number' ? twoLineBefore : 48
  const beforeH = all.some(scene => scene.before) || reserveBefore ? (twoLineBefore ? stackedH : 26) : 0
  const hasArc = all.some(scene => scene.beats.some(b => b.kind === 'move' && b.arc))
  // A drop that leaves a GHOST puts its struck word in the lane above that gap, as an old form does,
  // so it reserves the lane too (pilot fix, Engine-Limits.md: struck text never lands on the English
  // line). A drop with no gap left strikes the word only in the starting line, and needs no lane.
  const leavesGap = (scene, b) => b.kind === 'drop' && (scene.states[b.to] || []).some(([id]) => id === 'GHOST')
  const hasLane = all.some(scene => scene.beats.some(b => b.mark || b.old || leavesGap(scene, b)))
  const headroom = hasArc ? s.arc + 16 : hasLane ? 34 : 4
  const rowTop = beforeH + headroom
  const lineH = lineHeightOfRow(s)
  const labelTop = rowTop + (lines - 1) * lineH + s.h + 7
  const enTop = labelTop + s.label + (s.labelExtra || 0) + (all.some(scene => scene.enFirstWord) ? 24 : 4)
  const enH = 30
  return { beforeH, rowTop, labelTop, enTop, lineH, height: enTop + enH + (enLines - 1) * EN_WRAP_LINE }
}

/** The state showing at time t; a chip's tap can start its beat from any state. */
export function rowStateAt(timeline, t, override = null) {
  if (override) {
    const b = timeline.beats[override.beat]
    return t >= b.travelEnd ? override.to : override.from
  }
  let state = 0
  for (const b of timeline.beats) if (t >= b.travelEnd && b.to != null) state = b.toState
  return state
}

/** Where each tile of the first state stands in the starting line, as [start, end) offsets: the
 *  first state joins to before.say, so each tile's text is found in order from the last one's end. */
export function tilePlaces(scene) {
  // An attached tile (=a) is found right after its host's text, with no space between.
  const say = String(scene.before?.say ?? '')
  const places = {}
  let from = 0
  for (const [id, f] of scene.states[0] || []) {
    const text = scene.tiles[id]?.[f ?? 0]?.text
    if (!text) continue
    const at = say.indexOf(text, from)
    if (at < 0) continue
    places[id] = { start: at, end: at + text.length }
    from = at + text.length
  }
  return places
}

export function rowFrame(scene, timeline, t, layout, geometry, override = null) {
  const { layouts, s } = layout
  const { beats } = timeline
  const state = rowStateAt(timeline, t, override)
  const inBeat = override ? beats[override.beat] : beats.find(b => t >= b.start && t < b.travelEnd)
  const cur = inBeat && t >= inBeat.start && t < inBeat.travelEnd ? inBeat : null
  const p = cur ? (t - cur.start) / (cur.travelEnd - cur.start) : 1
  const moving = cur && cur.to != null
  const fromState = override ? override.from : cur?.from
  const toState = override ? override.to : cur?.toState
  const A = moving ? layouts[fromState] : layouts[state]
  const B = moving ? layouts[toState] : layouts[state]

  const posE = !cur ? 1 : cur.kind === 'add' ? travel(ramp(p, 0, 0.55)) : cur.kind === 'drop' ? travel(ramp(p, 0.35, 1)) : travel(p)
  const mains = cur ? [].concat(cur.tile || []) : []
  // Quality round after Step 12: a swap beat may drop tiles in the same beat (`drop: ['ai', 'faiva']`,
  // 45.2), so the row never stops on a sentence the book does not print. They leave as a drop's do.
  const drops = cur?.kind === 'swap' ? [].concat(cur.drop || []) : []

  const ids = new Set([...Object.keys(A), ...Object.keys(B)].filter(k => !k.startsWith('__')))
  const tiles = []
  const frames = {}
  for (const id of ids) {
    const a = A[id]
    const b = B[id]
    const isMain = mains.includes(id)
    let x = lerp((a ?? b).x, (b ?? a).x, posE)
    const lineY = lerp((a ?? b).y, (b ?? a).y, posE)
    let y = 0
    let opacity = 1
    let outline = 0
    let z = 1
    let w = lerp((a ?? b).w, (b ?? a).w, posE)
    let roll = 0
    let faceA = (a ?? b).face
    let faceB = (b ?? a).face
    let labelOpacity = 1
    const ldx = lerp(a?.ldx ?? b?.ldx ?? 0, b?.ldx ?? a?.ldx ?? 0, posE)

    if (cur?.kind === 'move' && isMain) {
      const e = travel(p)
      x = lerp(a.x, b.x, e)
      w = lerp(a.w, b.w, ramp(e, 0.5, 1))
      y = -Math.sin(Math.PI * e) * s.h * 0.82
      z = 3
      roll = faceA !== faceB ? travel(ramp(p, 0.52, 0.96)) : 0
      labelOpacity = Math.max(0, 1 - ramp(p, 0, 0.2)) + ramp(p, 0.82, 1)
    } else if (cur?.kind === 'add' && isMain) {
      const q = ramp(p, 0.38, 1)
      y = (1 - land(q)) * s.h * 0.62
      opacity = ramp(q, 0, 0.35)
      labelOpacity = ramp(q, 0.4, 1)
      x = b.x
      w = b.w
    } else if ((cur?.kind === 'drop' && isMain) || (drops.includes(id) && a)) {
      const q = ramp(p, 0.16, 1)
      outline = ramp(p, 0, 0.22)
      y = leave(q) * s.h * 0.72
      opacity = 1 - ramp(q, 0.45, 0.95)
      labelOpacity = 1 - ramp(p, 0, 0.2)
      x = a.x
      w = a.w
    } else if (cur?.kind === 'swap' && isMain) {
      roll = travel(p)
    } else if (cur?.roll === id) {
      roll = travel(ramp(p, 0.2, 0.8))
    } else if (a && !b) {
      opacity = 1 - ramp(p, 0, 0.4)
    } else if (!a && b) {
      // A ghost waits until the tile has mostly gone from its place.
      opacity = cur?.kind === 'drop' ? ramp(p, 0.4, 0.75) : ramp(p, 0.12, 0.5)
    }

    if (roll > 0 && roll < 1) labelOpacity *= 1 - Math.sin(Math.PI * roll)
    const face = roll >= 0.5 ? faceB : faceA

    frames[id] = { x, y, w, lineY }
    tiles.push({ id, x, y: y + lineY, w, z, opacity, outline, roll, faceA, faceB, labelFace: face, labelOpacity: clamp01(labelOpacity), ldx, kind: id })
  }

  // Arc from where the tile was to where it landed.
  let arc = null
  const arcBeat = beats.find(b => b.kind === 'move' && b.arc)
  if (arcBeat && t > arcBeat.start) {
    const inTravel = t < arcBeat.travelEnd
    const after = layouts[arcBeat.toState]
    const origin = layouts[arcBeat.from][arcBeat.tile]
    const ghost = arcBeat.arc === 'GHOST' && frames.GHOST
    const startX = ghost ? ghost.x + ghost.w / 2 : origin.x + origin.w / 2
    const startLine = ghost ? ghost.lineY : origin.y
    const landed = inTravel ? after[arcBeat.tile] : frames[arcBeat.tile]
    const endX = landed.x + landed.w / 2
    const endLine = landed.lineY ?? landed.y
    const top = line => geometry.rowTop + line - 5
    const foot = line => geometry.rowTop + line + s.h + 5
    const q = inTravel ? travel((t - arcBeat.start) / (arcBeat.travelEnd - arcBeat.start)) : 1
    const midX = (startX + endX) / 2
    const dir = endX >= startX ? 1 : -1
    // The bottom of a line's labels: an arc across a wrap runs below it, never through a label
    // (pilot fix, Engine-Limits.md). `line` is a line's y offset, as lineY is.
    const labelFoot = line => geometry.rowTop + line + s.h + 23 + (s.labelExtra || 0)
    const lineH = geometry.lineH
    const adjacent = Math.abs(endLine - startLine) <= lineH + 1
    if (startLine === endLine) {
      // The arc rises over the row. Below the first line it stays under the labels of the line above.
      const y0 = top(startLine)
      const apex = startLine > 0 ? Math.max(4, Math.min(14, y0 - labelFoot(startLine - lineH) - 3)) : s.arc - 6
      const ctrlY = y0 - apex * 2
      arc = {
        d: `M ${startX} ${y0} Q ${midX} ${ctrlY} ${endX} ${y0}`,
        progress: q,
        arrow: q > 0.97,
        endX,
        y0,
        dir,
        midX,
        apexY: y0 - apex,
        // Tangent at the end of a quadratic: from the control point to the end.
        tx: endX - midX,
        ty: y0 - ctrlY,
      }
    } else if (adjacent) {
      // Across one wrap the arc runs along the clear band between the upper line's labels and the
      // lower line's tiles, then turns onto its end: down onto the tile it reaches, or up to just
      // under the label of the tile it reaches. It crosses no label on the way.
      const down = endLine > startLine
      const upper = Math.min(startLine, endLine)
      const band = labelFoot(upper) + 4
      const y0 = down ? band : top(startLine)
      const y1 = down ? top(endLine) : labelFoot(endLine) + 3
      const run = y0
      arc = {
        d: `M ${startX} ${y0} C ${midX} ${run}, ${endX} ${run}, ${endX} ${y1}`,
        progress: q,
        arrow: q > 0.97,
        endX,
        y0: y1,
        dir,
        midX,
        apexY: 0.875 * run + 0.125 * y1,
        tx: 0,
        ty: y1 - run,
      }
    } else {
      // Across a wrap the arc leaves one line's edge and reaches the other's, running in the band
      // of the gap below the labels. Going up, it stops short of the label under the tile it reaches.
      const down = endLine > startLine
      const y0 = down ? foot(startLine) : top(startLine)
      const y1 = down ? top(endLine) : foot(endLine) + 17
      const c0 = down ? y1 - 3 : y0 - 12
      const c1 = down ? y1 - 12 : y1 + 3
      arc = {
        d: `M ${startX} ${y0} C ${startX} ${c0}, ${endX} ${c1}, ${endX} ${y1}`,
        progress: q,
        arrow: q > 0.97,
        endX,
        y0: y1,
        dir,
        midX,
        apexY: 0.125 * y0 + 0.375 * c0 + 0.375 * c1 + 0.125 * y1,
        // Tangent at the end of a cubic: from its last control point to the end.
        tx: 0,
        ty: y1 - c1,
      }
    }
  }

  // Numbered marks land at the end of their beat. A Move's sits on its arc; the others,
  // with any old form, sit in the lane above the tile, so nothing covers a tile's edge.
  const laneY = f => geometry.rowTop - 15 + (f?.lineY ?? 0)
  const marks = []
  const olds = []
  // A beat may name two tiles (`tile: ['afai', 'e']`); its struck word is their texts in row order,
  // each as the first state showed it (Step 9 batch 4: a two-tile drop into a GHOST crashed, Chapter 40).
  const firstFaces = Object.fromEntries((scene.states[0] || []).map(([id, f]) => [id, f ?? 0]))
  const oldText = tile => [].concat(tile).map(id => {
    const face = scene.tiles[id]?.[firstFaces[id] ?? 0]
    return face ? `${face.attach ? '' : ' '}${face.text}` : ''
  }).join('').trim()
  // Several drops into one GHOST stand side by side above it, in beat order, never on top of each other.
  const dropOlds = []
  for (const b of beats) {
    const f = b.kind === 'drop' ? frames.GHOST : b.tile ? frames[[].concat(b.tile)[0]] : null
    const oldAt = b.start + 0.3 * (b.travelEnd - b.start)
    if (b.mark && t >= b.travelEnd - 180) {
      const scale = land(ramp(t, b.travelEnd - 180, b.travelEnd + 160))
      if (b.kind === 'move' && arc) marks.push({ n: b.mark, x: arc.midX, y: arc.apexY, scale, onArc: true })
      else if (f) {
        const x = b.kind === 'add' ? f.x + f.w / 2 : b.kind === 'drop' ? f.x + f.w / 2 - 11 : f.x + 11
        marks.push({ n: b.mark, x, y: laneY(f), scale })
      }
    }
    if ((b.old || b.kind === 'drop') && f && t >= oldAt) {
      const old = { text: oldText(b.tile), y: laneY(f) - 9, opacity: ramp(t, oldAt, b.travelEnd) }
      if (b.kind === 'drop') dropOlds.push({ ...old, centre: f.x + f.w / 2 + 3 })
      else olds.push({ ...old, x: f.x + 26 })
    }
  }
  if (dropOlds.length) {
    // One run of struck words from where a single drop's word always starts (.ft-old's x is its left
    // edge), each next word after the last, kept inside the stage.
    const font = `italic 500 ${(s.phone ?? s.fs < 28) ? 14 : 15}px 'Source Serif 4 Variable', 'Source Serif 4', Georgia, serif`
    const ws = dropOlds.map(old => uiWidth(old.text, font) || old.text.length * 7)
    const space = 5
    const total = ws.reduce((a, w) => a + w, 0) + space * (ws.length - 1)
    let left = Math.max(0, Math.min(dropOlds[0].centre, (layout.stageW ?? Infinity) - total))
    if (dropOlds.length === 1) left = dropOlds[0].centre
    dropOlds.forEach((old, i) => {
      olds.push({ text: old.text, x: left, y: old.y, opacity: old.opacity })
      left += ws[i] + space
    })
  }

  // Sentence lines. In-between states carry no English.
  const first = beats[0]
  const enBeat = beats.find(b => b.kind === 'en')
  const beforeOpacity = scene.before ? ramp(t, first.start + 100, first.start + 500) : 0
  let en = null
  if (scene.before && t < first.start + 220) en = { text: scene.before.en, opacity: 1 - ramp(t, first.start, first.start + 220), y: 0 }
  if (enBeat && t >= enBeat.start) {
    const q = ramp(t, enBeat.start, enBeat.travelEnd)
    // A row whose halves the book glosses only as a whole (`whole`, 49.1) shows that line at rest.
    en = { text: scene.after.en ?? scene.whole?.en ?? null, opacity: q, y: (1 - land(q)) * 8 }
  }

  // A figure whose every state is a whole sentence the book prints: its line turns with the tile.
  let line = null
  if (scene.lines) {
    const shown = moving && p >= 0.5 ? scene.lines[toState] : moving ? scene.lines[fromState] : scene.lines[state]
    const q = moving ? 1 - Math.sin(Math.PI * clamp01(p)) : 1
    line = { text: shown.en ?? shown.note, opacity: q, y: 0 }
  }

  // A soft underlay on the book's list while its beat runs.
  const lit = beats.filter(b => b.li != null).map(b => ({
    li: b.li,
    v: ramp(t, b.start - 120, b.start + 160) * (1 - ramp(t, b.end - 80, b.end + 120)),
  }))

  // The starting line strikes each tile's whole text as the tile leaves, at the tile's own place in
  // the line (Direction.md part 8; Step 9 batch 2: a phrase tile such as *ʻi le nuʻu* is struck
  // whole, and *le* in another tile stays unstruck). A range is [start, end) in before.say.
  const struck = []
  const places = scene.before ? tilePlaces(scene) : {}
  for (const b of beats) {
    if (b.kind !== 'drop' && !b.drop) continue
    for (const id of [].concat(b.kind === 'drop' ? b.tile || [] : b.drop)) {
      if (places[id]) struck.push({ ...places[id], p: ramp(t, b.start, b.travelEnd) })
    }
  }

  const limitBeat = beats.find(b => b.kind === 'limit')
  const limit = limitBeat ? ramp(t, limitBeat.start, limitBeat.travelEnd) : 1
  const slotBeat = beats.find(b => b.kind === 'slot')
  const slot = slotBeat ? travel(ramp(t, slotBeat.start, slotBeat.travelEnd)) : 0
  const lineBeat = beats.find(b => b.kind === 'line')
  const absence = lineBeat ? travel(ramp(t, lineBeat.start, lineBeat.travelEnd)) : 0

  return { tiles, marks, olds, arc, beforeOpacity, en: line ?? en, isLine: Boolean(line), lit, limit, slot, line: absence, struck, s }
}
