/**
 * Daily words: spaced recall over the course's own Words to Learn lists.
 * A Leitner deck (an English cue, the Samoan among near neighbours, a box per
 * word kept in localStorage). Pure functions: the vocabulary is passed in, so
 * scripts/check-interactives.mjs can import this file under Node and check the
 * very deck the page uses. Nothing here writes Samoan: every word and gloss is
 * a row of src/data/book-vocabulary.json, shown exactly as stored.
 */

export const STORE_KEY = 'ls-daily-words-v1'
export const SESSION_SIZE = 12
export const MAX_BOX = 5
export const MAX_ENGLISH = 32
export const NEAR_CHAPTERS = 3

export const DECK_LISTS = ['vocabulary', 'carry']

const STOP = new Set(['to', 'be', 'a', 'an', 'the', 'of', 'in', 'on', 'at', 'for', 'and', 'or', 'with', 'is', 'are', 'it', 'one', 'who', 'that', 'this', 'you', 'your', 'he', 'she', 'his', 'her', 'i', 'my', 'we', 'they'])

/** The content words of an English gloss, lower case, for the distractor rule. */
export function contentWords(english) {
  return String(english ?? '').toLowerCase().split(/[^a-z]+/).filter(w => w && !STOP.has(w))
}

/**
 * The deck: vocabulary and carry rows with a short, one-line gloss. A row
 * whose gloss holds "...", an ellipsis or a slash is dropped (open-ended), and
 * so is an exact duplicate of Samoan plus English.
 */
export function buildDeck(vocab) {
  const seen = new Set()
  const deck = []
  for (const row of vocab) {
    if (!DECK_LISTS.includes(row.list)) continue
    if (!row.samoan || !row.english) continue
    if (/\.\.\.|…|\//.test(row.english) || row.english.length > MAX_ENGLISH) continue
    const key = `${row.samoan}\u0000${row.english}`
    if (seen.has(key)) continue
    seen.add(key)
    deck.push({ id: row.id, samoan: row.samoan, english: row.english, chapter: row.chapter ?? 0 })
  }
  return deck
}

function shuffle(items, random) {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Three distractors for one cue, never the same Samoan form or a shared content word in the English. */
export function distractorsFor(entry, deck, random = Math.random) {
  const cue = new Set(contentWords(entry.english))
  const pool = deck.filter(d => d.id !== entry.id && d.samoan !== entry.samoan
    && !contentWords(d.english).some(w => cue.has(w)))
  const pick = candidates => {
    const out = []
    const forms = new Set([entry.samoan])
    for (const d of shuffle(candidates, random)) {
      if (forms.has(d.samoan)) continue
      forms.add(d.samoan)
      out.push(d)
      if (out.length === 3) break
    }
    return out
  }
  const near = pick(pool.filter(d => Math.abs(d.chapter - entry.chapter) <= NEAR_CHAPTERS))
  return near.length === 3 ? near : pick(pool)
}

/**
 * One session: the SESSION_SIZE least-known words (lowest box first, unseen
 * counts as 0, random tiebreak), each with its four shuffled options.
 */
export function buildSession(deck, boxes = {}, random = Math.random) {
  const ranked = shuffle(deck, random).sort((a, b) => (boxes[a.id] ?? 0) - (boxes[b.id] ?? 0))
  return ranked.slice(0, SESSION_SIZE).map(entry => ({
    entry,
    options: shuffle([entry, ...distractorsFor(entry, deck, random)], random).map(d => ({ id: d.id, samoan: d.samoan })),
  }))
}

/** The box a word moves to: up one when right (to MAX_BOX), back to 1 when wrong. */
export function nextBox(box, right) {
  return right ? Math.min(MAX_BOX, (box ?? 0) + 1) : 1
}

export function loadBoxes(storage) {
  try {
    const raw = (storage ?? globalThis.localStorage).getItem(STORE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch { return {} }
}

export function saveBoxes(boxes, storage) {
  try { (storage ?? globalThis.localStorage).setItem(STORE_KEY, JSON.stringify(boxes)) } catch { /* private mode: boxes last for the visit */ }
}
