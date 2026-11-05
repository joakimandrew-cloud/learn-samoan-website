#!/usr/bin/env node
// Checks every chapter's figure file against that chapter's book text, and that chapter's only
// (plan 2026-11-06-chapter-page-simplify; the rule is reviews/lesson-simplify-2026-11-06/
// Direction.md part 5, the card is spec/Chapter-Figures-Method.md). Adapted from the
// Lea-Faka-Tonga scripts/premium/check-figures.mjs.
//
//   node scripts/premium/check-figures.mjs        every file in src/premium/figures
//   node scripts/premium/check-figures.mjs 14     one chapter
//   npm run check:figures [-- 14]
//
// For each src/premium/figures/NN.js it fails when:
//   1. any string on a figure is not word for word in book/Chapter-NN.md (emphasis marks and
//      blockquote markers stripped, whitespace collapsed, matched at word edges): sentences,
//      English lines, tile faces, lane forms and lane labels, chips, titles, captions, tile and
//      mark labels, text alternatives, a Build's words and any prefix or ending it names, opening
//      and recall strings. Case folding is allowed only for the first letter of an English title
//      or label, and for a section heading used as a title. Exempt: only the role labels of the
//      fixed key and the two key people-mark labels (src/premium/figure-engine/key.js);
//   2. an English line is not printed beside its Sāmoan sentence (the pairing of
//      scripts/check-interactives.mjs, with this chapter's text only, plus one prose form the
//      book uses: the Sāmoan and the English in one sentence joined by "means");
//   3. a state's tiles do not join to its sentence;
//   4. English sits on an in-between state (a change after the English beat);
//   5. a beat names a tile or a state the scene does not have;
//   6. a role is outside the key, or a kind outside the set (row, fork, path, build);
//   7. an anchor block is missing, or matches in two sections;
//   8. a REPLACES id is not in the chapter's Interactive file;
//   9. a chapter file carries a colour, a style, a class or a size.
// It exits 1 on any failure and prints each one. A figure that moves the wrong way cannot be
// seen by a script; a separate judge reads each chapter's figures against its book section.
//
// It is deliberately NOT part of `npm run build` or `prebuild`: it runs in `npm run gates`, so a
// later book repair can fail it and be fixed, and can never fail a deploy
// (test/gates.test.js holds that).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseLessonContent } from '../../src/premium/lib/lesson-content.js'
import { groupSections } from '../../src/premium/lib/chapter-page.js'
import { slugify } from '../../src/lib/slugify.js'
import { KEY_LABELS, PEOPLE_LABELS, ROLES } from '../../src/premium/figure-engine/key.js'
import { pairedIn, plainText } from '../check-interactives.mjs'

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const figuresDir = path.join(app, 'src/premium/figures')
const readJson = relative => JSON.parse(fs.readFileSync(path.join(app, relative), 'utf8'))
const quickPractice = readJson('src/data/quick-practice.json')
const bookExercises = readJson('src/data/book-exercises.json')

const KINDS = new Set(['row', 'fork', 'path', 'build'])
const ROW_BEATS = new Set(['move', 'add', 'drop', 'swap', 'en', 'limit', 'slot', 'line'])
const CHANGE_BEATS = new Set(['move', 'add', 'drop', 'swap', 'slot'])
const PEOPLE = new Set(['speaker', 'listener', 'third', 'away'])
const ROLE_SET = new Set(ROLES)
const EXEMPT = new Set([...KEY_LABELS, ...PEOPLE_LABELS])
// Keys a chapter file may never carry: the look lives in the shared stylesheet and engine.
const LOOK_KEYS = new Set(['style', 'className', 'class', 'color', 'colour', 'background', 'fill', 'stroke', 'font', 'fontSize', 'size', 'width', 'height', 'css', 'tokens', 'theme'])
const LOOK_VALUE = /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(|var\(--|\b\d+(?:\.\d+)?(?:px|rem|em|vh|vw)\b/i

// The book as the page shows it: blockquote markers and links' markup stripped, then the
// interactives gate's plainText (emphasis, escapes, fences, table bars, curly quotes), NFC.
const pageText = markdown => plainText(String(markdown)
  .replace(/^[ \t]*>[ \t]?/gm, '')
  .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')).normalize('NFC')
const squash = text => String(text ?? '').replace(/\*+/g, '').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim().normalize('NFC')
const bare = text => squash(text).replace(/[.!?…]+$/u, '').trim()
const LETTER = 'A-Za-zĀĒĪŌŪāēīōūʻ'
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/** Found at word edges, case for case. */
const foundExact = (text, needle) => new RegExp(`(^|[^${LETTER}])${esc(needle)}(?=$|[^${LETTER}])`).test(text)
/** Found at word edges, the first letter in either case. */
const foundFold1 = (text, needle) => {
  const first = needle[0]
  const head = first.toLowerCase() !== first.toUpperCase() ? `[${esc(first.toLowerCase())}${esc(first.toUpperCase())}]` : esc(first)
  return new RegExp(`(^|[^${LETTER}])${head}${esc(needle.slice(1))}(?=$|[^${LETTER}])`).test(text)
}

const requested = process.argv[2] ? Number(process.argv[2]) : null
if (process.argv[2] && (!Number.isInteger(requested) || requested < 1 || requested > 52)) {
  console.error('usage: node scripts/premium/check-figures.mjs [chapter 1 to 52]')
  process.exit(2)
}

const files = fs.existsSync(figuresDir) ? fs.readdirSync(figuresDir).filter(name => /^\d\d\.js$/.test(name)).sort() : []
const wanted = requested ? files.filter(name => Number(name.slice(0, 2)) === requested) : files
if (requested && !wanted.length) {
  console.error(`Chapter ${requested} has no figure file (src/premium/figures/${String(requested).padStart(2, '0')}.js)`)
  process.exit(1)
}

const failures = []
let strings = 0
let figureCount = 0
const rows = []

for (const name of wanted) {
  const n = Number(name.slice(0, 2))
  const nn = name.slice(0, 2)
  const fail = (where, message) => failures.push(`Chapter ${n} ${where}: ${message}`)
  const chapterFile = path.join(app, 'book', `Chapter-${nn}.md`)
  if (!fs.existsSync(chapterFile)) { fail('book', `book/Chapter-${nn}.md is missing`); continue }
  const markdown = fs.readFileSync(chapterFile, 'utf8')
  const book = pageText(markdown)
  const onlyThisChapter = { chapters: new Map([[n, book]]), intro: '' }
  const headings = [...markdown.matchAll(/^#{2,3}\s+(.+?)\s*$/gm)].map(m => squash(m[1]).toLowerCase())
  const interactiveFile = path.join(app, 'src/data/interactives', `${nn}.json`)
  const interactives = fs.existsSync(interactiveFile) ? JSON.parse(fs.readFileSync(interactiveFile, 'utf8')).items || [] : []
  const parsed = parseLessonContent(markdown, { chapter: n, quickPractices: quickPractice[String(n)] || [], exercises: bookExercises[String(n)] || [], interactives, slugify })
  const sections = groupSections(parsed.blocks)

  const source = fs.readFileSync(path.join(figuresDir, name), 'utf8')
  if (/\bclassName\b|\bstyle\s*[:=]/.test(source)) fail('file', 'carries a class or a style; the look lives in chapter-page.css and the engine')

  let mod
  try {
    mod = await import(pathToFileURL(path.join(figuresDir, name)).href)
  } catch (error) {
    fail('file', `cannot be imported: ${error.message}`)
    continue
  }
  const { FIGURES, REPLACES, OPENING, RECALL } = mod
  if (!Array.isArray(FIGURES)) { fail('file', 'does not export FIGURES as an array'); continue }

  // 1. Every string word for word in this chapter's book text.
  const sm = (where, value, what) => {
    strings += 1
    if (typeof value !== 'string' || !value.trim()) return fail(where, `${what} is empty`)
    if (!foundExact(book, squash(value))) fail(where, `${what} ${JSON.stringify(value)} is not in book/Chapter-${nn}.md`)
  }
  const en = (where, value, what) => sm(where, value, what)
  const label = (where, value, what) => {
    strings += 1
    if (typeof value !== 'string' || !value.trim()) return fail(where, `${what} is empty`)
    const v = squash(value)
    if (EXEMPT.has(v)) return
    if (!foundFold1(book, v)) fail(where, `${what} ${JSON.stringify(value)} is not in book/Chapter-${nn}.md and is not a label of the fixed key`)
  }
  const title = (where, value) => {
    strings += 1
    if (typeof value !== 'string' || !value.trim()) return fail(where, 'title is empty')
    const v = squash(value)
    if (headings.includes(v.toLowerCase())) return
    if (!foundFold1(book, v)) fail(where, `title ${JSON.stringify(value)} is not a phrase book/Chapter-${nn}.md prints, nor one of its headings`)
  }
  // 2. English beside its Sāmoan, as the book prints them.
  const paired = (where, say, english) => {
    if (english == null || say == null) return
    const s = bare(say)
    const e = squash(english)
    if (pairedIn(n, s, e, onlyThisChapter) || pairedIn(n, squash(say), e, onlyThisChapter)) return
    // The book's prose form: "X, with no te, means he went".
    const re = new RegExp(`(^|[^${LETTER}])${esc(s)}(?=$|[^${LETTER}])`, 'g')
    for (const m of book.matchAll(re)) {
      const rest = book.slice(m.index + m[0].length, m.index + m[0].length + 200)
      if (new RegExp(`^[^.?!]*?\\bmeans\\s+${esc(e)}(?![A-Za-z])`).test(rest)) return
    }
    fail(where, `the English ${JSON.stringify(english)} is not printed beside ${JSON.stringify(say)} in book/Chapter-${nn}.md`)
  }
  const join = (where, tiles, say, what) => {
    if (!say) return
    const read = tiles.map(tile => tile.text).join(' ')
    if (bare(read) !== bare(say)) fail(where, `${what} tiles read ${JSON.stringify(squash(read))}, which does not join to ${JSON.stringify(say)}`)
  }
  const tileOk = (where, tile) => {
    if (!ROLE_SET.has(tile.role)) fail(where, `role ${JSON.stringify(tile.role)} is not in the fixed key (${ROLES.join(', ')})`)
    sm(where, tile.text, 'tile')
    if (tile.label != null && tile.label !== true) label(where, tile.label, 'tile label')
  }
  // 9. No look in a chapter file.
  const noLook = (value, trail) => {
    if (Array.isArray(value)) return value.forEach((item, i) => noLook(item, [...trail, i]))
    if (!value || typeof value !== 'object') {
      if (typeof value === 'string' && LOOK_VALUE.test(value)) fail(`file ${trail.join('.')}`, `${JSON.stringify(value)} looks like a colour or a size; the look lives in chapter-page.css`)
      return
    }
    for (const [key, item] of Object.entries(value)) {
      if (LOOK_KEYS.has(key)) fail(`file ${[...trail, key].join('.')}`, `the key ${JSON.stringify(key)} sets a look; the look lives in chapter-page.css and the engine`)
      if (typeof item !== 'function') noLook(item, [...trail, key])
    }
  }
  noLook({ FIGURES, OPENING, RECALL }, [])

  // 8. REPLACES names items the chapter's Interactive file has.
  if (REPLACES != null) {
    if (!Array.isArray(REPLACES)) fail('REPLACES', 'is not an array')
    else for (const id of REPLACES) if (!interactives.some(item => item.id === id)) fail('REPLACES', `${JSON.stringify(id)} is not in src/data/interactives/${nn}.json`)
  }

  const ids = new Set()
  FIGURES.forEach((def, index) => {
    figureCount += 1
    const at = `figure ${def?.id ?? index}`
    if (!def || typeof def !== 'object') return fail(at, 'is not an object')
    if (!new RegExp(`^${n}\\.\\d+$`).test(def.id || '')) fail(at, `id must read ${n}.K`)
    if (ids.has(def.id)) fail(at, 'id is used twice')
    ids.add(def.id)
    // 6. The kind is one of the set.
    if (!KINDS.has(def.kind)) fail(at, `kind ${JSON.stringify(def.kind)} is not one of ${[...KINDS].join(', ')}`)
    if (!Array.isArray(def.scenes) || !def.scenes.length) return fail(at, 'has no scenes')
    title(at, def.title)
    if (def.caption != null) en(`${at} caption`, def.caption, 'caption')
    if (def.thirdLabel != null) label(`${at} thirdLabel`, def.thirdLabel, 'mark label')
    // A text alternative, of book sentences.
    if (!Array.isArray(def.alt) || !def.alt.length) fail(at, 'has no text alternative (alt)')
    else def.alt.forEach((line, i) => en(`${at} alt.${i}`, line, 'text alternative'))
    for (const lane of def.lanes || []) {
      label(`${at} lane`, lane.label, 'lane label')
      for (const form of lane.forms || []) sm(`${at} lane`, form, 'lane form')
    }
    for (const chip of def.chips || []) {
      sm(`${at} chip`, chip.sm, 'chip')
      if (chip.en != null) { en(`${at} chip`, chip.en, 'chip English'); paired(`${at} chip`, chip.sm, chip.en) }
    }
    if (def.limit) {
      for (const tile of def.limit.row || []) tileOk(`${at} limit`, tile)
      if (def.limit.en) en(`${at} limit`, def.limit.en, 'limit English')
      if (def.limit.caption) en(`${at} limit`, def.limit.caption, 'limit caption')
    }

    // 7. The anchor block exists, in exactly one section.
    if (!def.after || typeof def.after.section !== 'string' || typeof def.after.block !== 'function') {
      fail(at, 'after needs a section and a block function')
    } else {
      const holders = sections.filter(s => s.id.startsWith(def.after.section) && s.blocks.findIndex(def.after.block) >= 0)
      if (holders.length === 0) fail(at, `the anchor block in section ${JSON.stringify(def.after.section)} does not exist`)
      if (holders.length > 1) fail(at, `the anchor matches blocks in ${holders.length} sections (${holders.map(s => s.id).join(', ')}), so the figure would show more than once`)
    }

    def.scenes.forEach((scene, si) => {
      const where = `${at} scene ${scene.key ?? si}`
      if (def.kind === 'row') {
        const tiles = scene.tiles || {}
        const states = scene.states || []
        if (!states.length) return fail(where, 'has no states')
        for (const [id, faces] of Object.entries(tiles)) faces.forEach((tile, f) => tileOk(`${where} tile ${id}.${f}`, tile))
        states.forEach((state, i) => {
          for (const [key, faceIndex] of state) {
            if (key === 'GHOST' || key === 'SLOT') continue
            if (!tiles[key]) fail(where, `state ${i} names tile ${JSON.stringify(key)}, which the scene does not have`)
            else if (!tiles[key][faceIndex ?? 0]) fail(where, `state ${i} names face ${faceIndex} of tile ${JSON.stringify(key)}, which has ${tiles[key].length}`)
          }
        })
        const faceOf = ([key, f]) => (key === 'GHOST' || key === 'SLOT' ? null : tiles[key]?.[f ?? 0])
        const stateTiles = i => (states[i] || []).map(faceOf).filter(Boolean)
        for (const side of ['before', 'after']) {
          const line = scene[side]
          if (!line) continue
          sm(`${where} ${side}`, line.say, 'sentence')
          if (line.en != null) { en(`${where} ${side}`, line.en, 'English'); paired(`${where} ${side}`, line.say, line.en) }
        }
        // 3. States that have a sentence join to it.
        if (scene.before) join(where, stateTiles(0), scene.before.say, 'first state')
        if (scene.after) join(where, stateTiles(states.length - 1), scene.after.say, 'last state')
        if (scene.lines) {
          if (scene.lines.length !== states.length) fail(where, `lines has ${scene.lines.length} entries for ${states.length} states`)
          scene.lines.forEach((line, i) => {
            sm(`${where} line ${i}`, line.say, 'sentence')
            if (line.en != null) { en(`${where} line ${i}`, line.en, 'English'); paired(`${where} line ${i}`, line.say, line.en) }
            join(where, stateTiles(i), line.say, `state ${i}`)
          })
        }
        if (scene.slotLabel != null) label(`${where} slotLabel`, scene.slotLabel, 'slot label')
        // 5. Beats name real tiles and real states.
        const beats = scene.beats || []
        beats.forEach((beat, bi) => {
          if (!ROW_BEATS.has(beat.kind)) fail(where, `beat ${bi} has kind ${JSON.stringify(beat.kind)}`)
          for (const id of [].concat(beat.tile ?? [])) if (!tiles[id]) fail(where, `beat ${bi} (${beat.kind}) names tile ${JSON.stringify(id)}, which the scene does not have`)
          if (beat.roll && !tiles[beat.roll]) fail(where, `beat ${bi} rolls tile ${JSON.stringify(beat.roll)}, which the scene does not have`)
          if (beat.to != null && !(Number.isInteger(beat.to) && beat.to >= 0 && beat.to < states.length)) fail(where, `beat ${bi} goes to state ${beat.to}, and the scene has ${states.length}`)
        })
        // 4. English comes after the changes. A scene whose every state is a printed sentence is exempt.
        if (!scene.lines) {
          const firstEn = beats.findIndex(beat => beat.kind === 'en')
          if (firstEn >= 0 && beats.slice(firstEn + 1).some(beat => CHANGE_BEATS.has(beat.kind))) fail(where, 'a change comes after the English beat, so an in-between state would carry English')
        }
      } else if (def.kind === 'fork') {
        const lanes = def.lanes || []
        ;(scene.cases || []).forEach((c, ci) => {
          const here = `${where} case ${ci}`
          if (!Number.isInteger(c.lane) || c.lane < 0 || c.lane >= lanes.length) fail(here, `lane ${c.lane} is not one of the ${lanes.length} lanes`)
          const row = (c.row || []).map(tile => (tile.slot ? tile.form : tile))
          row.forEach((tile, ti) => tileOk(`${here} tile ${ti}`, tile))
          for (const tile of c.row || []) if (tile.slot && typeof tile.label === 'string') label(here, tile.label, 'slot label')
          sm(here, c.say, 'sentence')
          join(here, row, c.say, 'row')
          // A sentence the book gives no English gets none: say so with en: null, never by leaving it out.
          if (c.en === undefined) fail(here, 'has no English; write en: null where the book gives none')
          else if (c.en !== null) { en(here, c.en, 'English'); paired(here, c.say, c.en) }
          const readings = (c.row || []).filter(tile => tile.reads)
          if (readings.length > 1) fail(here, 'has more than one reading tile')
          if (readings.length && !(c.row || []).some(tile => tile.ring)) fail(here, 'a reading needs the ring on the neighbour that decides it')
        })
      } else if (def.kind === 'path') {
        ;(scene.cases || []).forEach((c, ci) => {
          const here = `${where} case ${ci}`
          sm(here, c.say, 'sentence')
          if (c.en != null) { en(here, c.en, 'English'); paired(here, c.say, c.en) }
          if (c.particle) sm(here, c.particle, 'direction word')
          if (c.dirText != null) label(here, c.dirText, 'direction wording')
          if (c.particle && !squash(c.say || '').includes(squash(c.particle))) fail(here, `the direction word ${JSON.stringify(c.particle)} is not in ${JSON.stringify(c.say)}`)
          for (const key of ['from', 'to']) if (c[key] != null && !PEOPLE.has(c[key])) fail(here, `${key} is ${JSON.stringify(c[key])}; use speaker, listener, third or away`)
        })
      } else if (def.kind === 'build') {
        const pieces = scene.pieces || []
        if (!ROLE_SET.has(scene.role)) fail(where, `role ${JSON.stringify(scene.role)} is not in the fixed key`)
        if (scene.label != null) label(where, scene.label, 'label')
        for (const side of ['from', 'to']) {
          const line = scene[side]
          if (!line) { fail(where, `has no ${side}`); continue }
          sm(`${where} ${side}`, line.say, 'word')
          if (line.en != null) { en(`${where} ${side}`, line.en, 'English'); paired(`${where} ${side}`, line.say, line.en) }
        }
        const joined = pieces.map(piece => piece.text).join('')
        const kept = pieces.filter(piece => !piece.added).map(piece => piece.text).join('')
        if (scene.to && bare(joined) !== bare(scene.to.say)) fail(where, `the pieces join to ${JSON.stringify(joined)}, not ${JSON.stringify(scene.to.say)}`)
        if (scene.from && bare(kept) !== bare(scene.from.say)) fail(where, `the kept pieces join to ${JSON.stringify(kept)}, not ${JSON.stringify(scene.from.say)}`)
        pieces.forEach((piece, pi) => {
          if (piece.of != null && !(Number.isInteger(piece.of) && pieces[piece.of] && !pieces[piece.of].added && pieces[piece.of].text === piece.text)) fail(where, `piece ${pi} doubles piece ${piece.of}, which is not a kept piece with the same text`)
          if (piece.label != null) {
            label(`${where} piece ${pi}`, piece.label, 'piece label')
            // A named prefix or ending is printed alone, as the book prints it (=ga).
            const t = squash(piece.text)
            if (![t, `=${t}`, `${t}=`, `-${t}`, `${t}-`].some(form => foundExact(book, form) || book.includes(form))) fail(`${where} piece ${pi}`, `the ${piece.label} ${JSON.stringify(piece.text)} is not printed alone in book/Chapter-${nn}.md`)
          }
        })
        if (!pieces.some(piece => piece.added)) fail(where, 'adds no piece')
      }
    })
  })

  // Opening and recall strings, if a chapter ever fills them (Direction.md parts 2 and 9 leave them empty).
  if (OPENING != null) {
    for (const tile of OPENING.row || []) tileOk('opening', tile)
    sm('opening', OPENING.say, 'sentence')
    en('opening', OPENING.en, 'English')
    paired('opening', OPENING.say, OPENING.en)
    join('opening', OPENING.row || [], OPENING.say, 'row')
  }
  if (RECALL != null) {
    if (!Array.isArray(RECALL)) fail('recall', 'is not an array')
    else RECALL.forEach((item, i) => { sm(`recall ${i}`, item?.sm, 'sentence'); en(`recall ${i}`, item?.en, 'English'); paired(`recall ${i}`, item?.sm, item?.en) })
  }

  rows.push(`Chapter ${String(n).padStart(2)}: ${FIGURES.length} figures${REPLACES?.length ? `, replaces ${REPLACES.join(', ')}` : ''}`)
}

for (const row of rows) console.log(row)
console.log(`${wanted.length} figure ${wanted.length === 1 ? 'file' : 'files'}, ${figureCount} figures, ${strings} strings checked against the book, ${failures.length} misses`)
if (failures.length) {
  console.log(`\nFAILED: ${failures.length}`)
  failures.forEach(line => console.log(`  ${line}`))
  process.exit(1)
}
console.log('check:figures passed')
