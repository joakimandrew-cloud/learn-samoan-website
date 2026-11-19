// The dictionary's built pages (Build-Spec part f): the hub, a page per word and per
// English word, /glossary's noindex shell, titles, structured data and the sitemap.
// The deploy runs the tests before the build, so this builds what it reads into a
// temporary folder from the source index.html and never reads dist/.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { prerender } from '../scripts/prerender.mjs'
import { loadDictionaryIndex } from '../scripts/lib/dictionary-data.mjs'
import { STATIC_META, dictionaryPageMeta } from '../src/seo/meta.js'

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const ORIGIN = 'https://learnsamoan.org'
let dist
let result
const index = loadDictionaryIndex(APP)

const file = route => path.join(dist, `${route.slice(1)}.html`)
const read = route => fs.readFileSync(file(route), 'utf8')
const count = (html, re) => (html.match(re) || []).length
const article = html => /<!-- prerender:root -->([\s\S]*?)<!-- \/prerender:root -->/.exec(html)?.[1] ?? ''
const jsonLd = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1].replaceAll('\\u003c', '<')))
const titleOf = html => /<title>([\s\S]*?)<\/title>/.exec(html)[1].replaceAll('&amp;', '&')

beforeAll(() => {
  dist = fs.mkdtempSync(path.join(os.tmpdir(), 'ls-dictionary-'))
  fs.copyFileSync(path.join(APP, 'index.html'), path.join(dist, 'index.html'))
  result = prerender({ dist, origin: ORIGIN, base: '/', quiet: true })
})

afterAll(() => {
  fs.rmSync(dist, { recursive: true, force: true })
})

describe('dictionary pages: what is built', () => {
  it('builds the hub, a page per word and a page per English word, in both file forms', () => {
    expect(result.dictionary).toEqual({ entries: index.entries.length, wordPages: index.pages.length, englishPages: index.english.length })
    expect(fs.existsSync(path.join(dist, 'dictionary.html'))).toBe(true)
    expect(fs.existsSync(path.join(dist, 'dictionary', 'index.html'))).toBe(true)
    for (const page of [...index.pages, ...index.english]) {
      expect(fs.existsSync(file(page.path)), page.path).toBe(true)
      expect(fs.existsSync(path.join(dist, page.path.slice(1), 'index.html')), page.path).toBe(true)
    }
  })

  it('gives each page the title and description of the meta module, one canonical and one h1', () => {
    for (const page of [...index.pages, ...index.english]) {
      const html = read(page.path)
      const meta = dictionaryPageMeta(page)
      expect(titleOf(html), page.path).toBe(meta.title)
      expect(html, page.path).toContain(`<meta name="description" content="${meta.description.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}" />`)
      expect(count(html, /<link rel="canonical"/g), page.path).toBe(1)
      expect(html).toContain(`<link rel="canonical" href="${ORIGIN}${page.path}" />`)
      expect(count(article(html), /<h1[ >]/g), page.path).toBe(1)
      expect(html).not.toMatch(/—/)
      expect(html).not.toMatch(/\bLesson/)
    }
    const hub = read('/dictionary')
    expect(titleOf(hub)).toBe(STATIC_META['/dictionary'].title)
    expect(count(article(hub), /<h1[ >]/g)).toBe(1)
  })

  it('keeps every title of an indexable page distinct', () => {
    const seen = new Map()
    for (const r of result.routes) {
      expect(seen.has(r.title), `${r.path} repeats ${seen.get(r.title)}`).toBe(false)
      seen.set(r.title, r.path)
    }
  })

  it('carries one DefinedTerm per entry on a word page, and the nodes of part (c) on the others', () => {
    for (const page of index.pages) {
      const graph = jsonLd(read(page.path))[0]['@graph']
      expect(graph.map(n => n['@type']), page.path).toEqual(['Organization', 'WebSite', 'DefinedTermSet', ...page.entries.map(() => 'DefinedTerm'), 'BreadcrumbList'])
    }
    expect(jsonLd(read('/dictionary'))[0]['@graph'].map(n => n['@type'])).toEqual(['Organization', 'WebSite', 'WebPage', 'DefinedTermSet', 'BreadcrumbList'])
    const english = index.english[0]
    expect(jsonLd(read(english.path))[0]['@graph'].map(n => n['@type'])).toEqual(['Organization', 'WebSite', 'BreadcrumbList'])
  })
})

describe('dictionary pages: served text', () => {
  it('links the hub to every word page and sets every Sāmoan link in lang="sm"', () => {
    const hub = article(read('/dictionary'))
    for (const page of index.pages) expect(hub, page.path).toContain(`href="${page.path}"`)
    for (const m of hub.matchAll(/<a href="\/dictionary\/[^"]+"([^>]*)>/g)) expect(m[1]).toContain('lang="sm"')
  })

  it('shows a word page\'s headwords, each entry\'s chapter link and its printed meaning', () => {
    for (const page of index.pages.filter((p, i) => i % 7 === 0)) {
      const html = article(read(page.path))
      for (const entry of page.entries) {
        expect(html, entry.id).toContain(`<span lang="sm">${entry.display.replaceAll('&', '&amp;')}</span>`)
        for (const chapter of entry.chapters) expect(html, entry.id).toContain(`href="${chapter.href}"`)
      }
    }
  })

  it('lists every word of an English page with a link', () => {
    for (const page of index.english.filter((p, i) => i % 9 === 0)) {
      const html = article(read(page.path))
      for (const entry of page.entries) expect(html, page.path).toContain(`href="${entry.path}"`)
    }
  })
})

describe('dictionary pages: the sitemap and /glossary', () => {
  it('lists the hub, every word page and every English page, and not /glossary', () => {
    const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8')
    const locs = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map(m => m[1])
    expect(locs).toContain(`${ORIGIN}/dictionary`)
    for (const page of [...index.pages, ...index.english]) expect(locs, page.path).toContain(`${ORIGIN}${page.path}`)
    expect(locs.filter(loc => loc.includes('/dictionary/'))).toHaveLength(index.pages.length + index.english.length)
    expect(locs).not.toContain(`${ORIGIN}/glossary`)
    expect(new Set(locs).size).toBe(locs.length)
  })

  it('writes /glossary as a noindex shell with a canonical to /dictionary and no served text', () => {
    const html = read('/glossary')
    expect(html).toContain('<meta name="robots" content="noindex" />')
    expect(html).toContain(`<link rel="canonical" href="${ORIGIN}/dictionary" />`)
    expect(count(html, /<link rel="canonical"/g)).toBe(1)
    expect(count(html, /application\/ld\+json/g)).toBe(0)
    expect(article(html)).toBe('')
  })

  it('stacks nothing on a second run', () => {
    const route = index.pages[0].path
    const before = read(route)
    prerender({ dist, origin: ORIGIN, base: '/', quiet: true })
    expect(read(route)).toBe(before)
  })
})
