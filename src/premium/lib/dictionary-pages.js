// The dictionary's pages as plain data (Build-Spec part f of
// plans/2026-11-19-samoan-site-search-features.md): one word page per folded
// spelling at /dictionary/<slug>, and one English page per English headword at
// /dictionary/english/<slug>.
//
// Pure: no React and no data imports, so the React pages, the tests, the data
// script and the prerender all build the same pages from the same files:
//   glossary    src/data/glossary.json         (the 658 rows: the dictionary)
//   vocabulary  src/data/book-vocabulary.json  (which list a row is taught in)
//   chapters    src/data/chapters.json         (chapter titles)
//   examples    src/premium/data/dictionary-examples.json (printed chapter pairs)
//
// Rules that bind: every Samoan string and every meaning is the course data's
// own, shown as the data has it. Nothing is written here: no gloss, no
// example, no pronunciation. Words that fold to one slug share a page and are
// shown as separate entries under their own marked headwords, in the
// glossary's order, never as one word.

import {
  ENGLISH_HEADWORD_MAX_WORDS, englishPagePath, englishSlug, isBoundForm, plainTyping, RESERVED_SLUGS,
  senseDropReason, splitSenses, wordPagePath, wordSlug, withoutNotes,
} from './dictionary-text.js'

export { ENGLISH_HEADWORD_MAX_WORDS }

// The typing shown beside a marked word ("also typed tama"), or '' when the
// word has no marks to drop.
function alsoTyped(samoan) {
  const plain = plainTyping(samoan)
  return plain !== String(samoan).trim() ? plain : ''
}

function chapterInfo(number, titles) {
  // `title` is the chapter's title as chapters.json has it (italic marks for
  // Samoan); `label` is the same without the marks, for titles and descriptions.
  const title = titles.get(number) || ''
  const plainTitle = title.replace(/\*+/g, '')
  return { number, title, label: plainTitle ? `Chapter ${number}: ${plainTitle}` : `Chapter ${number}`, href: `/chapters/${number}` }
}

// Which vocabulary list teaches a glossary row: the row of book-vocabulary.json
// with the same headword and chapter; where more than one matches, the one
// whose English is equal as well; with no such row, none.
export function matchVocabulary(row, vocabulary) {
  const same = vocabulary.filter(item => item.samoan === row.samoan && item.chapter === row.chapter)
  if (same.length <= 1) return same[0] || null
  return same.find(item => item.english === row.english) || null
}

// The entries of the dictionary: the glossary rows, in the glossary's order.
// Two rows with the same headword and the same meaning become one entry that
// names each chapter. Nothing else is merged.
export function buildEntries({ glossary, vocabulary = [], chapters = [], examples = {} }) {
  const titles = new Map((Array.isArray(chapters) ? chapters : []).map(chapter => [Number(chapter.chapter), chapter.title || '']))
  const entries = []
  const byKey = new Map()
  glossary.forEach((row, index) => {
    if (!row || typeof row.samoan !== 'string' || !row.samoan.trim()) return
    const key = `${row.samoan}\u0000${row.english}`
    const number = Number(row.chapter)
    const chapter = Number.isInteger(number) && number >= 1 ? number : null
    const merged = byKey.get(key)
    if (merged) {
      if (chapter && !merged.chapters.some(item => item.number === chapter)) merged.chapters.push(chapterInfo(chapter, titles))
      return
    }
    const listed = matchVocabulary(row, vocabulary)
    const entry = {
      id: `g${index}`,
      samoan: row.samoan,
      display: row.samoan,
      alsoTyped: alsoTyped(row.samoan),
      english: row.english || '',
      letter: row.letter,
      chapter,
      chapters: chapter ? [chapterInfo(chapter, titles)] : [],
      list: listed ? listed.list : '',
      listName: listed ? listed.listName : '',
      examples: (examples[`g${index}`] || []).map(item => ({ ...item, display: item.samoan, englishDisplay: item.english.replace(/"([^"]*)"/g, '“$1”') })),
    }
    byKey.set(key, entry)
    entries.push(entry)
  })
  return entries
}

// The lists whose entries may give English pages: the words the course gives an
// English word for. Grammar words and unlisted entries have descriptions.
const ENGLISH_LISTS = ['vocabulary', 'carry']

// Why an entry gives no English headwords at all, or '' when it may.
export function entryDropReason(entry) {
  if (isBoundForm(entry.samoan)) return 'bound form: the meaning describes the form'
  if (!ENGLISH_LISTS.includes(entry.list)) return entry.list === 'grammar' ? 'grammar list' : 'no vocabulary list'
  if (entry.english.includes(':')) return 'a colon in the meaning'
  return ''
}

// English headwords, from the meanings in the data and nowhere else. A meaning
// is split into its senses at commas and semicolons; bracketed notes, a leading
// "also", "to" and article go; a sense is kept when what remains is one to
// three plain words that are not a qualifier. Returns the kept headwords with
// the entries and sense text each came from, every sense that was dropped with
// the reason, and how many "also" openings were stripped.
export function deriveEnglishHeadwords(entries) {
  const kept = new Map()
  const dropped = []
  let alsoStripped = 0
  for (const entry of entries) {
    const entryReason = entryDropReason(entry)
    for (const { text, sense, counted, alsoStripped: stripped } of splitSenses(entry.english)) {
      if (entryReason) { dropped.push({ rowId: entry.id, samoan: entry.samoan, senseText: text, reason: entryReason }); continue }
      if (stripped) alsoStripped += 1
      const reason = senseDropReason(entry.samoan, sense, counted)
      if (reason) { dropped.push({ rowId: entry.id, samoan: entry.samoan, senseText: text, reason }); continue }
      const slug = englishSlug(sense)
      if (!kept.has(slug)) kept.set(slug, { slug, headword: sense, sources: [] })
      const page = kept.get(slug)
      if (!page.sources.some(source => source.rowId === entry.id)) page.sources.push({ rowId: entry.id, senseText: text })
    }
  }
  const headwords = [...kept.values()].sort((a, b) => a.slug.localeCompare(b.slug))
  return { headwords, dropped, alsoStripped }
}

// The line under an English page's heading.
export function englishPageLead(page) {
  const count = page.entries.length
  const word = `“${page.headword}”`
  return count === 1
    ? `One word in the dictionary has ${word} in its meaning.`
    : `${count} words in the dictionary have ${word} in their meaning. Each meaning is shown in full, so you can pick the word that fits.`
}

// Everything the dictionary shows, built once from the data files.
export function buildDictionaryIndex({ glossary, vocabulary = [], chapters = [], examples = {} }) {
  const entries = buildEntries({ glossary, vocabulary, chapters, examples })
  const byId = new Map(entries.map(entry => [entry.id, entry]))

  // Pages keep the order of the glossary: the first entry of a page places it.
  const pageMap = new Map()
  for (const entry of entries) {
    const slug = wordSlug(entry.samoan)
    if (!slug) throw new Error(`No web address can be made for ${entry.id} (${entry.samoan})`)
    if (RESERVED_SLUGS.includes(slug)) throw new Error(`${entry.id} would take the reserved address ${slug}`)
    entry.slug = slug
    entry.path = wordPagePath(slug)
    if (!pageMap.has(slug)) pageMap.set(slug, { kind: 'word', slug, path: wordPagePath(slug), entries: [] })
    pageMap.get(slug).entries.push(entry)
  }
  const pages = [...pageMap.values()]

  const chapterWords = new Map()
  for (const page of pages) {
    page.words = [...new Set(page.entries.map(entry => entry.display))]
    // One typing is named only when every entry on the page is typed that way; otherwise ''.
    const typings = new Set(page.entries.map(entry => plainTyping(withoutNotes(entry.samoan)).toLowerCase()))
    page.typed = typings.size === 1 ? [...typings][0] : ''
    page.rowIds = page.entries.map(entry => entry.id)
    for (const entry of page.entries) {
      for (const chapter of entry.chapters) {
        chapterWords.set(chapter.number, [...(chapterWords.get(chapter.number) || []), { display: entry.display, path: page.path, slug: page.slug }])
      }
    }
  }

  const others = (links, page) => {
    const seen = new Set([page.slug])
    return (links || []).filter(link => !seen.has(link.slug) && seen.add(link.slug)).map(link => ({ display: link.display, path: link.path }))
  }
  pages.forEach((page, index) => {
    const before = pages[index - 1]
    const after = pages[index + 1]
    page.previous = before ? { display: before.words.join(', '), path: before.path } : null
    page.next = after ? { display: after.words.join(', '), path: after.path } : null
    // Other words of the same chapter, one group per chapter on the page.
    page.sameChapter = []
    for (const entry of page.entries) {
      for (const chapter of entry.chapters) {
        if (page.sameChapter.some(group => group.chapter.number === chapter.number)) continue
        const words = others(chapterWords.get(chapter.number), page)
        if (words.length) page.sameChapter.push({ chapter, words })
      }
    }
  })

  const derived = deriveEnglishHeadwords(entries)
  const english = derived.headwords.map(item => ({
    kind: 'english',
    slug: item.slug,
    path: englishPagePath(item.slug),
    headword: item.headword,
    sources: item.sources,
    entries: item.sources.map(source => byId.get(source.rowId)),
  }))
  for (const page of english) for (const entry of page.entries) (entry.englishPages ||= []).push({ headword: page.headword, path: page.path })
  for (const entry of entries) entry.englishPages ||= []

  return {
    entries,
    pages,
    pageBySlug: new Map(pages.map(page => [page.slug, page])),
    english,
    englishBySlug: new Map(english.map(page => [page.slug, page])),
    englishDropped: derived.dropped,
    englishAlsoStripped: derived.alsoStripped,
    letters: [...new Set(entries.map(entry => entry.letter))],
  }
}

// The page at a path, or null: /dictionary/<slug> or /dictionary/english/<slug>.
export function dictionaryPageForPath(index, pathname) {
  const path = String(pathname || '').replace(/\/+$/, '')
  let found = /^\/dictionary\/english\/([a-z0-9-]+)$/.exec(path)
  if (found) return index.englishBySlug.get(found[1]) || null
  found = /^\/dictionary\/([a-z0-9-]+)$/.exec(path)
  return found ? index.pageBySlug.get(found[1]) || null : null
}
