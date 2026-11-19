// Text helpers shared by the dictionary search, the word pages and the scripts
// that build their data (Build-Spec part f of
// plans/2026-11-19-samoan-site-search-features.md; method ported from the
// Tongan site's dictionary-text.js, no Tongan string carried).
//
// Pure: no React, no data imports, so `node` can import this file directly.
// Everything here builds a key, a web address or a list of senses. Nothing
// here changes what is displayed: the Samoan and the meaning are always shown
// as the course data has them.

// Every character the data or a keyboard may use for the glottal stop (U+02BB).
const GLOTTAL_VARIANTS = /['‘’ʼ`ʻ]/g
const COMBINING_MARKS = /\p{M}/gu
const BRACKETED_NOTE = /\([^)]*\)/g

// Address segments kept for other pages: no word page may use them. `english`
// is the English pages' folder; `index` would clash with the hub's own file.
export const RESERVED_SLUGS = ['english', 'index']

export function stripMarks(text) {
  return String(text == null ? '' : text).normalize('NFD').replace(COMBINING_MARKS, '').normalize('NFC')
}

// A word as someone types it without macrons or the glottal stop. Case,
// spaces and hyphens stay, so this can be shown beside the marked word.
export function plainTyping(samoan) {
  return stripMarks(samoan).replace(GLOTTAL_VARIANTS, '').replace(/\s+/g, ' ').trim()
}

// Search key: plain typing, lowercased, hyphens dropped.
export function plainKey(text) {
  return plainTyping(text).toLowerCase().replace(/-+/g, '').replace(/\s+/g, ' ').trim()
}

// The plain key with its spaces removed: `maleifua` finds `male ifua`.
export function compactKey(text) {
  return plainKey(text).replace(/ /g, '')
}

// Exact spelling for comparison: marks kept, every glottal-stop form folded to
// one character, lowercase. Tells a word typed with its marks from one typed plain.
export function markedKey(text) {
  return String(text == null ? '' : text).normalize('NFC').toLowerCase().replace(GLOTTAL_VARIANTS, "'").replace(/\s+/g, ' ').trim()
}

// A meaning without its bracketed notes: "crow (of a rooster)" is "crow". The
// notes explain; they are not the meaning.
export function withoutNotes(english) {
  return String(english == null ? '' : english).replace(BRACKETED_NOTE, ' ').replace(/\s+/g, ' ').trim()
}

// A bound form is written with an equals sign or a hyphen at an end of the
// headword (an ending such as the course's suffixes, or a stem that takes one).
export const isBoundHeadword = samoan => /^[=-]|[=-]$/.test(withoutNotes(samoan))

// The letters of a headword as an address: macrons and the glottal stop gone,
// lowercase, every other run of characters a hyphen, no hyphen at either end.
function foldedLetters(samoan) {
  return stripMarks(String(samoan == null ? '' : samoan).replace(BRACKETED_NOTE, ' '))
    .toLowerCase()
    .replace(GLOTTAL_VARIANTS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// The address of a word page. Rows whose words fold to the same address share
// one page. A bound form takes the folded letters plus `-form`, so `=a` is at
// `a-form` and shares a page only with other bound forms.
export function wordSlug(samoan) {
  const letters = foldedLetters(samoan)
  if (isBoundHeadword(samoan)) return letters ? `${letters}-form` : ''
  return RESERVED_SLUGS.includes(letters) ? `${letters}-sm` : letters
}

export function wordPagePath(slug) {
  return `/dictionary/${slug}`
}

export function englishSlug(headword) {
  return String(headword == null ? '' : headword).toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export function englishPagePath(slug) {
  return `/dictionary/english/${slug}`
}

// One sense, without a leading "to" or a leading article when a word follows,
// and without an "and" left hanging at its end. "to eat" is "eat"; "the
// orange" is "orange"; a bare "to" or "the" stays.
export function normaliseSense(text) {
  return String(text == null ? '' : text)
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^to\s+(?=\S)/i, '')
    .replace(/^(?:a|an|the)\s+(?=\S)/i, '')
    .replace(/(?<=\S)\s+and$/i, '')
    .trim()
}

// A meaning split into its senses at commas and semicolons, notes dropped.
// A leading "also" is stripped before the sense is read ("also tomorrow" is
// "tomorrow"). Each sense keeps the text it came from, so a derived list can
// be traced.
export function splitSenses(english) {
  return withoutNotes(english)
    .split(/[,;]/)
    .map(part => {
      const text = part.replace(/\s+/g, ' ').trim()
      const withoutAlso = text.replace(/^also\s+(?=\S)/i, '')
      // `counted` is the sense before its article or "to" comes off: the words the three-word limit counts.
      return { text, sense: normaliseSense(withoutAlso), counted: withoutAlso, alsoStripped: withoutAlso !== text }
    })
    .filter(item => item.sense)
}

// One letter wrong, missing or extra, or two neighbouring letters swapped.
export function withinOneLetter(a, b) {
  if (a === b) return true
  const la = a.length
  const lb = b.length
  if (Math.abs(la - lb) > 1) return false
  let i = 0
  while (i < la && i < lb && a[i] === b[i]) i += 1
  if (la === lb) {
    if (a.slice(i + 1) === b.slice(i + 1)) return true
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2)
  }
  const [long, short] = la > lb ? [a, b] : [b, a]
  return long.slice(i + 1) === short.slice(i)
}

// Only the letters the Introduction prints for Sāmoan (marks and the glottal
// stop already removed): a e i o u f g l m n p s t v, and h k r in loanwords.
export function looksLikeSamoan(plain) {
  return /^[aeioufglmnpstvhkr]+$/.test(String(plain || '').replace(/[ -]/g, ''))
}

// ---------------------------------------------------------------------------
// Which senses are plain English words. Used twice: to decide which senses
// become English headwords, and to decide whether a row's meaning can be
// looked for in the English printed beside a chapter sentence.

export const ENGLISH_HEADWORD_MAX_WORDS = 3
// Bound forms and frames: their meanings describe what the form does.
export const isBoundForm = samoan => isBoundHeadword(samoan) || /\.\.\.|\//.test(withoutNotes(samoan))
// A sense that describes a job instead of giving an English word for it.
const GRAMMATICAL_NOTE = /^(?:marks|makes|adds|softens|replaces|emphasi[sz]ing|possessing|regarding|where it)\b|\b(?:speaker|listener|objects)\b/i
const PLAIN_WORDS = /^[A-Za-z]+(?:['-][A-Za-z]+)*(?: [A-Za-z]+(?:['-][A-Za-z]+)*)*$/

// Why a sense is not a plain English word or phrase, or '' when it is one.
export function senseDropReason(samoan, sense, counted = sense) {
  if (isBoundForm(samoan)) return 'bound form: the meaning describes the form'
  if (/^of\b/i.test(sense)) return 'qualifier opening with "of"'
  if (!PLAIN_WORDS.test(sense)) return 'not plain words'
  if (counted.split(' ').length > ENGLISH_HEADWORD_MAX_WORDS) return 'more than three words'
  if (GRAMMATICAL_NOTE.test(sense)) return 'grammatical note'
  return ''
}
