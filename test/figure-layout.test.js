// Layout guard for the chapter figures (plan 2026-11-06-chapter-page-simplify, Step 9 batch 1).
// Every figure in every src/premium/figures/NN.js is laid out through the engine's own geometry
// and frame functions at 390 and 1440, at every beat edge of every scene, and the test fails on a
// throw. It exists because a Fork with no slot crashed in the browser (TypeError reading 'x' of
// null) while check:figures and the build passed. Widths come from a stand-in measure (Node has no
// DOM), so this guards against crashes and impossible numbers, not against how a figure looks.
import { beforeAll, describe, expect, it } from 'vitest'

const STAND_IN = { fontSize: 100, text: '' }
beforeAll(() => {
  if (typeof globalThis.document !== 'undefined') return
  const span = {
    setAttribute() {},
    style: {
      set fontSize(v) { STAND_IN.fontSize = parseFloat(v) },
      get fontSize() { return `${STAND_IN.fontSize}px` },
      cssText: '',
    },
    set textContent(v) { STAND_IN.text = String(v) },
    get textContent() { return STAND_IN.text },
    getBoundingClientRect: () => ({ width: STAND_IN.text.length * STAND_IN.fontSize * 0.5 }),
  }
  const ctx = { font: '14px sans-serif', measureText(text) { return { width: String(text).length * (parseFloat(this.font.match(/(\d+(?:\.\d+)?)px/)?.[1]) || 14) * 0.5 } } }
  globalThis.document = {
    createElement: tag => (tag === 'canvas' ? { getContext: () => ctx } : span),
    body: { appendChild() {} },
  }
})

const files = import.meta.glob('../src/premium/figures/*.js', { eager: true })
const WIDTHS = [390, 1440]

/** Every moment worth drawing: each beat's edges and middle, the start, the rest and past it. */
function moments(timeline) {
  const ts = new Set([0, timeline.duration, timeline.duration + 1000])
  ;(timeline.beats || []).forEach(b => {
    ;[b.start, b.travelEnd, b.end, (b.start + (b.travelEnd ?? b.end)) / 2].forEach(t => Number.isFinite(t) && ts.add(t))
  })
  return [...ts].sort((a, b) => a - b)
}

function finiteNumbers(value, path = 'frame', seen = new Set()) {
  if (typeof value === 'number' && Number.isNaN(value)) throw new Error(`${path} is NaN`)
  if (!value || typeof value !== 'object' || seen.has(value)) return
  seen.add(value)
  for (const [k, v] of Object.entries(value)) if (typeof v !== 'function') finiteNumbers(v, `${path}.${k}`, seen)
}

async function layOut(def, width) {
  const { rowFrame, rowGeometry, rowLayouts, rowSizes, rowTimeline } = await import('../src/premium/figure-engine/row.js')
  const { forkFrame, forkGeometry, forkLayouts, forkLines, forkSizes, forkTimeline } = await import('../src/premium/figure-engine/fork.js')
  const { pathFrame, pathTimeline } = await import('../src/premium/figure-engine/path.js')
  const { buildFrame, buildGeometry, buildLayout, buildSizes, buildTimeline } = await import('../src/premium/figure-engine/build.js')
  const { gridTimeline } = await import('../src/premium/figure-engine/grid-timeline.js')
  const { enLineCount } = await import('../src/premium/figure-engine/lib/metrics.js')
  let heights = []
  if (def.kind === 'row') {
    const sizes = rowSizes(def, width)
    const lines = Math.max(...def.scenes.map(scene => rowLayouts(scene, width, sizes).lines))
    const english = scene => [scene.before?.en, scene.after?.en, ...(scene.lines ?? []).map(line => line.en ?? line.note)].filter(Boolean)
    const enLines = Math.max(1, ...def.scenes.flatMap(english).map(text => enLineCount(text, width)))
    const twoLineBefore = width < 480 && def.scenes.some(item => item.before && item.before.say.length + (item.before.en ?? '').length > 40)
    const geometry = rowGeometry(sizes, def.scenes, twoLineBefore, lines, def.scenes.some(item => item.before), enLines)
    def.scenes.forEach(scene => {
      const timeline = rowTimeline(scene)
      const layout = rowLayouts(scene, width, sizes)
      moments(timeline).forEach(t => finiteNumbers(rowFrame(scene, timeline, t, layout, geometry)))
    })
    heights = [geometry.height]
  } else if (def.kind === 'fork') {
    const sizes = forkSizes(def, width)
    const lines = forkLines(def, width, sizes)
    const enLines = Math.max(1, ...def.scenes.flatMap(item => item.cases.map(c => enLineCount(c.en, width))))
    const geometry = forkGeometry(sizes, width, def, lines, enLines)
    def.scenes.forEach(scene => {
      const timeline = forkTimeline(scene, Boolean(def.limit))
      const layout = forkLayouts(scene, width, sizes)
      moments(timeline).forEach(t => finiteNumbers(forkFrame(scene, timeline, t, layout, geometry, width)))
    })
    heights = [geometry.height]
  } else if (def.kind === 'path') {
    def.scenes.forEach(scene => {
      const timeline = pathTimeline(scene)
      moments(timeline).forEach(t => finiteNumbers(pathFrame(def, scene, timeline, t, width)))
    })
  } else if (def.kind === 'build') {
    const s = buildSizes(width)
    const geometry = buildGeometry(s, def.scenes)
    def.scenes.forEach(scene => {
      const timeline = buildTimeline(scene)
      const layout = buildLayout(scene, width, s)
      moments(timeline).forEach(t => finiteNumbers(buildFrame(scene, timeline, t, layout, geometry, s)))
    })
  } else if (def.kind === 'grid') {
    gridTimeline(def)
  } else {
    throw new Error(`unknown kind ${def.kind}`)
  }
  heights.forEach(h => expect(Number.isFinite(h) && h > 0).toBe(true))
}

/** Every scene's run time, for the under-8-s rule (Direction.md part 7). */
async function durations(def) {
  const { rowTimeline } = await import('../src/premium/figure-engine/row.js')
  const { forkTimeline } = await import('../src/premium/figure-engine/fork.js')
  const { pathTimeline } = await import('../src/premium/figure-engine/path.js')
  const { buildTimeline } = await import('../src/premium/figure-engine/build.js')
  const make = { row: rowTimeline, fork: scene => forkTimeline(scene, Boolean(def.limit)), path: pathTimeline, build: buildTimeline }[def.kind]
  return make ? def.scenes.map(scene => make(scene).duration) : []
}

const figures = Object.entries(files).flatMap(([file, mod]) => (mod.FIGURES || []).map(def => [file.match(/(\d+)\.js$/)[1], def]))

describe('every chapter figure lays out without a throw', () => {
  it('finds the figure files', () => {
    expect(Object.keys(files).length).toBeGreaterThan(0)
    expect(figures.length).toBeGreaterThan(0)
  })
  for (const [chapter, def] of figures) {
    for (const width of WIDTHS) {
      it(`Chapter ${chapter}, figure ${def.id} (${def.kind}) at ${width}`, async () => {
        await layOut(def, width)
      })
    }
    it(`Chapter ${chapter}, figure ${def.id}: every scene runs under 8 s`, async () => {
      for (const ms of await durations(def)) expect(ms).toBeLessThan(8000)
    })
  }
})

describe('the guard catches a Fork with nothing but a ring', () => {
  it('a ring-only Fork lays out at both widths', async () => {
    const def = {
      id: 'T.1', kind: 'fork', title: 't',
      lanes: [{ label: 'one', forms: ['a'] }, { label: 'two', forms: ['b'] }],
      scenes: [{
        key: 'k',
        cases: [
          { lane: 0, say: 'x a.', en: 'X a.', row: [{ text: 'x', role: 'verb' }, { text: 'a', role: 'marker', label: 'place word', ring: true }] },
          { lane: 1, say: 'x b.', en: 'X b.', row: [{ text: 'x', role: 'verb' }, { text: 'b', role: 'marker', label: 'place word', ring: true }] },
        ],
      }],
    }
    for (const width of WIDTHS) await layOut(def, width)
  })
})

describe('Fork slots and labels (Step 9 batch 1 fixes)', () => {
  const ownDef = {
    id: 'T.2', kind: 'fork', title: 't', ownSlots: true,
    lanes: [{ label: 'after', forms: ['b'] }, { label: 'before', forms: ['c'] }],
    scenes: [{
      key: 'k',
      cases: [
        { lane: 0, say: 'a x b.', en: 'A.', row: [{ text: 'a', role: 'tense' }, { text: 'x', role: 'verb' }, { slot: true, form: { text: 'b', role: 'verb', label: 'describing verb' } }] },
        { lane: 1, say: 'a c y.', en: 'B.', row: [{ text: 'a', role: 'tense' }, { slot: true, form: { text: 'c', role: 'marker', label: 'want word' } }, { text: 'y', role: 'verb' }] },
      ],
    }],
  }
  it('a lane that owns its slot is the only branch drawn, and only once it lights', async () => {
    const { forkFrame, forkGeometry, forkLayouts, forkLines, forkSizes, forkTimeline } = await import('../src/premium/figure-engine/fork.js')
    for (const width of WIDTHS) {
      const s = forkSizes(ownDef, width)
      const geometry = forkGeometry(s, width, ownDef, forkLines(ownDef, width, s))
      const scene = ownDef.scenes[0]
      const timeline = forkTimeline(scene)
      const layout = forkLayouts(scene, width, s)
      const rest = forkFrame(scene, timeline, timeline.duration, layout, geometry, width)
      expect(rest.branches.filter(b => b.d).map(b => b.lane)).toEqual([1])
      expect(rest.branches.find(b => b.lane === 1).track).toBe(true)
      const start = forkFrame(scene, timeline, 0, layout, geometry, width)
      expect(start.branches.some(b => b.d && b.track)).toBe(false)
    }
  })
  it('a slot takes the label set on its form, and a plain marker shows its own', async () => {
    const { forkLabelOf } = await import('../src/premium/figure-engine/fork.js')
    expect(forkLabelOf({ slot: true, form: { text: 'b', role: 'verb', label: 'describing verb' } })).toEqual({ role: 'verb', label: 'describing verb' })
    expect(forkLabelOf({ slot: true, form: { text: 'b', role: 'verb' } })).toBe(null)
    expect(forkLabelOf({ text: 'ʻO', role: 'marker', label: 'presenting particle' })).toEqual({ role: 'marker', label: 'presenting particle' })
    expect(forkLabelOf({ text: 'x', role: 'verb' })).toBe(null)
  })
})

describe('Step 9 batch 2 engine fixes (Engine-Limits.md rows 19 to 27)', () => {
  it('a Fork of readings with ownSlots draws only the lit lane, onto its own reading tile; a lone reading tile lays out', async () => {
    const { forkFrame, forkGeometry, forkLayouts, forkLines, forkSizes, forkTimeline } = await import('../src/premium/figure-engine/fork.js')
    const def = {
      id: 'T.3', kind: 'fork', title: 't', ownSlots: true,
      lanes: [{ label: 'one', forms: [] }, { label: 'two', forms: [] }],
      scenes: [{ key: 'k', cases: [
        { lane: 0, say: 'a', en: null, row: [{ text: 'a', role: 'verb', reads: true }] },
        { lane: 1, say: 'b a c.', en: 'B.', row: [{ text: 'b', role: 'tense' }, { text: 'a', role: 'marker', label: 'place word', reads: true }, { text: 'c', role: 'noun', ring: true }] },
      ] }],
    }
    for (const width of WIDTHS) {
      await layOut(def, width)
      const s = forkSizes(def, width)
      const geometry = forkGeometry(s, width, def, forkLines(def, width, s))
      const scene = def.scenes[0]
      const timeline = forkTimeline(scene)
      const rest = forkFrame(scene, timeline, timeline.duration, forkLayouts(scene, width, s), geometry, width)
      expect(rest.branches.filter(b => b.d).map(b => b.lane)).toEqual([1])
    }
  })
  it('an add beat may place two tiles at once, and a dropped phrase tile is struck whole at its own place', async () => {
    const { rowFrame, rowGeometry, rowLayouts, rowSizes, rowTimeline, tilePlaces } = await import('../src/premium/figure-engine/row.js')
    const scene = {
      key: 'k',
      tiles: { a: [{ text: 'a', role: 'tense' }], b: [{ text: 'le b', role: 'noun' }], c: [{ text: 'x le c', role: 'noun' }], d: [{ text: 'd', role: 'tense' }], e: [{ text: 'e', role: 'marker', label: 'not-word' }] },
      before: { say: 'a le b x le c.', en: 'A.' },
      after: { say: 'd e a le b.', en: 'B.' },
      states: [[['a', 0], ['b', 0], ['c', 0]], [['a', 0], ['b', 0]], [['d', 0], ['e', 0], ['a', 0], ['b', 0]]],
      beats: [{ kind: 'drop', tile: 'c', to: 1 }, { kind: 'add', tile: ['d', 'e'], to: 2 }, { kind: 'en' }],
    }
    expect(tilePlaces(scene).c).toEqual({ start: 7, end: 13 })
    const def = { id: 'T.4', kind: 'row', scenes: [scene] }
    for (const width of WIDTHS) {
      await layOut(def, width)
      const s = rowSizes(def, width)
      const layout = rowLayouts(scene, width, s)
      const timeline = rowTimeline(scene)
      const geometry = rowGeometry(s, [scene], false, layout.lines, true)
      const add = timeline.beats[1]
      const mid = rowFrame(scene, timeline, (add.start + add.travelEnd) / 2, layout, geometry)
      expect(mid.struck).toEqual([{ start: 7, end: 13, p: 1 }])
      const d = mid.tiles.find(tile => tile.id === 'd')
      const e = mid.tiles.find(tile => tile.id === 'e')
      expect(d.opacity).toBeCloseTo(e.opacity, 5)
      expect(d.y).toBeCloseTo(e.y, 5)
    }
  })
  it('a Build can take a piece away', async () => {
    const def = { id: 'T.5', kind: 'build', scenes: [{ key: 'k', role: 'verb', from: { say: 'abab', en: 'A.' }, to: { say: 'ab', en: 'B.' }, pieces: [{ text: 'ab' }, { text: 'ab', removed: true, of: 0 }] }] }
    const { buildFrame, buildGeometry, buildLayout, buildSizes, buildTimeline } = await import('../src/premium/figure-engine/build.js')
    for (const width of WIDTHS) {
      await layOut(def, width)
      const s = buildSizes(width)
      const scene = def.scenes[0]
      const layout = buildLayout(scene, width, s)
      const timeline = buildTimeline(scene)
      expect(timeline.beats.map(b => b.kind)).toEqual(['open', 'remove', 'close', 'en'])
      const rest = buildFrame(scene, timeline, timeline.duration, layout, buildGeometry(s, def.scenes), s)
      expect(rest.pieces[1].opacity).toBe(0)
      expect(rest.tileW).toBeCloseTo(layout.closedW, 5)
      expect(layout.closedW).toBeLessThan(layout.fromW)
    }
  })
})
