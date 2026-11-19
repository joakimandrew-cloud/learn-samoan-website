// /word-lists: words the course teaches, sorted by theme
// (plans/2026-11-20-samoan-scribbles-site-tour.md, Step 2; DECISIONS.md
// 2026-11-19, "The public dictionary is the course's own words").
//
// The data file, src/premium/data/word-lists.json, holds theme ids, theme
// labels and the ids of rows of src/data/book-vocabulary.json, and nothing
// else. No Sāmoan and no meaning is typed there or here: the page shows each
// word and its English exactly as its vocabulary row has them, and each word
// links to its dictionary page through the dictionary's own address functions
// (wordSlug and wordPagePath in dictionary-text.js).
//
// Pure: no React and no JSON import, so the page, the prerender and the test
// all build the same lists. The callers read the two JSON files and pass them in.

import { wordPagePath, wordSlug } from './dictionary-text.js'

export const WORD_LISTS_PATH = '/word-lists'
export const THEME_MIN_WORDS = 8

// The English a visitor reads on the page. New copy: it says whose words these
// are and says nothing of cost or access.
export const COPY = {
  eyebrow: 'Word lists · By theme',
  h1: ['Sāmoan', 'word lists'],
  lead: 'Words the course teaches, grouped by theme. Each word is shown with the English its chapter gives, and links to its page in the dictionary and to the chapter that teaches it. Within a theme the words run in the order the course teaches them.',
  indexLabel: 'Themes',
  count: (themes, words) => `${themes} themes · ${words} words`,
  themeCount: words => `${words} words`,
  served: (themes, words) => `${words} words in ${themes} themes.`,
  closing: 'Grammar words are left to their chapters, and a word that fits no theme is not listed here. To look one up,',
  dictionaryLink: 'search the dictionary',
  greetingsLead: 'Hello, goodbye and thank you have a page of their own:',
  greetingsLink: 'Hello in Sāmoan',
}

// A sentence under a theme's heading, by theme id. The Numbers note is held to
// book/Chapter-23.md by test/word-lists.test.js: the chapter says the word for
// five is the word already taught for "hand", and that row sits under The body.
export const THEME_NOTES = {
  numbers: 'Five is missing here because it is the word the course has already taught for “hand”. It is listed under The body.',
}

export function themeHref(themeId) {
  return `${WORD_LISTS_PATH}#${themeId}`
}

// A macron vowel, the glottal stop (U+02BB) or a mark typed in its place, or a combining macron.
const MARKED = /[āēīōūĀĒĪŌŪ\u02BB\u2018\u2019\u02BC`']|\u0304/
const THEME_KEYS = ['id', 'label', 'words']

// Everything wrong with the data file, as sentences; an empty list when it is
// sound. Held: the file's shape, every id a vocabulary row, no id listed twice,
// no grammar-list row, at least eight words to a theme, the words of a theme in
// the course's order, and no Sāmoan letter (a macron, the glottal stop) typed in.
export function checkWordLists(data, vocabulary) {
  const problems = []
  const rows = new Map((Array.isArray(vocabulary) ? vocabulary : []).map(row => [row.id, row]))
  if (!data || typeof data !== 'object' || Object.keys(data).join() !== 'themes' || !Array.isArray(data.themes)) {
    return ['the data file holds one key, "themes", a list']
  }
  const themeIds = new Set()
  const placed = new Map()
  for (const theme of data.themes) {
    const name = theme?.id || '(a theme with no id)'
    if (!theme || Object.keys(theme).sort().join() !== [...THEME_KEYS].sort().join()) {
      problems.push(`${name}: a theme holds exactly id, label and words`)
      continue
    }
    if (typeof theme.id !== 'string' || !/^[a-z]+(?:-[a-z]+)*$/.test(theme.id)) problems.push(`${name}: the id is lowercase words joined by hyphens`)
    if (themeIds.has(theme.id)) problems.push(`${name}: the theme id is used twice`)
    themeIds.add(theme.id)
    if (typeof theme.label !== 'string' || !theme.label.trim()) problems.push(`${name}: the theme has no label`)
    else if (MARKED.test(theme.label)) problems.push(`${name}: the label holds a Sāmoan mark or a quote mark; labels are plain English`)
    if (!Array.isArray(theme.words)) { problems.push(`${name}: words is a list of vocabulary ids`); continue }
    if (theme.words.length < THEME_MIN_WORDS) problems.push(`${name}: ${theme.words.length} words, and a theme needs at least ${THEME_MIN_WORDS}`)
    theme.words.forEach((id, at) => {
      if (typeof id !== 'string' || MARKED.test(id)) { problems.push(`${name}: "${id}" is not a vocabulary id; no word is typed into this file`); return }
      const row = rows.get(id)
      if (!row) { problems.push(`${name}: ${id} is not a row of book-vocabulary.json`); return }
      if (placed.has(id)) problems.push(`${name}: ${id} is listed twice (also under ${placed.get(id)})`)
      placed.set(id, theme.id)
      if (row.list === 'grammar') problems.push(`${name}: ${id} is a grammar word, and grammar words are not themed`)
      if (at > 0 && String(theme.words[at - 1]) >= id) problems.push(`${name}: ${id} is out of the course's order`)
    })
  }
  return problems
}

// The page as plain data: one group per theme, each row a vocabulary row with
// its dictionary address and its chapter. A row is shaped as the dictionary's
// own EntryRow reads an entry (display, path, english, chapters), so the page
// draws it with that component. Throws on unsound data, so a build stops on it.
export function buildWordLists(data, vocabulary) {
  const problems = checkWordLists(data, vocabulary)
  if (problems.length) throw new Error(`word-lists.json: ${problems.join('; ')}`)
  const rows = new Map(vocabulary.map(row => [row.id, row]))
  return data.themes.map(theme => ({
    id: theme.id,
    label: theme.label,
    href: themeHref(theme.id),
    note: THEME_NOTES[theme.id] || '',
    rows: theme.words.map(id => {
      const row = rows.get(id)
      return {
        id: row.id,
        samoan: row.samoan,
        display: row.samoan,
        english: row.english,
        chapter: row.chapter,
        chapters: [{ number: row.chapter, href: `/chapters/${row.chapter}` }],
        listName: '',
        path: wordPagePath(wordSlug(row.samoan)),
      }
    }),
  }))
}

export const countWords = themes => themes.reduce((sum, theme) => sum + theme.rows.length, 0)
