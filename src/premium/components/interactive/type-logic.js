/**
 * Grading for the Type practice, kept apart from the component so it can be
 * tested on its own. What the learner typed is compared with the printed
 * Samoan (and any printed alternatives) through foldTyped from engine.js:
 *
 *   right   equal after folding (any apostrophe for the glottal stop, case,
 *           spacing, a final stop)
 *   almost  equal only once macrons and glottal stops are dropped as well:
 *           counted right, with the printed spelling shown and the letters
 *           that differ marked (spellingDiff)
 *   wrong   neither; the chapter's own form is shown
 *   empty   nothing typed yet, so nothing is graded
 */
import { foldTyped } from './engine.js'

const GLOTTAL = 'ʻ'
const APOSTROPHES = /[‘’'`ʼ]/g
const FINAL_STOP = /[.?!,;:]+$/

export function gradeTyped(typed, item) {
  const answers = [item?.sm, ...(Array.isArray(item?.accept) ? item.accept : [])]
    .filter(a => typeof a === 'string' && a.trim())
  const strict = foldTyped(typed)
  if (!strict) return { verdict: 'empty', match: item?.sm }
  const exact = answers.find(a => foldTyped(a) === strict)
  if (exact) return { verdict: 'right', match: exact }
  const loose = foldTyped(typed, { loose: true })
  const near = loose ? answers.find(a => foldTyped(a, { loose: true }) === loose) : null
  if (near) return { verdict: 'almost', match: near }
  return { verdict: 'wrong', match: item?.sm }
}

// The same tidying foldTyped does, without touching case, so the printed
// spelling can be shown as printed.
const tidy = s => String(s ?? '').normalize('NFC').replace(APOSTROPHES, GLOTTAL).replace(/\s+/g, ' ').trim()
const bare = ch => ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Each letter (or space) with the number of glottal stops written before it.
// A glottal stop at the very end rides on an empty letter.
function units(s) {
  const out = []
  let g = 0
  for (const ch of s) {
    if (ch === GLOTTAL) { g += 1; continue }
    out.push({ g, ch })
    g = 0
  }
  if (g) out.push({ g, ch: '' })
  return out
}

/**
 * The printed spelling cut into runs, each marked `differs` where what the
 * learner typed does not have that letter: a vowel typed without its macron
 * (or with one it should not have), a glottal stop left out or put in the
 * wrong place. A glottal stop typed where none is printed marks the letter
 * it was typed before. Case and a final stop never count.
 *   spellingDiff('tāʻele', 'taele') -> [{t}, {āʻ, differs}, {ele}]
 */
export function spellingDiff(printed, typed) {
  const p = tidy(printed)
  const tail = p.match(FINAL_STOP)?.[0] ?? ''
  const pu = units(p.slice(0, p.length - tail.length))
  const tu = units(tidy(typed).replace(FINAL_STOP, ''))

  // Line the letters up (a longest common subsequence on bare letters),
  // preferring, among equally long line-ups, exact letters and glottal stops
  // in the same places.
  const LETTER = 1000
  const score = (a, b) => (bare(a.ch) !== bare(b.ch) ? -1 : LETTER + (a.ch.toLowerCase() === b.ch.toLowerCase() ? 2 : 0) + (a.g === b.g ? 1 : 0))
  const n = pu.length
  const m = tu.length
  const best = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      const s = score(pu[i], tu[j])
      best[i][j] = Math.max(best[i + 1][j], best[i][j + 1], s >= 0 ? s + best[i + 1][j + 1] : -Infinity)
    }
  }
  const partner = new Array(n).fill(null)
  for (let i = 0, j = 0; i < n && j < m;) {
    const s = score(pu[i], tu[j])
    if (s >= 0 && best[i][j] === s + best[i + 1][j + 1]) { partner[i] = tu[j]; i += 1; j += 1 } else if (best[i][j] === best[i + 1][j]) i += 1
    else j += 1
  }

  const runs = []
  const push = (text, differs) => {
    if (!text) return
    const last = runs[runs.length - 1]
    if (last && last.differs === differs) last.text += text
    else runs.push({ text, differs })
  }
  pu.forEach((u, k) => {
    const t = partner[k]
    const glottals = GLOTTAL.repeat(u.g)
    if (!t) {
      push(glottals, true)
      push(u.ch, u.ch !== ' ')
      return
    }
    const glottalOff = u.g !== t.g
    push(glottals, glottalOff)
    push(u.ch, u.ch.toLowerCase() !== t.ch.toLowerCase() || (glottalOff && u.g === 0))
  })
  push(tail, false)
  return runs
}
