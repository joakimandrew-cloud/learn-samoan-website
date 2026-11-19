#!/usr/bin/env node
// check-dictionary-pages.mjs: the page check of Build-Spec part f of
// plans/2026-11-19-samoan-site-search-features.md (method ported from the Tongan
// site's script of the same name). Run after `npm run build`; it reads dist/ and
// the dictionary index and exits 1 on any failure and on any count of zero.
//
//   npm run check:dictionary
//
// What it asserts, with each count printed:
//   - one built page per index word page and per English page, in both file
//     forms (<slug>.html and <slug>/index.html), identical, and no extra files
//   - every row of src/data/glossary.json lands on exactly one word page, and
//     that page's static body shows the row's headword
//   - every <title> of an indexable page in dist/ is unique, and the two files
//     of each route carry the same title
//   - on every dictionary page: one canonical equal to its own address; exactly
//     one <h1> in the static body; every JSON-LD block parses; a word page has
//     as many DefinedTerm nodes as entries; title and description equal
//     dictionaryPageMeta(page); no "Page not found" and no U+2014 dash; not noindex
//   - every dictionary address (the hub, each word page, each English page) is
//     in sitemap.xml, and /glossary is noindex with a canonical to /dictionary
//     and is not in the sitemap
//   - every lang="sm" string in a dictionary page's static body is found in the
//     course data (glossary.json, book-vocabulary.json) or in book/*.md
//   - /dictionary's static body links to every word page
// It also prints the counts of rows, word pages and English pages, and how many
// senses each English rule dropped.

import fs from 'node:fs'
import path from 'node:path'
import { STATIC_META, dictionaryPageMeta } from '../src/seo/meta.js'
import { entryDropReason } from '../src/premium/lib/dictionary-pages.js'
import { plainTyping } from '../src/premium/lib/dictionary-text.js'
import { APP_ROOT, englishDropCounts, loadDictionaryIndex, readDictionarySources } from './lib/dictionary-data.mjs'

const DIST = path.join(APP_ROOT, 'dist')
const SITE_URL = process.env.SITE_ORIGIN || 'https://learnsamoan.org'
const ROOT_OPEN = '<!-- prerender:root -->'
const ROOT_CLOSE = '<!-- /prerender:root -->'
const EM_DASH = String.fromCharCode(0x2014)

let failures = 0
const fail = (name, detail) => {
  failures += 1
  console.log(`FAIL  ${name}${detail ? `: ${detail}` : ''}`)
}
const pass = (name, detail) => console.log(`ok    ${name}${detail ? `: ${detail}` : ''}`)
const sample = list => list.slice(0, 5).join(' | ') + (list.length > 5 ? ` (and ${list.length - 5} more)` : '')

// A count that must equal what the index says and must not be zero.
function counted(name, got, want) {
  if (got === 0) return fail(name, 'count is zero')
  if (want !== undefined && got !== want) return fail(name, `${got} found, ${want} expected`)
  return pass(name, String(got))
}
// A list of problems: empty is a pass, and `seen` (how many things were looked at) must not be zero.
function none(name, seen, problems) {
  if (seen === 0) return fail(name, 'nothing was checked (count is zero)')
  if (problems.length) return fail(name, `${problems.length} of ${seen}: ${sample(problems)}`)
  return pass(name, `${seen} checked`)
}

const decode = s => s.replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&amp;', '&')
const stripTags = s => s.replace(/<[^>]*>/g, '')
const read = file => fs.readFileSync(file, 'utf8')
const escHtml = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

if (!fs.existsSync(DIST)) {
  console.log('FAIL  dist/ does not exist: run npm run build first')
  process.exit(1)
}

const index = loadDictionaryIndex()
const { glossary, vocabulary } = readDictionarySources()

// ---- every html file in dist/, one record per route ------------------------
const files = []
const walk = dir => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (entry.name.endsWith('.html')) files.push(full)
  }
}
walk(DIST)
const routeOf = file => {
  const rel = path.relative(DIST, file).split(path.sep).join('/')
  if (rel === 'index.html') return '/'
  return `/${rel.replace(/\/index\.html$/, '').replace(/\.html$/, '')}`
}
const byRoute = new Map()
for (const file of files) {
  const route = routeOf(file)
  if (!byRoute.has(route)) byRoute.set(route, [])
  byRoute.get(route).push(file)
}

const titleOf = html => decode(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '')
const descriptionOf = html => decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '')
const canonicalsOf = html => [...html.matchAll(/<link rel="canonical" href="([^"]*)"/g)].map(m => decode(m[1]))
const isNoindex = html => /<meta name="robots"[^>]*noindex/.test(html)
const bodyOf = html => {
  const from = html.indexOf(ROOT_OPEN)
  const to = html.indexOf(ROOT_CLOSE)
  return from === -1 || to === -1 ? '' : html.slice(from + ROOT_OPEN.length, to)
}

// ---- 1. counts ---------------------------------------------------------------
console.log('--- counts')
counted('rows in glossary.json (the dictionary\'s rows)', glossary.length)
counted('entries (rows with the same headword and meaning merged)', index.entries.length)
counted('word pages', index.pages.length)
counted('English pages', index.english.length)
const drops = englishDropCounts(index)
console.log(`      senses the English rules dropped: ${JSON.stringify(drops.dropped)}; leading "also" stripped: ${drops.alsoStripped}`)
const withSeveralHeadwords = index.pages.filter(page => page.words.length > 1).length
console.log(`      word pages holding more than one headword: ${withSeveralHeadwords}`)
counted('entries on an English page\'s list (rule: vocabulary and carry lists, no colon, no bound form)', index.entries.filter(entry => !entryDropReason(entry)).length)

// ---- 2. the files ------------------------------------------------------------
console.log('--- the files')
const dictDir = path.join(DIST, 'dictionary')
const englishDir = path.join(dictDir, 'english')
const listHtml = dir => fs.existsSync(dir) ? fs.readdirSync(dir).filter(n => n.endsWith('.html') && n !== 'index.html') : []
const listIndexDirs = (dir, skip = []) => fs.existsSync(dir)
  ? fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory() && !skip.includes(e.name) && fs.existsSync(path.join(dir, e.name, 'index.html'))).map(e => e.name)
  : []
const wordFlat = listHtml(dictDir)
const wordDirs = listIndexDirs(dictDir, ['english'])
const englishFlat = listHtml(englishDir)
const englishDirs = listIndexDirs(englishDir)
counted('word pages, <slug>.html files', wordFlat.length, index.pages.length)
counted('word pages, <slug>/index.html files', wordDirs.length, index.pages.length)
counted('English pages, <slug>.html files', englishFlat.length, index.english.length)
counted('English pages, <slug>/index.html files', englishDirs.length, index.english.length)
const dictionaryPages = [...index.pages, ...index.english]
none('every index page has both files, and the two are identical', dictionaryPages.length,
  dictionaryPages.filter(p => !fs.existsSync(path.join(DIST, `${p.path}.html`)) || !fs.existsSync(path.join(DIST, p.path, 'index.html')) || read(path.join(DIST, `${p.path}.html`)) !== read(path.join(DIST, p.path, 'index.html'))).map(p => p.path))
none('no word or English file without an index page', wordFlat.length + englishFlat.length, [
  ...wordFlat.filter(n => !index.pageBySlug.has(n.slice(0, -5))),
  ...englishFlat.filter(n => !index.englishBySlug.has(n.slice(0, -5))),
])

// ---- 3. every row on exactly one page ----------------------------------------
console.log('--- rows')
const pagesOfEntry = new Map()
for (const page of index.pages) for (const id of page.rowIds) pagesOfEntry.set(id, [...(pagesOfEntry.get(id) || []), page])
none('every entry is on exactly one word page', index.entries.length, index.entries.filter(entry => (pagesOfEntry.get(entry.id) || []).length !== 1).map(entry => entry.id))
none('no page holds an entry the data does not have', index.pages.length, index.pages.flatMap(p => p.rowIds).filter(id => !index.entries.some(entry => entry.id === id)))
// Every glossary row is in an entry: its headword and meaning are on that entry.
const entryKeys = new Set(index.entries.map(entry => `${entry.samoan}\u0000${entry.english}`))
none('every glossary row is shown as an entry (headword and meaning)', glossary.length, glossary.filter(row => !entryKeys.has(`${row.samoan}\u0000${row.english}`)).map(row => row.samoan))
const rowShown = []
for (const entry of index.entries) {
  const page = (pagesOfEntry.get(entry.id) || [])[0]
  if (!page) continue
  const body = bodyOf(read(path.join(DIST, `${page.path}.html`)))
  if (!body.includes(`>${escHtml(entry.display)}</`)) rowShown.push(`${entry.id}: ${entry.display} not in ${page.path}`)
}
none('the static body of each entry\'s page shows its headword', index.entries.length, rowShown)

// ---- 4. titles unique across the indexable pages of dist/ ---------------------
console.log('--- titles')
const titles = new Map()
const splitTitles = []
let routesRead = 0
for (const [route, group] of byRoute) {
  const own = [...new Set(group.map(f => titleOf(read(f))))]
  if (own.length > 1) splitTitles.push(route)
  if (isNoindex(read(group[0]))) continue
  routesRead += 1
  if (!titles.has(own[0])) titles.set(own[0], [])
  titles.get(own[0]).push(route)
}
counted('indexable routes in dist/ (two file forms of a route counted once)', routesRead)
none('the two files of every route carry the same title', byRoute.size, splitTitles)
none('every <title> of an indexable page in dist/ is unique', titles.size, [...titles].filter(([, routes]) => routes.length > 1).map(([title, routes]) => `"${title}" on ${routes.join(', ')}`))

// ---- 5. per page: canonical, h1, JSON-LD, meta, forbidden text ------------------
console.log('--- pages')
const problems = { canonical: [], h1: [], jsonld: [], terms: [], title: [], description: [], notFound: [], dash: [], noRoot: [], noindex: [] }
let jsonBlocks = 0
for (const page of dictionaryPages) {
  const html = read(path.join(DIST, `${page.path}.html`))
  const body = bodyOf(html)
  if (!body) problems.noRoot.push(page.path)
  const canonicals = canonicalsOf(html)
  if (canonicals.length !== 1 || canonicals[0] !== `${SITE_URL}${page.path}`) problems.canonical.push(page.path)
  if ((body.match(/<h1\b/g) || []).length !== 1) problems.h1.push(page.path)
  if (isNoindex(html)) problems.noindex.push(page.path)
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1])
  if (!blocks.length) problems.jsonld.push(`${page.path} has none`)
  let terms = 0
  for (const block of blocks) {
    jsonBlocks += 1
    try {
      const parsed = JSON.parse(block.replaceAll('\\u003c', '<'))
      terms += (parsed['@graph'] || []).filter(n => n['@type'] === 'DefinedTerm').length
    } catch {
      problems.jsonld.push(`${page.path} does not parse`)
    }
  }
  if (page.kind === 'word' && terms !== page.entries.length) problems.terms.push(`${page.path}: ${terms} terms, ${page.entries.length} entries`)
  const meta = dictionaryPageMeta(page)
  if (titleOf(html) !== meta.title) problems.title.push(page.path)
  if (descriptionOf(html) !== meta.description) problems.description.push(page.path)
  if (html.includes('Page not found')) problems.notFound.push(page.path)
  if (html.includes(EM_DASH)) problems.dash.push(page.path)
}
const total = dictionaryPages.length
none('every dictionary page has a static body', total, problems.noRoot)
none('every dictionary page has exactly one canonical, equal to its own address', total, problems.canonical)
none('every dictionary page has exactly one <h1> in its static body', total, problems.h1)
none('no dictionary page is noindex', total, problems.noindex)
none('every JSON-LD block on a dictionary page parses (and each page has one)', total, problems.jsonld)
counted('JSON-LD blocks read', jsonBlocks)
none('each word page has as many DefinedTerm nodes as entries', index.pages.length, problems.terms)
none('each page title equals dictionaryPageMeta(page).title', total, problems.title)
none('each page description equals dictionaryPageMeta(page).description', total, problems.description)
none('no dictionary page says "Page not found"', total, problems.notFound)
none('no dictionary page holds a U+2014 dash', total, problems.dash)

// ---- 6. the hub and /glossary ------------------------------------------------
console.log('--- the hub, /glossary and the sitemap')
const hubFile = path.join(DIST, 'dictionary.html')
const hubHtml = fs.existsSync(hubFile) ? read(hubFile) : ''
const hubBody = bodyOf(hubHtml)
const hubLinks = new Set([...hubBody.matchAll(/href="([^"]+)"/g)].map(m => m[1]))
none('/dictionary\'s static body has exactly one <h1>', 1, (hubBody.match(/<h1\b/g) || []).length === 1 ? [] : ['not one'])
none('/dictionary\'s title and description equal the meta table\'s', 1, titleOf(hubHtml) === STATIC_META['/dictionary'].title && descriptionOf(hubHtml) === STATIC_META['/dictionary'].description ? [] : ['differ'])
none('/dictionary\'s static body links to every word page', index.pages.length, index.pages.filter(p => !hubLinks.has(p.path)).map(p => p.path))
const glossaryFile = path.join(DIST, 'glossary.html')
const glossaryHtml = fs.existsSync(glossaryFile) ? read(glossaryFile) : ''
none('/glossary is noindex with a canonical to /dictionary', 1, glossaryHtml && isNoindex(glossaryHtml) && canonicalsOf(glossaryHtml).join() === `${SITE_URL}/dictionary` ? [] : ['not a noindex shell pointing at /dictionary'])

const sitemap = fs.existsSync(path.join(DIST, 'sitemap.xml')) ? read(path.join(DIST, 'sitemap.xml')) : ''
const locs = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map(m => m[1])
counted('URLs in sitemap.xml', locs.length)
const seenLocs = new Set()
const repeated = []
for (const loc of locs) { if (seenLocs.has(loc)) repeated.push(loc); seenLocs.add(loc) }
none('sitemap.xml has no duplicate', locs.length, repeated)
none('every dictionary address is in sitemap.xml', total + 1, ['/dictionary', ...dictionaryPages.map(p => p.path)].filter(p => !seenLocs.has(`${SITE_URL}${p}`)))
none('/glossary is not in sitemap.xml', 1, seenLocs.has(`${SITE_URL}/glossary`) ? ['it is'] : [])
counted('sitemap addresses under /dictionary/', locs.filter(loc => loc.includes('/dictionary/')).length, total)

// ---- 7. every lang="sm" string is the course's own ----------------------------
console.log('--- Sāmoan strings')
let book = ''
const bookDir = path.join(APP_ROOT, 'book')
for (const name of fs.readdirSync(bookDir).filter(n => n.endsWith('.md')).sort()) book += `${read(path.join(bookDir, name))}\n`
const known = new Set()
for (const row of glossary) known.add(row.samoan)
for (const row of vocabulary) known.add(row.samoan)
for (const letter of index.letters) known.add(letter)
const corpus = `${book}\n${glossary.map(r => `${r.samoan}\n${r.english}`).join('\n')}\n${vocabulary.map(r => `${r.samoan}\n${r.english}`).join('\n')}`
const knownPlain = new Set([...known].map(plainTyping).map(s => s.toLowerCase()))
const traced = new Map()
const isTraceable = text => {
  if (traced.has(text)) return traced.get(text)
  const parts = text.split(', ')
  const one = part => known.has(part) || corpus.includes(part) || knownPlain.has(plainTyping(part).toLowerCase())
  const ok = one(text) || (parts.length > 1 && parts.every(one))
  traced.set(text, ok)
  return ok
}
const untraced = []
let smStrings = 0
for (const page of [{ path: '/dictionary' }, ...dictionaryPages]) {
  const html = read(path.join(DIST, `${page.path}.html`))
  for (const m of bodyOf(html).matchAll(/<(span|a|h2|em)\b[^>]*\blang="sm"[^>]*>([\s\S]*?)<\/\1>/g)) {
    smStrings += 1
    const text = decode(stripTags(m[2])).trim()
    if (!isTraceable(text)) untraced.push(`${page.path}: ${text}`)
  }
}
counted('lang="sm" strings in the static bodies', smStrings)
none('every lang="sm" string is found in the course data or the book copy', smStrings, untraced)

console.log(failures ? `\n${failures} check(s) failed` : `\nall checks passed (${total} dictionary pages: ${index.pages.length} word, ${index.english.length} English; ${index.entries.length} entries)`)
process.exit(failures ? 1 : 0)
