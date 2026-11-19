// The dictionary's search, its address fragment and its failed-search count
// (Build-Spec parts d and f). Words come from the course data, never typed here.
import { describe, expect, it } from 'vitest'
import glossary from '../src/data/glossary.json'
import vocabulary from '../src/data/book-vocabulary.json'
import chapters from '../src/data/chapters.json'
import examplesFile from '../src/premium/data/dictionary-examples.json'
import { buildDictionaryIndex } from '../src/premium/lib/dictionary-pages.js'
import { browseDictionary, dictionaryGroups, searchDictionary, searchDictionaryDetailed } from '../src/premium/lib/course-dictionary.js'
import { readSearchAddress, searchAddress, searchAddressHash } from '../src/premium/lib/dictionary-address.js'
import { countFailedSearch, failedSearchEvent, failedSearchText, foundNothing } from '../src/premium/lib/dictionary-failed-search.js'
import { plainTyping } from '../src/premium/lib/dictionary-text.js'

const index = buildDictionaryIndex({ glossary, vocabulary, chapters, examples: examplesFile.examples })
const entries = index.entries

// Two entries of one page where one is the plain spelling of the other's marked spelling.
function markedPair() {
  for (const page of index.pages) {
    for (const marked of page.entries) {
      if (plainTyping(marked.samoan) === marked.samoan) continue
      const plain = page.entries.find(e => e.samoan === plainTyping(marked.samoan))
      if (plain) return { plain, marked }
    }
  }
  throw new Error('the data has no plain and marked pair on one page')
}

describe('dictionary search: ranking with and without marks', () => {
  it('puts the word as typed with its marks first, then the same word typed plain', () => {
    const { plain, marked } = markedPair()
    const withMarks = searchDictionaryDetailed(entries, marked.samoan)
    expect(withMarks.matches[0].id).toBe(marked.id)
    expect(withMarks.matches.map(e => e.id)).toContain(plain.id)
    const typedPlain = searchDictionaryDetailed(entries, plain.samoan)
    expect(typedPlain.matches[0].samoan).toBe(plain.samoan)
    // Typed without marks, the marked word is still found, after the plain one.
    const ids = typedPlain.matches.map(e => e.id)
    expect(ids).toContain(marked.id)
    expect(ids.indexOf(plain.id)).toBeLessThan(ids.indexOf(marked.id))
  })

  it('finds a word typed in capitals or with the glottal stop left out', () => {
    const withStop = entries.find(e => /ʻ/.test(e.samoan) && !/\s/.test(e.samoan) && !/[=-]/.test(e.samoan))
    expect(withStop).toBeTruthy()
    const typed = withStop.samoan.replace(/ʻ/g, '').toUpperCase()
    expect(searchDictionary(entries, typed).map(e => e.id)).toContain(withStop.id)
    expect(searchDictionary(entries, withStop.samoan.replace(/ʻ/g, "'")).map(e => e.id)).toContain(withStop.id)
  })

  it('finds an entry by a plain English sense in its meaning', () => {
    const page = index.english.find(p => p.entries.length > 0)
    const found = searchDictionary(entries, page.headword).map(e => e.id)
    for (const entry of page.entries) expect(found).toContain(entry.id)
  })

  it('returns every entry for an empty query and nothing at all for a nonsense one', () => {
    expect(searchDictionaryDetailed(entries, '').matches).toHaveLength(entries.length)
    const none = searchDictionaryDetailed(entries, 'qxzqxz')
    expect(foundNothing(none)).toBe(true)
  })

  it('browses a letter by the glossary\'s own letter values', () => {
    const groups = dictionaryGroups(entries)
    expect(groups).toEqual(index.letters)
    let total = 0
    for (const letter of groups) {
      const part = browseDictionary(entries, letter)
      expect(part.length).toBeGreaterThan(0)
      for (const entry of part) expect(entry.letter).toBe(letter)
      total += part.length
    }
    expect(total).toBe(entries.length)
  })
})

describe('dictionary: the address fragment', () => {
  it('keeps a search or a letter in the fragment and never in the query string', () => {
    const letters = index.letters
    expect(searchAddressHash('anything', '')).toBe('#q=anything')
    expect(searchAddressHash('', letters[2])).toBe(`#letter=${letters[2]}`)
    expect(searchAddressHash('', '')).toBe('')
    expect(searchAddress('two words')).toBe('/dictionary#q=two+words')
    expect(searchAddress('x')).not.toContain('?')
    expect(readSearchAddress('#q=hello', letters)).toEqual({ q: 'hello', letter: '' })
    expect(readSearchAddress(`#letter=${letters[2]}`, letters)).toEqual({ q: '', letter: letters[2] })
    expect(readSearchAddress('#letter=nothing', letters)).toEqual({ q: '', letter: '' })
    expect(readSearchAddress('#an-anchor', letters)).toEqual({ q: '', letter: '' })
  })
})

describe('dictionary: a failed search is counted through the counter, and only then', () => {
  const nothing = searchDictionaryDetailed(entries, 'qxzqxz')
  const fakeWindow = (extra = {}) => {
    const calls = []
    return { calls, win: { goatcounter: { count: event => calls.push(event) }, location: { search: '' }, localStorage: { getItem: () => null }, ...extra } }
  }

  it('sends one event for a settled search that found nothing, once per text', () => {
    const { calls, win } = fakeWindow()
    const sent = new Set()
    expect(countFailedSearch('qxzqxz', nothing, { win, sent })).toBe(true)
    expect(countFailedSearch('qxzqxz', nothing, { win, sent })).toBe(false)
    expect(calls).toEqual([{ path: 'dictionary-search-none/qxzqxz', title: 'Dictionary search that found nothing', event: true }])
  })

  it('does nothing when the page has no counter, when the search found something, or when the text is not allowed', () => {
    const found = searchDictionaryDetailed(entries, entries[0].samoan)
    expect(failedSearchEvent(entries[0].samoan, found)).toBeNull()
    expect(countFailedSearch('qxzqxz', nothing, { win: { location: { search: '' } }, sent: new Set() })).toBe(false)
    expect(countFailedSearch('qxzqxz', nothing, { win: undefined, sent: new Set() })).toBe(false)
    expect(failedSearchText('ab1')).toBe('')
    expect(failedSearchText('someone@here')).toBe('')
    expect(failedSearchText('x')).toBe('')
    const { calls, win } = fakeWindow({ location: { search: '?q=qxzqxz' } })
    expect(countFailedSearch('qxzqxz', nothing, { win, sent: new Set() })).toBe(false)
    expect(calls).toEqual([])
    const off = fakeWindow({ localStorage: { getItem: () => 't' } })
    expect(countFailedSearch('qxzqxz', nothing, { win: off.win, sent: new Set() })).toBe(false)
  })
})
