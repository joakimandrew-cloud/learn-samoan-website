// Mutation proofs for check:figures rules added in Step 9 batches 2 and 3 (plan 2026-11-06-chapter-page-simplify,
// reviews/lesson-simplify-2026-11-06/Engine-Limits.md rows 19 to 21). Each runs the real checker on a
// fixture figure file through --figures DIR, against the real book text. Every Sāmoan and English string
// in a fixture is copied from that chapter's book/Chapter-NN.md.
import { afterAll, describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SCRIPT = path.join(APP, 'scripts/premium/check-figures.mjs')
const dirs = []
afterAll(() => dirs.forEach(dir => fs.rmSync(dir, { recursive: true, force: true })))

function check(chapter, source) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-figures-'))
  dirs.push(dir)
  fs.writeFileSync(path.join(dir, `${String(chapter).padStart(2, '0')}.js`), source, 'utf8')
  const run = spawnSync(process.execPath, [SCRIPT, String(chapter), '--figures', dir], { encoding: 'utf8' })
  return { code: run.status, out: run.stdout + run.stderr }
}

// Chapter 13's Note: Both *Sā vaʻai le teine ʻi le iʻa* and *Sā vaʻai ʻi le iʻa le teine* say "the girl saw the fish".
const order = en => `
const face = (text, role, label) => (label ? { text, role, label } : { text, role })
export const FIGURES = [{
  id: '13.1', kind: 'row', title: 'The one who sees and the thing reached can come in either order.',
  after: { section: 'the-two-participant-sentence', block: b => b.type === 'examples' && JSON.stringify(b.pairs).includes('Sā ia vaʻai ʻi le pusi') },
  alt: ['*Sā vaʻai le teine ʻi le iʻa.* The girl saw the fish.'],
  scenes: [{
    key: 'iaa',
    tiles: { sa: [face('Sā', 'tense')], verb: [face('vaʻai', 'verb')], doer: [face('le teine', 'noun')], i: [face('ʻi', 'marker', 'place word')], reached: [face('le iʻa', 'noun')] },
    before: { say: 'Sā vaʻai le teine ʻi le iʻa.', en: 'The girl saw the fish.' },
    after: { say: 'Sā vaʻai ʻi le iʻa le teine', en: ${JSON.stringify(en)} },
    states: [[['sa', 0], ['verb', 0], ['doer', 0], ['i', 0], ['reached', 0]], [['sa', 0], ['verb', 0], ['i', 0], ['reached', 0], ['doer', 0]]],
    beats: [{ kind: 'move', tile: 'doer', to: 1, arc: true }, { kind: 'en' }],
  }],
}]
`

// Chapter 28's Figure 28.2 as its batch 2 repair left it, with ownSlots set.
const readings = (ownSlots, secondReads = true) => `
const face = (text, role, label) => (label ? { text, role, label } : { text, role })
export const FIGURES = [{
  id: '28.2', kind: 'fork', title: 'Position separates them every time',${ownSlots ? ' ownSlots: true,' : ''}
  after: { section: 'the-agent-marker-e', block: b => b.type === 'p' && b.text.includes('Position separates') },
  lanes: [{ label: 'the general particle', forms: [] }, { label: 'the agent marker', forms: [] }],
  alt: ['*E tausi pepe e le fafine.* The woman takes care of the babies.'],
  scenes: [{ key: 'tausi', cases: [
    { lane: 0, say: 'E tausi pepe e le fafine.', en: 'The woman takes care of the babies.',
      row: [{ ...face('E', 'tense', 'general particle'), reads: true }, { ...face('tausi', 'verb', 'bare verb'), ring: true }, face('pepe', 'noun'), face('e', 'quiet'), face('le fafine', 'noun')] },
    { lane: 1, say: 'E tausi pepe e le fafine.', en: 'The woman takes care of the babies.',
      row: [face('E', 'tense', 'general particle'), face('tausi', 'verb'), face('pepe', 'noun'), { ...face('e', 'marker', 'agent marker')${secondReads ? ', reads: true' : ''} }, { ...face('le fafine', 'noun', 'noun after the verb'), ring: true }] },
  ] }],
}]
`

describe('check:figures, Step 9 batch 2 rules', () => {
  it('accepts English the book gives in a prose "say" form inside one sentence (Chapter 13 Note)', () => {
    for (const en of ['The girl saw the fish.', 'the girl saw the fish']) {
      const run = check(13, order(en))
      expect(run.out).toContain('0 misses')
      expect(run.code).toBe(0)
    }
  })

  it('still fails a mispair: English printed in the chapter but not said for that sentence', () => {
    const run = check(13, order('She saw the cat.'))
    expect(run.code).toBe(1)
    expect(run.out).toMatch(/is not printed beside "Sā vaʻai ʻi le iʻa le teine"/)
  })

  it('accepts ownSlots on a Fork of readings with one reading tile a case, and fails a case with none', () => {
    expect(check(28, readings(true)).code).toBe(0)
    const run = check(28, readings(true, false))
    expect(run.code).toBe(1)
    expect(run.out).toMatch(/ownSlots needs exactly one slot or one reading tile/)
  })
})

// Chapter 25's Figure 25.2: 'two' holds the plural pronoun with the singular verb between two swaps
// (ʻAua tātou te nofo, never printed); 'one' lands both in one beat; 'gap' keeps the verb's place open.
const agree = shape => {
  const mid = { two: "[['aua', 0], ['who', 1], ['te', 0], ['verb', 0]],", one: '', gap: "[['aua', 0], ['who', 1], ['te', 0], ['GHOST']]," }[shape]
  const beats = {
    one: "{ kind: 'swap', tile: ['who', 'verb'], to: 1 }, { kind: 'en' }",
    two: "{ kind: 'swap', tile: 'who', to: 1 }, { kind: 'swap', tile: 'verb', to: 2 }, { kind: 'en' }",
    gap: "{ kind: 'drop', tile: 'verb', roll: 'who', to: 1 }, { kind: 'add', tile: 'verb', to: 2 }, { kind: 'en' }",
  }[shape]
  return `
const face = (text, role, label) => (label ? { text, role, label } : { text, role })
export const FIGURES = [{
  id: '25.2', kind: 'row', title: 'When More Than One Is Meant',
  after: { section: 'when-more-than-one-is-meant', block: b => b.type === 'p' && b.text.includes('Because the group is more than one') },
  alt: ['*ʻAua tātou te nonofo.* Let us not stay.'],
  scenes: [{
    key: 'nofo',
    tiles: { aua: [face('ʻAua', 'verb', 'do-not verb')], who: [face('ʻe', 'pronoun', 'you'), face('tātou', 'pronoun', 'we, you and I')], te: [face('te', 'tense', '')], verb: [face('nofo', 'verb', 'singular'), face('nonofo', 'verb', 'plural form')] },
    before: { say: 'ʻAua ʻe te nofo.', en: "Don't stay." },
    after: { say: 'ʻAua tātou te nonofo.', en: 'Let us not stay.' },
    states: [[['aua', 0], ['who', 0], ['te', 0], ['verb', 0]], ${mid} [['aua', 0], ['who', 1], ['te', 0], ['verb', 1]]],
    beats: [${beats}],
  }],
}]
`
}

// Chapter 23's Figure 23.4 with English on its last state: *le uluaʻi tama* is also "the first boy" (line 217).
const uluai = en => `
const face = (text, role, label) => (label ? { text, role, label } : { text, role })
export const FIGURES = [{
  id: '23.4', kind: 'row', title: 'The two forms mean the same thing; only their place changes.',
  after: { section: 'putting-things-in-order', block: b => b.type === 'p' && b.text.includes('only their place changes') },
  alt: ['The two forms mean the same thing; only their place changes.'],
  scenes: [{
    key: 'uluai',
    tiles: { le: [face('le', 'quiet')], tama: [face('tama', 'noun')], muamua: [face('muamua', 'marker', 'first')], uluai: [face('uluaʻi', 'marker', 'first')] },
    before: { say: 'le tama muamua', en: 'the first boy' },
    after: { say: 'le uluaʻi tama', en: ${JSON.stringify(en)} },
    states: [[['le', 0], ['tama', 0], ['muamua', 0]], [['le', 0], ['tama', 0]], [['le', 0], ['uluai', 0], ['tama', 0]]],
    beats: [{ kind: 'drop', tile: 'muamua', to: 1 }, { kind: 'add', tile: 'uluai', to: 2 }, { kind: 'en' }],
  }],
}]
`

describe('check:figures, Step 9 batch 3 rules', () => {
  it('fails a held in-between row that reads as a sentence the chapter never prints (25.2 between two swaps)', () => {
    const run = check(25, agree('two'))
    expect(run.code).toBe(1)
    expect(run.out).toContain('state 1 holds "ʻAua tātou te nofo", which book/Chapter-25.md does not print')
  })

  it('passes the same change landed in one beat, or held with its place left open', () => {
    for (const shape of ['one', 'gap']) {
      const run = check(25, agree(shape))
      expect(run.out).toContain('0 misses')
      expect(run.code).toBe(0)
    }
  })

  it('accepts English the book gives as *X* is also "..." (Chapter 23, line 217), and still fails a mispair', () => {
    const ok = check(23, uluai('the first boy'))
    expect(ok.out).toContain('0 misses')
    expect(ok.code).toBe(0)
    const bad = check(23, uluai('There are three boys.'))
    expect(bad.code).toBe(1)
    expect(bad.out).toMatch(/the English "There are three boys\." is not printed beside "le uluaʻi tama"/)
  })
})
