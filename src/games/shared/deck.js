/**
 * Word Balloons: deck building (pure, no React).
 *
 * The deck is read from src/data/book-vocabulary.json at run time and nothing
 * is typed here: one card per distinct `samoan` string among the rows whose
 * `list` is `vocabulary` or `carry` (the grammar words have no clean
 * one-word English match, so they would make unfair rounds), where
 *   - the headword has no space, comma, = or - (a word, not a phrase or a bound form);
 *   - the meaning, cut as shownMeaning() cuts it, is 28 characters or fewer.
 * A card carries every meaning its rows print: `fulls` holds each row's
 * printed English exactly as the book has it, `meaning` is the cut of the
 * first row (what a choice shows), and `words` and `items` read all of them,
 * so a wrong choice is never one of the card's other meanings.
 *
 * The code only re-shows what the book prints. It never composes a Sāmoan
 * form and never writes a gloss.
 */
import { okinafy } from '../../lib/okinafy.js'

/** Longest meaning shown whole; a longer list shows its first item. */
export const MAX_SHOWN_CHARS = 28

/** The lists a card may come from. */
export const DECK_LISTS = ['vocabulary', 'carry']

/** A headword with a space, comma, = or - is not a one-word card. */
export const NOT_A_WORD = /[\s,=-]/

const SEPARATOR = /[,;]/

/** Splits at a separator that sits outside any brackets. */
function splitTop(text, sep) {
  const out = []
  let depth = 0
  let cur = ''
  for (const ch of String(text ?? '')) {
    if (ch === '(') depth++
    else if (ch === ')') depth = Math.max(0, depth - 1)
    if (ch === sep && depth === 0) { out.push(cur); cur = '' } else cur += ch
  }
  out.push(cur)
  return out.map(x => x.trim()).filter(Boolean)
}

/** The English without any note: each semicolon piece cut before its first "(", trimmed. */
function beforeParen(english) {
  return splitTop(english, ';').map(p => p.split('(')[0].trim()).filter(Boolean).join('; ')
}

/**
 * The meaning a choice shows: each piece cut before "(" and trimmed. A list
 * (commas, or the book's semicolons) is shown whole unless it runs past 28
 * characters, then only its first item. This is the cut function the test
 * holds every shown choice to.
 */
export function shownMeaning(english) {
  const base = beforeParen(english).replace(/\s+/g, ' ')
  if (base.length <= MAX_SHOWN_CHARS || !SEPARATOR.test(base)) return base
  return base.split(SEPARATOR)[0].trim()
}

/** One meaning item, normalised for comparison ("To Preach" = "preach"). */
export function normaliseItem(item) {
  return item
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(to|a|an|the) /, '')
    .replace(/[.!?]+$/, '')
    .trim()
}

/**
 * Every comma- or semicolon-separated item of the meaning (the field before
 * any "(", not the notes), normalised. Two cards that share any item are
 * never put in one round.
 */
export function meaningItems(english) {
  return beforeParen(english)
    .split(SEPARATOR)
    .map(normaliseItem)
    .filter(Boolean)
}

/**
 * Words too small to tell two meanings apart: to/be/articles, and the little
 * particles of phrasal verbs ("sit down", "live together"). Two meanings that
 * share only these never count as the same meaning.
 */
const SMALL_WORDS = new Set([
  'to', 'be', 'a', 'an', 'the', 'of', 'with', 'for', 'down', 'up', 'out',
  'together', 'in', 'on', 'at', 'from', 'off', 'away', 'and', 'or', 'by', 'as',
  'is', 'it', 'one', 'oneself', 'someone', 'something',
])

/** Folds simple endings, so sit / sits / sitting and live / lives / living agree. */
export function stemWord(word) {
  let w = word
  if (w.length <= 3) return w
  let cut = false
  if (w.endsWith('ing') && w.length > 5) { w = w.slice(0, -3); cut = true }
  else if (w.endsWith('ies') && w.length > 4) { w = `${w.slice(0, -3)}y`; cut = true }
  else if (w.endsWith('es') && w.length > 4) { w = w.slice(0, -2); cut = true }
  else if (w.endsWith('ed') && w.length > 4) { w = w.slice(0, -2); cut = true }
  else if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) { w = w.slice(0, -1); cut = true }
  if (w.length > 2 && w.endsWith('e')) w = w.slice(0, -1)
  if (cut && w.length > 2 && w[w.length - 1] === w[w.length - 2] && !/[aeiou]/.test(w[w.length - 1])) w = w.slice(0, -1)
  return w
}

/**
 * The words that carry a meaning, read over the WHOLE printed English with its
 * bracketed notes kept: lower-case, the little words above dropped, endings
 * folded. A meaning made only of little words ("one") keeps them.
 */
export function contentWords(english) {
  const out = new Set()
  const tokens = String(english ?? '')
    .toLowerCase()
    .replace(/['’ʼ]s\b/g, '')
    .replace(/['’ʼ]/g, '')
    .split(/[^\p{L}]+/u)
    .filter(Boolean)
  const kept = tokens.filter(t => !SMALL_WORDS.has(t))
  for (const t of kept.length ? kept : tokens) out.add(stemWord(t))
  return [...out]
}

/** A spelling made comparable: NFC, lower case, every ʻ-like mark one ʻ. */
export function samoanKey(text) {
  return String(text ?? '').normalize('NFC').toLowerCase().replace(/[ʻ‘’ʼ']/g, 'ʻ').trim()
}

/** The same letters with the macrons and the ʻ taken off, so tama and tamā fold together. */
export function foldLetters(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[ʻ‘’ʼ']/g, '')
    .toLowerCase()
    .normalize('NFC')
}

/** A printed meaning with its whitespace tidied and nothing else changed. */
function tidy(english) {
  return String(english ?? '').replace(/\s+/g, ' ').trim()
}

/** The rows a card may be made from. */
export function isDeckRow(row) {
  return DECK_LISTS.includes(row.list) && !!row.samoan && !NOT_A_WORD.test(row.samoan)
}

/** One card from the rows that print one `samoan` string, in the book's order. */
export function toCard(rows) {
  const first = rows[0]
  const fulls = rows.map(r => tidy(r.english))
  return {
    id: first.id,
    rowIds: rows.map(r => r.id),
    samoan: first.samoan,
    samoanShown: okinafy(first.samoan),
    english: rows.map(r => r.english),
    fulls,
    full: fulls.join('; '),
    meaning: shownMeaning(first.english),
    cuts: rows.map(r => shownMeaning(r.english)),
    items: [...new Set(rows.flatMap(r => meaningItems(r.english)))],
    words: [...new Set(rows.flatMap(r => contentWords(r.english)))],
    key: samoanKey(first.samoan),
    fold: foldLetters(first.samoan),
    chapters: [...new Set(rows.map(r => r.chapter))],
    list: first.list,
  }
}

/**
 * The deck: one card per distinct `samoan` string, in the book's order, kept
 * only when the cut of every row's meaning is 28 characters or fewer.
 */
export function buildDeck(vocabulary) {
  const byWord = new Map()
  for (const row of vocabulary) {
    if (!isDeckRow(row)) continue
    byWord.set(row.samoan, [...(byWord.get(row.samoan) ?? []), row])
  }
  return [...byWord.values()]
    .map(toCard)
    .filter(c => c.cuts.every(cut => cut && cut.length <= MAX_SHOWN_CHARS))
}
