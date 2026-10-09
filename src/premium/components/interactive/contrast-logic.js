/**
 * Pure logic for the Contrast figure (Contrast.jsx): what to highlight when
 * one printed form is set against another, stable keys so the words both
 * forms share can glide to their new places, and the pitch contours drawn for
 * a state's tune. No Samoan lives here; every string comes from chapter data.
 *
 * The highlight works at two sizes. Words come from changedWords() in
 * engine.js: a word of the new form that is not in the old one at the same
 * place is new. Inside a new word that was built from an old one (faʻa- in
 * front, a doubled piece, an ending), only the letters it adds are marked.
 */
import { changedWords } from './engine.js'

// The punctuation changedWords() ignores when it compares words.
const MARK_CHARS = '.,;:!?"“”'
const MARKS_RE = /[.,;:!?"“”]/g
const fold = w => String(w).replace(MARKS_RE, '').toLowerCase()

// A word's leading punctuation, its letters, and its trailing punctuation.
export function splitMarks(word) {
  const chars = Array.from(String(word ?? ''))
  let start = 0
  let end = chars.length
  while (start < end && MARK_CHARS.includes(chars[start])) start += 1
  while (end > start && MARK_CHARS.includes(chars[end - 1])) end -= 1
  return { lead: chars.slice(0, start).join(''), body: chars.slice(start, end).join(''), tail: chars.slice(end).join('') }
}

// One longest common subsequence of two letter arrays: which letters of `b`
// it uses. Aligned from the start, the letters `b` adds fall late; aligned
// `fromEnd`, they fall early (a prefix, or a doubled piece "repeated in front
// of itself").
function lcsHits(a, b, fromEnd) {
  if (fromEnd) return lcsHits([...a].reverse(), [...b].reverse(), false).reverse()
  const n = a.length
  const m = b.length
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  }
  const hits = new Array(m).fill(false)
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) { hits[j] = true; i += 1; j += 1 } else if (dp[i + 1][j] >= dp[i][j + 1]) i += 1
    else j += 1
  }
  return hits
}

const runsOf = hits => hits.reduce((n, hit, k) => n + (!hit && (k === 0 || hits[k - 1]) ? 1 : 0), 0)
const lettersOf = s => Array.from(String(s ?? '').normalize('NFC'))

/**
 * The letters of `b` that are not in `a`, as runs: [{ text, changed }].
 * Of the two alignments (extra letters early or late), the one that marks
 * fewer separate pieces wins; on a tie, early (prefixes are the commoner
 * case in the course). Letters compare without case; a macron counts.
 */
export function letterDiff(a, b) {
  const A = lettersOf(a)
  const B = lettersOf(b)
  const la = A.map(c => c.toLowerCase())
  const lb = B.map(c => c.toLowerCase())
  const addedEarly = lcsHits(la, lb, true)
  const addedLate = lcsHits(la, lb, false)
  const hits = runsOf(addedLate) < runsOf(addedEarly) ? addedLate : addedEarly
  const out = []
  B.forEach((c, k) => {
    const changed = !hits[k]
    const last = out[out.length - 1]
    if (last && last.changed === changed) last.text += c
    else out.push({ text: c, changed })
  })
  return out
}

// How many letters two words share in order, if they are close enough to
// call one built from the other: at least two, and at least 60% of the
// shorter word. Otherwise 0.
export function kinship(a, b) {
  const la = lettersOf(a).map(c => c.toLowerCase())
  const lb = lettersOf(b).map(c => c.toLowerCase())
  if (!la.length || !lb.length) return 0
  const shared = lcsHits(la, lb, false).filter(Boolean).length
  return shared >= 2 && shared >= 0.6 * Math.min(la.length, lb.length) ? shared : 0
}

// Keys that survive a change of state: the n-th time a word (folded) occurs.
function keyer(prefix = '') {
  const seen = new Map()
  return word => {
    const f = fold(word)
    const n = seen.get(f) ?? 0
    seen.set(f, n + 1)
    return `${prefix}${f}#${n}`
  }
}

const words = s => String(s ?? '').split(/\s+/).filter(Boolean)

/**
 * The words of `cur` for the stage, each { key, word, changed, parts }, where
 * parts are [{ text, changed }] runs that spell the word. With no reference
 * (`ref` null), nothing is marked.
 *  - A word changedWords() calls new is marked whole, or, when it is close
 *    kin to a word the reference had and lost, only in the letters it adds.
 *  - The sentence-final mark is marked when both forms end in one and they
 *    differ (a statement's stop against a question mark), even when no word
 *    changed.
 */
export function stageWords(ref, cur) {
  const key = keyer()
  const list = words(cur)
  if (ref == null || !words(ref).length) {
    return list.map(word => ({ key: key(word), word, changed: false, parts: [{ text: word, changed: false }] }))
  }
  const flags = changedWords(ref, cur)
  const lost = changedWords(cur, ref).filter(x => x.changed).map(x => splitMarks(x.word).body)
  const taken = new Set()
  const out = flags.map(({ word, changed }) => {
    if (!changed) return { word, changed, parts: [{ text: word, changed: false }] }
    const { lead, body, tail } = splitMarks(word)
    let best = -1
    let bestShared = 0
    lost.forEach((old, k) => {
      if (taken.has(k)) return
      const shared = kinship(old, body)
      if (shared > bestShared) { best = k; bestShared = shared }
    })
    let inner = [{ text: body, changed: true }]
    if (best >= 0) {
      taken.add(best)
      const diff = letterDiff(lost[best], body)
      if (diff.some(p => p.changed)) inner = diff
    }
    const parts = [...(lead ? [{ text: lead, changed: false }] : []), ...inner, ...(tail ? [{ text: tail, changed: false }] : [])]
    return { word, changed, parts }
  })
  const refWords = words(ref)
  const refEnd = splitMarks(refWords[refWords.length - 1]).tail
  const last = out[out.length - 1]
  if (last) {
    const { tail } = splitMarks(last.word)
    if (refEnd && tail && refEnd !== tail) {
      const keep = last.parts.slice()
      const end = keep[keep.length - 1]
      if (end && !end.changed && end.text.endsWith(tail)) {
        keep[keep.length - 1] = { text: end.text.slice(0, end.text.length - tail.length), changed: false }
        if (!keep[keep.length - 1].text) keep.pop()
        keep.push({ text: tail, changed: true })
        last.parts = keep
      }
    }
  }
  return out.map(w => ({ ...w, key: key(w.word) }))
}

// An English-only line split for the stage, keyed apart from Samoan words.
export function englishWords(en) {
  const key = keyer('en:')
  return words(en).map(word => ({ key: key(word), word }))
}

/**
 * Pitch contours over a 640 x 130 stage, drawn left to right across the
 * words. Every path has the same commands, so one can morph into another.
 *   fall: starts mid-high, drops, and stays low over the end
 *   rise: holds, then lifts at the end
 *   level: flat
 */
export const TUNE_VIEW = '0 0 640 130'
export const TUNE_BASE = 'M20 114 H620'
export const TUNES = {
  fall: { d: 'M40 40 C 150 40, 250 44, 330 76 C 380 96, 470 100, 610 100', end: 100, label: 'Falling tune', arrow: '↘' },
  rise: { d: 'M40 74 C 150 74, 250 74, 330 72 C 420 70, 540 44, 610 14', end: 14, label: 'Rising tune', arrow: '↗' },
  level: { d: 'M40 62 C 150 62, 250 62, 330 62 C 420 62, 540 62, 610 62', end: 62, label: 'Level tune', arrow: '→' },
}
export const isTune = t => Object.prototype.hasOwnProperty.call(TUNES, t)
