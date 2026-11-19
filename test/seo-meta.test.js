// Titles and descriptions (Build-Spec part b of plans/2026-11-19-samoan-site-search-features.md).
// src/seo/meta.js is the one source the prerender and the app both read.
import { describe, expect, it } from 'vitest'
import chapters from '../src/data/chapters.json'
import {
  DEFAULT_DESCRIPTION, GOATCOUNTER_CODE, HOME_TITLE, STATIC_META, TITLE_TAIL,
  chapterTitle, drillTitle, metaForPath, quizDescription, quizTitle,
} from '../src/seo/meta.js'
import { COURSE, HUBS, HOME_TITLE as HOME_VIA_SITE_META } from '../src/lib/site-meta.js'

const T = ' · Learn Sāmoan'

// The strings of the spec's part (b) table, typed out once more here so a change to the
// module that is not a change to the spec fails.
const SPEC = {
  '/': ['Learn Sāmoan · A free course in 52 chapters', null],
  '/chapters': [`All 52 Sāmoan Chapters in Order${T}`, null],
  '/quizzes': [`Sāmoan Quizzes: One for Every Chapter${T}`, null],
  '/drills': [`Sāmoan Grammar Drills, Practice by Skill${T}`, null],
  '/cards': [`Sāmoan Vocabulary Flip Cards${T}`, null],
  '/dictionary': [
    `Sāmoan Dictionary: Search in Sāmoan or English${T}`,
    'Look up the words the Sāmoan course teaches. Search in Sāmoan or English, with or without macrons and the glottal stop, or browse by letter. Each word shows its meaning and the chapter that teaches it.',
  ],
  '/reference': [`Sāmoan Reference: Pronunciation, Charts and Dictionary${T}`, null],
  '/introduction': [`Introduction to Sāmoan: Sounds, Spelling and How Words Work${T}`, null],
  '/pronunciation': [
    `Sāmoan Pronunciation Guide: Vowels, Stress and the ʻ Mark${T}`,
    'Sāmoan has five vowels, and each can be short or long. How they sound, where the stress falls, what the ʻ mark and the long-vowel mark do, and how t becomes k in the everyday style.',
  ],
  '/charts': [
    `Sāmoan Grammar Charts: Pronouns, Possessives, Articles${T}`,
    'Reference charts from the Sāmoan course: pronouns, possessives, articles and the tense-aspect-mood particles.',
  ],
  // The two topic pages. The alphabet's description carries the count a shelf source prints (Step 12).
  '/greetings': [
    `Hello in Sāmoan: Tālofa, the Reply and the Goodbyes${T}`,
    'Tālofa is the Sāmoan hello, and the reply is tālofa back. The goodbyes, thank you and please, the good wishes and the lighter hi, each as the course teaches it.',
  ],
  '/alphabet': [
    `Sāmoan Alphabet: The Letters and How They Sound${T}`,
    'The Sāmoan alphabet has five vowels and thirteen consonants, one of them the ʻ mark. The letters, how they sound, what the long-vowel mark does, and where the stress falls.',
  ],
}

// What src/lib/site-meta.js and scripts/prerender.mjs held before src/seo/meta.js existed.
const UNCHANGED_DESCRIPTIONS = {
  '/': 'Learn Sāmoan, free. A complete 52-chapter course with worked examples, exercises, quizzes and flip cards.',
  '/chapters': 'The whole Sāmoan course in 52 chapters, Beginner to Advanced. Every chapter has worked examples, exercises with answers and a 10-question quiz.',
  '/quizzes': 'A ten-question quiz for every chapter of the Sāmoan course, with every answer explained.',
  '/drills': '68 drills grouped by skill, each built only from Sāmoan printed in the course, with a Words to Learn recall deck.',
  '/cards': 'Flip cards for every Words to Learn list in the Sāmoan course, by chapter or by band.',
  '/reference': 'The Introduction, the Pronunciation Guide and the Reference Charts of the Sāmoan course.',
  '/introduction': 'Sounds, Spelling, and How Words Work: the Introduction to the free Sāmoan course, read before Chapter 1.',
}

describe('seo meta: the strings of the spec', () => {
  it('holds exactly the static titles of part (b), and the new descriptions', () => {
    for (const [route, [title, description]] of Object.entries(SPEC)) {
      expect(STATIC_META[route]?.title, route).toBe(title)
      if (description) expect(STATIC_META[route].description, route).toBe(description)
    }
    expect(Object.keys(STATIC_META).sort()).toEqual(Object.keys(SPEC).sort())
  })

  it('leaves the "Unchanged" descriptions and the home title byte for byte', () => {
    for (const [route, description] of Object.entries(UNCHANGED_DESCRIPTIONS)) expect(STATIC_META[route].description, route).toBe(description)
    expect(HOME_TITLE).toBe('Learn Sāmoan · A free course in 52 chapters')
    expect(DEFAULT_DESCRIPTION).toBe(UNCHANGED_DESCRIPTIONS['/'])
  })

  it('keeps src/lib/site-meta.js exporting what other files import', () => {
    expect(COURSE).toBe('Learn Sāmoan')
    expect(HOME_VIA_SITE_META).toBe(HOME_TITLE)
    expect(Object.keys(HUBS).sort()).toEqual(['/cards', '/chapters', '/dictionary', '/drills', '/quizzes', '/reference'])
    expect(HUBS['/drills'].description).toBe(UNCHANGED_DESCRIPTIONS['/drills'])
  })

  it('builds the chapter, quiz and drill patterns of part (b)', () => {
    expect(chapterTitle(1, 'The Basic Sentence')).toBe(`Chapter 1: The Basic Sentence${T}`)
    expect(quizTitle(1, 'The Basic Sentence')).toBe(`Chapter 1 Quiz: The Basic Sentence${T}`)
    expect(quizDescription(1, 'The Basic Sentence')).toBe('Ten questions on Chapter 1 of the Sāmoan course, The Basic Sentence, with every answer explained.')
    expect(drillTitle('*Sā* or *ʻua*')).toBe(`Sā or ʻua${T}`)
  })

  it('keeps static titles at 80 characters or fewer and descriptions at 220', () => {
    for (const [route, m] of Object.entries(STATIC_META)) {
      expect(m.title.length, `${route} title`).toBeLessThanOrEqual(80)
      expect(m.description.length, `${route} description`).toBeLessThanOrEqual(220)
    }
  })

  it('holds no U+2014 and no "Lesson" in any title or description, and no new "free"', () => {
    const all = [
      ...Object.entries(STATIC_META).flatMap(([route, m]) => [[route, m.title], [route, m.description]]),
      ...chapters.flatMap(c => [[`ch${c.chapter}`, chapterTitle(c.chapter, c.title)], [`quiz${c.chapter}`, quizTitle(c.chapter, c.title)], [`qd${c.chapter}`, quizDescription(c.chapter, c.title)]]),
    ]
    for (const [where, s] of all) {
      expect(s, where).not.toMatch(/—/)
      expect(s, where).not.toMatch(/\bLesson/)
    }
    // The home and Introduction strings that already said "free" stay as they were; nothing else says it.
    const saysFree = Object.entries(STATIC_META).filter(([, m]) => /\bfree\b/i.test(m.title + m.description)).map(([r]) => r)
    expect(saysFree.sort()).toEqual(['/', '/introduction'])
    for (const t of Object.values(STATIC_META).map(m => m.title)) expect(t === HOME_TITLE || t.endsWith(TITLE_TAIL)).toBe(true)
  })

  it('serves the app and the prerender from one function (metaForPath)', () => {
    expect(metaForPath('/chapters/1/', { chapters })).toEqual({
      title: chapterTitle(1, chapters[0].title),
      description: expect.stringContaining('three-part sentence pattern'),
    })
    expect(metaForPath('/quizzes/2', { chapters }).title).toBe(quizTitle(2, chapters[1].title))
    expect(metaForPath('/chapters/999', { chapters })).toBeNull()
    expect(metaForPath('/no-such-page', { chapters })).toBeNull()
  })

  it('ships the counter code empty', () => {
    expect(GOATCOUNTER_CODE).toBe('')
  })
})
