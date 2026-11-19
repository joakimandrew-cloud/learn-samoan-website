/**
 * Sentence Tiles: the deck (pure, no React).
 *
 * Every sentence comes from the book's own exercises (src/data/book-exercises.json,
 * read at run time): the items of exercises titled "Translate into Sāmoan"
 * whose answer is one `*...*` span of 3 to 8 words. The English prompt is kept
 * exactly as the book prints it. Nothing is typed here and nothing is composed:
 * the tiles are the book's own answer, split at the spaces.
 *
 * An item is left out when:
 *   - its answer is not one `*...*` span on its own (an English tail after it, say);
 *   - the answer holds a slash, " or ", brackets, or more than one sentence
 *     (a second right answer, or two answers in one);
 *   - it has fewer than 3 words or more than 8;
 *   - its prompt carries a note joined on from the book page ("> ").
 * A sentence whose answer an earlier chapter already has is played once.
 *
 * The game marks against the ORDER THE BOOK PRINTS. Some Sāmoan sentences can
 * be said in more than one order, so an exercise item that ever gains an
 * `accept` list has each accepted order honoured too, as the site's own order
 * practice does (src/premium/components/interactive/order-logic.js): an
 * accepted answer that uses the same words in another order is another right
 * order. An accepted answer that uses different words cannot be built from
 * these tiles and is not used.
 *
 * Tiles are the answer split at spaces. A comma stays on its word, as the book
 * prints it. The full stop, question mark or exclamation mark at the end is
 * not a tile: it is shown fixed after the answer line. The first word is
 * lower-cased on its tile and in the comparison, so the capital does not point
 * at the first tile; `capitalFirst` puts it back in the answer line.
 */
import exercises from '../../data/book-exercises.json' with { type: 'json' }
import { samoanKey } from '../shared/deck.js'

export const MIN_WORDS = 3
export const MAX_WORDS = 8
/** The exercise title that marks an item the game may use. */
export const EXERCISE_TITLE = 'Translate into Sāmoan'
/** A chapter has a game only when it keeps this many sentences. */
export const MIN_SENTENCES_PER_CHAPTER = 3

const END = /[.?!]+$/

/** A tile made comparable: the deck's spelling key with punctuation dropped. */
export function tileKey(text) {
  return samoanKey(text).replace(/[.,;:?!"“”]/g, '').trim()
}

/** The Sāmoan inside a lone `*...*` answer, or null. */
export function answerText(answer) {
  const m = String(answer ?? '').trim().match(/^\*([^*]+)\*$/)
  return m ? m[1].trim() : null
}

/** An answer made comparable with another (case, spacing and end marks aside). */
function sameAnswerKey(text) {
  return samoanKey(String(text ?? '').replace(/\*/g, '')).replace(/[.?!]+\s*$/, '').replace(/\s+/g, ' ').trim()
}

/** The answer split into tiles and its end mark: { words, end }. */
export function splitAnswer(text) {
  const words = String(text).trim().split(/\s+/)
  if (words[0]) words[0] = words[0].toLowerCase()
  const last = words[words.length - 1]
  const m = last.match(END)
  const end = m ? m[0] : ''
  if (end) words[words.length - 1] = last.slice(0, -end.length)
  return { words: words.filter(Boolean), end }
}

/**
 * A word with its capital put back (the sentence's capital, shown in the answer
 * line). The capital goes on the first character that HAS one: the glottal-stop
 * mark is a letter with no capital, so a word that opens with it takes the
 * capital on the letter after.
 */
export function capitalFirst(word) {
  const w = String(word ?? '')
  const i = [...w].findIndex(c => c.toLowerCase() !== c.toUpperCase())
  if (i < 0) return w
  const cs = [...w]
  cs[i] = cs[i].toUpperCase()
  return cs.join('')
}

/** The sentence as the answer line prints it: capital, tiles, end mark. */
export function sentenceText(s, words = s.words) {
  return `${[s.capital ? capitalFirst(words[0]) : words[0], ...words.slice(1)].join(' ')}${s.end}`
}

/** Why an item is left out of the game, or null when it is kept. */
export function whyLeftOut(item) {
  const text = answerText(item.answer)
  if (text == null) return 'not one Sāmoan span'
  if (text.includes('/')) return 'slash'
  if (/\sor\s/i.test(` ${text} `)) return 'or'
  if (/[()[\]]/.test(text)) return 'brackets'
  if (/[.?!]\s+\S/.test(text)) return 'more than one sentence'
  const { words } = splitAnswer(text)
  if (words.length < MIN_WORDS || words.length > MAX_WORDS) return 'length'
  if (/(^|\s)>\s/.test(String(item.prompt ?? ''))) return 'prompt note'
  return null
}

/**
 * The other word orders an item's `accept` list allows: each accepted answer
 * that uses exactly the sentence's own words, in the sentence's own spellings.
 */
function acceptedOrders(item, words) {
  const byKey = new Map()
  for (const w of words) byKey.set(tileKey(w), [...(byKey.get(tileKey(w)) ?? []), w])
  const out = []
  for (const raw of Array.isArray(item.accept) ? item.accept : []) {
    const { words: theirs } = splitAnswer(String(raw).replace(/\*/g, ''))
    if (theirs.length !== words.length) continue
    const left = new Map([...byKey].map(([k, list]) => [k, [...list]]))
    const mapped = []
    for (const w of theirs) {
      const list = left.get(tileKey(w))
      if (!list?.length) break
      mapped.push(list.shift())
    }
    if (mapped.length === words.length && !out.some(o => o.join(' ') === mapped.join(' '))) out.push(mapped)
  }
  return out
}

/** One kept item as a sentence card. */
function toSentence(item, chapter) {
  const answer = answerText(item.answer)
  const { words, end } = splitAnswer(answer)
  // orders[0] is the book's; the rest are the orders the item's `accept` list allows.
  const orders = [words, ...acceptedOrders(item, words).filter(o => o.join(' ') !== words.join(' '))]
  // `capital`: the book prints the first word with a capital (a few noun-phrase answers do not).
  const first = answer.trim().split(/\s+/)[0]
  return { id: item.id, chapter, prompt: item.prompt, answer, words, orders, end, capital: first !== first.toLowerCase() }
}

/** Every item of an exercise titled "Translate into Sāmoan", with its chapter number. */
export function allItems(data = exercises) {
  const out = []
  for (const [ch, list] of Object.entries(data)) {
    for (const ex of list ?? []) {
      if (String(ex.title ?? '').normalize('NFC') !== EXERCISE_TITLE) continue
      for (const item of ex.items ?? []) out.push({ item, chapter: Number(ch) })
    }
  }
  return out.sort((a, b) => a.chapter - b.chapter)
}

/** The sentences the game plays, chapter by chapter in the book's order, duplicates played once. */
export function buildSentences(data = exercises) {
  const seen = new Set()
  return allItems(data)
    .filter(({ item }) => !whyLeftOut(item))
    .filter(({ item }) => {
      const k = sameAnswerKey(item.answer)
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    .map(({ item, chapter }) => toSentence(item, chapter))
}

/** The chapters that have a game, each with its own sentences: [{ chapter, id, label, cards, count }]. */
export function buildChapters(sentences) {
  const counts = new Map()
  for (const s of sentences) counts.set(s.chapter, (counts.get(s.chapter) ?? 0) + 1)
  return [...counts.entries()]
    .filter(([, n]) => n >= MIN_SENTENCES_PER_CHAPTER)
    .sort((a, b) => a[0] - b[0])
    .map(([n]) => {
      const cards = sentences.filter(s => s.chapter === n)
      return { chapter: n, id: `chapter:${n}`, label: `Chapter ${n}`, cards, count: cards.length }
    })
}

export const SENTENCES = buildSentences()

/** Kept sentences by chapter, every chapter with at least one: [[chapter, count], ...]. */
export const CHAPTER_COUNTS = (() => {
  const m = new Map()
  for (const s of SENTENCES) m.set(s.chapter, (m.get(s.chapter) ?? 0) + 1)
  return [...m.entries()].sort((a, b) => a[0] - b[0])
})()

/**
 * The chapters, in the book's order, each with its own sentences. Every game
 * is one chapter; a chapter that keeps fewer than three sentences is not
 * offered.
 */
export const CHAPTERS = buildChapters(SENTENCES)

/** The first chapter with a game: where a new player starts. */
export const FIRST_CHAPTER = CHAPTERS.length ? CHAPTERS[0].chapter : null

const byChapter = new Map(CHAPTERS.map(c => [c.chapter, c]))

/** The chapter entry for a chapter number, or the first chapter for a number the game does not offer. */
export function chapterEntry(n) {
  return byChapter.get(Number(n)) ?? CHAPTERS[0]
}

/** The next chapter after `n` that has a game, or null after the last. */
export function nextChapter(n) {
  const at = CHAPTERS.find(c => c.chapter > Number(n))
  return at ? at.chapter : null
}
