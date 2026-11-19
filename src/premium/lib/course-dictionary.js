// The dictionary's search and letter browse (Build-Spec part f of
// plans/2026-11-19-samoan-site-search-features.md; the ranking is the Tongan
// site's searchDictionaryDetailed, ported). The entries searched are the
// entries of buildDictionaryIndex() in dictionary-pages.js: the course's
// glossary, in the glossary's own order and letter sections.
//
// Read-only. Nothing here rewrites an entry: the Samoan and the meaning are
// shown as the data has them. Folding exists only to build a search key; it
// never changes what is displayed.

import { compactKey, looksLikeSamoan, markedKey, normaliseSense, plainKey, splitSenses, stripMarks, withinOneLetter, withoutNotes } from './dictionary-text.js'

// Every character the data or a keyboard may use for the glottal stop (U+02BB).
const GLOTTAL_VARIANTS = /['\u2018\u2019\u02bc`\u02bb]/g
// Combining macron (U+0304), after NFD.
const MACRON = /\u0304/g

// Search key only: lowercase, fold every glottal-stop variant to one
// character, strip macrons. The glottal stop stays: it is a letter.
export function foldSearchKey(text) {
  return String(text == null ? '' : text)
    .normalize('NFD')
    .replace(MACRON, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(GLOTTAL_VARIANTS, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

// The hub's letter groups: the glossary's own `letter` values in file order.
export function dictionaryGroups(entries) {
  return [...new Set(entries.map(entry => entry.letter))]
}

export function browseDictionary(entries, letter) {
  return letter ? entries.filter(entry => entry.letter === letter) : entries
}

// ---------------------------------------------------------------------------
// Search (plan 2026-11-18-dictionary-search-and-word-pages).
//
// A result is either a match or a partial:
//   match    the word as typed (with or without its marks), or a meaning that
//            has the English word or phrase as whole words;
//   partial  a Samoan word that begins with or contains the letters typed, or
//            an English word that begins with them. Shown under its own
//            heading, never as a match.
// An English word that merely has the letters inside it ("white" for "hit")
// is not returned at all.
//
// One more kind, for a query of several words that is no entry as it stands:
//   containing  a longer Samoan entry that has every word typed, as whole
//               words in the same order, with other words between them
//               ("malo lelei" for mālō e lelei). Offered first under its own
//               heading, never as a match. Nothing is matched on a word that
//               was not typed, and no spelling is guessed.

const wordsOf = text => String(text || '').toLowerCase().split(/[^a-z0-9']+/).filter(Boolean)
const samoanPlain = text => plainKey(withoutNotes(text)).replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()

// Words a question wraps around the word it is asking for.
const QUESTION_WORDS = new Set(['a', 'an', 'the', 'to', 'in', 'of', 'for', 'and', 'how', 'do', 'does', 'you', 'say', 'what', 'is', 'mean', 'means', 'meaning', 'translation', 'pronunciation', 'english', 'word', 'samoan', 'samoa'])

const plainMeaning = english => String(english == null ? '' : english).replace(/\*+/g, '')

const SEARCH_KEYS = new WeakMap()
function searchKeys(entry) {
  let keys = SEARCH_KEYS.get(entry)
  if (!keys) {
    const plain = samoanPlain(entry.samoan)
    // The entry's own senses, asterisks of the book's italics dropped.
    const senses = splitSenses(plainMeaning(entry.english)).map(item => item.sense.toLowerCase())
    keys = {
      marked: markedKey(withoutNotes(entry.samoan)),
      fold: foldSearchKey(withoutNotes(entry.samoan)),
      plain,
      compact: plain.replace(/ /g, ''),
      samoanWords: plain.split(' '),
      senses,
      senseWords: senses.map(wordsOf),
    }
    SEARCH_KEYS.set(entry, keys)
  }
  return keys
}

function readQuery(query) {
  const raw = String(query == null ? '' : query).trim()
  const plain = samoanPlain(raw)
  // Macrons are dropped before the words are split, so a query typed with its
  // marks has the same words as one typed plain.
  const english = normaliseSense(stripMarks(raw).toLowerCase().replace(/[^a-z0-9' -]+/g, ' ')).toLowerCase()
  return {
    raw,
    marked: markedKey(raw),
    fold: foldSearchKey(raw),
    plain,
    compact: compactKey(plain),
    samoanWords: plain ? plain.split(' ') : [],
    english,
    englishWords: wordsOf(english),
  }
}

// The words of `needle` in order and side by side inside `hay`. With
// `openEnd`, the last word may be the start of a longer one (typing in progress).
function hasRun(hay, needle, openEnd = false) {
  if (!needle.length || needle.length > hay.length) return false
  for (let start = 0; start + needle.length <= hay.length; start += 1) {
    let ok = true
    for (let i = 0; i < needle.length && ok; i += 1) {
      const last = i === needle.length - 1
      ok = openEnd && last ? hay[start + i].startsWith(needle[i]) : hay[start + i] === needle[i]
    }
    if (ok) return true
  }
  return false
}

// "houses" and "house" are one word; so are "boxes" and "box".
function singular(word) {
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`
  if (word.length > 4 && /(?:ss|x|z|ch|sh)es$/.test(word)) return word.slice(0, -2)
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

// How well an entry matches: lower is better, null is no match. 0 to 7 are
// matches, 8 to 10 partials.
function rank(entry, q) {
  const k = searchKeys(entry)
  if (q.marked && k.marked === q.marked) return 0
  if (q.fold && k.fold === q.fold) return 1
  if (q.plain && k.plain === q.plain) return 2
  if (q.compact && k.compact === q.compact) return 3
  if (q.english && k.senses.includes(q.english)) return 4
  if (q.englishWords.length && k.senseWords.some(words => hasRun(words, q.englishWords))) return 5
  if (q.englishWords.length === 1 && q.englishWords[0].length > 3) {
    const stem = singular(q.englishWords[0])
    if (k.senseWords.some(words => words.some(word => word !== q.englishWords[0] && singular(word) === stem))) return 6
  }
  if (q.samoanWords.length && k.samoanWords.length > q.samoanWords.length && hasRun(k.samoanWords, q.samoanWords)) return 7
  if (q.compact && k.compact.startsWith(q.compact)) return 8
  if (q.englishWords.length && q.englishWords[q.englishWords.length - 1].length > 1 && k.senseWords.some(words => hasRun(words, q.englishWords, true))) return 9
  if (q.compact.length > 2 && k.compact.includes(q.compact)) return 10
  return null
}

const FIRST_PARTIAL_RANK = 8

function rankAll(entries, q) {
  const scored = []
  entries.forEach((entry, index) => {
    const r = rank(entry, q)
    if (r !== null) scored.push({ entry, r, index })
  })
  scored.sort((a, b) => a.r - b.r || a.index - b.index)
  return {
    matches: scored.filter(item => item.r < FIRST_PARTIAL_RANK).map(item => item.entry),
    partial: scored.filter(item => item.r >= FIRST_PARTIAL_RANK).map(item => item.entry),
  }
}

// Several English words that match nothing together: first the content words
// as a phrase ("how to say hurry up in Samoan" is "hurry up"), then the
// content words one by one, the entries that have more of them first.
function contentWordResults(entries, q) {
  if (q.englishWords.length < 2) return null
  const content = q.englishWords.filter(word => !QUESTION_WORDS.has(word))
  if (!content.length) return null
  if (content.length < q.englishWords.length) {
    const phrase = rankAll(entries, readQuery(content.join(' ')))
    if (phrase.matches.length) return { words: content, phrase: content.join(' '), matches: phrase.matches }
  }
  if (content.length < 2) return null
  const scored = []
  entries.forEach((entry, index) => {
    const k = searchKeys(entry)
    const found = content.filter(word => k.senseWords.some(words => words.includes(word)) || k.plain === word)
    if (found.length) scored.push({ entry, found, index })
  })
  if (!scored.length) return null
  scored.sort((a, b) => b.found.length - a.found.length || a.index - b.index)
  const words = content.filter(word => scored.some(item => item.found.includes(word)))
  return { words, phrase: '', matches: scored.map(item => item.entry) }
}

// The words of `needle` in order inside `hay`, with other words allowed between.
function hasInOrder(hay, needle) {
  let at = 0
  for (const word of hay) if (word === needle[at]) at += 1
  return at === needle.length
}

// Longer Samoan entries that hold every word typed, in the same order. The
// words as typed are tried first; if no entry holds them all, the words left
// once the question words are dropped ("malo lelei meaning" is "malo lelei").
// A query whose words sit side by side in an entry is already a match and
// never comes here.
function containingEntries(entries, q) {
  const typed = q.samoanWords
  const content = typed.filter(word => !QUESTION_WORDS.has(word))
  for (const words of content.length < typed.length ? [typed, content] : [typed]) {
    if (words.length < 2) continue
    const found = entries
      .map((entry, index) => ({ entry, index, length: searchKeys(entry).samoanWords.length }))
      .filter(item => item.length > words.length && hasInOrder(searchKeys(item.entry).samoanWords, words))
      .sort((a, b) => a.length - b.length || a.index - b.index)
    if (found.length) return { entries: found.map(item => item.entry), words }
  }
  return { entries: [], words: [] }
}

// Near spellings for a Samoan-looking query of five letters or more that
// matched nothing: entries one letter away. Offered, never substituted.
export const SUGGESTION_MIN_LETTERS = 5
function nearSpellings(entries, q) {
  if (q.compact.length < SUGGESTION_MIN_LETTERS || !looksLikeSamoan(q.compact)) return []
  return entries.filter(entry => withinOneLetter(searchKeys(entry).compact, q.compact)).slice(0, 8)
}

// The full answer to a query:
//   matches      entries that match, best first
//   partial      entries that only begin with or contain the letters typed
//   fallback     null, or { words, phrase } when the query matched nothing as a
//                whole and `matches` holds entries for its content words
//                instead: as one phrase (phrase is set) or one by one
//   containing   longer Samoan entries that hold every word of a several-word
//                query that matched nothing as it stands; shown first.
//                containingWords are the typed words they hold.
//   suggestions  near spellings, only when everything above is empty
export function searchDictionaryDetailed(entries, query) {
  const q = readQuery(query)
  const none = { containing: [], containingWords: [] }
  if (!q.raw) return { query: '', matches: entries, partial: [], ...none, fallback: null, suggestions: [] }
  const { matches, partial } = rankAll(entries, q)
  if (matches.length) return { query: q.raw, matches, partial, ...none, fallback: null, suggestions: [] }
  const content = partial.length ? null : contentWordResults(entries, q)
  // The content words matched as a phrase: that is the answer, nothing longer is offered.
  if (content?.phrase) return { query: q.raw, matches: content.matches, partial: [], ...none, fallback: { words: content.words, phrase: content.phrase }, suggestions: [] }
  const { entries: containing, words: containingWords } = containingEntries(entries, q)
  const others = list => containing.length ? list.filter(entry => !containing.includes(entry)) : list
  if (partial.length) return { query: q.raw, matches: [], partial: others(partial), containing, containingWords, fallback: null, suggestions: [] }
  if (content) return { query: q.raw, matches: others(content.matches), partial: [], containing, containingWords, fallback: { words: content.words, phrase: '' }, suggestions: [] }
  if (containing.length) return { query: q.raw, matches: [], partial: [], containing, containingWords, fallback: null, suggestions: [] }
  return { query: q.raw, matches: [], partial: [], ...none, fallback: null, suggestions: nearSpellings(entries, q) }
}

// The flat list: a longer entry that holds the words typed, then matches, then
// partials. A near spelling is never in it.
export function searchDictionary(entries, query) {
  const found = searchDictionaryDetailed(entries, query)
  return found.partial.length || found.containing.length ? [...found.containing, ...found.matches, ...found.partial] : found.matches
}
