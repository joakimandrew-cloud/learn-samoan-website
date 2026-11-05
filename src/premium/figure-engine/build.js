// The Build engine: a word that changes inside itself (Direction.md part 4, new for Sāmoan).
// The tile opens into its pieces as the book cuts them, each added piece (a doubled piece,
// an ending or a prefix) arrives in its gap, the tile closes on the new word, and the
// English re-forms. buildFrame is a pure function of time, as rowFrame and forkFrame are.
//
// A scene: { from: { say, en }, to: { say, en }, role, pieces: [{ text, added?, of?, label? }] }.
// The pieces joined are to.say's word; the pieces without `added` joined are from.say's word.
// `of` names the piece a doubled piece copies, so it rises from that piece.
// A piece with `was` changes in place (a vowel growing long: { text: 'ā', was: 'a' }): its old
// letters joined with the other kept pieces are from.say's word. A scene that only changes
// letters never opens: the changed piece turns over inside the closed word while every other
// letter holds still, its slot as wide as the wider of its two forms (pilot fix, Engine-Limits.md).
import { clamp01, land, lerp, ramp, travel } from './lib/motion.js'
import { textWidth } from './lib/metrics.js'

const OPEN = [700, 250]
const ADD = [900, 350]
const CLOSE = [650, 300]
const EN = [420, 380]
const CHANGE = [900, 350]

/** The italic lean of the tile face (Source Serif 4 Italic, measured: 0.2 across per 1 up), so an
 *  outline around letters leans with them and lines up with the letters it marks. */
export const ITALIC_LEAN = 0.2
const LEAN_DEG = (Math.atan(ITALIC_LEAN) * 180) / Math.PI
export const OUTLINE_SKEW = `skewX(${-LEAN_DEG.toFixed(2)}deg)`

const opens = scene => (scene.pieces || []).some(piece => piece.added)

export function buildTimeline(scene) {
  let at = 500
  const beats = []
  const push = (kind, [go, hold], extra = {}) => {
    beats.push({ kind, start: at, travelEnd: at + go, end: at + go + hold, ...extra })
    at += go + hold
  }
  const open = opens(scene)
  if (open) push('open', OPEN)
  ;(scene.pieces || []).forEach((piece, index) => { if (piece.added) push('add', ADD, { piece: index }) })
  ;(scene.pieces || []).forEach((piece, index) => { if (piece.was != null) push('change', CHANGE, { piece: index }) })
  if (open) push('close', CLOSE)
  push('en', EN)
  return { beats, duration: at, rests: beats.filter(b => b.kind !== 'open').map(b => b.end) }
}

/** Sizes on this stage: the tile type of a Row, a touch larger since a Build shows one word. */
export function buildSizes(width) {
  const phone = width > 0 && width < 480
  return phone
    ? { fs: 30, h: 54, pad: 14, gap: 10, label: 22, before: 26 }
    : { fs: 38, h: 68, pad: 18, gap: 14, label: 24, before: 30 }
}

export function buildGeometry(s, scenes) {
  const enTop = s.before + 16 + s.h + 7 + s.label + 8
  const hasEn = scenes.some(scene => scene.from?.en || scene.to?.en)
  return { rowTop: s.before + 16, labelTop: s.before + 16 + s.h + 7, enTop, height: enTop + (hasEn ? 30 : 0) }
}

/** Where each piece sits, closed (one word) and open (pieces apart), centred on the stage. */
export function buildLayout(scene, width, s) {
  const pieces = scene.pieces.map(piece => {
    const textW = textWidth(piece.text, s.fs)
    const wasW = piece.was != null ? textWidth(piece.was, s.fs) : textW
    return { ...piece, textW, wasW, w: Math.max(textW, wasW) }
  })
  const kept = pieces.filter(piece => !piece.added)
  const closedW = pieces.reduce((a, p) => a + p.w, 0) + s.pad * 2
  const fromW = kept.reduce((a, p) => a + p.w, 0) + s.pad * 2
  const openW = pieces.reduce((a, p) => a + p.w + s.pad * 2, 0) + s.gap * (pieces.length - 1)
  const x0 = Math.max(0, (width - Math.max(openW, closedW)) / 2)
  const centre = x0 + Math.max(openW, closedW) / 2
  let ox = centre - openW / 2
  let cx = centre - closedW / 2 + s.pad
  let fx = centre - fromW / 2 + s.pad
  for (const piece of pieces) {
    piece.openX = ox
    piece.openW = piece.w + s.pad * 2
    ox += piece.openW + s.gap
    piece.closedX = cx
    cx += piece.w
    piece.fromX = piece.added ? null : fx
    if (!piece.added) fx += piece.w
  }
  return { pieces, closedW, fromW, openW, centre }
}

export function buildFrame(scene, timeline, t, layout, geometry, s) {
  const { beats } = timeline
  const beat = kind => beats.find(b => b.kind === kind)
  const P = b => (b ? ramp(t, b.start, b.travelEnd) : 0)
  const firstBeat = beats[0]
  const openP = travel(P(beat('open')))
  const closeP = travel(P(beat('close')))
  const split = clamp01(openP) * (1 - closeP)

  const pieces = layout.pieces.map((piece, index) => {
    const add = beats.find(b => b.kind === 'add' && b.piece === index)
    const addP = add ? P(add) : 1
    // A kept piece goes from its place in the old word to its own box, then into the new word.
    let x
    if (piece.added) x = lerp(piece.openX + s.pad, piece.closedX, closeP)
    else if (closeP > 0) x = lerp(piece.openX + s.pad, piece.closedX, closeP)
    else x = lerp(piece.fromX, piece.openX + s.pad, openP)
    let y = 0
    let opacity = 1
    let change = null
    if (piece.was != null) {
      // The old letters lift away and the new ones settle into the same slot; nothing else moves.
      const b = beats.find(item => item.kind === 'change' && item.piece === index)
      const q = P(b)
      change = {
        q,
        oldX: x + (piece.w - piece.wasW) / 2,
        newX: x + (piece.w - piece.textW) / 2,
        oldY: -travel(ramp(q, 0.05, 0.6)) * s.h * 0.34,
        newY: (1 - land(ramp(q, 0.35, 1))) * s.h * 0.34,
        oldOpacity: 1 - ramp(q, 0.05, 0.45),
        newOpacity: ramp(q, 0.4, 0.8),
      }
    }
    if (piece.added) {
      const q = travel(addP)
      const source = Number.isInteger(piece.of) ? layout.pieces[piece.of] : null
      if (source && addP < 1) {
        // A doubled piece copies itself out of the piece it doubles and lands in its gap.
        x = lerp(source.openX + s.pad, piece.openX + s.pad, q)
        y = -Math.sin(Math.PI * q) * s.h * 0.7
        opacity = ramp(addP, 0, 0.2)
      } else if (addP < 1) {
        y = (1 - land(ramp(addP, 0.2, 1))) * s.h * 0.6
        opacity = ramp(addP, 0.15, 0.5)
      }
    }
    return { ...piece, x, y, opacity, addP, change, boxX: piece.added ? piece.openX : lerp(piece.openX, piece.openX, 1) }
  })

  // The whole tile: the old word's width at the start, the new word's at the end.
  const tileW = closeP > 0 ? lerp(layout.openW, layout.closedW, closeP) : lerp(layout.fromW, layout.openW, openP)
  const tileX = layout.centre - tileW / 2
  const merged = 1 - ramp(openP, 0, 0.25) + ramp(closeP, 0.75, 1)

  const enBeat = beat('en')
  const enP = enBeat ? ramp(t, enBeat.start, enBeat.travelEnd) : 0
  let en = null
  if (scene.from?.en && t < firstBeat.start + 220) en = { text: scene.from.en, opacity: 1 - ramp(t, firstBeat.start, firstBeat.start + 220), y: 0 }
  if (enP > 0) en = { text: scene.to.en, opacity: enP, y: (1 - land(enP)) * 8 }

  const beforeOpacity = ramp(t, firstBeat.start, firstBeat.start + 400)
  // Added pieces are outlined as the word closes; a changed piece is outlined as it starts to turn.
  const outline = ramp(closeP, 0.8, 1)
  const change = beats.find(b => b.kind === 'change')
  const changeOutline = change ? ramp(t, change.start, change.start + 0.3 * (change.travelEnd - change.start)) : 0
  return { pieces, split, merged: clamp01(merged), tileX, tileW, en, beforeOpacity, outline, changeOutline, labelP: 1 - ramp(openP, 0, 0.2) + ramp(closeP, 0.6, 1), s }
}
