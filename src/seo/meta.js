// The one source of page titles and descriptions. The prerender
// (scripts/prerender.mjs) writes them into each route's static HTML and the app
// (RouteChrome, and the useTitle calls in the page files) sets them on
// navigation, so the two can no longer differ. Plain JS with no JSON import, so
// Node and Vite both load it.
//
// Strings and rules are Build-Spec part (b) of plans/2026-11-19-samoan-site-search-features.md.
// "Unchanged" rows hold exactly what src/lib/site-meta.js held before this file
// existed. New copy never says "free" and never says every chapter is open; the
// home title and description, which do, stay as they were.
import { DAILY_WORDS_ENTRY, DAILY_WORDS_ID, stripStars } from '../premium/lib/drills-catalog.js'

export const SITE_NAME = 'Learn Sāmoan'
export const TITLE_TAIL = ` · ${SITE_NAME}`
export const HOME_TITLE = 'Learn Sāmoan · A free course in 52 chapters'
export const DEFAULT_DESCRIPTION = 'Learn Sāmoan, free. A complete 52-chapter course with worked examples, exercises, quizzes and flip cards.'

// The visit counter's code on GoatCounter (the site address is <code>.goatcounter.com).
// Empty until the account exists: while it is empty no counter script is written.
export const GOATCOUNTER_CODE = ''

export const plain = s => String(s ?? '').replace(/\*+/g, '').replace(/\s+/g, ' ').trim()

export function clip(text, max = 158) {
  const t = plain(text)
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:]$/, '')}…`
}

export const withTail = title => `${title}${TITLE_TAIL}`

const DESCRIPTIONS = {
  chapters: 'The whole Sāmoan course in 52 chapters, Beginner to Advanced. Every chapter has worked examples, exercises with answers and a 10-question quiz.',
  drills: '68 drills grouped by skill, each built only from Sāmoan printed in the course, with a Words to Learn recall deck.',
  quizzes: 'A ten-question quiz for every chapter of the Sāmoan course, with every answer explained.',
  cards: 'Flip cards for every Words to Learn list in the Sāmoan course, by chapter or by band.',
  dictionary: 'Look up the words the Sāmoan course teaches. Search in Sāmoan or English, with or without macrons and the glottal stop, or browse by letter. Each word shows its meaning and the chapter that teaches it.',
  reference: 'The Introduction, the Pronunciation Guide and the Reference Charts of the Sāmoan course.',
}

// Static pages, keyed by route. Titles carry their own tail.
export const STATIC_META = {
  '/': { title: HOME_TITLE, description: DEFAULT_DESCRIPTION },
  '/chapters': { title: withTail('All 52 Sāmoan Chapters in Order'), description: DESCRIPTIONS.chapters },
  '/quizzes': { title: withTail('Sāmoan Quizzes: One for Every Chapter'), description: DESCRIPTIONS.quizzes },
  '/drills': { title: withTail('Sāmoan Grammar Drills, Practice by Skill'), description: DESCRIPTIONS.drills },
  '/cards': { title: withTail('Sāmoan Vocabulary Flip Cards'), description: DESCRIPTIONS.cards },
  '/dictionary': { title: withTail('Sāmoan Dictionary: Search in Sāmoan or English'), description: DESCRIPTIONS.dictionary },
  '/reference': { title: withTail('Sāmoan Reference: Pronunciation, Charts and Dictionary'), description: DESCRIPTIONS.reference },
  '/introduction': {
    title: withTail('Introduction to Sāmoan: Sounds, Spelling and How Words Work'),
    description: 'Sounds, Spelling, and How Words Work: the Introduction to the free Sāmoan course, read before Chapter 1.',
  },
  '/pronunciation': {
    title: withTail('Sāmoan Pronunciation Guide: Vowels, Stress and the ʻ Mark'),
    description: 'Sāmoan has five vowels, and each can be short or long. How they sound, where the stress falls, what the ʻ mark and the long-vowel mark do, and how t becomes k in the everyday style.',
  },
  '/charts': {
    title: withTail('Sāmoan Grammar Charts: Pronouns, Possessives, Articles'),
    description: 'Reference charts from the Sāmoan course: pronouns, possessives, articles and the tense-aspect-mood particles.',
  },
  // The two topic pages (src/seo/pages/). The alphabet's count is the one a shelf source prints: see that file's head.
  '/greetings': {
    title: withTail('Hello in Sāmoan: Tālofa, the Reply and the Goodbyes'),
    description: 'Tālofa is the Sāmoan hello, and the reply is tālofa back. The goodbyes, thank you and please, the good wishes and the lighter hi, each as the course teaches it.',
  },
  '/alphabet': {
    title: withTail('Sāmoan Alphabet: The Letters and How They Sound'),
    description: 'The Sāmoan alphabet has five vowels and thirteen consonants, one of them the ʻ mark. The letters, how they sound, what the long-vowel mark does, and where the stress falls.',
  },
}

// The hub pages as src/lib/site-meta.js has always exported them (title without the tail).
export const HUBS = Object.fromEntries(
  ['/chapters', '/drills', '/quizzes', '/cards', '/dictionary', '/reference'].map(route => [
    route,
    { title: STATIC_META[route].title.slice(0, -TITLE_TAIL.length), description: STATIC_META[route].description },
  ]),
)

/** The page heading for a static route: its title without the tail. */
export const headingFor = route => {
  const t = STATIC_META[route]?.title ?? HOME_TITLE
  return t.endsWith(TITLE_TAIL) ? t.slice(0, -TITLE_TAIL.length) : SITE_NAME
}

export const chapterTitle = (n, title) => withTail(`Chapter ${n}: ${plain(title)}`)
export const chapterDescription = intro => clip(intro) || DEFAULT_DESCRIPTION

export const quizTitle = (n, title) => withTail(`Chapter ${n} Quiz: ${plain(title)}`)
export const quizDescription = (n, title) =>
  `Ten questions on Chapter ${n} of the Sāmoan course${title ? `, ${plain(title)}` : ''}, with every answer explained.`

export const drillTitle = title => withTail(stripStars(title))
export const drillDescription = intro => clip(intro) || DESCRIPTIONS.drills

// ---------------------------------------------------------------------------
// The dictionary's pages (Build-Spec part b). One function, dictionaryPageMeta(page),
// used by the React pages and by the prerender. `page` is a page object from
// buildDictionaryIndex() in src/premium/lib/dictionary-pages.js. Every string is
// built from the page's own fields (the headword as the course prints it, the
// meaning in full, the chapter title); nothing is written about a word here.

export const DICTIONARY_PAGE_PATH = /^\/dictionary\/(?:english\/)?[a-z0-9-]+$/
export const DICTIONARY_TITLE_MAX = 60
export const DICTIONARY_DESCRIPTION_MAX = 220
const DICTIONARY_TITLE_TAIL = ' · Sāmoan Dictionary'

// Trim to a word boundary so a description never ends mid-word.
export function clamp(text, max) {
  const flat = String(text || '').replace(/\s+/g, ' ').trim()
  if (flat.length <= max) return flat
  const cut = flat.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > 40 ? cut.slice(0, space) : cut).replace(/[,;:.]$/, '')}…`
}

const meaningOf = entry => plain(entry.english).replace(/[.]+$/, '')

// The word with the word "meaning"; the meaning itself only when the page has
// one headword and the whole title still fits in 60 characters. A page that
// holds two headwords never runs their meanings together.
export function dictionaryWordTitle(page) {
  const word = page.words.join(', ')
  if (page.words.length === 1) {
    const meanings = [...new Set(page.entries.map(meaningOf))].join('; ')
    const full = `${word} meaning: ${meanings}${DICTIONARY_TITLE_TAIL}`
    if (meanings && full.length <= DICTIONARY_TITLE_MAX) return full
  }
  return `${word} meaning${DICTIONARY_TITLE_TAIL}`
}

function chapterPlace(entry) {
  if (!entry.chapters.length) return ''
  return ` Taught in ${entry.chapters.map(chapter => chapter.label).join(' and ')}.`
}

export function dictionaryWordDescription(page) {
  const parts = page.entries.map(entry => `${entry.display} in Sāmoan: ${meaningOf(entry)}.${chapterPlace(entry)}`)
  return clamp(parts.join(' '), DICTIONARY_DESCRIPTION_MAX)
}

export function dictionaryEnglishTitle(page) {
  return withTail(`How to say ${page.headword} in Sāmoan`)
}

export function dictionaryEnglishDescription(page) {
  const list = page.entries.map(entry => `${entry.display}, ${meaningOf(entry)}`).join('; ')
  return clamp(`${page.headword} in Sāmoan: ${list}.`, DICTIONARY_DESCRIPTION_MAX)
}

export function dictionaryPageMeta(page) {
  return page.kind === 'english'
    ? { title: dictionaryEnglishTitle(page), description: dictionaryEnglishDescription(page) }
    : { title: dictionaryWordTitle(page), description: dictionaryWordDescription(page) }
}

export function normalisePath(pathname) {
  const p = String(pathname || '/').split(/[?#]/)[0].replace(/\/+$/, '')
  return p || '/'
}

/**
 * Title and description for a route, or null when the page sets its own (a drill
 * item, a route that does not exist). `chapters` is the rows of src/data/chapters.json;
 * the quiz count is not needed for the strings.
 */
export function metaForPath(pathname, { chapters = [] } = {}) {
  const path = normalisePath(pathname)
  if (STATIC_META[path]) return STATIC_META[path]
  let m = /^\/chapters\/(\d+)$/.exec(path)
  if (m) {
    const c = chapters.find(x => x.chapter === Number(m[1]))
    return c ? { title: chapterTitle(c.chapter, c.title), description: chapterDescription(c.intro) } : null
  }
  m = /^\/quizzes\/(\d+)$/.exec(path)
  if (m) {
    const c = chapters.find(x => x.chapter === Number(m[1]))
    return c ? { title: quizTitle(c.chapter, c.title), description: quizDescription(c.chapter, c.title) } : null
  }
  if (path === `/drill/${DAILY_WORDS_ID}`) return { title: drillTitle(DAILY_WORDS_ENTRY.title), description: DAILY_WORDS_ENTRY.blurb }
  return null
}
