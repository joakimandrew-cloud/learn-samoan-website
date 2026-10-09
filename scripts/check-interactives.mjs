#!/usr/bin/env node
/**
 * The honesty gate for chapter interactives (src/data/interactives/NN.json).
 *
 * Every Samoan string an interactive shows must be printed in the course:
 * a verbatim piece of that chapter's learner copy (book/Chapter-NN.md), or of
 * an earlier chapter's, matched at word edges. Every English line paired with
 * a Samoan string must be printed too. A fill-the-blank prompt completed with
 * its answer must be a printed sentence, and a word-order target is a printed
 * sentence cut into its own words. Samoan inside free English (titles,
 * captions, notes, why-lines) is written in *italics* and checked the same way.
 * Nothing composed is shown as Samoan (DECISIONS 2026-08-27, rulings 6 and 7).
 *
 *   node scripts/check-interactives.mjs          every chapter file
 *   node scripts/check-interactives.mjs 7 12     chapters 7 and 12 only
 *   node scripts/check-interactives.mjs --file <path>   one file (a fixture)
 *
 * Exit code 1 when anything fails. test/interactives.test.js runs the same
 * checks, so a failure here fails `npm test`.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { slugify } from '../src/lib/slugify.js'

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const DATA_DIR = path.join(APP, 'src', 'data', 'interactives')
const BOOK = path.join(APP, 'book')
const pad = n => String(n).padStart(2, '0')

export const FIGURE_KINDS = ['anatomy', 'builder', 'contrast', 'grid', 'scale', 'dialogue']
export const PRACTICE_KINDS = ['pick', 'order', 'match', 'sort', 'type']
export const KINDS = [...FIGURE_KINDS, ...PRACTICE_KINDS]

// ---------------------------------------------------------------------------
// The printed text, normalised for matching
// ---------------------------------------------------------------------------

// Markdown markup and typography that are not part of the words: emphasis
// stars, escapes, the examples-block fences, table pipes, curly quotes.
export function plainText(md) {
  return String(md ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/^:::.*$/gm, ' ')
    .replace(/\\([*_\\[\]()`#+\-.!|])/g, '$1')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?span[^>]*>/gi, ' ')
    .replace(/\*+/g, '')
    .replace(/(^|\s)_([^_\n]+)_(?=\s|[.,;:!?)]|$)/g, '$1$2')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\|/g, ' | ')
    .replace(/[ \t]*\n[ \t]*/g, ' ')
    .replace(/\s+/g, ' ')
}

export function normalise(s) {
  return String(s ?? '')
    .replace(/\*+/g, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

// A Samoan word is letters (with macrons and the glottal stop ʻ) and hyphens.
const LETTER = "A-Za-zĀĒĪŌŪāēīōūʻ"
const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Matched at word edges, so "alu" is not found inside "malu". The first
// letter may differ in case only (a sentence-initial capital).
export function findAt(text, needle) {
  const n = normalise(needle)
  if (!n) return false
  const first = n[0]
  const head = first.toLowerCase() !== first.toUpperCase() ? `[${escapeRe(first.toLowerCase())}${escapeRe(first.toUpperCase())}]` : escapeRe(first)
  const re = new RegExp(`(^|[^${LETTER}])${head}${escapeRe(n.slice(1))}(?=$|[^${LETTER}])`)
  return re.test(text)
}

let bookCache = null
export function loadBook() {
  if (bookCache) return bookCache
  const chapters = new Map()
  for (const file of fs.readdirSync(BOOK)) {
    const m = file.match(/^Chapter-(\d+)\.md$/)
    if (m) chapters.set(Number(m[1]), plainText(fs.readFileSync(path.join(BOOK, file), 'utf8')))
  }
  const intro = fs.existsSync(path.join(BOOK, 'Introduction.md')) ? plainText(fs.readFileSync(path.join(BOOK, 'Introduction.md'), 'utf8')) : ''
  bookCache = { chapters, intro }
  return bookCache
}

// Where a string is printed: this chapter first, then earlier chapters, then
// the Introduction. Returns the chapter number, 0 for the Introduction, or null.
export function attestedIn(n, s, book = loadBook()) {
  if (book.chapters.has(n) && findAt(book.chapters.get(n), s)) return n
  for (let k = n - 1; k >= 1; k -= 1) if (book.chapters.has(k) && findAt(book.chapters.get(k), s)) return k
  if (book.intro && findAt(book.intro, s)) return 0
  return null
}

// A Samoan string and its English are printed together: the English follows
// the Samoan (or comes just before it) with only separators between them:
// spaces, a table bar, an arrow, brackets, quotes, "means", "the", "to"...,
// or one table cell (a literal column) in between. Catches an English line
// borrowed from the neighbouring example.
const GAP = /^(?:[\s|↘↗=:,;"'“”‘’()[\]*.!?/-]|(?:means|is|are|or|and|the|a|an|to|Lit)(?![A-Za-z]))*/
const GAP_END = /(?:[\s|↘↗=:,;"'“”‘’()[\]*.!?/-]|(?:means|is|are|or|and|the|a|an|to|Lit)(?![A-Za-z]))*$/
const WORD_CHAR = /[\p{L}\p{M}\p{N}_]/u
const startsWith = (text, needle) => {
  return text[0]?.toLowerCase() === needle[0].toLowerCase()
    && text.slice(1).startsWith(needle.slice(1))
    && !(WORD_CHAR.test(needle.at(-1)) && WORD_CHAR.test(text[needle.length] || ''))
}
const endsWith = (text, needle) => text.toLowerCase().endsWith(needle.toLowerCase())
  && !(WORD_CHAR.test(needle[0]) && WORD_CHAR.test(text[text.length - needle.length - 1] || ''))
// Preserve gloss-leading words, and never match across two table-row bars.
const SEPARATORS = /^[\s|↘↗=:,;"'“”‘’()[\]*.!?/-]*/
const SEPARATORS_END = /[\s|↘↗=:,;"'“”‘’()[\]*.!?/-]*$/
function followedBy(after, en) {
  const boundary = after.search(/\|\s*\|/)
  const row = boundary < 0 ? after : after.slice(0, boundary)
  const matches = text => startsWith(text.replace(SEPARATORS, ''), en) || startsWith(text.replace(GAP, ''), en)
  if (matches(row)) return true
  // One intervening cell is the printed literal-translation column.
  const rest = row.replace(SEPARATORS, '')
  const bar = rest.indexOf('|')
  return bar >= 0 && bar < 90 && matches(rest.slice(bar))
}
function precededBy(before, en) {
  const boundaries = [...before.matchAll(/\|\s*\|/g)]
  const boundary = boundaries.at(-1)
  const row = boundary ? before.slice(boundary.index + boundary[0].length) : before
  const matches = text => [text.replace(SEPARATORS_END, ''), text.replace(GAP_END, '')]
    .some(rest => endsWith(rest, en))
  if (matches(row)) return true
  const rest = row.replace(SEPARATORS_END, '')
  const bar = rest.lastIndexOf('|')
  return bar >= 0 && rest.length - bar < 90 && matches(rest.slice(0, bar))
}
export function pairedIn(n, sm, en, book = loadBook()) {
  const a = normalise(sm)
  const b = normalise(en).replace(/^[↘↗]\s*/, '')
  if (!a || !b) return false
  const first = a[0]
  const head = first.toLowerCase() !== first.toUpperCase() ? `[${escapeRe(first.toLowerCase())}${escapeRe(first.toUpperCase())}]` : escapeRe(first)
  const re = new RegExp(`(^|[^${LETTER}])${head}${escapeRe(a.slice(1))}(?=$|[^${LETTER}])`, 'g')
  const texts = []
  for (let k = n; k >= 1; k -= 1) if (book.chapters.has(k)) texts.push(book.chapters.get(k))
  if (book.intro) texts.push(book.intro)
  for (const text of texts) {
    for (const m of text.matchAll(re)) {
      const at = m.index + m[1].length
      if (followedBy(text.slice(at + a.length, at + a.length + 220), b)) return true
      if (precededBy(text.slice(Math.max(0, at - 220), at), b)) return true
    }
  }
  return false
}

// Heading slugs a chapter's interactives can be anchored after.
export function headingSlugs(md, slugify) {
  const teaching = String(md).split(/^##\s+(?:Exercises|Answers)\s*$/m)[0]
  return new Set([...teaching.matchAll(/^#{2,3}\s+(.+?)\s*$/gm)].map(m => slugify(m[1].replace(/\*/g, ''))))
}

// ---------------------------------------------------------------------------
// The checks
// ---------------------------------------------------------------------------

const BLANK = '___'
const SENTENCE_END = /[.?!]+$/

// Samoan-looking words in free English must sit inside *italics*.
const SAMOAN_MARK = /[āēīōūĀĒĪŌŪʻ]/
const NO_DASH = /—/
const CEFR = /\b[ABC][12]\b/
const LESSON = /\blessons?\b/i

export function validateFile(data, { file = '', book = loadBook(), slugs = null } = {}) {
  const errors = []
  const warnings = []
  const where = (it, field) => `${file}${it ? ` ${it.id}` : ''}${field ? ` ${field}` : ''}`
  const n = data?.chapter
  if (!Number.isInteger(n) || !book.chapters.has(n)) {
    errors.push(`${file}: "chapter" must be a chapter number with a book file (got ${JSON.stringify(n)})`)
    return { errors, warnings }
  }
  if (!Array.isArray(data.items)) {
    errors.push(`${file}: "items" must be an array`)
    return { errors, warnings }
  }

  const samoan = (it, field, s, { sentence = false } = {}) => {
    if (typeof s !== 'string' || !s.trim()) { errors.push(`${where(it, field)}: missing Samoan string`); return }
    if (s.includes('*')) errors.push(`${where(it, field)}: Samoan fields hold plain text, without *stars*: ${s}`)
    const at = attestedIn(n, s, book)
    if (at === null) errors.push(`${where(it, field)}: not printed in Chapter ${n} or before: "${s}"`)
    if (sentence && at !== null && at !== n) warnings.push(`${where(it, field)}: printed in ${at === 0 ? 'the Introduction' : `Chapter ${at}`}, not Chapter ${n}: "${s}"`)
  }
  const english = (it, field, s, { required = true } = {}) => {
    if (s == null || s === '') { if (required) errors.push(`${where(it, field)}: missing English`); return }
    if (typeof s !== 'string') { errors.push(`${where(it, field)}: English must be a string`); return }
    if (attestedIn(n, s, book) === null) errors.push(`${where(it, field)}: English not printed in Chapter ${n} or before: "${s}"`)
  }
  // The English must be printed beside this Samoan, not just somewhere.
  const pair = (it, field, sm, en) => {
    if (typeof sm !== 'string' || typeof en !== 'string' || !sm.trim() || !en.trim()) return
    if (attestedIn(n, sm, book) === null || attestedIn(n, en, book) === null) return
    // A single word keeps its gloss without the sentence's final stop.
    const word = /\s/.test(sm.trim()) ? sm : sm.replace(/[.?!,;:]+$/, '')
    if (!pairedIn(n, sm, en, book) && !pairedIn(n, word, en, book)) errors.push(`${where(it, field)}: "${en}" is not printed beside "${sm}"; use the chapter's own translation of this Samoan`)
  }
  // Free English written for the site: no dash, no level codes, no "Lesson",
  // and any Samoan inside it in *italics*, each italic span printed.
  const prose = (it, field, s, { required = false } = {}) => {
    if (s == null || s === '') { if (required) errors.push(`${where(it, field)}: missing text`); return }
    if (typeof s !== 'string') { errors.push(`${where(it, field)}: must be a string`); return }
    if (NO_DASH.test(s)) errors.push(`${where(it, field)}: em dash in site copy`)
    if (/\s-\s/.test(s)) errors.push(`${where(it, field)}: spaced hyphen used as a dash`)
    if (CEFR.test(s)) errors.push(`${where(it, field)}: level code in site copy`)
    if (LESSON.test(s)) errors.push(`${where(it, field)}: says "lesson"; the course says "chapter"`)
    const italics = [...s.matchAll(/\*([^*]+)\*/g)].map(m => m[1])
    for (const span of italics) {
      if (/[bcdjqwxyz]/i.test(span)) continue // an English word in italics
      if (attestedIn(n, span, book) === null) errors.push(`${where(it, field)}: Samoan in italics not printed in Chapter ${n} or before: "${span}"`)
    }
    const bare = s.replace(/\*[^*]+\*/g, ' ')
    const marked = bare.split(/\s+/).filter(w => SAMOAN_MARK.test(w))
    if (marked.length) errors.push(`${where(it, field)}: Samoan outside *italics* (${marked.slice(0, 3).join(', ')}); wrap it so it renders and is checked as Samoan`)
  }
  const ids = new Set()

  for (const it of data.items) {
    if (!it || typeof it !== 'object') { errors.push(`${file}: an item is not an object`); continue }
    if (!it.id || typeof it.id !== 'string') errors.push(`${file}: an item has no id`)
    else if (ids.has(it.id)) errors.push(`${where(it)}: duplicate id`)
    else ids.add(it.id)
    if (!KINDS.includes(it.kind)) { errors.push(`${where(it)}: unknown kind "${it.kind}" (one of ${KINDS.join(', ')})`); continue }
    if (!it.anchor || typeof it.anchor !== 'string') errors.push(`${where(it)}: no anchor (a heading slug in the chapter)`)
    else if (slugs && !slugs.has(it.anchor)) errors.push(`${where(it)}: anchor "${it.anchor}" is not a heading in Chapter ${n} (${[...slugs].join(', ')})`)
    else if (/^(exercises|answers)$/.test(it.anchor)) errors.push(`${where(it)}: anchor after a teaching heading, not "${it.anchor}"`)
    if (it.place != null && !['lead', 'end'].includes(it.place)) errors.push(`${where(it)}: place must be "lead" or "end"`)
    prose(it, 'title', it.title, { required: true })
    prose(it, 'caption', it.caption)
    prose(it, 'intro', it.intro)
    const d = it.data
    if (!d || typeof d !== 'object') { errors.push(`${where(it)}: no data`); continue }

    if (it.kind === 'anatomy') {
      samoan(it, 'data.sentence.sm', d.sentence?.sm, { sentence: true })
      english(it, 'data.sentence.en', d.sentence?.en)
      pair(it, 'data.sentence', d.sentence?.sm, d.sentence?.en)
      if (!Array.isArray(d.parts) || d.parts.length < 2) errors.push(`${where(it, 'data.parts')}: needs at least two parts`)
      else {
        const joined = d.parts.map(p => p.sm).join(' ')
        if (normalise(joined) !== normalise(d.sentence?.sm)) errors.push(`${where(it, 'data.parts')}: the parts, joined with spaces, must spell the sentence ("${joined}" vs "${d.sentence?.sm}")`)
        d.parts.forEach((p, i) => {
          english(it, `data.parts[${i}].gloss`, p.gloss)
          pair(it, `data.parts[${i}]`, p.sm, p.gloss)
          prose(it, `data.parts[${i}].role`, p.role, { required: true })
          prose(it, `data.parts[${i}].note`, p.note, { required: true })
        })
      }
    }

    if (it.kind === 'builder') {
      const slots = Array.isArray(d.slots) ? d.slots : []
      if (slots.length < 1) errors.push(`${where(it, 'data.slots')}: needs at least one slot`)
      const optionIds = new Map()
      slots.forEach((slot, si) => {
        if (!slot.key) errors.push(`${where(it, `data.slots[${si}].key`)}: missing`)
        prose(it, `data.slots[${si}].label`, slot.label, { required: true })
        const ids = new Set()
        ;(slot.options || []).forEach((o, oi) => {
          if (!o.id) errors.push(`${where(it, `data.slots[${si}].options[${oi}].id`)}: missing`)
          ids.add(o.id)
          samoan(it, `data.slots[${si}].options[${oi}].sm`, o.sm)
          english(it, `data.slots[${si}].options[${oi}].en`, o.en)
          pair(it, `data.slots[${si}].options[${oi}]`, o.sm, o.en)
        })
        if (ids.size < 2) errors.push(`${where(it, `data.slots[${si}].options`)}: a slot needs at least two options`)
        optionIds.set(slot.key, ids)
      })
      const sentences = Array.isArray(d.sentences) ? d.sentences : []
      if (sentences.length < 2) errors.push(`${where(it, 'data.sentences')}: needs at least two printed sentences`)
      const seen = new Set()
      sentences.forEach((s, i) => {
        samoan(it, `data.sentences[${i}].sm`, s.sm, { sentence: true })
        english(it, `data.sentences[${i}].en`, s.en)
        pair(it, `data.sentences[${i}]`, s.sm, s.en)
        const pick = s.pick || {}
        for (const slot of slots) {
          if (!optionIds.get(slot.key)?.has(pick[slot.key])) errors.push(`${where(it, `data.sentences[${i}].pick.${slot.key}`)}: not one of the slot's option ids`)
        }
        const key = JSON.stringify(slots.map(slot => pick[slot.key]))
        if (seen.has(key)) errors.push(`${where(it, `data.sentences[${i}]`)}: two sentences share the same picks`)
        seen.add(key)
      })
      // Every option must lead to at least one sentence.
      slots.forEach((slot, si) => (slot.options || []).forEach((o, oi) => {
        if (!sentences.some(s => s.pick?.[slot.key] === o.id)) errors.push(`${where(it, `data.slots[${si}].options[${oi}]`)}: no sentence uses this option`)
      }))
    }

    if (it.kind === 'contrast') {
      if (d.mode != null && !['toggle', 'steps'].includes(d.mode)) errors.push(`${where(it, 'data.mode')}: "toggle" or "steps"`)
      const states = Array.isArray(d.states) ? d.states : []
      if (states.length < 2) errors.push(`${where(it, 'data.states')}: needs at least two states`)
      states.forEach((s, i) => {
        prose(it, `data.states[${i}].label`, s.label, { required: true })
        if (s.sm != null) {
          samoan(it, `data.states[${i}].sm`, s.sm, { sentence: true })
          english(it, `data.states[${i}].en`, s.en)
          pair(it, `data.states[${i}]`, s.sm, s.en)
        } else prose(it, `data.states[${i}].en`, s.en, { required: true })
        if (s.tune != null && !['fall', 'rise', 'level'].includes(s.tune)) errors.push(`${where(it, `data.states[${i}].tune`)}: fall, rise or level`)
        prose(it, `data.states[${i}].note`, s.note)
      })
    }

    if (it.kind === 'grid') {
      const cols = Array.isArray(d.cols) ? d.cols : []
      const rows = Array.isArray(d.rows) ? d.rows : []
      if (cols.length < 1 || rows.length < 1) errors.push(`${where(it, 'data')}: needs rows and cols`)
      cols.forEach((c, ci) => prose(it, `data.cols[${ci}]`, c, { required: true }))
      prose(it, 'data.rowLabel', d.rowLabel)
      prose(it, 'data.colLabel', d.colLabel)
      const prompts = new Map()
      rows.forEach((r, ri) => {
        prose(it, `data.rows[${ri}].label`, r.label, { required: true })
        if (!Array.isArray(r.cells) || r.cells.length !== cols.length) errors.push(`${where(it, `data.rows[${ri}].cells`)}: one cell (or null) per column`)
        ;(r.cells || []).forEach((c, ci) => {
          if (c == null) return
          samoan(it, `data.rows[${ri}].cells[${ci}].sm`, c.sm)
          if (c.en != null) { english(it, `data.rows[${ri}].cells[${ci}].en`, c.en); pair(it, `data.rows[${ri}].cells[${ci}]`, c.sm, c.en) }
          if (c.example) {
            samoan(it, `data.rows[${ri}].cells[${ci}].example.sm`, c.example.sm, { sentence: true })
            english(it, `data.rows[${ri}].cells[${ci}].example.en`, c.example.en)
            pair(it, `data.rows[${ri}].cells[${ci}].example`, c.example.sm, c.example.en)
          }
          prose(it, `data.rows[${ri}].cells[${ci}].note`, c.note)
          if (d.quiz) {
            const p = `${r.label} / ${cols[ci]}`
            if (prompts.has(p)) errors.push(`${where(it)}: two cells answer the same quiz prompt "${p}"`)
            prompts.set(p, true)
          }
        })
      })
    }

    if (it.kind === 'scale') {
      if (d.layout != null && !['line', 'map'].includes(d.layout)) errors.push(`${where(it, 'data.layout')}: "line" or "map"`)
      prose(it, 'data.axis.from', d.axis?.from, { required: d.layout !== 'map' })
      prose(it, 'data.axis.to', d.axis?.to, { required: d.layout !== 'map' })
      const points = Array.isArray(d.points) ? d.points : []
      if (points.length < 2) errors.push(`${where(it, 'data.points')}: needs at least two points`)
      points.forEach((p, i) => {
        if (typeof p.x !== 'number' || p.x < 0 || p.x > 100) errors.push(`${where(it, `data.points[${i}].x`)}: a number from 0 to 100`)
        if (d.layout === 'map' && (typeof p.y !== 'number' || p.y < 0 || p.y > 100)) errors.push(`${where(it, `data.points[${i}].y`)}: a number from 0 to 100`)
        samoan(it, `data.points[${i}].label`, p.label)
        english(it, `data.points[${i}].gloss`, p.gloss)
        pair(it, `data.points[${i}]`, p.label, p.gloss)
        if (p.sm != null) { samoan(it, `data.points[${i}].sm`, p.sm, { sentence: true }); english(it, `data.points[${i}].en`, p.en); pair(it, `data.points[${i}]`, p.sm, p.en) }
        prose(it, `data.points[${i}].note`, p.note)
      })
    }

    if (it.kind === 'dialogue') {
      const speakers = d.speakers && typeof d.speakers === 'object' ? d.speakers : {}
      if (Object.keys(speakers).length < 2) errors.push(`${where(it, 'data.speakers')}: name at least two speakers`)
      for (const [k, v] of Object.entries(speakers)) {
        if (v && typeof v === 'object') { samoan(it, `data.speakers.${k}.sm`, v.sm) } else prose(it, `data.speakers.${k}`, v, { required: true })
      }
      const lines = Array.isArray(d.lines) ? d.lines : []
      if (lines.length < 2) errors.push(`${where(it, 'data.lines')}: needs at least two lines`)
      lines.forEach((l, i) => {
        if (!(l.who in speakers)) errors.push(`${where(it, `data.lines[${i}].who`)}: not a named speaker`)
        samoan(it, `data.lines[${i}].sm`, l.sm, { sentence: true })
        english(it, `data.lines[${i}].en`, l.en)
        pair(it, `data.lines[${i}]`, l.sm, l.en)
      })
    }

    if (it.kind === 'pick') {
      prose(it, 'data.question', d.question, { required: true })
      const shared = Array.isArray(d.options) ? d.options : null
      const checkOptions = (opts, field) => {
        if (!Array.isArray(opts) || opts.length < 2) { errors.push(`${where(it, field)}: needs at least two options`); return }
        const ids = new Set()
        opts.forEach((o, oi) => {
          if (!o.id) errors.push(`${where(it, `${field}[${oi}].id`)}: missing`)
          if (ids.has(o.id)) errors.push(`${where(it, `${field}[${oi}].id`)}: duplicate`)
          ids.add(o.id)
          if (o.en != null) { english(it, `${field}[${oi}].en`, o.en); if (o.sm != null) pair(it, `${field}[${oi}]`, o.sm, o.en) }
          if (o.sm != null) samoan(it, `${field}[${oi}].sm`, o.sm)
          else prose(it, `${field}[${oi}].label`, o.label, { required: true })
        })
      }
      if (shared) checkOptions(shared, 'data.options')
      const prompts = Array.isArray(d.prompts) ? d.prompts : []
      if (prompts.length < 3) errors.push(`${where(it, 'data.prompts')}: needs at least three prompts`)
      prompts.forEach((p, i) => {
        const opts = p.options || shared
        if (p.options) checkOptions(p.options, `data.prompts[${i}].options`)
        const answer = (opts || []).find(o => o.id === p.answer)
        if (!answer) { errors.push(`${where(it, `data.prompts[${i}].answer`)}: not one of the options`); return }
        for (const extra of p.acceptAlso || []) if (!(opts || []).some(o => o.id === extra)) errors.push(`${where(it, `data.prompts[${i}].acceptAlso`)}: "${extra}" is not an option`)
        prose(it, `data.prompts[${i}].why`, p.why, { required: true })
        prose(it, `data.prompts[${i}].note`, p.note)
        prose(it, `data.prompts[${i}].ask`, p.ask)
        if (p.sm != null) {
          if (typeof p.sm !== 'string') { errors.push(`${where(it, `data.prompts[${i}].sm`)}: must be a string`); return }
          const blanks = p.sm.split(BLANK).length - 1
          if (blanks > 1) errors.push(`${where(it, `data.prompts[${i}].sm`)}: one blank at most`)
          if (blanks === 1) {
            if (answer.sm == null) errors.push(`${where(it, `data.prompts[${i}]`)}: a blank needs Samoan options (sm)`)
            else samoan(it, `data.prompts[${i}].sm (with the answer filled in)`, p.sm.replace(BLANK, answer.fill ?? answer.sm), { sentence: true })
            for (const extra of p.acceptAlso || []) {
              const o = opts.find(x => x.id === extra)
              if (o?.sm != null) samoan(it, `data.prompts[${i}].sm (with "${extra}" filled in)`, p.sm.replace(BLANK, o.fill ?? o.sm), { sentence: true })
            }
          } else samoan(it, `data.prompts[${i}].sm`, p.sm, { sentence: true })
          english(it, `data.prompts[${i}].en`, p.en, { required: false })
          if (p.en) pair(it, `data.prompts[${i}]`, blanks === 1 && answer.sm != null ? p.sm.replace(BLANK, answer.fill ?? answer.sm) : p.sm, p.en)
        } else {
          // English-only prompt: pick the printed Samoan for this English.
          english(it, `data.prompts[${i}].en`, p.en)
          if (answer.sm != null) pair(it, `data.prompts[${i}]`, answer.sm, p.en)
        }
      })
    }

    if (it.kind === 'order') {
      prose(it, 'data.prompt', d.prompt)
      const items = Array.isArray(d.items) ? d.items : []
      if (items.length < 2) errors.push(`${where(it, 'data.items')}: needs at least two sentences`)
      items.forEach((x, i) => {
        samoan(it, `data.items[${i}].sm`, x.sm, { sentence: true })
        english(it, `data.items[${i}].en`, x.en)
        pair(it, `data.items[${i}]`, x.sm, x.en)
        const tiles = x.tiles || String(x.sm ?? '').replace(SENTENCE_END, '').split(/\s+/)
        if (normalise(tiles.join(' ')) !== normalise(String(x.sm ?? '').replace(SENTENCE_END, ''))) errors.push(`${where(it, `data.items[${i}].tiles`)}: the tiles must spell the sentence in order, without its final stop`)
        if (tiles.length < 2) errors.push(`${where(it, `data.items[${i}]`)}: needs at least two tiles`)
        if (new Set(tiles).size !== tiles.length && !x.tiles) warnings.push(`${where(it, `data.items[${i}]`)}: repeated word; either order of the repeats is accepted`)
        ;(x.extra || []).forEach((w, wi) => samoan(it, `data.items[${i}].extra[${wi}]`, w))
        for (const alt of x.accept || []) samoan(it, `data.items[${i}].accept`, alt, { sentence: true })
        prose(it, `data.items[${i}].why`, x.why, { required: true })
      })
    }

    if (it.kind === 'match') {
      const pairs = Array.isArray(d.pairs) ? d.pairs : []
      if (pairs.length < 4) errors.push(`${where(it, 'data.pairs')}: needs at least four pairs`)
      const sms = new Set()
      const ens = new Set()
      pairs.forEach((p, i) => {
        samoan(it, `data.pairs[${i}].sm`, p.sm)
        english(it, `data.pairs[${i}].en`, p.en)
        pair(it, `data.pairs[${i}]`, p.sm, p.en)
        if (sms.has(normalise(p.sm))) errors.push(`${where(it, `data.pairs[${i}].sm`)}: duplicate Samoan side`)
        if (ens.has(normalise(p.en))) errors.push(`${where(it, `data.pairs[${i}].en`)}: duplicate English side`)
        sms.add(normalise(p.sm)); ens.add(normalise(p.en))
      })
    }

    if (it.kind === 'sort') {
      const bins = Array.isArray(d.bins) ? d.bins : []
      if (bins.length < 2 || bins.length > 4) errors.push(`${where(it, 'data.bins')}: two to four bins`)
      const binIds = new Set(bins.map(b => b.id))
      bins.forEach((b, i) => {
        if (!b.id) errors.push(`${where(it, `data.bins[${i}].id`)}: missing`)
        prose(it, `data.bins[${i}].label`, b.label, { required: true })
        if (b.sm != null) samoan(it, `data.bins[${i}].sm`, b.sm)
        prose(it, `data.bins[${i}].hint`, b.hint)
      })
      const items = Array.isArray(d.items) ? d.items : []
      if (items.length < 4) errors.push(`${where(it, 'data.items')}: needs at least four items`)
      items.forEach((x, i) => {
        samoan(it, `data.items[${i}].sm`, x.sm)
        english(it, `data.items[${i}].en`, x.en)
        pair(it, `data.items[${i}]`, x.sm, x.en)
        if (!binIds.has(x.bin)) errors.push(`${where(it, `data.items[${i}].bin`)}: not a bin id`)
        prose(it, `data.items[${i}].why`, x.why, { required: true })
      })
      for (const b of bins) if (!items.some(x => x.bin === b.id)) errors.push(`${where(it, 'data.bins')}: bin "${b.id}" has no items`)
    }

    if (it.kind === 'type') {
      const items = Array.isArray(d.items) ? d.items : []
      if (items.length < 3) errors.push(`${where(it, 'data.items')}: needs at least three items`)
      items.forEach((x, i) => {
        english(it, `data.items[${i}].en`, x.en)
        samoan(it, `data.items[${i}].sm`, x.sm)
        pair(it, `data.items[${i}]`, x.sm, x.en)
        for (const alt of x.accept || []) samoan(it, `data.items[${i}].accept`, alt)
        prose(it, `data.items[${i}].why`, x.why)
        prose(it, `data.items[${i}].hint`, x.hint)
      })
    }
  }
  return { errors, warnings }
}

export function chapterFiles() {
  if (!fs.existsSync(DATA_DIR)) return []
  return fs.readdirSync(DATA_DIR).filter(f => /^\d{2}\.json$/.test(f)).sort().map(f => path.join(DATA_DIR, f))
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

// Run from the command line.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  let files
  const fileFlag = args.indexOf('--file')
  if (fileFlag >= 0) files = [path.resolve(args[fileFlag + 1])]
  else if (args.length) files = args.map(a => path.join(DATA_DIR, `${pad(Number(a))}.json`))
  else files = chapterFiles()
  let failed = 0
  for (const file of files) {
    const rel = path.relative(APP, file)
    if (!fs.existsSync(file)) { console.log(`${rel}: no file`); failed += 1; continue }
    let data
    try { data = readJson(file) } catch (e) { console.log(`${rel}: invalid JSON: ${e.message}`); failed += 1; continue }
    const md = Number.isInteger(data?.chapter) && fs.existsSync(path.join(BOOK, `Chapter-${pad(data.chapter)}.md`)) ? fs.readFileSync(path.join(BOOK, `Chapter-${pad(data.chapter)}.md`), 'utf8') : ''
    const { errors, warnings } = validateFile(data, { file: rel, slugs: md ? headingSlugs(md, slugify) : null })
    if (data && Number.isInteger(data.chapter) && path.basename(file).match(/^\d{2}\.json$/) && Number(path.basename(file).slice(0, 2)) !== data.chapter) errors.push(`${rel}: file name and "chapter" disagree`)
    for (const w of warnings) console.log(`  warn  ${w}`)
    for (const e of errors) console.log(`  FAIL  ${e}`)
    console.log(`${rel}: ${errors.length ? `${errors.length} error(s)` : 'ok'}${warnings.length ? `, ${warnings.length} warning(s)` : ''} (${data?.items?.length ?? 0} items)`)
    if (errors.length) failed += 1
  }
  if (failed) process.exitCode = 1
}
