// The two topic pages, /greetings and /alphabet (Build-Spec part g of
// plans/2026-11-19-samoan-site-search-features.md).
//
// Their Sāmoan is the one place on the site where Sāmoan is typed into a source
// file, so this holds it word for word, mark for mark, to the book lines each
// page is allowed to quote. It also holds the dash rule, the titles and
// descriptions, and what the prerender serves. The deploy runs the tests before
// the build, so the built pages are built here into a temporary folder and no
// test reads dist/.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { prerender } from '../scripts/prerender.mjs'
import { STATIC_META } from '../src/seo/meta.js'
import { plainInline, tokenizeInline } from '../src/seo/inline.js'
import { TOPIC_PAGES, topicByPath } from '../src/seo/pages/index.js'

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const ORIGIN = 'https://learnsamoan.org'
const book = name => fs.readFileSync(path.join(APP, 'book', name), 'utf8')
const lines = (name, pick) => book(name).split('\n').filter((_, i) => pick(i + 1)).join('\n')

// The book lines each page may quote. /greetings: Chapter 10 before its Words to
// Learn list, and the five lines of Chapter 24's conversation exercise that print
// a greeting, a thanks or a farewell. /alphabet: the Introduction and the
// Pronunciation Guide, whole.
const CHAPTER_24_LINES = [120, 127, 212, 216, 220]
const ALLOWED = {
  '/greetings': [lines('Chapter-10.md', n => n <= 202), lines('Chapter-24.md', n => CHAPTER_24_LINES.includes(n))].join('\n').normalize('NFC'),
  '/alphabet': [book('Introduction.md'), book('appendix-pronunciation.md')].join('\n').normalize('NFC'),
}

// The strings each page types, as the spec's part (b) table has them after Step 12.
const META = {
  '/greetings': {
    title: 'Hello in Sāmoan: Tālofa, the Reply and the Goodbyes · Learn Sāmoan',
    description: 'Tālofa is the Sāmoan hello, and the reply is tālofa back. The goodbyes, thank you and please, the good wishes and the lighter hi, each as the course teaches it.',
  },
  '/alphabet': {
    title: 'Sāmoan Alphabet: The Letters and How Each One Sounds · Learn Sāmoan',
    description: 'The Sāmoan alphabet has five vowels and thirteen consonants, one of them the ʻ mark. The letters, how they sound, what the long-vowel mark does, and where the stress falls.',
  },
}

/** Every string a page object holds, in page order. `sm` sides of examples are returned apart. */
export function stringsOf(doc) {
  const inline = [doc.eyebrow, doc.h1, ...(doc.chips || [])]
  const samoan = []
  const english = []
  for (const block of doc.blocks) {
    if (block.text != null) inline.push(block.text)
    if (block.k === 'table') inline.push(...block.headers, ...block.rows.flat())
    if (block.k === 'next') inline.push(...block.items.map(item => item.label))
    if (block.k === 'ex') for (const item of block.items) { samoan.push(item.sm); english.push(item.en) }
  }
  return { inline: inline.filter(s => s != null), samoan, english }
}

/** Every Sāmoan string of a page: the `*…*` spans and the `sm` sides of its examples. */
export function samoanSpans(doc) {
  const { inline, samoan } = stringsOf(doc)
  return [...inline.flatMap(s => tokenizeInline(s).filter(tok => tok.t === 'em').map(tok => tok.v)), ...samoan]
}

/** The words outside a span that carry a macron or the ʻ, the site's own "Sāmoa" and "Sāmoan" aside. */
function markedWordsOutsideSpans(strings) {
  const outside = strings.flatMap(s => tokenizeInline(s).filter(tok => tok.t !== 'em').map(tok => tok.v)).join(' ')
  return (outside.match(/[\p{L}ʻ]+/gu) || []).filter(w => /[āēīōūĀĒĪŌŪʻ]/.test(w) && !/^Sāmoan?$/.test(w))
}

describe('topic pages: the Sāmoan is the book\'s, word for word', () => {
  it('reads the book lines the pages are held to where the spec found them', () => {
    expect(book('Chapter-10.md').split('\n')[202]).toBe('## Words to Learn')
    expect(book('Chapter-24.md').split('\n')[119]).toBe('1. First speaker: *Tālofa.* (Hello.)')
    expect(book('Chapter-24.md').split('\n')[126]).toBe('8. Second speaker: *Tōfā soifua.* (Goodbye.)')
  })

  it('finds every *…* span and every example line in the allowed book lines, after NFC', () => {
    expect(TOPIC_PAGES.map(doc => doc.path)).toEqual(['/greetings', '/alphabet'])
    for (const doc of TOPIC_PAGES) {
      const spans = samoanSpans(doc)
      expect(spans.length, `${doc.path} spans`).toBeGreaterThan(20)
      const missing = spans.filter(span => !ALLOWED[doc.path].includes(span.normalize('NFC')))
      expect(missing, `${doc.path}: Sāmoan the allowed book lines do not print`).toEqual([])
    }
  })

  it('finds every marked word outside a span (a chip, a title, a description) in the same lines', () => {
    for (const doc of TOPIC_PAGES) {
      const { inline, english } = stringsOf(doc)
      const words = markedWordsOutsideSpans([...inline, ...english, STATIC_META[doc.path].title, STATIC_META[doc.path].description])
      const missing = words.filter(word => !ALLOWED[doc.path].includes(word.normalize('NFC')))
      expect(missing, `${doc.path}: marked words outside a span that the book lines do not print`).toEqual([])
    }
  })

  it('writes the glottal stop as U+02BB and never as an apostrophe or a quote mark inside Sāmoan', () => {
    for (const doc of TOPIC_PAGES) for (const span of samoanSpans(doc)) expect(span, doc.path).not.toMatch(/['‘’`]/)
  })
})

describe('topic pages: the house rules', () => {
  it('holds no U+2014, no spaced hyphen, no "Lesson", no "free" and no CEFR label in any string', () => {
    for (const doc of TOPIC_PAGES) {
      const { inline, samoan, english } = stringsOf(doc)
      for (const s of [...inline, ...samoan, ...english, STATIC_META[doc.path].title, STATIC_META[doc.path].description]) {
        expect(s, doc.path).not.toMatch(/—/)
        expect(s, doc.path).not.toMatch(/ [-–] /)
        expect(s, doc.path).not.toMatch(/\bLessons?\b/i)
        expect(s, doc.path).not.toMatch(/\bfree\b/i)
        expect(s, doc.path).not.toMatch(/\b[ABC][12]\b/)
        expect(s, doc.path).not.toMatch(/\bSamoan?\b/)
      }
    }
  })

  it('gives each page the title and description of the meta table', () => {
    for (const doc of TOPIC_PAGES) {
      expect(STATIC_META[doc.path], doc.path).toEqual(META[doc.path])
      expect(topicByPath(doc.path)).toBe(doc)
    }
  })

  it('is linked from the footer and from the /reference hub', () => {
    const chrome = fs.readFileSync(path.join(APP, 'src', 'premium', 'components', 'Chrome.jsx'), 'utf8')
    const hub = fs.readFileSync(path.join(APP, 'src', 'premium', 'pages', 'Reference.jsx'), 'utf8')
    for (const doc of TOPIC_PAGES) {
      expect(chrome, doc.path).toContain(`<Link to="${doc.path}">`)
      expect(hub, doc.path).toContain(`to: '${doc.path}'`)
    }
  })
})

describe('topic pages: what the prerender serves', () => {
  let dist
  let result
  const read = route => fs.readFileSync(path.join(dist, `${route.slice(1)}.html`), 'utf8')
  const article = html => /<!-- prerender:root -->([\s\S]*?)<!-- \/prerender:root -->/.exec(html)?.[1] ?? ''
  const unescape = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  // Inline tags close up, so "<em>Tālofa</em>," reads "Tālofa,"; every other tag is a break.
  const textOf = html => unescape(html.replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<\/?(?:em|strong|a)\b[^>]*>/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
  const flat = s => plainInline(s).replace(/\s+/g, ' ').trim()

  beforeAll(() => {
    dist = fs.mkdtempSync(path.join(os.tmpdir(), 'ls-topics-'))
    fs.copyFileSync(path.join(APP, 'index.html'), path.join(dist, 'index.html'))
    result = prerender({ dist, origin: ORIGIN, base: '/', quiet: true })
  })

  afterAll(() => {
    fs.rmSync(dist, { recursive: true, force: true })
  })

  it('writes both file forms, with the page\'s title, description and canonical', () => {
    for (const doc of TOPIC_PAGES) {
      expect(fs.existsSync(path.join(dist, doc.path.slice(1), 'index.html')), doc.path).toBe(true)
      const html = read(doc.path)
      expect(unescape(/<title>([\s\S]*?)<\/title>/.exec(html)[1]), doc.path).toBe(META[doc.path].title)
      expect(unescape(/<meta name="description" content="([^"]*)"/.exec(html)[1]), doc.path).toBe(META[doc.path].description)
      expect(html, doc.path).toContain(`<link rel="canonical" href="${ORIGIN}${doc.path}" />`)
      expect(html, doc.path).not.toContain('noindex')
    }
  })

  it('holds the <h1> and every block inside #root', () => {
    for (const doc of TOPIC_PAGES) {
      const html = article(read(doc.path))
      expect((html.match(/<h1[ >]/g) || []).length, doc.path).toBe(1)
      expect(textOf(/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)[1]), doc.path).toBe(flat(doc.h1))
      const served = textOf(html)
      const { inline, samoan, english } = stringsOf(doc)
      for (const s of [...inline, ...samoan, ...english]) expect(served, `${doc.path} serves "${flat(s).slice(0, 40)}"`).toContain(flat(s))
      expect((html.match(/<h2[ >]/g) || []).length, doc.path).toBe(doc.blocks.filter(b => b.k === 'h2').length)
      expect((html.match(/<table>/g) || []).length, doc.path).toBe(doc.blocks.filter(b => b.k === 'table').length)
    }
  })

  it('marks every Sāmoan span lang="sm", and nothing else', () => {
    for (const doc of TOPIC_PAGES) {
      const html = article(read(doc.path))
      const marked = [...html.matchAll(/<em lang="sm">([\s\S]*?)<\/em>/g)].map(m => unescape(m[1]))
      expect(marked.slice().sort(), doc.path).toEqual(samoanSpans(doc).sort())
      expect(html, doc.path).not.toMatch(/<em>/)
    }
  })

  it('links only to pages the build wrote: the chapter, the drills and the dictionary pages of the words', () => {
    const built = new Set(result.routes.map(r => r.path))
    for (const doc of TOPIC_PAGES) {
      const links = doc.blocks.filter(b => b.k === 'next').flatMap(b => b.items.map(item => item.to))
      expect(links.length, doc.path).toBeGreaterThan(3)
      for (const to of links) expect(built.has(to), `${doc.path} links to ${to}`).toBe(true)
    }
    const greetingLinks = topicByPath('/greetings').blocks.filter(b => b.k === 'next').flatMap(b => b.items.map(item => item.to))
    expect(greetingLinks).toContain('/chapters/10')
    expect(greetingLinks.filter(to => to.startsWith('/dictionary/')).length).toBeGreaterThan(0)
    expect(topicByPath('/alphabet').blocks.filter(b => b.k === 'next').flatMap(b => b.items.map(item => item.to))).toContain('/pronunciation')
  })

  it('is in the sitemap, with the nodes of part (c) and its own URL and description', () => {
    const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8')
    for (const doc of TOPIC_PAGES) {
      expect(sitemap, doc.path).toContain(`<loc>${ORIGIN}${doc.path}</loc>`)
      const blocks = [...read(doc.path).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1].replaceAll('\\u003c', '<')))
      expect(blocks, doc.path).toHaveLength(1)
      const graph = blocks[0]['@graph']
      expect(graph.map(n => n['@type']), doc.path).toEqual(['Organization', 'WebSite', 'Course', 'LearningResource', 'BreadcrumbList'])
      const resource = graph[3]
      expect(resource.url).toBe(`${ORIGIN}${doc.path}`)
      expect(resource.description).toBe(META[doc.path].description)
      expect(resource.name).toBe(flat(doc.h1))
      expect(JSON.stringify(graph)).not.toMatch(/"offers"|"price"|isAccessibleForFree|—/)
    }
  })
})
