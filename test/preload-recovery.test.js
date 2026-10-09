import { afterEach, expect, it, vi } from 'vitest'
import { recoverPreload } from '../src/premium/lib/preload-recovery.js'

afterEach(() => vi.unstubAllGlobals())

it('reloads a stale URL once and leaves subsequent errors for the page fallback', () => {
  const values = new Map()
  const reload = vi.fn()
  vi.stubGlobal('window', {
    location: { href: 'https://example.test/chapters/1', reload },
    sessionStorage: { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) },
  })
  const first = { preventDefault: vi.fn() }
  const second = { preventDefault: vi.fn() }
  recoverPreload(first)
  recoverPreload(second)
  expect(reload).toHaveBeenCalledTimes(1)
  expect(first.preventDefault).toHaveBeenCalledOnce()
  expect(second.preventDefault).not.toHaveBeenCalled()
})

it('does not reload or suppress the error when browser storage is denied', () => {
  const reload = vi.fn()
  vi.stubGlobal('window', {
    location: { href: 'https://example.test/chapters/1', reload },
    get sessionStorage() { throw new Error('Storage denied') },
  })
  const event = { preventDefault: vi.fn() }
  recoverPreload(event)
  recoverPreload(event)
  expect(reload).not.toHaveBeenCalled()
  expect(event.preventDefault).not.toHaveBeenCalled()
})
