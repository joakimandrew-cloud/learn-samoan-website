// Example sentences for the dictionary's word pages, copied from the chapters
// as printed (Build-Spec part f, "Examples"; method ported from the Tongan
// site's dictionary-examples.js).
//
// Pure: takes the chapter markdown as text and returns data. The script
// scripts/build-dictionary-data.mjs runs it over book/Chapter-NN.md and writes
// src/premium/data/dictionary-examples.json; a test re-runs it and checks that
// file is current and every pair against the book.
//
// Nothing is written here. A pair is one printed line of a chapter's examples
// block: the Samoan in italics, then the English the chapter prints with it.
// The rule throughout is that no sentence beats a wrong one:
//   - only lines inside an examples block of the chapter body are read, and
//     only the two printed shapes whose pairing is certain;
//   - an entry gets a sentence only from the chapter that teaches it or a later
//     one, and only when its headword stands in the sentence as whole words
//     with the same marks (case aside);
//   - a word that is part of a longer dictionary entry in that sentence
//     belongs to the longer entry;
//   - if another entry on the same word page is also spelled in the sentence,
//     nobody gets it;
//   - a phrase line that holds nothing but the word is a gloss, and is left out;
//   - an entry whose meaning holds a colon takes no sentence: it is a grammar
//     word whose English is a description, so the sense test cannot guard it;
//   - when the entry's meaning has a plain English sense, a form of that sense
//     must stand in the English printed with the sentence. A word can be
//     spelled the same and mean something else in a given line; this keeps
//     those out.

import { senseDropReason, splitSenses, withoutNotes, wordSlug } from './dictionary-text.js'

export const MAX_EXAMPLES = 3

const GLOTTAL_VARIANTS = /['‘’ʼ`ʻ]/g
const FENCE_OPEN = /^:::\s*\{\.examples\}\s*$/
const FENCE_CLOSE = /^:::\s*$/
const END_OF_BODY = /^##\s+(?:Words to Learn|Exercises|Answers)\s*$/
// *Sentence.* English.   The italic span holds the whole Samoan sentence.
const SENTENCE_LINE = /^\*([^*]+[.?!])\*\s+(\S[^*]*)$/
// *phrase*. English      A phrase with its meaning, as the chapters print it.
const PHRASE_LINE = /^\*([^*]+[^*.?!\s])\*\.\s+(\S[^*]*)$/
// English that is a label, a tone mark or a formula, not a translation.
const NOT_A_TRANSLATION = /[↗↘→=+|\\_]|^\(/
const SAMOAN_ONLY = /^[\p{L}\p{M}'‘’ʼ`ʻ ,.?!;:"“”-]+$/u
// A literal reading in brackets at the end of a printed English line.
const LITERAL_READING = /\s*\(Lit\.[^)]*\)\s*$/

// The printed example pairs of one chapter, in order.
export function chapterExampleLines(markdown) {
  const out = []
  let inFence = false
  const lines = String(markdown || '').split('\n')
  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index].trim()
    if (END_OF_BODY.test(raw)) break
    if (!inFence) {
      if (FENCE_OPEN.test(raw)) inFence = true
      continue
    }
    if (FENCE_CLOSE.test(raw)) { inFence = false; continue }
    const sentence = SENTENCE_LINE.exec(raw)
    const phrase = sentence ? null : PHRASE_LINE.exec(raw)
    const found = sentence || phrase
    if (!found) continue
    const samoan = found[1].trim()
    const english = found[2].replace(LITERAL_READING, '').trim()
    if (!english || !SAMOAN_ONLY.test(samoan) || NOT_A_TRANSLATION.test(english)) continue
    out.push({ line: index + 1, kind: sentence ? 'sentence' : 'phrase', samoan, english, printed: raw })
  }
  return out
}

const normal = text => text.normalize('NFC').replace(GLOTTAL_VARIANTS, "'").toLowerCase()

// The words of a printed Samoan line, each with its place in the text. Case is
// folded so a sentence-opening capital and a headword in capitals both match.
export function tokenise(text) {
  const tokens = []
  const source = String(text || '')
  const pattern = /\S+/g
  let found
  while ((found = pattern.exec(source))) {
    const chunk = found[0]
    const lead = /^["“(]+/.exec(chunk)?.[0].length || 0
    const trail = /[.,?!;:"”)]+$/.exec(chunk.slice(lead))?.[0].length || 0
    const word = chunk.slice(lead, chunk.length - trail)
    if (word) tokens.push({ text: normal(word), start: found.index + lead, end: found.index + lead + word.length })
  }
  return tokens
}

// An entry's headword as the whole words to look for, or null for one that
// cannot stand as whole words in a sentence (a bound form such as =a, a frame
// with a gap or a mark such as ...).
export function entryWords(samoan) {
  const text = normal(withoutNotes(samoan))
  if (!text || /^[=-]|[=-]$|\.\.\.|\//.test(text) || !/^[\p{L}\p{M}' -]+$/u.test(text)) return null
  if (text.split(' ').some(word => /^[=-]|[=-]$/.test(word))) return null
  return text.split(' ')
}

function occurrences(tokens, words) {
  const starts = []
  for (let start = 0; start + words.length <= tokens.length; start += 1) {
    let ok = true
    for (let i = 0; i < words.length && ok; i += 1) ok = tokens[start + i].text === words[i]
    if (ok) starts.push(start)
  }
  return starts
}

// English forms that do not begin with their base word.
const IRREGULAR_FORMS = {
  be: ['am', 'is', 'are', 'was', 'were', 'been', 'being'], go: ['went', 'gone', 'goes'], eat: ['ate'], see: ['saw'], come: ['came'],
  give: ['gave'], take: ['took'], know: ['knew'], drink: ['drank', 'drunk'], run: ['ran'], sit: ['sat'], stand: ['stood'],
  speak: ['spoke'], write: ['wrote', 'written'], say: ['said'], tell: ['told'], make: ['made'], buy: ['bought'], bring: ['brought'],
  think: ['thought'], find: ['found'], get: ['got'], do: ['did', 'does', 'done'], have: ['had', 'has'], hear: ['heard'], meet: ['met'],
  fall: ['fell'], leave: ['left'], begin: ['began', 'begun'], break: ['broke'], build: ['built'], catch: ['caught'], teach: ['taught'],
  wear: ['wore', 'worn'], swim: ['swam'], fly: ['flew'], forget: ['forgot'], feel: ['felt'], keep: ['kept'], pay: ['paid'],
  sell: ['sold'], send: ['sent'], win: ['won'], lose: ['lost'], hold: ['held'], steal: ['stole'], wake: ['woke'], sing: ['sang', 'sung'],
  sleep: ['slept'], child: ['children'], man: ['men'], woman: ['women'], person: ['people'], tooth: ['teeth'], foot: ['feet'],
  good: ['better', 'best', 'well'], bad: ['worse', 'worst'], many: ['more', 'most'], lie: ['lying', 'lay'], die: ['dying'],
}
const LITTLE_WORDS = new Set(['a', 'an', 'the', 'to', 'of', 'be', 'is', 'in', 'at', 'on', 'for', 'it', 'and', 'or', 'with', 'by', 'as'])

function hasFormOf(words, base) {
  if (words.includes(base) || (IRREGULAR_FORMS[base] || []).some(form => words.includes(form))) return true
  if (base.endsWith('y') && ['ied', 'ies', 'ier', 'iest', 'ily'].some(end => words.includes(base.slice(0, -1) + end))) return true
  const stem = base.replace(/e$/, '')
  return stem.length >= 3 && words.some(word => word.startsWith(stem) && word.length - stem.length <= 4)
}

// The entry's plain English senses, lowercased; empty when its meaning only
// describes what the word does.
export function plainSenses(samoan, english) {
  return splitSenses(english).map(item => item.sense).filter(sense => !senseDropReason(samoan, sense)).map(sense => sense.toLowerCase())
}

// Does a form of one of the senses stand in the printed English?
export function meaningShowsIn(senses, printedEnglish) {
  const words = String(printedEnglish || '').toLowerCase().split(/[^a-z']+/).filter(Boolean)
  return senses.some(sense => {
    const content = sense.split(/[ -]/).filter(word => !LITTLE_WORDS.has(word))
    return content.length ? content.every(word => hasFormOf(words, word)) : words.includes(sense)
  })
}

// entries:  [{ id, samoan, english, chapter }] for every entry shown on a word
//           page; chapter is the teaching chapter's number (the first one an
//           entry names).
// chapters: { [number]: markdown of book/Chapter-NN.md }
// Returns   { [entryId]: [{ samoan, english, line, kind, chapter, at: [start, end] }] }
export function selectExamples({ entries, chapters, max = MAX_EXAMPLES }) {
  const known = entries
    .map(entry => ({
      id: entry.id,
      chapter: entry.chapter,
      slug: wordSlug(entry.samoan),
      words: entryWords(entry.samoan),
      // A colon in the meaning marks a grammar word: it blocks, and takes nothing.
      takes: !String(entry.english).includes(':'),
      senses: plainSenses(entry.samoan, entry.english),
    }))
    .filter(entry => entry.words)
  const candidates = new Map()

  for (const [number, markdown] of Object.entries(chapters)) {
    const chapter = Number(number)
    for (const pair of chapterExampleLines(markdown)) {
      const tokens = tokenise(pair.samoan)
      const hits = []
      for (const entry of known) for (const start of occurrences(tokens, entry.words)) hits.push({ entry, start, length: entry.words.length })
      // A shorter entry inside a longer one belongs to the longer one.
      const free = hits.filter(hit => !hits.some(other => other.entry.id !== hit.entry.id && other.length > hit.length
        && other.start <= hit.start && other.start + other.length >= hit.start + hit.length))
      for (const hit of free) {
        if (!hit.entry.takes) continue
        // From the chapter that teaches the entry or a later one.
        if (chapter < hit.entry.chapter) continue
        // A phrase line that is only the word itself is its gloss, not a use of it.
        if (pair.kind === 'phrase' && tokens.length <= hit.length) continue
        // Another entry of the same word page is spelled here too: nobody gets it.
        if (hits.some(other => other.entry.id !== hit.entry.id && other.entry.slug === hit.entry.slug)) continue
        if (hit.entry.senses.length && !meaningShowsIn(hit.entry.senses, pair.english)) continue
        const list = candidates.get(hit.entry.id) || []
        if (list.some(item => item.samoan === pair.samoan)) continue
        const last = tokens[hit.start + hit.length - 1]
        list.push({ samoan: pair.samoan, english: pair.english, line: pair.line, kind: pair.kind, chapter, at: [tokens[hit.start].start, last.end] })
        candidates.set(hit.entry.id, list)
      }
    }
  }

  const out = {}
  for (const entry of entries) {
    const list = candidates.get(entry.id)
    if (!list) continue
    // Whole sentences before phrases, each in the order the book prints them.
    const ordered = [...list.filter(item => item.kind === 'sentence'), ...list.filter(item => item.kind === 'phrase')]
    out[entry.id] = ordered.slice(0, max)
  }
  return out
}
