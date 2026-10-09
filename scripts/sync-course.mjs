#!/usr/bin/env node
/**
 * Copy the Samoan course into the website and derive its data.
 *
 * Reads (never writes) the canonical course files in the parent vault:
 *   ../book/Chapter-NN.md, Introduction.md, appendix-*.md
 *   ../quizzes/samoan_grammar_quiz_chNN.md
 *
 * Writes, inside this app only:
 *   book/*.md                      learner copies: HTML comments and the
 *                                  "Author Verification" block removed (the same
 *                                  cut filters/strip-verification.lua makes for
 *                                  the PDF and EPUB). No other character changes.
 *   src/data/chapters.json         number, title, level, sections, first example
 *   src/data/quizzes.json          the 51 ten-question quizzes
 *   src/data/book-vocabulary.json  every Words to Learn row, with its chapter
 *   src/data/glossary.json         the Glossary appendix rows
 *   src/data/book-exercises.json   exercises with their answer-key entries
 *   src/data/quick-practice.json   in-chapter Quick Practice blocks
 *   src/data/provenance.json       source hashes and counts
 *
 * Nothing here writes Samoan of its own: every Samoan string on the site is a
 * substring of a course file. --check reports whether the saved copies match
 * the current course without writing anything.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const VAULT = path.resolve(APP, '..')
const BOOK_IN = path.join(VAULT, 'book')
const QUIZ_IN = path.join(VAULT, 'quizzes')
const BOOK_OUT = path.join(APP, 'book')
const DATA_OUT = path.join(APP, 'src', 'data')
const CHECK = process.argv.includes('--check')

const LEVELS = [
  { key: 'beginner', from: 1, to: 23 },
  { key: 'intermediate', from: 24, to: 41 },
  { key: 'advanced', from: 42, to: 51 },
]

const problems = []
const fail = message => problems.push(message)
const sha = text => crypto.createHash('sha256').update(text).digest('hex')
const read = file => fs.readFileSync(file, 'utf8')
const pad = n => String(n).padStart(2, '0')

// ---------------------------------------------------------------------------
// Learner copy
// ---------------------------------------------------------------------------

export function learnerCopy(md) {
  let text = md.replace(/\r\n?/g, '\n').replace(/<!--[\s\S]*?-->/g, '')
  const lines = text.split('\n')
  const out = []
  for (let i = 0; i < lines.length; i += 1) {
    const heading = lines[i].match(/^(#{1,6})\s+Author Verification/)
    if (!heading) { out.push(lines[i]); continue }
    // Drop the divider (and blank lines) that led into the block.
    while (out.length && /^\s*$/.test(out.at(-1))) out.pop()
    if (out.length && /^\s*(---|\*\*\*|___)\s*$/.test(out.at(-1))) out.pop()
    const level = heading[1].length
    i += 1
    while (i < lines.length) {
      const next = lines[i].match(/^(#{1,6})\s/)
      if (next && next[1].length <= level) { i -= 1; break }
      i += 1
    }
  }
  while (out.length && /^\s*$/.test(out.at(-1))) out.pop()
  return out.join('\n') + '\n'
}

// ---------------------------------------------------------------------------
// Small Markdown helpers (line based; the site's own renderer does the rest)
// ---------------------------------------------------------------------------

const plain = s => String(s ?? '').replace(/[*_`]/g, '').replace(/\\/g, '').replace(/\s+/g, ' ').trim()

function sections(md) {
  // Split on level-2 headings: [{ title, body }]
  const out = []
  let cur = { title: null, lines: [] }
  for (const line of md.split('\n')) {
    const m = line.match(/^##\s+(.*)$/)
    if (m) { out.push(cur); cur = { title: m[1].trim(), lines: [] }; continue }
    cur.lines.push(line)
  }
  out.push(cur)
  return out.map(s => ({ title: s.title, body: s.lines.join('\n') }))
}

function tables(body) {
  const lines = body.split('\n')
  const found = []
  for (let i = 0; i < lines.length - 1; i += 1) {
    if (!lines[i].startsWith('|') || !/^\|[\s:|-]+\|\s*$/.test(lines[i + 1])) continue
    const cells = l => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim())
    const head = cells(lines[i])
    const rows = []
    let j = i + 2
    for (; j < lines.length && lines[j].startsWith('|'); j += 1) rows.push(cells(lines[j]))
    // The paragraph just above the table, if it is a bold lead-in.
    let k = i - 1
    while (k >= 0 && !lines[k].trim()) k -= 1
    let lead = null
    if (k >= 0 && lines[k].startsWith('**')) {
      let start = k
      while (start > 0 && lines[start - 1].trim() && !lines[start - 1].startsWith('|')) start -= 1
      lead = lines.slice(start, k + 1).join(' ')
    } else if (k >= 0 && !lines[k].startsWith('|')) {
      let start = k
      while (start > 0 && lines[start - 1].trim() && !lines[start - 1].startsWith('|')) start -= 1
      const para = lines.slice(start, k + 1).join(' ')
      if (para.startsWith('**')) lead = para
    }
    found.push({ head, rows, lead, line: i })
    i = j - 1
  }
  return found
}

// ---------------------------------------------------------------------------
// Chapters
// ---------------------------------------------------------------------------

// The chapter's sample sentence for the catalog and the resume card: the
// first whole-sentence pair in its example blocks that no earlier chapter
// already shows (Chapters 2, 4 and 23 open on Chapter 1's sentence). Word and
// phrase pairs ("*le teine*. the girl") are passed over. The literal reading
// in brackets stays in the chapter; the sample keeps the plain translation.
const shownExamples = new Set()
function firstExample(md) {
  const pairs = []
  const take = line => {
    const pair = line.match(/^\*([^*]+[.?!])\*\s+(?:[↘↗]\s*)?([A-Z"].*)$/)
    if (pair) pairs.push({ samoan: pair[1].trim(), english: pair[2].replace(/\s*\(Lit\.[^)]*\)\s*$/, '').trim() })
  }
  for (const m of md.matchAll(/^:::\s*\{\.examples\}\s*\n([\s\S]*?)\n:::/gm)) {
    // A pair the book wraps continues on lines that do not open with *.
    const lines = []
    for (const line of m[1].split('\n')) {
      if (!line.trim()) continue
      if (line.startsWith('*') || !lines.length) lines.push(line.trim())
      else lines[lines.length - 1] += ` ${line.trim()}`
    }
    lines.forEach(take)
  }
  // Then the sentence rows of the chapter's teaching tables.
  const teaching = md.split(/^##\s+(?:Words to Learn|Exercises)\s*$/m)[0]
  for (const row of teaching.matchAll(/^\|\s*\*([^*|]+[.?!])\*\s*\|(?:[^|\n]*\|)*?\s*([A-Z][^|\n]*?)\s*\|\s*$/gm)) take(`*${row[1]}* ${row[2]}`)
  // A checkpoint that only reprints earlier sentences shows its first one again.
  const pick = pairs.find(p => !shownExamples.has(p.samoan)) || pairs[0] || null
  if (pick) shownExamples.add(pick.samoan)
  return pick
}

function chapterMeta(n, md) {
  const title = (md.match(/^#\s+Chapter\s+\d+:\s*(.*)$/m) || [])[1]
  if (!title) fail(`Chapter ${n}: no "# Chapter ${n}: Title" heading`)
  const secs = sections(md)
  const intro = secs[0].body.split('\n\n').map(p => p.trim()).find(p => p && !p.startsWith('#') && p !== '---') || ''
  const level = LEVELS.find(l => n >= l.from && n <= l.to).key
  return {
    chapter: n,
    title: title?.trim() || `Chapter ${n}`,
    level,
    group: level,
    intro: intro.replace(/\s*\n\s*/g, ' '),
    sections: secs.slice(1).map(s => s.title).filter(t => !/^(Answers)$/i.test(t)),
    example: firstExample(md),
  }
}

// ---------------------------------------------------------------------------
// Words to Learn
// ---------------------------------------------------------------------------

const LIST_KEYS = [
  [/^\*\*New grammar words/i, 'grammar', 'Grammar words'],
  [/^\*\*New vocabulary/i, 'vocabulary', 'Vocabulary'],
  [/^\*\*Words to carry/i, 'carry', 'Words to carry'],
]

function vocabulary(n, md) {
  const sec = sections(md).find(s => /^Words to Learn$/i.test(s.title || ''))
  if (!sec) return []
  const out = []
  const lines = sec.body.split('\n')
  for (const t of tables(sec.body)) {
    // The nearest bold lead-in above the table names its list.
    let key = null
    for (let i = t.line - 1; i >= 0 && !key; i -= 1) key = LIST_KEYS.find(([re]) => re.test(lines[i]))
    if (!key) fail(`Chapter ${n}: Words to Learn table with no recognised lead-in (${(t.lead || '').slice(0, 40)})`)
    if (t.head.length !== 2) fail(`Chapter ${n}: Words to Learn table has ${t.head.length} columns`)
    t.rows.forEach(row => out.push({
      samoan: plain(row[0]),
      english: row[1],
      chapter: n,
      list: key ? key[1] : 'vocabulary',
      listName: key ? key[2] : 'Vocabulary',
      column: t.head[1],
    }))
  }
  return out
}

// ---------------------------------------------------------------------------
// Exercises and answers
// ---------------------------------------------------------------------------

// Numbered lines with their continuation lines. Keeps the printed number.
function numbered(lines, { runOn = false } = {}) {
  let items = []
  const letters = []
  const before = []
  const after = []
  let cur = null
  let gap = false
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '')
    const m = line.match(/^(\d+)\.\s+(.*)$/)
    if (m) { cur = { n: Number(m[1]), text: m[2] }; items.push(cur); gap = false; continue }
    const letter = line.match(/^([a-z])\.\s+(.*)$/)
    if (letter && items.length) { letters.push({ letter: letter[1], text: letter[2] }); cur = null; continue }
    if (!line.trim()) { gap = true; continue }
    if (/^(---|\*\*\*)$/.test(line.trim())) continue
    if (cur && (!gap || /^\s{2,}/.test(line))) { cur.text += ' ' + line.trim(); continue }
    if (!items.length) before.push(line.trim())
    else after.push(line.trim())
  }
  // Answer keys sometimes run several answers along one line:
  // "1. be awake · 2. overflow · 3. arrive". Split only on the next number in
  // sequence, so a numeral inside an answer is never mistaken for a new item.
  if (runOn) {
    items = items.flatMap(item => {
      const parts = []
      let n = item.n
      let rest = item.text
      for (;;) {
        const re = new RegExp(`\\s+(?:·\\s+)?${n + 1}\\.\\s+`)
        const m = rest.match(re)
        if (!m) break
        parts.push({ n, text: rest.slice(0, m.index).replace(/\s*·\s*$/, '').trim() })
        rest = rest.slice(m.index + m[0].length)
        n += 1
      }
      parts.push({ n, text: rest.replace(/\s*·\s*$/, '').trim() })
      return parts
    })
  }
  return { items, letters, before: before.join(' '), after: after.join(' ') }
}

// Blocks headed "### Exercise N..." or "## Can You Do This?" / "### Can You Do This?"
function blocks(md, { answers }) {
  const lines = md.split('\n')
  const found = []
  let cur = null
  let inAnswers = false
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.*)$/)
    const h3 = line.match(/^###\s+(.*)$/)
    if (h2) {
      inAnswers = /^Answers$/i.test(h2[1].trim())
      cur = null
      if (!answers && !inAnswers && /^Can You Do This\?$/i.test(h2[1].trim())) {
        cur = { key: 'can', number: null, title: 'Can You Do This?', lines: [] }
        found.push(cur)
      }
      continue
    }
    if (h3) {
      cur = null
      if (answers !== inAnswers) continue
      const ex = h3[1].match(/^Exercise\s+(\d+)(?::\s*(.*))?$/)
      if (ex) { cur = { key: `ex${ex[1]}`, number: Number(ex[1]), title: (ex[2] || '').trim(), lines: [] }; found.push(cur) }
      else if (/^Can You Do This\?$/i.test(h3[1].trim())) { cur = { key: 'can', number: null, title: 'Can You Do This?', lines: [] }; found.push(cur) }
      continue
    }
    if (line.startsWith('# ')) { cur = null; continue }
    if (cur && (answers === inAnswers || cur.key === 'can')) cur.lines.push(line)
  }
  return found
}

const italics = text => [...String(text).matchAll(/\*([^*]+)\*/g)].map(m => m[1].trim())

// A closed option set is used only when the book's own instruction names the
// choices and exactly one of them turns the prompt into the printed answer.
function mcqFor(ex) {
  const choices = [...new Set(italics(ex.instructions))]
  if (choices.length < 2 || choices.length > 4) return null
  if (!/\bor\b/.test(plain(ex.instructions))) return null
  const items = []
  for (const item of ex.items) {
    if (item.given || !/_{3,}/.test(item.prompt)) return null
    const samoan = italics(item.prompt)[0]
    if (!samoan || (samoan.match(/_{3,}/g) || []).length !== 1) return null
    const target = plain(item.answer).replace(/\s*\(.*\)\s*$/, '')
    const fits = choices.filter(c => plain(samoan.replace(/_{3,}/, c)) === target)
    if (fits.length !== 1) return null
    items.push({ ...item, options: choices.map(c => `*${c}*`), correct: `*${fits[0]}*` })
  }
  return items
}

function exercises(n, md) {
  const questions = blocks(md, { answers: false })
  const keys = new Map(blocks(md, { answers: true }).map(b => [b.key, numbered(b.lines, { runOn: true })]))
  // Which exercises sit inside teaching sections (checkpoint chapters) rather
  // than under "## Exercises".
  const placement = new Map()
  let section = null
  for (const line of md.split('\n')) {
    const h2 = line.match(/^##\s+(.*)$/)
    if (h2) { section = h2[1].trim(); if (/^Can You Do This\?$/i.test(section)) placement.set('can', 'section'); continue }
    const ex = line.match(/^###\s+Exercise\s+(\d+)/)
    if (ex && !placement.has(`ex${ex[1]}`)) placement.set(`ex${ex[1]}`, /^Exercises$/i.test(section) ? 'exercises' : 'inline')
  }
  const out = []
  for (const q of questions) {
    const parsed = numbered(q.lines)
    const key = keys.get(q.key)
    if (!key) { fail(`Chapter ${n} ${q.key}: no answer block`); continue }
    // Matching: lettered options under the numbered prompts, keyed "1-b, 2-d".
    if (parsed.letters.length) {
      let pairs = [...`${key.before} ${key.after}`.matchAll(/(\d+)-([a-z])\b/g)].map(m => [Number(m[1]), m[2]])
      if (!pairs.length) pairs = key.items.filter(a => /^[a-z]\.?$/.test(a.text)).map(a => [a.n, a.text[0]])
      const byLetter = new Map(parsed.letters.map(l => [l.letter, l.text]))
      const ok = pairs.length === parsed.items.length && parsed.items.every(item => pairs.some(([num, letter]) => num === item.n && byLetter.has(letter)))
      if (!ok) { fail(`Chapter ${n} ${q.key}: matching key does not cover every prompt`); continue }
      out.push({
        id: `ch${n}-${q.key}`,
        number: q.number,
        title: q.title,
        instructions: parsed.before,
        placement: placement.get(q.key) || 'exercises',
        type: 'matching',
        key: `${key.before} ${key.after}`.trim(),
        items: parsed.items.map(item => ({ id: `ch${n}-${q.key}-${item.n}`, n: item.n, prompt: item.text, answer: byLetter.get(pairs.find(([num]) => num === item.n)[1]) })),
      })
      continue
    }
    const answerByN = new Map(key.items.map(a => [a.n, a.text]))
    const known = new Set(parsed.items.map(i => i.n))
    for (const a of key.items) if (!known.has(a.n)) fail(`Chapter ${n} ${q.key}: answer ${a.n} has no question`)
    const answerNote = [key.before, key.after].filter(Boolean).join(' ') || undefined
    const items = parsed.items.map(item => {
      const answer = answerByN.get(item.n)
      return answer === undefined
        ? { id: `ch${n}-${q.key}-${item.n}`, n: item.n, prompt: item.text, given: true }
        : { id: `ch${n}-${q.key}-${item.n}`, n: item.n, prompt: item.text, answer }
    })
    const ex = {
      id: `ch${n}-${q.key}`,
      number: q.number,
      title: q.title,
      instructions: parsed.before,
      note: parsed.after || undefined,
      answerNote,
      placement: placement.get(q.key) || 'exercises',
      type: 'reveal',
      items,
    }
    const mcq = mcqFor(ex)
    if (mcq) { ex.type = 'mcq'; ex.items = mcq }
    if (!items.some(i => !i.given)) fail(`Chapter ${n} ${q.key}: no item has an answer`)
    out.push(ex)
  }
  for (const k of keys.keys()) if (!questions.some(q => q.key === k)) fail(`Chapter ${n}: answer block ${k} has no exercise`)
  return out
}

// "**Quick Practice A.** instructions" + numbered list + "Answers: 1. ... 2. ..."
function quickPractice(n, md) {
  const out = []
  const re = /^\*\*Quick Practice ([A-Z])\.\*\*\s*([\s\S]*?)\n\n((?:\d+\.\s.*\n?)+)\nAnswers:\s*([\s\S]*?)(?=\n\n|\n---|(?![\s\S]))/gm
  for (const m of md.matchAll(re)) {
    const prompts = numbered(m[3].split('\n')).items
    const answers = [...m[4].replace(/\s*\n\s*/g, ' ').matchAll(/(\d+)\.\s+(.*?)(?=\s+\d+\.\s|$)/g)].map(a => ({ n: Number(a[1]), text: a[2].trim() }))
    if (prompts.length !== answers.length || prompts.some((p, i) => answers[i]?.n !== p.n)) {
      fail(`Chapter ${n} Quick Practice ${m[1]}: ${prompts.length} prompts, ${answers.length} answers`)
      continue
    }
    out.push({
      id: `ch${n}-qp-${m[1].toLowerCase()}`,
      letter: m[1],
      title: `Quick Practice ${m[1]}`,
      instructions: m[2].replace(/\s*\n\s*/g, ' ').trim(),
      type: 'reveal',
      items: prompts.map((p, i) => ({ id: `ch${n}-qp-${m[1].toLowerCase()}-${p.n}`, n: p.n, prompt: p.text, answer: answers[i].text })),
    })
  }
  const printed = (md.match(/^\*\*Quick Practice [A-Z]\.\*\*/gm) || []).length
  if (printed !== out.length) fail(`Chapter ${n}: ${printed} Quick Practice blocks printed, ${out.length} parsed`)
  return out
}

// ---------------------------------------------------------------------------
// Quizzes
// ---------------------------------------------------------------------------

function quiz(n, md) {
  const blocksOf = md.replace(/\r\n?/g, '\n').split(/^## Question /m).slice(1)
  const questions = blocksOf.map((block, index) => {
    const lines = block.split('\n')
    const prompt = (lines.find(l => /^\*\*.+\*\*\s*$/.test(l)) || '').replace(/^\*\*/, '').replace(/\*\*\s*$/, '').trim()
    const options = []
    for (const line of lines) {
      const opt = line.match(/^- (\*\*)?([A-D])\.\s+(.*)$/)
      if (opt) {
        const correct = Boolean(opt[1]) && /✓/.test(opt[3])
        const text = opt[3].replace(/\s*✓[\s\S]*$/, '').replace(/\*\*$/, '').trim()
        options.push({ label: opt[2], text, correct, explanation: '' })
        continue
      }
      const why = line.match(/^\s{2,}- (.*)$/)
      if (why && options.length) options.at(-1).explanation = (options.at(-1).explanation + ' ' + why[1]).trim()
    }
    if (!prompt) fail(`Quiz ${n} Q${index + 1}: no prompt`)
    if (options.length !== 4) fail(`Quiz ${n} Q${index + 1}: ${options.length} options`)
    if (options.filter(o => o.correct).length !== 1) fail(`Quiz ${n} Q${index + 1}: ${options.filter(o => o.correct).length} keyed answers`)
    if (options.some(o => !o.explanation)) fail(`Quiz ${n} Q${index + 1}: an option has no explanation`)
    return { id: `q${index + 1}`, prompt, options }
  })
  if (questions.length !== 10) fail(`Quiz ${n}: ${questions.length} questions`)
  return questions
}

// ---------------------------------------------------------------------------
// Glossary
// ---------------------------------------------------------------------------

function glossary(md) {
  const out = []
  for (const sec of sections(md).slice(1)) {
    for (const t of tables(sec.body)) {
      if (t.head.join('|') !== 'Samoan|English|Ch') fail(`Glossary ${sec.title}: unexpected columns ${t.head.join('|')}`)
      t.rows.forEach(row => out.push({ samoan: plain(row[0]), english: row[1], chapter: Number(row[2]) || null, letter: sec.title }))
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const chapterFiles = fs.readdirSync(BOOK_IN).filter(f => /^Chapter-\d+\.md$/.test(f)).sort()
const extraFiles = ['Introduction.md', 'appendix-glossary.md', 'appendix-pronunciation.md', 'appendix-reference-charts.md']
const outputs = new Map()
const provenance = { generated: 'scripts/sync-course.mjs', sources: [] }

const chapters = []
const quizzes = {}
const vocab = []
const exerciseData = {}
const quickData = {}

for (const file of [...chapterFiles, ...extraFiles]) {
  const source = read(path.join(BOOK_IN, file))
  const copy = learnerCopy(source)
  if (/Author Verification|\[(SOURCE|REMIX|mosel|sayit)\b/i.test(copy)) fail(`${file}: private material survived the strip`)
  outputs.set(path.join(BOOK_OUT, file), copy)
  provenance.sources.push({ source: `book/${file}`, sha256: sha(source), copy: sha(copy) })
}

for (const file of chapterFiles) {
  const n = Number(file.match(/\d+/)[0])
  const md = outputs.get(path.join(BOOK_OUT, file))
  chapters.push(chapterMeta(n, md))
  vocab.push(...vocabulary(n, md))
  exerciseData[n] = exercises(n, md)
  const qp = quickPractice(n, md)
  if (qp.length) quickData[n] = qp
  const quizFile = path.join(QUIZ_IN, `samoan_grammar_quiz_ch${pad(n)}.md`)
  if (!fs.existsSync(quizFile)) { fail(`Chapter ${n}: no quiz file`); continue }
  const quizSource = read(quizFile)
  // The quizzes carry their own author block too; strip it the same way.
  const quizCopy = learnerCopy(quizSource)
  quizzes[n] = { chapter: n, title: chapters.at(-1).title, questions: quiz(n, quizCopy) }
  provenance.sources.push({ source: `quizzes/samoan_grammar_quiz_ch${pad(n)}.md`, sha256: sha(quizSource) })
}

// Whether each chapter has a quiz, so a chapter page need not load the quiz bank.
for (const c of chapters) c.quiz = Boolean(quizzes[c.chapter])

const glossaryRows = glossary(outputs.get(path.join(BOOK_OUT, 'appendix-glossary.md')))

vocab.forEach((v, i) => { v.id = `w${String(i + 1).padStart(4, '0')}` })

const counts = {
  chapters: chapters.length,
  quizzes: Object.keys(quizzes).length,
  quizQuestions: Object.values(quizzes).reduce((a, q) => a + q.questions.length, 0),
  words: vocab.length,
  glossary: glossaryRows.length,
  exercises: Object.values(exerciseData).reduce((a, list) => a + list.length, 0),
  exerciseItems: Object.values(exerciseData).flat().reduce((a, e) => a + e.items.length, 0),
  givenItems: Object.values(exerciseData).flat().reduce((a, e) => a + e.items.filter(i => i.given).length, 0),
  mcqExercises: Object.values(exerciseData).flat().filter(e => e.type === 'mcq').length,
  quickPractice: Object.values(quickData).flat().length,
}
provenance.counts = counts

const json = value => JSON.stringify(value, null, 2) + '\n'
outputs.set(path.join(DATA_OUT, 'chapters.json'), json(chapters))
outputs.set(path.join(DATA_OUT, 'quizzes.json'), json(quizzes))
outputs.set(path.join(DATA_OUT, 'book-vocabulary.json'), json(vocab))
outputs.set(path.join(DATA_OUT, 'glossary.json'), json(glossaryRows))
outputs.set(path.join(DATA_OUT, 'book-exercises.json'), json(exerciseData))
outputs.set(path.join(DATA_OUT, 'quick-practice.json'), json(quickData))
outputs.set(path.join(DATA_OUT, 'provenance.json'), json(provenance))

if (problems.length) {
  console.error(`${problems.length} problem(s):\n- ${problems.join('\n- ')}`)
  process.exitCode = 1
}

if (CHECK) {
  const stale = [...outputs].filter(([file, text]) => !fs.existsSync(file) || read(file) !== text).map(([file]) => path.relative(APP, file))
  console.log(stale.length ? `Out of date: ${stale.join(', ')}` : 'Website copy matches the course.')
  if (stale.length) process.exitCode = 1
} else {
  fs.mkdirSync(BOOK_OUT, { recursive: true })
  fs.mkdirSync(DATA_OUT, { recursive: true })
  for (const [file, text] of outputs) fs.writeFileSync(file, text, 'utf8')
  console.log('Synced.', counts)
}
