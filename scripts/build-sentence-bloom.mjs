#!/usr/bin/env node
/**
 * The homepage sentence bloom's data (src/data/sentence-bloom.json), built from
 * the storyboard (scripts/sentence-bloom-spec.json), the synced book
 * (book/Chapter-NN.md) and the chapter list (src/data/chapters.json).
 *
 * Every Samoan string the bloom shows is a sentence printed in its chapter with
 * its English beside it (an examples line or a Samoan | English table row, in
 * the chapter's teaching sections), found here and recorded with its line.
 * Nothing is composed (DECISIONS 2026-08-27, rulings 6 and 7). Each tile label
 * is the book's own name for the slot, cited to the section that names it.
 *
 *   node scripts/build-sentence-bloom.mjs           write the data file
 *   node scripts/build-sentence-bloom.mjs --check   exit 1 when the file is not what the book gives now
 *
 * `npm run sync` writes it after every sync; prebuild and `npm test` run the check.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { LESSON_GROUPS } from '../src/lib/lesson-browser.js'
import { loadBook, pairedIn } from './check-interactives.mjs'

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const SPEC_FILE = path.join(APP, 'scripts', 'sentence-bloom-spec.json')
export const DATA_FILE = path.join(APP, 'src', 'data', 'sentence-bloom.json')
const pad = (n, w = 2) => String(n).padStart(w, '0')
const bookFile = n => `book/Chapter-${pad(n)}.md`

// The teaching sections end where the word list, the exercises or a
// checkpoint's self-test begin; nothing after that is offered as a preview.
const STOP = /^##\s+(?:Words to Learn|Exercises|Answers|Can You Do This\?)\s*$/
const NOT_TOPICS = new Set(['Words to Learn', 'Exercises', 'Answers', 'Can You Do This?'])
// A whole sentence: a capital first letter (after a glottal stop) and closing punctuation.
const SENTENCE = /^ʻ?[A-ZĀĒĪŌŪ][^*]*[.?!]$/u

// Every sentence a chapter prints with its English: the lines of its examples
// blocks (*Samoan.* English) and the rows of its two-column tables
// (| *Samoan.* | English |), in book order, with their line numbers and which
// of the two they are.
export function printedPairs(md) {
  const out = []
  let inExamples = false
  for (const [i, line] of md.split('\n').entries()) {
    if (STOP.test(line)) break
    if (/^:::\s*\{\.examples\}/.test(line)) { inExamples = true; continue }
    if (/^:::\s*$/.test(line)) { inExamples = false; continue }
    const m = inExamples
      ? line.match(/^\*([^*]+)\*\s*(?:[↘↗]\s*)?(\S.*?)\s*$/)
      : line.match(/^\|\s*\*([^*|]+)\*\s*\|\s*([^|]+?)\s*\|\s*$/)
    if (m && SENTENCE.test(m[1].trim())) out.push({ line: i + 1, sm: m[1].trim(), en: m[2].trim(), table: !inExamples })
  }
  return out
}

// A section's lines: from its heading to the line before the next heading of
// the same or a higher level.
function section(md, heading) {
  const lines = md.split('\n')
  const at = lines.findIndex(l => /^#{2,3}\s/.test(l) && l.replace(/^#+\s+/, '').trim() === heading)
  if (at < 0) return null
  const level = lines[at].match(/^#+/)[0].length
  let end = lines.length
  for (let i = at + 1; i < lines.length; i += 1) {
    const m = lines[i].match(/^(#+)\s/)
    if (m && m[1].length <= level) { end = i; break }
  }
  while (end > at + 1 && !lines[end - 1].trim()) end -= 1
  while (end > at + 1 && /^-{3,}\s*$/.test(lines[end - 1])) { end -= 1; while (end > at + 1 && !lines[end - 1].trim()) end -= 1 }
  return { from: at + 1, to: end, text: lines.slice(at, end).join(' ').replace(/\*+/g, '') }
}

const plain = s => String(s).replace(/\*+/g, '')
const words = s => s.toLowerCase().replace(/[.?!,]/g, '').split(/\s+/).filter(Boolean)
// a, two words or more, is b with words added: a's words in b, in a's order
const contains = (b, a) => {
  if (a.length < 2 || b.length <= a.length) return false
  let i = 0
  for (const w of b) if (w === a[i]) i += 1
  return i === a.length
}

export function buildData({ spec = JSON.parse(fs.readFileSync(SPEC_FILE, 'utf8')), chapters = JSON.parse(fs.readFileSync(path.join(APP, 'src', 'data', 'chapters.json'), 'utf8')) } = {}) {
  const errors = []
  const md = new Map()
  const read = n => {
    if (!md.has(n)) md.set(n, fs.existsSync(path.join(APP, bookFile(n))) ? fs.readFileSync(path.join(APP, bookFile(n)), 'utf8') : null)
    return md.get(n)
  }
  const book = loadBook()
  const LAST = chapters.length

  // the labels, each with the book section that names it
  const sources = []
  const labelIx = {}
  for (const [key, L] of Object.entries(spec.labels)) {
    const text = read(L.chapter)
    const sec = text && section(text, L.heading)
    if (!sec) { errors.push(`label ${key}: no section "${L.heading}" in ${bookFile(L.chapter)}`); continue }
    if (!sec.text.toLowerCase().includes(L.text.toLowerCase())) errors.push(`label ${key}: "${L.text}" is not in ${bookFile(L.chapter)} "${L.heading}"`)
    labelIx[key] = sources.length
    sources.push(`${bookFile(L.chapter)}:${sec.from}-${sec.to} | ${plain(L.heading)}`)
  }

  // the play's rows, each found where its chapter prints it
  const rows = {}
  for (const [id, R] of Object.entries(spec.rows)) {
    const text = read(R.chapter)
    const hit = text && printedPairs(text).find(p => p.sm === R.sm && p.en === R.en)
    if (!hit) { errors.push(`row ${id}: "${R.sm}" with "${R.en}" is not printed in ${bookFile(R.chapter)}`); continue }
    if (!pairedIn(R.chapter, R.sm, R.en, book)) errors.push(`row ${id}: the honesty gate does not find "${R.sm}" paired with "${R.en}"`)
    const punct = R.sm.match(/[.?!]+$/)[0]
    if (R.words.map(w => w[0]).join(' ') + punct !== R.sm) errors.push(`row ${id}: its words do not make "${R.sm}"`)
    for (const [, key] of R.words) if (!(key in spec.labels)) errors.push(`row ${id}: no label "${key}"`)
    rows[id] = { id, lesson: R.chapter, line: hit.line, sm: R.sm, en: R.en, punct, words: R.words.map(([w, key]) => [w, spec.labels[key]?.text ?? '', labelIx[key] ?? null]) }
  }

  // the storyboard's own consistency: a drum's rows share a shape, a morph's keys match its rows, the times run on
  let at = 0
  for (const [i, s] of spec.segs.entries()) {
    const name = `seg ${i + 1} (${s.beat})`
    if (Math.abs(s.t0 - at) > 1e-6 || !(s.t1 > s.t0)) errors.push(`${name}: does not follow on from ${at} s`)
    at = s.t1
    if (!s.rows.every(r => rows[r])) { errors.push(`${name}: a row is missing`); continue }
    const R = s.rows.map(r => rows[r])
    if (s.k === 'drum') {
      if (R.some(r => r.words.length !== R[0].words.length)) errors.push(`${name}: a drum's rows must have the same number of words`)
      if (s.learned.length !== R[0].words.length) errors.push(`${name}: learned has ${s.learned.length} entries for ${R[0].words.length} words`)
    } else {
      if (s.keys[0].length !== R[0].words.length || s.keys[1].length !== R[1].words.length) errors.push(`${name}: keys do not match its rows' words`)
      if (s.learned.length !== R[1].words.length) errors.push(`${name}: learned has ${s.learned.length} entries for ${R[1].words.length} words`)
      if (!(s.s0 >= s.t0 && s.s1 > s.s0 && s.s1 <= s.t1)) errors.push(`${name}: the morph's s0 and s1 fall outside it`)
    }
    if (s.lesson < (spec.segs[i - 1]?.lesson ?? 1)) errors.push(`${name}: the chapter flag goes backwards`)
    // the flag says "by Chapter N": nothing on screen, and no word's road link, comes from a later chapter
    if (R.some(r => r.lesson > s.lesson)) errors.push(`${name}: shows a sentence from after Chapter ${s.lesson}`)
    if (s.learned.some(n => !(n >= 1 && n <= s.lesson))) errors.push(`${name}: a word is linked to a chapter after Chapter ${s.lesson}`)
  }
  const lastSeg = spec.segs.at(-1)
  if (lastSeg.lesson !== spec.page) errors.push(`the play ends in Chapter ${lastSeg.lesson}, not on the page chapter ${spec.page}`)
  let from = at
  for (const b of spec.ending) {
    if (Math.abs(b.start - from) > 1e-6 || !(b.end > b.start)) errors.push(`ending ${b.id}: does not follow on from ${from} s`)
    from = b.end
  }
  const groups = LESSON_GROUPS.map(g => ({ key: g.key, name: g.name, lessons: chapters.filter(c => c.group === g.key).map(c => c.chapter) }))
  const openers = new Set(groups.map(g => g.lessons[0]))
  // the stops after the pull-back: each says entry is a sentence its chapter prints with its English, shown in a say-N beat
  const says = []
  for (const S of spec.says ?? []) {
    const text = read(S.chapter)
    const hit = text && printedPairs(text).find(p => p.sm === S.sm && p.en === S.en)
    if (!hit) { errors.push(`says ${S.chapter}: "${S.sm}" with "${S.en}" is not printed in ${bookFile(S.chapter)}`); continue }
    if (!pairedIn(S.chapter, S.sm, S.en, book)) errors.push(`says ${S.chapter}: the honesty gate does not find "${S.sm}" paired with "${S.en}"`)
    const id = `ch${pad(S.chapter)}-l${pad(hit.line, 3)}`
    rows[id] = { id, lesson: S.chapter, line: hit.line, sm: S.sm, en: S.en }
    says.push({ lesson: S.chapter, row: id })
  }
  // the walk: walk-N carries the stroke to N (a level's first chapter with a hold-N, a chapter with a say-N, or the last chapter, last);
  // say-N holds it at N with that chapter's sentence; the stops run forward from the page chapter
  const beats = spec.ending.map(b => b.id.match(/^(walk|hold|say)-(\d+)$/)).filter(Boolean).map(m => ({ kind: m[1], n: +m[2] }))
  const walks = beats.filter(b => b.kind === 'walk').map(b => b.n)
  walks.forEach((n, i) => {
    const said = spec.ending.some(b => b.id === `say-${n}`)
    if (i === walks.length - 1 ? n !== LAST : !(openers.has(n) || said)) errors.push(`ending walk-${n}: a walk ends at a level's first chapter or a say, the last at Chapter ${LAST}`)
    if (i < walks.length - 1 && !said && !spec.ending.some(b => b.id === `hold-${n}`)) errors.push(`ending walk-${n}: no hold-${n} or say-${n}`)
  })
  let stop = spec.page, prev = null
  for (const b of beats) {
    // a say right after the walk to its own chapter stays where the walk ended
    if (b.kind !== 'hold' && !(b.n > stop || (b.kind === 'say' && prev?.kind === 'walk' && prev.n === b.n))) errors.push(`ending ${b.kind}-${b.n}: the stops must run forward from Chapter ${stop}`)
    if (b.kind !== 'hold') stop = b.n
    prev = b
  }
  const sayBeats = beats.filter(b => b.kind === 'say').map(b => b.n)
  if (sayBeats.join() !== says.map(s => s.lesson).join()) errors.push(`ending: the say beats (${sayBeats.join(', ')}) and the says (${says.map(s => s.lesson).join(', ')}) do not match one to one`)

  // each chapter's map entry: its title, level and teaching sections from chapters.json, and up to three of its printed sentences
  const earlier = new Set()
  const lessons = []
  const finalRow = rows[lastSeg.rows[1]]
  for (const c of chapters) {
    const n = c.chapter
    const text = read(n)
    if (!text) { errors.push(`chapter ${n}: no ${bookFile(n)}`); continue }
    const seen = new Set()
    const pool = printedPairs(text).filter(p => !p.en.includes('*') && !seen.has(p.sm) && seen.add(p.sm))
    // the chapter's own sentences first; then not the "before" half of a before/after pair (the same words again, in order, in a
    // longer sentence of the chapter, as Chapter 3's foʻi before foʻi fiafia); then any without a morpheme mark or a bracketed note; in book order
    const before = p => pool.some(q => q !== p && contains(words(q.sm), words(p.sm)))
    const score = p => (earlier.has(p.sm) ? 2 : 0) + (before(p) ? 2 : 0) + (p.sm.includes('=') ? 4 : 0) + (p.en.includes('(') ? 1 : 0)
    const ranked = pool.map((p, i) => ({ p, i })).sort((a, b) => score(a.p) - score(b.p) || a.i - b.i).map(x => x.p)
    for (const p of pool) earlier.add(p.sm)
    const pick = []
    if (finalRow && n === spec.page) pick.push(finalRow.id)
    // two sentences with the same English (the book's tātou and mātou, "We danced.") would read as a slip on one card
    const english = new Set(pick.map(id => rows[id].en))
    for (const p of ranked) {
      if (pick.length >= 3) break
      if (finalRow && n === spec.page && p.sm === finalRow.sm) continue
      if (english.has(p.en) && ranked.length > 3) continue
      english.add(p.en)
      const id = `ch${pad(n)}-l${pad(p.line, 3)}`
      if (!pairedIn(n, p.sm, p.en, book)) { errors.push(`chapter ${n} line ${p.line}: the honesty gate does not find "${p.sm}" paired with "${p.en}"`); continue }
      rows[id] = { id, lesson: n, line: p.line, sm: p.sm, en: p.en }
      pick.push(id)
    }
    if (!pick.length) errors.push(`chapter ${n}: no printed sentence to preview`)
    const group = groups.find(g => g.key === c.group)
    if (!group) errors.push(`chapter ${n}: level "${c.group}" is not one of ${groups.map(g => g.key).join(', ')}`)
    lessons.push({ n, title: c.title, topics: c.sections.filter(s => !NOT_TOPICS.has(s)), group: c.group, card: pick[0], preview: pick })
  }
  if (lessons.length !== LAST || lessons.some((L, i) => L.n !== i + 1)) errors.push('chapters.json must list chapters 1 to N in order')

  const data = {
    generated_by: 'scripts/build-sentence-bloom.mjs from scripts/sentence-bloom-spec.json, book/ and src/data/chapters.json. Do not edit by hand: change the spec or the book, then npm run bloom.',
    sources,
    rows,
    lessons,
    course: { groups },
    play: { page: lastSeg.t1, pageLesson: spec.page, runtime: from, segs: spec.segs, says, ending: spec.ending },
  }
  return { data, errors }
}

export const serialise = data => JSON.stringify(data, null, 1) + '\n'

// Run from the command line.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { data, errors } = buildData()
  for (const e of errors) console.log(`  FAIL  ${e}`)
  if (errors.length) {
    console.log(`sentence bloom: ${errors.length} error(s); ${path.relative(APP, DATA_FILE)} not written`)
    process.exitCode = 1
  } else if (process.argv.includes('--check')) {
    const now = fs.existsSync(DATA_FILE) ? fs.readFileSync(DATA_FILE, 'utf8') : ''
    if (now !== serialise(data)) {
      console.log(`sentence bloom: ${path.relative(APP, DATA_FILE)} is not what the book gives now; run npm run bloom`)
      process.exitCode = 1
    } else console.log(`sentence bloom: ok (${Object.keys(data.rows).length} rows, ${data.lessons.length} chapters, every sentence printed with its English)`)
  } else {
    fs.writeFileSync(DATA_FILE, serialise(data))
    console.log(`sentence bloom: wrote ${path.relative(APP, DATA_FILE)} (${Object.keys(data.rows).length} rows, ${data.lessons.length} chapters)`)
  }
}
