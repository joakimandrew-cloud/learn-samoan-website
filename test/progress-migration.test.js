// The one-time move of saved progress from ls-progress-v1 (51 chapters) to
// ls-progress-v2 (52 chapters): chapters 5 and above move up one, 1 to 4 stay.
import { describe, expect, it } from 'vitest'
import {
  LEGACY_PROGRESS_KEY,
  PREMIUM_PROGRESS_KEY,
  migrateV1Progress,
  readProgress,
} from '../src/premium/lib/progress-migration.js'

function memoryStorage(entries = {}) {
  const values = new Map(Object.entries(entries))
  return {
    getItem: key => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    keys: () => [...values.keys()],
  }
}

const v1 = {
  done: [1, 4, 5, 12, 51],
  last: 5,
  quiz: { 3: { right: 8, total: 10 }, 5: { right: 9, total: 10 }, 51: { right: 10, total: 10 } },
}

describe('progress migration v1 to v2', () => {
  it('moves chapters 5 and above up one and leaves 1 to 4 alone', () => {
    const p = migrateV1Progress(v1)
    expect(p.done).toEqual([1, 4, 6, 13, 52])
    expect(p.last).toBe(6)
    expect(p.quiz).toEqual({ 3: { right: 8, total: 10 }, 6: { right: 9, total: 10 }, 52: { right: 10, total: 10 } })
  })

  it('runs once on first load: writes v2, removes v1, and does not shift again', () => {
    const storage = memoryStorage({ [LEGACY_PROGRESS_KEY]: JSON.stringify(v1) })
    const first = readProgress(storage)
    expect(first.done).toEqual([1, 4, 6, 13, 52])
    expect(storage.getItem(LEGACY_PROGRESS_KEY)).toBeNull()
    expect(JSON.parse(storage.getItem(PREMIUM_PROGRESS_KEY)).last).toBe(6)
    const second = readProgress(storage)
    expect(second).toEqual(first)
  })

  it('keeps existing v2 progress and only removes a leftover v1', () => {
    const v2 = { done: [2, 6], quiz: {}, last: 6 }
    const storage = memoryStorage({ [LEGACY_PROGRESS_KEY]: JSON.stringify(v1), [PREMIUM_PROGRESS_KEY]: JSON.stringify(v2) })
    expect(readProgress(storage)).toEqual(v2)
    expect(storage.getItem(LEGACY_PROGRESS_KEY)).toBeNull()
  })

  it('reads empty progress when nothing was saved, and survives malformed v1', () => {
    expect(readProgress(memoryStorage())).toEqual({ done: [], quiz: {} })
    const storage = memoryStorage({ [LEGACY_PROGRESS_KEY]: '{not json' })
    expect(readProgress(storage)).toEqual({ done: [], quiz: {} })
    expect(storage.getItem(LEGACY_PROGRESS_KEY)).toBeNull()
  })

  it('reads nothing and throws nothing when storage is blocked', () => {
    const blocked = { getItem() { throw new Error('denied') }, setItem() { throw new Error('denied') }, removeItem() { throw new Error('denied') } }
    expect(readProgress(blocked)).toEqual({ done: [], quiz: {} })
    expect(readProgress(null)).toEqual({ done: [], quiz: {} })
  })
})
