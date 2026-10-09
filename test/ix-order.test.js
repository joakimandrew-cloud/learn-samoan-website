// The checking behind the Order practice (src/premium/components/interactive/
// order-logic.js). Every Samoan sentence here is printed in the book; the
// chapter is named beside each one.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { chapterFiles, readJson } from '../scripts/check-interactives.mjs'
import { checkOrder, finalStop, poolTiles, shuffledPool, solvedInPool, targetTiles, withoutStop, wordKey } from '../src/premium/components/interactive/order-logic.js'

const APP = path.join(__dirname, '..')
const fixture = path.join(APP, 'src', 'premium', 'components', 'interactive', 'fixtures', 'order.json')

const went = { en: 'I went.', sm: 'Sā ʻou alu.', extra: ['ia'] } // Chapter 1
const rained = { en: 'Did it rain?', sm: 'Sā timu?' } // Chapter 1
const sawFish = { en: 'The girl saw the fish.', sm: 'Sā vaʻai le teine i le iʻa.', extra: ['tama'], accept: ['Sā vaʻai i le iʻa le teine'] } // Chapter 12
const friend = { en: 'He is a friend.', sm: 'ʻO ia ʻo se uō.' } // Chapter 7
const bus = { en: 'The bus goes to the village.', sm: 'E alu le pasi i le nuʻu.', tiles: ['E', 'alu', 'le pasi', 'i le nuʻu'] } // Chapter 13

const split = s => s.split(' ')

describe('order: the tiles', () => {
  it('cuts the sentence at its spaces and drops the final stop', () => {
    expect(targetTiles(went)).toEqual(['Sā', 'ʻou', 'alu'])
    expect(targetTiles(rained)).toEqual(['Sā', 'timu'])
  })
  it('keeps the item’s own tiles when it has them', () => {
    expect(targetTiles(bus)).toEqual(['E', 'alu', 'le pasi', 'i le nuʻu'])
  })
  it('offers every tile and every extra word, each with its own id', () => {
    const pool = poolTiles(sawFish)
    expect(pool.map(t => t.text)).toEqual(['Sā', 'vaʻai', 'le', 'teine', 'i', 'le', 'iʻa', 'tama'])
    expect(new Set(pool.map(t => t.id)).size).toBe(pool.length)
  })
  it('finds the final stop by the gate’s rule', () => {
    expect(finalStop(went.sm)).toBe('.')
    expect(finalStop(rained.sm)).toBe('?')
    expect(finalStop('Sā vaʻai i le iʻa le teine')).toBe('')
    expect(withoutStop(rained.sm)).toBe('Sā timu')
  })
})

describe('order: checking', () => {
  it('accepts the sentence’s own order', () => {
    expect(checkOrder(went, ['Sā', 'ʻou', 'alu'])).toEqual({ right: true, shown: ['Sā', 'ʻou', 'alu'] })
  })
  it('rejects another order, a missing word, a word too many and an extra word', () => {
    expect(checkOrder(went, ['ʻou', 'Sā', 'alu']).right).toBe(false)
    expect(checkOrder(went, ['Sā', 'ʻou']).right).toBe(false)
    expect(checkOrder(went, ['Sā', 'ʻou', 'alu', 'ia']).right).toBe(false)
    expect(checkOrder(went, ['Sā', 'ia', 'alu']).right).toBe(false)
    expect(checkOrder(went, []).right).toBe(false)
  })
  it('gives back the placed words as they are when wrong', () => {
    expect(checkOrder(went, ['alu', 'Sā']).shown).toEqual(['alu', 'Sā'])
  })
  it('accepts a printed alternative, with or without its final stop', () => {
    expect(checkOrder(sawFish, split('Sā vaʻai i le iʻa le teine')).right).toBe(true)
    expect(checkOrder({ ...sawFish, accept: ['Sā vaʻai i le iʻa le teine.'] }, split('Sā vaʻai i le iʻa le teine')).right).toBe(true)
    expect(checkOrder(sawFish, split('Sā vaʻai le teine i le iʻa')).right).toBe(true)
    expect(checkOrder(sawFish, split('Sā vaʻai i le teine le iʻa')).right).toBe(false)
  })
  it('lets identical repeated words swap', () => {
    // The two le tiles, placed in either order, are the same sentence.
    const pool = poolTiles(sawFish)
    const byId = Object.fromEntries(pool.map(t => [t.id, t.text]))
    const order = ['t0', 't1', 't5', 't3', 't4', 't2', 't6'].map(id => byId[id])
    expect(checkOrder(sawFish, order).right).toBe(true)
  })
  it('lets a capital and its lower-case twin swap, and shows the printed spelling', () => {
    const swapped = ['ʻo', 'ia', 'ʻO', 'se', 'uō']
    expect(checkOrder(friend, swapped)).toEqual({ right: true, shown: ['ʻO', 'ia', 'ʻo', 'se', 'uō'] })
  })
  it('never asks for the final stop', () => {
    expect(checkOrder(rained, ['Sā', 'timu']).right).toBe(true)
    expect(checkOrder(rained, ['Sā', 'timu?']).right).toBe(false)
  })
  it('checks tiles that hold more than one word, and cuts the shown spelling at them', () => {
    expect(checkOrder(bus, ['E', 'alu', 'le pasi', 'i le nuʻu'])).toEqual({ right: true, shown: ['E', 'alu', 'le pasi', 'i le nuʻu'] })
    expect(checkOrder(bus, ['E', 'alu', 'i le nuʻu', 'le pasi']).right).toBe(false)
  })
  it('reads a straight apostrophe as the glottal stop', () => {
    expect(wordKey("'ou")).toBe(wordKey('ʻou'))
    expect(checkOrder(went, ['Sā', "'ou", 'alu']).right).toBe(true)
  })
})

describe('order: the shuffled pool', () => {
  it('knows when the sentence lies in order, extra words between or not', () => {
    const pool = poolTiles(went)
    const [sa, ou, alu, ia] = pool
    expect(solvedInPool(went, [sa, ia, ou, alu])).toBe(true)
    expect(solvedInPool(went, [ou, sa, ia, alu])).toBe(false)
  })
  it('shuffles again while the pool shows the answer', () => {
    const outs = [xs => [...xs], xs => [...xs], xs => [...xs].reverse()]
    let call = 0
    const pool = shuffledPool(went, xs => outs[Math.min(call++, outs.length - 1)](xs))
    expect(call).toBe(3)
    expect(solvedInPool(went, pool)).toBe(false)
    expect(pool.map(t => t.text).sort()).toEqual(['Sā', 'ʻou', 'alu', 'ia'].sort())
  })
  it('gives up after a few tries rather than looping', () => {
    let call = 0
    const pool = shuffledPool(went, xs => { call += 1; return [...xs] })
    expect(call).toBeLessThanOrEqual(21)
    expect(pool).toHaveLength(4)
  })
})

// Every order card in the chapter data and the lab fixture: its own sentence
// checks right from its tiles, and every accepted sentence can be built from
// the pool and checks right.
function canBuild(pool, target, used = new Set()) {
  if (!target.length) return true
  for (const t of pool) {
    if (used.has(t.id)) continue
    const n = t.text.split(/\s+/).length
    const head = target.slice(0, n)
    if (head.length === n && head.every((w, i) => wordKey(w) === wordKey(t.text.split(/\s+/)[i]))) {
      used.add(t.id)
      if (canBuild(pool, target.slice(n), used)) return true
      used.delete(t.id)
    }
  }
  return false
}

const files = [...chapterFiles(), ...(fs.existsSync(fixture) ? [fixture] : [])]
const cards = files.flatMap(file => readJson(file).items
  .filter(it => it.kind === 'order')
  .flatMap(it => (it.data?.items || []).map((x, i) => ({ where: `${path.relative(APP, file)} ${it.id} [${i}]`, x }))))

describe('order: the data', () => {
  it('has order cards to check', () => {
    expect(cards.length).toBeGreaterThan(0)
  })
  for (const { where, x } of cards) {
    it(`${where} checks its own sentence right`, () => {
      expect(checkOrder(x, targetTiles(x)).right).toBe(true)
    })
    for (const alt of x.accept || []) {
      it(`${where} can build and accept "${alt}"`, () => {
        const target = withoutStop(alt).split(/\s+/)
        expect(canBuild(poolTiles(x), target)).toBe(true)
        expect(checkOrder(x, target).right).toBe(true)
      })
    }
  }
})
