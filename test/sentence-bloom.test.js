// The homepage sentence bloom (src/premium/lib/blueprint/sentence-bloom.js). Every
// Samoan string it shows comes from src/data/sentence-bloom.json, which
// scripts/build-sentence-bloom.mjs builds from sentences the book prints with
// their English; nothing is typed into the module.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildData, serialise, DATA_FILE } from '../scripts/build-sentence-bloom.mjs'
import { pairedIn } from '../scripts/check-interactives.mjs'
import chapters from '../src/data/chapters.json'

const { data, errors } = buildData()

describe('sentence bloom data', () => {
  it('builds from the book with no errors', () => {
    expect(errors, errors.join('\n')).toEqual([])
  })

  it('is the file the book gives now (run npm run bloom after a sync)', () => {
    expect(readFileSync(DATA_FILE, 'utf8') === serialise(data)).toBe(true)
  })

  it('shows only sentences printed with their English in their chapter', () => {
    for (const r of Object.values(data.rows)) {
      expect(pairedIn(r.lesson, r.sm, r.en), `${r.id} ${r.sm}`).toBe(true)
      const line = readFileSync(new URL(`../book/Chapter-${String(r.lesson).padStart(2, '0')}.md`, import.meta.url), 'utf8').split('\n')[r.line - 1]
      expect(line, r.id).toContain(`*${r.sm}*`)
      expect(line, r.id).toContain(r.en)
    }
  })

  it('cuts each play row into its own words', () => {
    for (const s of data.play.segs) for (const id of s.rows) {
      const r = data.rows[id]
      expect(r.words.map(w => w[0]).join(' ') + r.punct).toBe(r.sm)
      for (const [, label, src] of r.words) {
        expect(label, id).toBeTruthy()
        expect(data.sources[src], id).toMatch(/^book\/Chapter-\d{2}\.md:\d+-\d+ \| /)
      }
    }
  })

  it('maps every chapter, in its level, with at least one sentence', () => {
    expect(data.lessons.map(L => L.n)).toEqual(chapters.map(c => c.chapter))
    for (const L of data.lessons) {
      expect(L.title).toBe(chapters[L.n - 1].title)
      expect(data.course.groups.find(g => g.key === L.group)?.lessons, `chapter ${L.n}`).toContain(L.n)
      expect(L.preview.length, `chapter ${L.n}`).toBeGreaterThan(0)
      for (const id of L.preview) expect(data.rows[id].lesson).toBe(L.n)
    }
  })

  it('stops the walk after the page chapter only at chapters whose own sentence it shows', () => {
    const says = data.play.says
    const beats = data.play.ending.filter(b => /^say-\d+$/.test(b.id)).map(b => +b.id.slice(4))
    expect(says.map(s => s.lesson)).toEqual(beats)
    let last = data.play.pageLesson
    for (const s of says) {
      expect(s.lesson).toBeGreaterThan(last)
      expect(data.rows[s.row].lesson).toBe(s.lesson)
      last = s.lesson
    }
  })

  it('ends the play on the page chapter it lands on', () => {
    expect(data.play.segs.at(-1).lesson).toBe(data.play.pageLesson)
    expect(data.lessons[data.play.pageLesson - 1].card).toBe(data.play.segs.at(-1).rows[1])
  })
})

describe('sentence bloom code', () => {
  it('keeps Samoan out of the module and the homepage wrapper', () => {
    // The glottal stop letter and the long vowels mark Samoan text.
    const samoan = /[ʻĀāĒēĪīŌōŪū]/
    for (const file of ['src/premium/lib/blueprint/sentence-bloom.js', 'src/premium/components/HomeBlueprint.jsx']) {
      const code = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
      expect(code, file).not.toMatch(samoan)
    }
  })

  it('says chapter, never lesson, in what it shows', () => {
    const code = readFileSync(new URL('../src/premium/lib/blueprint/sentence-bloom.js', import.meta.url), 'utf8')
    // visible strings only: template and quoted literals outside comments
    const strings = code.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n').match(/(['`])(?:(?!\1)[^\\]|\\.)*\1/g) || []
    for (const s of strings) expect(s, s).not.toMatch(/\bLessons?\b/)
  })
})
