// The dictionary's data build (Build-Spec part f): slugs and shared pages, bound
// forms, the vocabulary-list match, the title rule, the English-page rules, the
// example guard and the generated examples file. Every row these tests use is read
// from src/data/*.json or book/*.md; nothing in this file types a Sāmoan word or a gloss.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import glossary from '../src/data/glossary.json'
import vocabulary from '../src/data/book-vocabulary.json'
import chapters from '../src/data/chapters.json'
import examplesFile from '../src/premium/data/dictionary-examples.json'
import { buildDictionaryIndex, deriveEnglishHeadwords, entryDropReason, matchVocabulary } from '../src/premium/lib/dictionary-pages.js'
import { isBoundHeadword, plainTyping, splitSenses, withoutNotes, wordSlug } from '../src/premium/lib/dictionary-text.js'
import { meaningShowsIn, plainSenses } from '../src/premium/lib/dictionary-examples.js'
import { dictionaryWordTitle } from '../src/seo/meta.js'
import { EXAMPLES_FILE, drawExamples, examplesFileText } from '../scripts/lib/dictionary-data.mjs'

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const index = buildDictionaryIndex({ glossary, vocabulary, chapters, examples: examplesFile.examples })

// The slug rule written a second time, differently, so a change to the module that is not a change to the rule fails.
const foldedSlug = samoan => {
  const letters = samoan.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ʻ/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return /^[=-]|[=-]$/.test(samoan) ? `${letters}-form` : letters
}

describe('dictionary: rows, slugs and shared pages', () => {
  it('has one entry per glossary row except rows with the same headword and meaning, which merge', () => {
    const seen = new Set(glossary.map(row => `${row.samoan}\u0000${row.english}`))
    expect(index.entries).toHaveLength(seen.size)
    expect(index.entries.length).toBeLessThanOrEqual(glossary.length)
    // Nothing else is merged: two entries never share headword and meaning.
    expect(new Set(index.entries.map(e => `${e.samoan}\u0000${e.english}`)).size).toBe(index.entries.length)
  })

  it('gives every entry the slug of the rule, and no word the reserved addresses', () => {
    for (const entry of index.entries) {
      expect(entry.slug, entry.samoan).toBe(foldedSlug(entry.samoan))
      expect(entry.slug, entry.samoan).toMatch(/^[a-z0-9-]+$/)
      expect(['english', 'index'], entry.samoan).not.toContain(entry.slug)
    }
    expect(wordSlug('')).toBe('')
  })

  it('puts words that fold to one slug on one page, as separate entries under their own marked headwords', () => {
    const groups = new Map()
    for (const entry of index.entries) groups.set(entry.slug, [...(groups.get(entry.slug) || []), entry.samoan])
    const shared = [...groups.values()].filter(words => new Set(words).size > 1)
    // Counted from the data, not pinned: the pages are the distinct slugs, and the pages that hold more than one headword are the shared groups.
    expect(index.pages).toHaveLength(groups.size)
    expect(index.pages.filter(page => page.words.length > 1)).toHaveLength(shared.length)
    expect(shared.length).toBeGreaterThan(20)
    expect(index.pages.length).toBeGreaterThan(500)
    for (const page of index.pages) {
      expect(page.words).toEqual([...new Set(page.entries.map(entry => entry.display))])
      // The page holds the entries in the glossary's own order.
      const ids = page.entries.map(entry => Number(entry.id.slice(1)))
      expect(ids).toEqual([...ids].sort((a, b) => a - b))
    }
    // A pair that differs only by a macron or the glottal stop is two entries on one page, never one word.
    const marked = index.pages.find(page => page.words.length > 1 && page.words.some(w => plainTyping(w) === w) && page.words.some(w => plainTyping(w) !== w))
    expect(marked).toBeTruthy()
    expect(new Set(marked.entries.map(e => e.display)).size).toBe(marked.words.length)
  })

  it('writes a bound form at its own address and shares a page only with other bound forms', () => {
    const bound = index.entries.filter(entry => isBoundHeadword(entry.samoan))
    expect(bound.length).toBeGreaterThan(8)
    for (const entry of bound) {
      expect(entry.slug, entry.samoan).toMatch(/-form$/)
      const page = index.pageBySlug.get(entry.slug)
      expect(page.entries.every(e => isBoundHeadword(e.samoan)), entry.samoan).toBe(true)
    }
    for (const entry of index.entries.filter(e => !isBoundHeadword(e.samoan))) expect(entry.slug, entry.samoan).not.toMatch(/-form$/)
  })

  it('takes the hub letters from the glossary\'s own letter values, in file order', () => {
    expect(index.letters).toEqual([...new Set(glossary.map(row => row.letter))])
    expect(index.letters.length).toBeGreaterThan(10)
    for (const letter of index.letters) expect(letter).not.toMatch(/ng|ʻ/i)
  })
})

describe('dictionary: which vocabulary list teaches an entry', () => {
  it('matches on headword and chapter, and on the meaning too where more than one row matches', () => {
    let ambiguous = 0
    for (const row of glossary) {
      const same = vocabulary.filter(item => item.samoan === row.samoan && item.chapter === row.chapter)
      const matched = matchVocabulary(row, vocabulary)
      if (same.length <= 1) { expect(matched, row.samoan).toBe(same[0] || null); continue }
      ambiguous += 1
      const equal = same.filter(item => item.english === row.english)
      expect(matched, `${row.samoan} chapter ${row.chapter}`).toEqual(equal[0] || null)
    }
    // The judge's case: a word with a grammar row and a vocabulary row in one chapter.
    expect(ambiguous).toBeGreaterThan(0)
  })

  it('leaves a glossary row with no vocabulary match with no list', () => {
    const unmatched = index.entries.filter(entry => !entry.list)
    expect(unmatched.length).toBeGreaterThan(0)
    for (const entry of unmatched) expect(entry.listName).toBe('')
  })
})

describe('dictionary: the title rule', () => {
  it('carries meanings only for a one-headword page and only when the whole title fits in 60', () => {
    let withMeaning = 0
    for (const page of index.pages) {
      const title = dictionaryWordTitle(page)
      if (page.words.length > 1) {
        expect(title, page.slug).toBe(`${page.words.join(', ')} meaning · Sāmoan Dictionary`)
        continue
      }
      if (title.includes(' meaning:')) {
        withMeaning += 1
        expect(title.length, page.slug).toBeLessThanOrEqual(60)
      } else {
        expect(title, page.slug).toBe(`${page.words[0]} meaning · Sāmoan Dictionary`)
      }
    }
    expect(withMeaning).toBeGreaterThan(100)
  })

  it('never runs the meanings of two headwords together on one page', () => {
    const two = index.pages.filter(page => page.words.length > 1)
    expect(two.length).toBeGreaterThan(0)
    for (const page of two) for (const entry of page.entries) {
      const meaning = entry.english.replace(/\*/g, '')
      expect(dictionaryWordTitle(page), page.slug).not.toContain(meaning)
    }
  })
})

describe('dictionary: English pages', () => {
  const hasSense = (entry, re) => splitSenses(entry.english).some(item => re.test(item.text))

  it('keeps the four cases of the judge\'s gap 1 off the English pages', () => {
    const headwords = index.english.map(page => page.headword.toLowerCase())
    // A sense that opens with "of" qualifies the sense before it ("crow, of a rooster") and is dropped.
    const ofSenses = index.entries.filter(entry => !entryDropReason(entry) && hasSense(entry, /^of\b/i))
    expect(ofSenses.length).toBeGreaterThanOrEqual(2)
    expect(headwords.filter(h => /^of\b/.test(h))).toEqual([])
    for (const entry of ofSenses) {
      const first = splitSenses(entry.english)[0].sense.toLowerCase()
      expect(headwords, entry.samoan).toContain(first)
    }
    // A leading "also" is stripped, so the sense after it is the headword ("also tomorrow" is "tomorrow").
    const alsoSenses = index.entries.filter(entry => !entryDropReason(entry) && hasSense(entry, /^also\s/i))
    expect(alsoSenses.length).toBeGreaterThanOrEqual(2)
    expect(headwords.filter(h => /^also\b/.test(h))).toEqual([])
    for (const entry of alsoSenses) {
      const stripped = splitSenses(entry.english).find(item => item.alsoStripped)
      expect(headwords, entry.samoan).toContain(stripped.sense.toLowerCase())
    }
  })

  it('gives no English page to a grammar-list entry, an unlisted entry, a colon meaning or a bound form', () => {
    const onPages = new Set(index.english.flatMap(page => page.entries.map(entry => entry.id)))
    for (const entry of index.entries) {
      if (entry.list === 'grammar' || !entry.list || entry.english.includes(':') || isBoundHeadword(entry.samoan)) expect(onPages.has(entry.id), entry.samoan).toBe(false)
    }
    expect(onPages.size).toBeGreaterThan(300)
  })

  it('derives the headwords from the meanings and nowhere else', () => {
    expect(index.english.length).toBeGreaterThan(400)
    const { headwords } = deriveEnglishHeadwords(index.entries)
    expect(headwords).toHaveLength(index.english.length)
  })

  it('shows each word\'s printed meaning in full, and every sense is a plain English word or phrase of at most three words', () => {
    for (const page of index.english) {
      expect(page.headword, page.slug).toMatch(/^[A-Za-z]+(?:['-][A-Za-z]+)*(?: [A-Za-z]+(?:['-][A-Za-z]+)*)*$/)
      expect(page.headword.split(' ').length).toBeLessThanOrEqual(3)
      expect(page.entries.length).toBe(page.sources.length)
      for (const entry of page.entries) expect(glossary.some(row => row.samoan === entry.samoan && row.english === entry.english)).toBe(true)
    }
  })
})

describe('dictionary: examples', () => {
  it('gives no sentence to an entry whose headword is spelled the same as another entry on its page', () => {
    let checked = 0
    for (const page of index.pages) {
      for (const entry of page.entries) {
        const twin = page.entries.some(other => other.id !== entry.id && other.samoan.toLowerCase() === entry.samoan.toLowerCase())
        if (!twin) continue
        checked += 1
        expect(entry.examples, `${entry.samoan} (${entry.id})`).toEqual([])
      }
    }
    expect(checked).toBeGreaterThan(10)
  })

  it('gives a grammar word whose meaning holds a colon no sentence', () => {
    for (const entry of index.entries.filter(e => e.english.includes(':'))) expect(entry.examples, entry.samoan).toEqual([])
  })

  it('prints each pair as the book has it, from the entry\'s chapter or a later one, with the headword inside the marked span', () => {
    const book = number => fs.readFileSync(path.join(APP, 'book', `Chapter-${String(number).padStart(2, '0')}.md`), 'utf8')
    let pairs = 0
    for (const entry of index.entries) {
      expect(entry.examples.length).toBeLessThanOrEqual(3)
      for (const pair of entry.examples) {
        pairs += 1
        expect(pair.chapter, entry.samoan).toBeGreaterThanOrEqual(entry.chapter)
        const line = book(pair.chapter).split('\n')[pair.line - 1]
        expect(line, `${entry.samoan} chapter ${pair.chapter} line ${pair.line}`).toContain(`*${pair.samoan}*`)
        expect(line).toContain(pair.english.slice(0, 20))
        const [start, end] = pair.at
        expect(pair.samoan.slice(start, end).normalize('NFC').toLowerCase().replace(/[‘’ʼ`]/g, 'ʻ')).toBe(entry.samoan.normalize('NFC').toLowerCase().replace(/[‘’ʼ`]/g, 'ʻ'))
      }
    }
    expect(pairs).toBeGreaterThan(300)
  })

  it('has a generated examples file that is not stale', () => {
    // npm run build:dictionary-data rewrites it; this fails the moment the book or the glossary moves on without it.
    const current = fs.readFileSync(path.join(APP, EXAMPLES_FILE), 'utf8')
    expect(current).toBe(examplesFileText(drawExamples(APP)))
  })
})

describe('dictionary: rules mended after the page judge', () => {
  it('names one typing for a shared page only when every entry on it is typed that way', () => {
    const several = index.pages.filter(page => page.entries.length > 1)
    const typings = page => new Set(page.entries.map(entry => plainTyping(withoutNotes(entry.samoan)).toLowerCase()))
    expect(several.filter(page => typings(page).size > 1).length).toBeGreaterThan(0)
    expect(several.filter(page => typings(page).size === 1).length).toBeGreaterThan(0)
    for (const page of several) expect(page.typed, page.slug).toBe(typings(page).size === 1 ? [...typings(page)][0] : '')
  })

  it('counts the words of an English sense before its leading article or "to" comes off', () => {
    // Every sense on an English page, as the glossary prints it (a leading "also" off), is at most three words.
    let longer = 0
    for (const page of index.english) {
      for (const source of page.sources) {
        expect(source.senseText.replace(/^also\s+/i, '').split(/\s+/).length, `${page.slug}: ${source.senseText}`).toBeLessThanOrEqual(3)
      }
    }
    // The rule bites: some sense is three words once its article is off and four with it.
    for (const entry of index.entries) {
      for (const item of splitSenses(entry.english)) {
        if (item.sense.split(' ').length === 3 && item.text.replace(/^also\s+/i, '').split(/\s+/).length === 4) longer += 1
      }
    }
    expect(longer).toBeGreaterThan(0)
  })

  it('prints examples only for an entry with a plain sense, and only where that sense shows in the English', () => {
    let without = 0
    let withExamples = 0
    for (const entry of index.entries) {
      const senses = plainSenses(entry.samoan, entry.english)
      if (!senses.length) {
        if (entry.examples.length) without += 1
        continue
      }
      for (const pair of entry.examples) {
        withExamples += 1
        expect(meaningShowsIn(senses, pair.english), `${entry.samoan}: ${pair.english}`).toBe(true)
      }
    }
    expect(without).toBe(0)
    expect(withExamples).toBeGreaterThan(300)
  })
})
