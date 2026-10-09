// The Scale figure's pure logic: reading order, label anchoring, vertical
// spacing, the room check that turns a crowded line vertical, and arrow keys.
import { describe, expect, it } from 'vitest'
import { anchorFor, gaps, lineFits, orderPoints, stepOnLine, stepOnMap } from '../src/premium/components/interactive/scale-logic.js'

describe('scale: reading order', () => {
  it('orders a line left to right and keeps each data index', () => {
    const out = orderPoints([{ x: 60, label: 'b' }, { x: 10, label: 'a' }, { x: 90, label: 'c' }])
    expect(out.map(p => p.label)).toEqual(['a', 'b', 'c'])
    expect(out.map(p => p.key)).toEqual([1, 0, 2])
  })
  it('orders a map by row, then across', () => {
    const out = orderPoints([{ x: 100, y: 50 }, { x: 50, y: 0 }, { x: 0, y: 50 }, { x: 30, y: 100 }], 'map')
    expect(out.map(p => p.key)).toEqual([1, 2, 0, 3])
  })
  it('clamps positions into 0..100', () => {
    const out = orderPoints([{ x: -5, y: 140 }, { x: 'x' }], 'map')
    expect(out.map(p => [p.x, p.y])).toEqual([[0, 0], [0, 100]])
  })
})

describe('scale: anchoring and spacing', () => {
  it('centres a label unless its dot is at an end', () => {
    expect([0, 7, 8, 50, 92, 93, 100].map(anchorFor)).toEqual(['start', 'start', 'center', 'center', 'center', 'end', 'end'])
  })
  it('gives the vertical line the same proportions', () => {
    expect(gaps([14, 34, 58, 82])).toEqual([14, 20, 24, 24, 18])
    expect(gaps([0, 0, 100])).toEqual([0, 0, 100, 0])
  })
})

describe('scale: room on the horizontal line', () => {
  const xs = [14, 34, 58, 82]
  it('fits short labels on a wide line', () => {
    expect(lineFits(xs, [40, 80, 50, 60], 500)).toBe(true)
  })
  it('does not fit the same labels on a narrow line', () => {
    expect(lineFits(xs, [40, 80, 50, 60], 260)).toBe(false)
  })
  it('does not fit neighbours that sit too close', () => {
    expect(lineFits([40, 44], [60, 60], 600)).toBe(false)
    expect(lineFits([40, 60], [60, 60], 600)).toBe(true)
  })
  it('lets an end label hang into the inset, not past it', () => {
    expect(lineFits([10, 60], [100, 40], 400)).toBe(false)
    expect(lineFits([10, 60], [100, 40], 400, { inset: 20 })).toBe(true)
  })
  it('anchors labels at the very ends so they stay on the rail', () => {
    expect(lineFits([0, 100], [120, 120], 400, { inset: 12 })).toBe(true)
    expect(lineFits([0, 100], [220, 220], 400, { inset: 12 })).toBe(false)
  })
  it('refuses a line it cannot measure', () => {
    expect(lineFits(xs, [40, 80, 50, 60], 0)).toBe(false)
    expect(lineFits(xs, [40], 500)).toBe(false)
  })
})

describe('scale: arrow keys', () => {
  it('steps along a line and stops at the ends', () => {
    expect(stepOnLine(4, 0, 'ArrowLeft')).toBe(0)
    expect(stepOnLine(4, 0, 'ArrowRight')).toBe(1)
    expect(stepOnLine(4, 2, 'ArrowUp')).toBe(1)
    expect(stepOnLine(4, 3, 'ArrowDown')).toBe(3)
    expect(stepOnLine(4, 2, 'Home')).toBe(0)
    expect(stepOnLine(4, 1, 'End')).toBe(3)
    expect(stepOnLine(4, 1, 'a')).toBe(1)
  })
  // A compass: north, west, east, two souths (reading order).
  const map = orderPoints([{ x: 50, y: 0 }, { x: 0, y: 50 }, { x: 100, y: 50 }, { x: 30, y: 100 }, { x: 70, y: 100 }], 'map')
  it('moves to the nearest point that lies that way on a map', () => {
    expect(stepOnMap(map, 1, 'ArrowRight')).toBe(2) // west to east, not north
    expect(stepOnMap(map, 0, 'ArrowLeft')).toBe(1) // north to west
    expect(stepOnMap(map, 0, 'ArrowDown')).toBe(3) // north to the first south
    expect(stepOnMap(map, 3, 'ArrowRight')).toBe(4) // south to south
    expect(stepOnMap(map, 1, 'ArrowUp')).toBe(0) // west to north
  })
  it('stays put when nothing lies that way', () => {
    expect(stepOnMap(map, 0, 'ArrowUp')).toBe(0)
    expect(stepOnMap(map, 1, 'ArrowLeft')).toBe(1)
    expect(stepOnMap(map, 2, 'Enter')).toBe(2)
  })
  it('reaches every point from every other by arrows alone', () => {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
    for (let start = 0; start < map.length; start += 1) {
      const seen = new Set([start])
      const queue = [start]
      while (queue.length) {
        const at = queue.shift()
        for (const k of keys) {
          const to = stepOnMap(map, at, k)
          if (!seen.has(to)) { seen.add(to); queue.push(to) }
        }
      }
      expect(seen.size).toBe(map.length)
    }
  })
})
