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
// A piece with `removed` is in from.say's word and not in to.say's (*uliuli* to *uli*, Step 9 batch 2):
// the word opens, that piece leaves (back into the piece `of` names, or down and out), and the word
// closes on the rest. The pieces without `removed` joined are to.say's word.
// A kept or removed piece may hold spaces (Step 9 batch 3): a Build can start from a phrase and show
// words leaving as it fuses (*tua o le fale* to *tuāfale*: the piece ' o le ' is removed). Spaces are
// measured and drawn (.fb-word keeps them); an open piece's box fits its letters, not its spaces.
// buildSizes(width, def) shrinks the type so the open, old and new words all fit the stage.
import { clamp01, land, leave, lerp, ramp, travel } from './lib/motion.js'
const leaveY = r => leave(ramp(r, 0.1, 1))
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

const opens = scene => (scene.pieces || []).some(piece => piece.added || piece.removed)

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
  ;(scene.pieces || []).forEach((piece, index) => { if (piece.removed) push('remove', ADD, { piece: index }) })
  ;(scene.pieces || []).forEach((piece, index) => { if (piece.was != null) push('change', CHANGE, { piece: index }) })
  if (open) push('close', CLOSE)
  push('en', EN)
  return { beats, duration: at, rests: beats.filter(b => b.kind !== 'open').map(b => b.end) }
}

/** Sizes on this stage: the tile type of a Row, a touch larger since a Build shows one word. Given
 *  the figure (`def`), the type steps down where a scene's open pieces, or its old or new word, would
 *  run past the stage (a phrase that fuses is long: Step 9 batch 3); one size holds for every scene. */
export function buildSizes(width, def = null) {
  const phone = width > 0 && width < 480
  const base = phone
    ? { fs: 30, h: 54, pad: 14, gap: 10, label: 22, before: 26 }
    : { fs: 38, h: 68, pad: 18, gap: 14, label: 24, before: 30 }
  if (!def || !width) return base
  const room = width - 8
  const widest = Math.max(...def.scenes.map(scene => {
    const layout = buildLayout(scene, width, base)
    return Math.max(layout.openW, layout.closedW, layout.fromW)
  }))
  if (widest <= room) return base
  const k = (room / widest) * 0.98
  return { ...base, fs: Math.round(base.fs * k * 10) / 10, h: Math.round(base.h * k), pad: Math.round(base.pad * k), gap: Math.max(4, Math.round(base.gap * k)) }
}

/** The room between the dashed outlines of two neighbouring outlined pieces (faʻa and lē in
 *  faʻalētonu), so two boxes never read as one double line (Step 9 batch 3). */
export const OUTLINE_GAP = 4

/** Each outlined piece's outline box in the closed word: its letters' advance plus 1 px a side, drawn
 *  in by OUTLINE_GAP / 2 on a side that meets another outlined piece. `which` picks the pieces. */
export function outlineBoxes(pieces, which) {
  const closed = pieces.filter(piece => !piece.removed)
  const lit = piece => which(piece)
  return closed.map((piece, i) => {
    if (!lit(piece)) return null
    const left = i > 0 && lit(closed[i - 1]) ? OUTLINE_GAP / 2 : -1
    const right = i < closed.length - 1 && lit(closed[i + 1]) ? OUTLINE_GAP / 2 : -1
    return { piece, left: piece.closedX + left, width: piece.w - left - right }
  }).filter(Boolean)
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
    // A piece with spaces: its open box fits its letters, and its text starts `lead` in.
    const lead = /^\s/.test(piece.text) ? textWidth(piece.text.match(/^\s+/)[0], s.fs) : 0
    const letters = piece.text.trim() !== piece.text ? textWidth(piece.text.trim(), s.fs) : Math.max(textW, wasW)
    return { ...piece, textW, wasW, w: Math.max(textW, wasW), lead, letters }
  })
  const kept = pieces.filter(piece => !piece.added)
  const closedW = pieces.filter(piece => !piece.removed).reduce((a, p) => a + p.w, 0) + s.pad * 2
  const fromW = kept.reduce((a, p) => a + p.w, 0) + s.pad * 2
  const openW = pieces.reduce((a, p) => a + p.letters + s.pad * 2, 0) + s.gap * (pieces.length - 1)
  const x0 = Math.max(0, (width - Math.max(openW, closedW)) / 2)
  const centre = x0 + Math.max(openW, closedW) / 2
  let ox = centre - openW / 2
  let cx = centre - closedW / 2 + s.pad
  let fx = centre - fromW / 2 + s.pad
  for (const piece of pieces) {
    piece.openX = ox
    piece.openW = piece.letters + s.pad * 2
    // Where its text stands when the word is open: its letters start one pad into its box.
    piece.openTextX = ox + s.pad - piece.lead
    ox += piece.openW + s.gap
    piece.closedX = piece.removed ? null : cx
    if (!piece.removed) cx += piece.w
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
    const remove = piece.removed ? beats.find(b => b.kind === 'remove' && b.piece === index) : null
    const r = remove ? P(remove) : 0
    let x
    if (piece.removed) x = r >= 1 ? piece.openTextX : lerp(piece.fromX, piece.openTextX, openP)
    else if (piece.added) x = lerp(piece.openTextX, piece.closedX, closeP)
    else if (closeP > 0) x = lerp(piece.openTextX, piece.closedX, closeP)
    else x = lerp(piece.fromX, piece.openTextX, openP)
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
    if (r > 0) {
      // The piece leaves its gap: back into the piece it doubled (the add run backwards), or down and out.
      const q = travel(r)
      const source = Number.isInteger(piece.of) ? layout.pieces[piece.of] : null
      if (source) {
        x = lerp(piece.openTextX, source.openTextX, q)
        y = -Math.sin(Math.PI * q) * s.h * 0.7
        opacity = 1 - ramp(r, 0.8, 1)
      } else {
        y = leaveY(r) * s.h * 0.6
        opacity = 1 - ramp(r, 0.4, 0.85)
      }
      if (r >= 1) opacity = 0
    }
    if (piece.added) {
      const q = travel(addP)
      const source = Number.isInteger(piece.of) ? layout.pieces[piece.of] : null
      if (source && addP < 1) {
        // A doubled piece copies itself out of the piece it doubles and lands in its gap.
        x = lerp(source.openTextX, piece.openTextX, q)
        y = -Math.sin(Math.PI * q) * s.h * 0.7
        opacity = ramp(addP, 0, 0.2)
      } else if (addP < 1) {
        y = (1 - land(ramp(addP, 0.2, 1))) * s.h * 0.6
        opacity = ramp(addP, 0.15, 0.5)
      }
    }
    return { ...piece, x, y, opacity, addP, change, boxX: piece.openX }
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
