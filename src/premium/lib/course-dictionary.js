// The glossary: the book's Glossary appendix (src/data/glossary.json), in the
// appendix's own order and letter sections, searchable in Samoan or English.
//
// Read-only. Folding exists only to build a search key; it never changes what
// is displayed.

const GLOTTAL_VARIANTS = /['‘’ʼ`ʻ]/g
const COMBINING_MARKS = /[̀-ͯ]/g

export function foldSearchKey(text) {
  return String(text == null ? '' : text)
    .replace(/[*_]/g, '')
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(GLOTTAL_VARIANTS, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildDictionary(rows) {
  return rows.map((row, index) => ({
    id: `g${index}`,
    samoan: row.samoan,
    english: row.english,
    letter: row.letter,
    lesson: row.chapter,
    samoanKey: foldSearchKey(row.samoan).replace(/^[=-]+/, ''),
    englishKey: foldSearchKey(row.english),
  }))
}

export function dictionaryGroups(entries) {
  return [...new Set(entries.map(entry => entry.letter))]
}

export function browseDictionary(entries, letter) {
  return letter ? entries.filter(entry => entry.letter === letter) : entries
}

// How well an entry matches: lower is better, null is no match.
function rank(entry, q) {
  if (entry.samoanKey === q) return 0
  if (entry.englishKey === q) return 1
  if (entry.samoanKey.startsWith(q)) return 2
  if (entry.englishKey.startsWith(q) || entry.englishKey.split(/[^a-z0-9]+/).includes(q)) return 3
  if (entry.samoanKey.includes(q)) return 4
  if (entry.englishKey.includes(q)) return 5
  return null
}

export function searchDictionary(entries, query) {
  const q = foldSearchKey(query)
  if (!q) return entries
  const scored = []
  entries.forEach((entry, index) => {
    const r = rank(entry, q)
    if (r !== null) scored.push({ entry, r, index })
  })
  scored.sort((a, b) => a.r - b.r || a.index - b.index)
  return scored.map(item => item.entry)
}
