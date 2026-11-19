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
  glossary: 'Every Sāmoan word the course teaches, with its meaning. Search with or without macrons and the glottal stop.',
  reference: 'The Introduction, the Pronunciation Guide and the Reference Charts of the Sāmoan course.',
}

// Static pages, keyed by route. Titles carry their own tail.
export const STATIC_META = {
  '/': { title: HOME_TITLE, description: DEFAULT_DESCRIPTION },
  '/chapters': { title: withTail('All 52 Sāmoan Chapters in Order'), description: DESCRIPTIONS.chapters },
  '/quizzes': { title: withTail('Sāmoan Quizzes: One for Every Chapter'), description: DESCRIPTIONS.quizzes },
  '/drills': { title: withTail('Sāmoan Grammar Drills, Practice by Skill'), description: DESCRIPTIONS.drills },
  '/cards': { title: withTail('Sāmoan Vocabulary Flip Cards'), description: DESCRIPTIONS.cards },
  '/glossary': { title: withTail('Sāmoan Glossary: Every Word the Course Teaches'), description: DESCRIPTIONS.glossary },
  '/reference': { title: withTail('Sāmoan Reference: Pronunciation, Charts and Glossary'), description: DESCRIPTIONS.reference },
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
}

// The hub pages as src/lib/site-meta.js has always exported them (title without the tail).
export const HUBS = Object.fromEntries(
  ['/chapters', '/drills', '/quizzes', '/cards', '/glossary', '/reference'].map(route => [
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
