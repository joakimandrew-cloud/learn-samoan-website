// The Grid figure's pure logic (src/premium/components/interactive/grid-logic.js)
// and its lab fixture: every cell's English is the one the chapter's own table
// prints in that form's row.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Grid from '../src/premium/components/interactive/Grid.jsx'
import { curly, gridCells, newRound, plain, promptsFor, quizReducer, stepCell, stop, verdictParts } from '../src/premium/components/interactive/grid-logic.js'

const APP = path.join(__dirname, '..')
const fixture = JSON.parse(fs.readFileSync(path.join(APP, 'src/premium/components/interactive/fixtures/grid.json'), 'utf8'))

it('renders printed italic spans inside cell meanings without exposing Markdown', () => {
  const chapter = JSON.parse(fs.readFileSync(path.join(APP, 'src/data/interactives/08.json'), 'utf8'))
  const html = renderToStaticMarkup(createElement(Grid, { data: chapter.items[0].data }))
  expect(html).not.toContain('*ʻo*')
  expect(html).not.toContain('*ʻo le*')
  expect(html).toContain('the question word for who')
  expect(html).toContain('the question word for what')
})

const ROWS = [
  { label: 'A', cells: [{ sm: 'a1', en: 'one' }, { sm: 'a2', en: 'two' }, null] },
  { label: 'B', cells: [null, { sm: 'b2', en: 'two' }, { sm: 'b3' }] },
  { label: 'C', cells: [{ sm: 'c1', en: 'three' }] },
]

describe('grid cells and arrow keys', () => {
  it('lists only the cells that hold a form, in reading order', () => {
    expect(gridCells(ROWS, 3).map(e => e.key)).toEqual(['0-0', '0-1', '1-1', '1-2', '2-0'])
  })
  it('steps over empty squares and stops at the edge', () => {
    expect(stepCell(ROWS, 3, 0, 0, [1, 0])).toBe('2-0')
    expect(stepCell(ROWS, 3, 0, 1, [0, 1])).toBe(null)
    expect(stepCell(ROWS, 3, 1, 1, [0, -1])).toBe(null)
    expect(stepCell(ROWS, 3, 1, 1, [0, 1])).toBe('1-2')
    expect(stepCell(ROWS, 3, 2, 0, [-1, 0])).toBe('0-0')
    expect(stepCell(ROWS, 3, 0, 0, [-1, 0])).toBe(null)
  })
  it('strips italic stars for screen-reader lines', () => {
    expect(plain('After *ʻo* or *ia te*')).toBe('After ʻo or ia te')
  })
  it('curls straight double quotes for display, and nothing else', () => {
    expect(curly('me (the independent form of "I")')).toBe('me (the independent form of “I”)')
    expect(curly('he, she')).toBe('he, she')
  })
})

describe('quiz prompts', () => {
  it('asks by the English, and names row and column when it is shared or missing', () => {
    const p = promptsFor(gridCells(ROWS, 3))
    expect(p['0-0']).toEqual({ en: 'one', where: false })
    expect(p['0-1']).toEqual({ en: 'two', where: true })
    expect(p['1-1']).toEqual({ en: 'two', where: true })
    expect(p['1-2']).toEqual({ en: null, where: true })
  })
})

describe('the verdict line', () => {
  const say = parts => parts.map(p => (typeof p === 'string' ? p : `<${p.sm}>`)).join('')
  const byKey = new Map(gridCells([
    { label: 'A', cells: [{ sm: 'tā', en: 'we two (you and I)' }, { sm: 'Sā tātou siva.', en: 'We danced.' }] },
    { label: 'B', cells: [{ sm: 'Sā tātou alu.' }, { sm: 'Sā mātou alu.' }] },
  ], 2).map(e => [e.key, e]))

  it('closes a phrase with one full stop, never two', () => {
    expect([stop('they'), stop('We danced.'), stop('Did you all dance?'), stop('of "I")')]).toEqual(['.', '', '', '.'])
  })
  it('names the form and its English, or just the form', () => {
    expect(say(verdictParts({ type: 'right', key: '0-0' }, byKey))).toBe('Right: <tā> is we two (you and I).')
    expect(say(verdictParts({ type: 'right', key: '0-1' }, byKey))).toBe('Right: <Sā tātou siva.> is We danced.')
    expect(say(verdictParts({ type: 'late', key: '1-0' }, byKey))).toBe('<Sā tātou alu.>')
  })
  it('after a miss, says what was tapped and which form is the answer', () => {
    expect(say(verdictParts({ type: 'wrong', key: '0-1', tapped: '0-0' }, byKey))).toBe('<tā> is we two (you and I). Tap the outlined answer: <Sā tātou siva.>')
    expect(say(verdictParts({ type: 'wrong', key: '0-0', tapped: '1-1' }, byKey))).toBe('That is <Sā mātou alu.> Tap the outlined answer: <tā>.')
  })
  it('says nothing before the first answer or after a new round', () => {
    expect(verdictParts(null, byKey)).toBe(null)
    expect(verdictParts({ type: 'new' }, byKey)).toBe(null)
  })
})

describe('a Find-the-form round', () => {
  const keys = ['x', 'y', 'z']
  const tap = (s, key) => quizReducer(s, { type: 'tap', key })

  it('counts a right first tap and moves on', () => {
    const s = tap(newRound(keys), 'x')
    expect(s.found).toEqual({ x: 'first' })
    expect([s.at, s.firstTime, s.asked]).toEqual([1, 1, 1])
    expect(s.last).toEqual({ type: 'right', key: 'x' })
  })
  it('a miss marks the tapped cell, keeps the prompt, and the answer then counts as late', () => {
    let s = tap(newRound(keys), 'y')
    expect([s.at, s.missed, s.wrong, s.shake]).toEqual([0, true, 'y', 1])
    expect(s.last).toEqual({ type: 'wrong', key: 'x', tapped: 'y' })
    s = tap(s, 'y')
    expect([s.at, s.shake, s.asked]).toEqual([0, 2, 0])
    s = tap(s, 'x')
    expect(s.found.x).toBe('late')
    expect([s.at, s.firstTime, s.asked, s.missed, s.wrong]).toEqual([1, 0, 1, false, null])
  })
  it('ignores the second tap of a double tap on the answer', () => {
    const once = tap(newRound(keys), 'x')
    expect(tap(once, 'x')).toBe(once)
  })
  it('asks every form once, then ignores taps', () => {
    let s = newRound(keys, ['z', 'x', 'y'])
    for (const k of ['z', 'x', 'y']) s = tap(s, k)
    expect([s.at, s.firstTime, s.asked]).toEqual([3, 3, 3])
    expect(tap(s, 'x')).toBe(s)
  })
  it('a new round clears everything but the forms', () => {
    let s = tap(tap(newRound(keys), 'y'), 'x')
    s = quizReducer(s, { type: 'new', order: ['y', 'z', 'x'] })
    expect(s).toEqual({ ...newRound(keys, ['y', 'z', 'x']), last: { type: 'new' } })
  })
})

// The chapter's two-column tables, "| *form* | English |", form -> English.
function tableGlosses(n) {
  const out = new Map()
  for (let k = n; k >= 1; k -= 1) {
    const md = fs.readFileSync(path.join(APP, 'book', `Chapter-${String(k).padStart(2, '0')}.md`), 'utf8')
    for (const m of md.matchAll(/^\|\s*\*([^*|]+)\*\s*\|\s*([^|]+?)\s*\|\s*$/gm)) {
      if (!out.has(m[1])) out.set(m[1], new Set())
      out.get(m[1]).add(m[2])
    }
  }
  return out
}

describe('grid lab fixture', () => {
  const glosses = tableGlosses(fixture.chapter)
  for (const item of fixture.items) {
    it(`${item.id}: every cell's English is its own row in the chapter's table`, () => {
      for (const e of gridCells(item.data.rows, item.data.cols.length)) {
        if (!e.cell.en) continue
        expect(glosses.get(e.cell.sm), `${e.cell.sm} is in a table`).toBeDefined()
        expect([...glosses.get(e.cell.sm)], `${e.cell.sm}`).toContain(e.cell.en)
      }
    })
    it(`${item.id}: one cell (or null) per column, and unique quiz prompts`, () => {
      for (const row of item.data.rows) expect(row.cells).toHaveLength(item.data.cols.length)
      const p = promptsFor(gridCells(item.data.rows, item.data.cols.length))
      if (item.data.quiz) expect(Object.values(p).every(x => x.en && !x.where)).toBe(true)
    })
  }
})
