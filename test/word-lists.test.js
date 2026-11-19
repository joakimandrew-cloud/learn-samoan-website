// /word-lists: words the course teaches, sorted by theme
// (plans/2026-11-20-samoan-scribbles-site-tour.md, Step 2).
//
// The data file, src/premium/data/word-lists.json, types no word: it names rows of
// src/data/book-vocabulary.json by id. So this holds that every id is a vocabulary
// row, that no id is listed twice, that no Sāmoan letter is typed into the file,
// and that the page shows each word and its English exactly as its row has them
// and links it through the dictionary's own address function to a page that
// exists. It also holds the copy's house rules, the wiring and what the prerender
// serves. The deploy runs the tests before the build, so the served page is built
// here into a temporary folder and no test reads dist/.
//
// WORD_LISTS_DATA=<file> points the data tests at another copy of the data file
// (used once to show these tests fail on a broken copy; see the README).
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { prerender } from '../scripts/prerender.mjs'
import { loadDictionaryIndex } from '../scripts/lib/dictionary-data.mjs'
import { STATIC_META } from '../src/seo/meta.js'
import { wordPagePath, wordSlug } from '../src/premium/lib/dictionary-text.js'
import {
  COPY, THEME_MIN_WORDS, THEME_NOTES, WORD_LISTS_PATH, buildWordLists, checkWordLists, countWords, themeHref,
} from '../src/premium/lib/word-lists.js'

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const ORIGIN = 'https://learnsamoan.org'
const text = (...parts) => fs.readFileSync(path.join(APP, ...parts), 'utf8')
const json = (...parts) => JSON.parse(text(...parts))

const DATA_FILE = process.env.WORD_LISTS_DATA ? path.resolve(process.env.WORD_LISTS_DATA) : path.join(APP, 'src', 'premium', 'data', 'word-lists.json')
const raw = fs.readFileSync(DATA_FILE, 'utf8')
const data = JSON.parse(raw)
const vocabulary = json('src', 'data', 'book-vocabulary.json')
const chapters = json('src', 'data', 'chapters.json')
const byId = new Map(vocabulary.map(row => [row.id, row]))
const listed = data.themes.flatMap(theme => theme.words.map(id => ({ theme: theme.id, id })))

// A macron vowel, the glottal stop or a mark typed in its place, or a combining macron.
const SAMOAN_MARK = /[āēīōūĀĒĪŌŪ\u02BB\u2018\u2019\u02BC`']|\u0304/

const META = {
  title: 'Sāmoan Words by Theme: Family, Food, the Body and More · Learn Sāmoan',
  description: 'Lists of the words the Sāmoan course teaches, sorted by theme: family, food and drink, the body, the house, animals, time, numbers and more. Each word shows its English and the chapter that teaches it.',
}
// The words the /reference hub and the footer show for this page.
const HUB_CARD = {
  kicker: 'By theme',
  title: 'Word Lists',
  text: 'Words the course teaches, sorted by theme: family, food and drink, the body, the house, animals, time, numbers and more.',
}
const HUB_LEAD = 'The grammar charts, the dictionary and the word lists, for checking a form or finding a word while you work through the chapters.'
const FOOTER_LABEL = 'Word lists'

/** Every English string a visitor can read on the page, in its title or in a link to it. */
const englishStrings = () => [
  COPY.eyebrow, ...COPY.h1, COPY.lead, COPY.indexLabel, COPY.count(20, 300), COPY.themeCount(8), COPY.served(20, 300),
  COPY.closing, COPY.dictionaryLink, COPY.greetingsLead, COPY.greetingsLink,
  ...Object.values(THEME_NOTES),
  ...data.themes.map(theme => theme.label),
  META.title, META.description,
  ...Object.values(HUB_CARD), HUB_LEAD, FOOTER_LABEL,
]

describe('word lists: the data file types no word', () => {
  it('holds theme ids, theme labels and vocabulary ids, and nothing else', () => {
    expect(Object.keys(data)).toEqual(['themes'])
    expect(data.themes.length).toBeGreaterThan(0)
    for (const theme of data.themes) {
      expect(Object.keys(theme).sort(), theme.id).toEqual(['id', 'label', 'words'])
      expect(theme.id).toMatch(/^[a-z]+(?:-[a-z]+)*$/)
      expect(typeof theme.label === 'string' && theme.label.trim().length > 0, theme.id).toBe(true)
      expect(Array.isArray(theme.words), theme.id).toBe(true)
      for (const id of theme.words) expect(id, `${theme.id}: "${id}" is a vocabulary id, never a word`).toMatch(/^w\d{4}$/)
    }
    expect(new Set(data.themes.map(theme => theme.id)).size).toBe(data.themes.length)
    expect(new Set(data.themes.map(theme => theme.label)).size).toBe(data.themes.length)
  })

  it('names only rows of book-vocabulary.json', () => {
    for (const { theme, id } of listed) expect(byId.has(id), `${theme}: ${id} is not a row of book-vocabulary.json`).toBe(true)
  })

  it('lists no id twice: a word sits in one theme', () => {
    const seen = new Map()
    for (const { theme, id } of listed) {
      expect(seen.has(id), `${id} is listed twice: under ${seen.get(id)} and under ${theme}`).toBe(false)
      seen.set(id, theme)
    }
  })

  it('has no Sāmoan letter typed into it: no macron vowel and no ʻ mark', () => {
    raw.split('\n').forEach((line, at) => expect(SAMOAN_MARK.test(line), `line ${at + 1} of the data file holds a Sāmoan mark or a quote mark`).toBe(false))
  })

  it('themes no grammar word, gives each theme at least eight words and keeps the course\'s order', () => {
    expect(THEME_MIN_WORDS).toBe(8)
    for (const theme of data.themes) {
      expect(theme.words.length, theme.id).toBeGreaterThanOrEqual(THEME_MIN_WORDS)
      expect([...theme.words].sort(), `${theme.id}: its words run in the course's order`).toEqual(theme.words)
      for (const id of theme.words) expect(byId.get(id)?.list, `${theme.id}: ${id} is a grammar word`).not.toBe('grammar')
    }
  })

  it('passes the check the page and the prerender run before they build', () => {
    expect(checkWordLists(data, vocabulary)).toEqual([])
  })
})

describe('word lists: the check catches a broken data file', () => {
  const broken = change => { const copy = JSON.parse(JSON.stringify(data)); change(copy); return checkWordLists(copy, vocabulary) }
  const grammarId = vocabulary.find(row => row.list === 'grammar').id
  const markedWord = vocabulary.find(row => /[āēīōū]/.test(row.samoan)).samoan

  it('names an id that is not a vocabulary row', () => {
    expect(broken(copy => { copy.themes[0].words[0] = 'w9999' }).join(' ')).toMatch(/w9999 is not a row of book-vocabulary\.json/)
  })

  it('names an id listed twice, in one theme or in two', () => {
    expect(broken(copy => { copy.themes[1].words.push(copy.themes[0].words[0]) }).join(' ')).toMatch(/is listed twice/)
    expect(broken(copy => { copy.themes[0].words.push(copy.themes[0].words[0]) }).join(' ')).toMatch(/is listed twice/)
  })

  it('names a word typed in place of an id, and a mark typed into a label', () => {
    expect(broken(copy => { copy.themes[0].words[0] = markedWord }).join(' ')).toMatch(/no word is typed into this file/)
    expect(broken(copy => { copy.themes[0].label = `${copy.themes[0].label} ${markedWord}` }).join(' ')).toMatch(/labels are plain English/)
  })

  it('names a grammar word, a theme under eight words and a key the file may not hold', () => {
    expect(broken(copy => { copy.themes[0].words[0] = grammarId }).join(' ')).toMatch(/grammar words are not themed/)
    expect(broken(copy => { copy.themes[0].words = copy.themes[0].words.slice(0, 7) }).join(' ')).toMatch(/a theme needs at least 8/)
    expect(broken(copy => { copy.themes[0].english = 'typed' }).join(' ')).toMatch(/exactly id, label and words/)
    expect(broken(copy => { copy.words = [] }).join(' ')).toMatch(/one key, "themes"/)
  })

  it('stops the build: buildWordLists throws on it', () => {
    const copy = JSON.parse(JSON.stringify(data))
    copy.themes[0].words[0] = 'w9999'
    expect(() => buildWordLists(copy, vocabulary)).toThrow(/w9999 is not a row/)
  })
})

describe('word lists: each word is its vocabulary row, linked to its dictionary page and its chapter', () => {
  const themes = buildWordLists(data, vocabulary)
  const dictionary = loadDictionaryIndex(APP)

  it('keeps the themes and the words in the order of the data file', () => {
    expect(themes.map(theme => theme.id)).toEqual(data.themes.map(theme => theme.id))
    expect(themes.map(theme => theme.label)).toEqual(data.themes.map(theme => theme.label))
    expect(themes.map(theme => theme.rows.map(row => row.id))).toEqual(data.themes.map(theme => theme.words))
    expect(countWords(themes)).toBe(listed.length)
    for (const theme of themes) expect(theme.href).toBe(themeHref(theme.id))
    expect(themeHref('numbers')).toBe('/word-lists#numbers')
  })

  it('shows the Sāmoan and the English exactly as book-vocabulary.json prints them', () => {
    for (const theme of themes) {
      for (const row of theme.rows) {
        const source = byId.get(row.id)
        expect(row.samoan, row.id).toBe(source.samoan)
        expect(row.display, row.id).toBe(source.samoan)
        expect(row.english, row.id).toBe(source.english)
        expect(row.chapter, row.id).toBe(source.chapter)
      }
    }
  })

  it('links each word through the dictionary\'s own address function to a page that holds it', () => {
    for (const theme of themes) {
      for (const row of theme.rows) {
        expect(row.path, row.id).toBe(wordPagePath(wordSlug(row.samoan)))
        const page = dictionary.pageBySlug.get(wordSlug(row.samoan))
        expect(page?.path, `${row.id}: ${row.path} is a page of the dictionary`).toBe(row.path)
        const entries = page.entries.filter(entry => entry.samoan === row.samoan)
        expect(entries.length, `${row.id}: its dictionary page holds the word with the same marks`).toBeGreaterThan(0)
        expect(entries.some(entry => entry.chapters.some(chapter => chapter.number === row.chapter)), `${row.id}: the dictionary names Chapter ${row.chapter} for it`).toBe(true)
      }
    }
  })

  it('shows each word\'s chapter with a link to /chapters/N', () => {
    const numbers = new Set(chapters.map(chapter => chapter.chapter))
    for (const theme of themes) {
      for (const row of theme.rows) {
        expect(row.chapters, row.id).toEqual([{ number: row.chapter, href: `/chapters/${row.chapter}` }])
        expect(numbers.has(row.chapter), `${row.id}: Chapter ${row.chapter} exists`).toBe(true)
      }
    }
  })

  it('holds the Numbers note to the book: five is the word already taught for "hand", listed under The body', () => {
    const numbers = themes.find(theme => theme.id === 'numbers')
    const body = themes.find(theme => theme.id === 'the-body')
    expect(Object.keys(THEME_NOTES)).toEqual(['numbers'])
    expect(numbers.note).toBe(THEME_NOTES.numbers)
    expect(numbers.note).toContain(`listed under ${body.label}.`)
    const hand = body.rows.find(row => row.english === 'hand')
    expect(hand, 'a row glossed "hand" sits under The body').toBeTruthy()
    const chapter23 = text('book', 'Chapter-23.md').replace(/\s+/g, ' ')
    expect(chapter23).toContain(`Five, *${hand.samoan}*, is the word you already know for "hand".`)
    expect(hand.chapter).toBeLessThan(23)
    expect(numbers.rows.every(row => row.chapter === 23)).toBe(true)
    expect(numbers.rows.some(row => /\bfive\b/i.test(row.english)), 'no vocabulary row is glossed "five"').toBe(false)
    expect(vocabulary.some(row => /^five\b/i.test(row.english))).toBe(false)
  })
})

describe('word lists: the copy', () => {
  it('says plainly that these are words the course teaches', () => {
    expect(COPY.lead).toMatch(/^Words the course teaches, grouped by theme\./)
    expect(META.description).toMatch(/the words the Sāmoan course teaches/)
    expect(HUB_CARD.text).toMatch(/^Words the course teaches/)
  })

  it('says nothing of cost or access, and holds no U+2014, spaced hyphen, "Lesson" or CEFR label', () => {
    for (const s of englishStrings()) {
      expect(s).not.toMatch(/free|paid|price|member|open|subscri|donat|support/i)
      expect(s).not.toMatch(/—/)
      expect(s).not.toMatch(/ [-–] /)
      expect(s).not.toMatch(/\bLessons?\b/i)
      expect(s).not.toMatch(/\b[ABC][12]\b/)
    }
  })

  it('carries the macron on Sāmoa and Sāmoan, and types no other marked word', () => {
    for (const s of englishStrings()) {
      expect(s).not.toMatch(/\bSamoan?\b/)
      const marked = (s.match(/[\p{L}ʻ]+/gu) || []).filter(w => /[āēīōūĀĒĪŌŪʻ]/.test(w))
      expect(marked.filter(w => !/^Sāmoan?$/.test(w)), s).toEqual([])
    }
  })

  it('keeps the page file to the data: it types no word and draws each row with the dictionary\'s own row', () => {
    const page = text('src', 'premium', 'pages', 'WordLists.jsx')
    expect(page).not.toMatch(/[āēīōūĀĒĪŌŪʻ—]/)
    expect(page).not.toMatch(/free|paid|price|member|subscri|donat|support/i)
    expect(page).toContain("import vocabulary from '@app/data/book-vocabulary.json'")
    expect(page).toContain("import wordListData from '../data/word-lists.json'")
    expect(page).toContain("import { EntryRow } from '../components/DictionaryBits.jsx'")
    expect(page).toContain('buildWordLists(wordListData, vocabulary)')
    expect(page).toContain('<EntryRow key={row.id} entry={row} />')
  })
})

describe('word lists: the wiring', () => {
  it('has its route and its meta row', () => {
    expect(WORD_LISTS_PATH).toBe('/word-lists')
    expect(text('src', 'premium', 'App.jsx')).toContain('<Route path="/word-lists" element={<Page><WordLists /></Page>} />')
    expect(STATIC_META[WORD_LISTS_PATH]).toEqual(META)
    expect(META.title.length).toBeLessThanOrEqual(80)
    expect(META.description.length).toBeLessThanOrEqual(220)
    expect(Object.values(STATIC_META).filter(meta => meta.title === META.title)).toHaveLength(1)
  })

  it('is linked from the /reference hub and from the footer column that links the topic pages', () => {
    const hub = text('src', 'premium', 'pages', 'Reference.jsx')
    expect(hub).toContain(`{ to: '/word-lists', group: 'lookup', kicker: '${HUB_CARD.kicker}', title: '${HUB_CARD.title}', text: '${HUB_CARD.text}' },`)
    expect(hub).toContain(`lead: '${HUB_LEAD}',`)
    const chrome = text('src', 'premium', 'components', 'Chrome.jsx')
    const column = /<h2>Reference<\/h2>([\s\S]*?)<\/div>/.exec(chrome)[1]
    expect(column).toContain('<Link to="/greetings">')
    expect(column).toContain('<Link to="/alphabet">')
    expect(column).toContain(`<Link to="/word-lists">${FOOTER_LABEL}</Link>`)
    expect(chrome.match(/"\/word-lists"/g)).toHaveLength(1)
  })

  it('leaves the home page and the dictionary\'s search alone', () => {
    expect(text('src', 'premium', 'pages', 'Home.jsx')).not.toMatch(/word-lists/)
    expect(text('src', 'premium', 'pages', 'Dictionary.jsx')).not.toMatch(/word-lists|wordList/)
    expect(text('src', 'premium', 'lib', 'course-dictionary.js')).not.toMatch(/word-lists|wordList/)
  })

  it('uses the site\'s own stylesheets and tokens: no stylesheet, colour or font of its own', () => {
    const page = text('src', 'premium', 'pages', 'WordLists.jsx')
    expect([...page.matchAll(/import '([^']+\.css)'/g)].map(m => m[1])).toEqual(['../styles/catalog.css', '../styles/dictionary.css'])
    const rules = text('src', 'premium', 'styles', 'dictionary.css').split('\n').filter(line => /\.word-list/.test(line))
    expect(rules.length).toBeGreaterThan(5)
    const base = text('src', 'premium', 'styles', 'base.css')
    for (const rule of rules) {
      expect(rule).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|@font-face|@import/i)
      for (const m of rule.matchAll(/font(?:-family)?:[^;]*/g)) expect(m[0].replace(/var\([^)]*\)/g, '')).not.toMatch(/['"]|serif|sans|Georgia|Arial/)
      for (const m of rule.matchAll(/var\((--[a-z0-9-]+)/g)) expect(base, m[1]).toContain(`${m[1]}:`)
    }
  })
})

describe('word lists: what the prerender serves', () => {
  let dist
  let result
  let html
  const themes = buildWordLists(json('src', 'premium', 'data', 'word-lists.json'), vocabulary)
  const article = page => /<!-- prerender:root -->([\s\S]*?)<!-- \/prerender:root -->/.exec(page)?.[1] ?? ''
  const unescape = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
  const plainText = page => unescape(page.replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()

  beforeAll(() => {
    dist = fs.mkdtempSync(path.join(os.tmpdir(), 'ls-word-lists-'))
    fs.copyFileSync(path.join(APP, 'index.html'), path.join(dist, 'index.html'))
    result = prerender({ dist, origin: ORIGIN, base: '/', quiet: true })
    html = fs.readFileSync(path.join(dist, 'word-lists.html'), 'utf8')
  })

  afterAll(() => {
    fs.rmSync(dist, { recursive: true, force: true })
  })

  it('writes both file forms with one title, the description and the canonical', () => {
    expect(fs.readFileSync(path.join(dist, 'word-lists', 'index.html'), 'utf8')).toBe(html)
    expect(html.match(/<title>/g)).toHaveLength(1)
    expect(unescape(/<title>([\s\S]*?)<\/title>/.exec(html)[1])).toBe(META.title)
    expect(unescape(/<meta name="description" content="([^"]*)"/.exec(html)[1])).toBe(META.description)
    expect(html).toContain(`<link rel="canonical" href="${ORIGIN}/word-lists" />`)
    expect(html).not.toContain('noindex')
  })

  it('serves the heading, the lead-in and every theme inside #root', () => {
    const served = article(html)
    expect(html).toContain('<div id="root"><!-- prerender:root --><article ')
    expect((served.match(/<h1[ >]/g) || []).length).toBe(1)
    expect(plainText(/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(served)[1])).toBe(COPY.h1.join(' '))
    const words = plainText(served)
    expect(words).toContain(COPY.lead)
    expect(words).toContain(COPY.served(themes.length, countWords(themes)))
    expect(words).toContain(THEME_NOTES.numbers)
    expect([...served.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map(m => plainText(m[1]))).toEqual(themes.map(theme => theme.label))
  })

  it('serves every word as its row prints it, marked lang="sm", with its English and its chapter', () => {
    const served = article(html)
    const rows = themes.flatMap(theme => theme.rows)
    const items = [...served.matchAll(/<li><a href="([^"]+)" lang="sm"[^>]*>([\s\S]*?)<\/a>: ([\s\S]*?) <a href="\/chapters\/(\d+)"[^>]*>Chapter (\d+)<\/a><\/li>/g)]
    expect(items).toHaveLength(rows.length)
    items.forEach((item, at) => {
      const row = rows[at]
      expect(item[1], row.id).toBe(row.path)
      expect(unescape(item[2]), row.id).toBe(row.samoan)
      // The English with its tags taken out is the row's English with its italic marks taken out.
      expect(unescape(item[3].replace(/<[^>]+>/g, '')), row.id).toBe(row.english.replace(/\*/g, ''))
      expect(Number(item[4]), row.id).toBe(row.chapter)
      expect(Number(item[5]), row.id).toBe(row.chapter)
    })
  })

  it('links only to pages the build writes, and holds no U+2014 and no "Page not found"', () => {
    const served = article(html)
    const built = new Set(result.routes.map(r => r.path))
    const links = [...served.matchAll(/href="([^"]+)"/g)].map(m => m[1])
    expect(links.length).toBeGreaterThan(2 * countWords(themes))
    for (const link of links) expect(built.has(link), `links to ${link}`).toBe(true)
    expect(links).toContain('/dictionary')
    expect(links).toContain('/greetings')
    expect(links).toContain('/reference')
    expect(html).not.toMatch(/—|Page not found/)
  })

  it('is in the sitemap, with a WebPage node of its own URL and description', () => {
    expect(fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8')).toContain(`<loc>${ORIGIN}/word-lists</loc>`)
    expect(result.routes.filter(r => r.path === '/word-lists')).toHaveLength(1)
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1].replaceAll('\\u003c', '<')))
    expect(blocks).toHaveLength(1)
    const graph = blocks[0]['@graph']
    expect(graph.map(n => n['@type'])).toEqual(['Organization', 'WebSite', 'WebPage'])
    expect(graph[2].url).toBe(`${ORIGIN}/word-lists`)
    expect(graph[2].name).toBe(META.title)
    expect(graph[2].description).toBe(META.description)
    expect(JSON.stringify(graph)).not.toMatch(/"offers"|"price"|isAccessibleForFree|—/)
  })

  it('is linked from the served text of /reference', () => {
    expect(article(fs.readFileSync(path.join(dist, 'reference.html'), 'utf8'))).toContain('<a href="/word-lists"')
  })
})
