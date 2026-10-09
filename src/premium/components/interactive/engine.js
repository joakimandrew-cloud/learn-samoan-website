/**
 * Shared machinery for the chapter interactives: the deck every practice
 * widget runs (shuffle, score, streak, finish), a keyboard guard so number
 * keys only answer the card in the middle of the screen, touch detection,
 * and small text helpers. Non-component code lives here so the widget files
 * export components only (React Fast Refresh).
 */
import { useCallback, useEffect, useRef, useState } from 'react'

export function shuffle(items) {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// A new order that never opens on the card the learner just saw.
export function reshuffle(items, last) {
  const next = shuffle(items)
  if (next.length > 1 && next[0] === last) [next[0], next[1]] = [next[1], next[0]]
  return next
}

/**
 * The deck: one item at a time, scored once per item.
 *   const d = useDeck(items)
 *   d.current, d.index, d.total, d.finished, d.score {right, total}, d.streak
 *   d.mark(right)  record the answer to the current item (once)
 *   d.next()       advance, or finish at the end
 *   d.again()      a fresh shuffle, score kept
 *   d.reset()      a fresh shuffle, score cleared
 */
export function useDeck(items, { random = true } = {}) {
  const [deck, setDeck] = useState(() => (random ? shuffle(items) : [...items]))
  const [index, setIndex] = useState(0)
  const [marked, setMarked] = useState(null)
  const [score, setScore] = useState({ right: 0, total: 0 })
  const [streak, setStreak] = useState(0)
  const [finished, setFinished] = useState(false)
  const current = deck[index]
  // Guards a double tap: an item is scored once, whatever the re-render timing.
  const markedRef = useRef(null)

  const mark = useCallback(right => {
    if (markedRef.current !== null) return
    markedRef.current = right
    setMarked(right)
    setScore(s => ({ right: s.right + (right ? 1 : 0), total: s.total + 1 }))
    setStreak(s => (right ? s + 1 : 0))
  }, [])
  const next = useCallback(() => {
    markedRef.current = null
    setMarked(null)
    if (index < deck.length - 1) setIndex(index + 1)
    else setFinished(true)
  }, [index, deck.length])
  const again = useCallback(() => {
    markedRef.current = null
    setDeck(random ? reshuffle(items, current) : [...items])
    setIndex(0); setMarked(null); setFinished(false)
  }, [items, current, random])
  const reset = useCallback(() => {
    markedRef.current = null
    setDeck(random ? shuffle(items) : [...items])
    setIndex(0); setMarked(null); setFinished(false)
    setScore({ right: 0, total: 0 }); setStreak(0)
  }, [items, random])

  const answered = marked !== null
  const pct = finished ? 100 : deck.length ? ((index + (answered ? 1 : 0)) / deck.length) * 100 : 0
  return { deck, current, index, total: deck.length, answered, marked, score, streak, finished, pct, mark, next, again, reset }
}

// Touch-first devices get no keyboard hints.
export function useIsTouchPrimary() {
  const [touch, setTouch] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(hover: none) and (pointer: coarse)')
    const update = () => setTouch(mq.matches)
    update()
    mq.addEventListener?.('change', update)
    return () => mq.removeEventListener?.('change', update)
  }, [])
  return touch
}

/**
 * Window-level shortcuts for one card. Several interactives can sit on a
 * chapter page, so a card only listens while its box spans the middle of the
 * viewport, and never while the learner is typing.
 */
export function useCardKeys(ref, onKey) {
  useEffect(() => {
    const handler = event => {
      const tag = event.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || event.target?.isContentEditable) return
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
      if (event.target !== document.body && !ref.current?.contains(event.target)) return
      const rect = ref.current?.getBoundingClientRect()
      if (!rect) return
      const mid = window.innerHeight / 2
      if (rect.top > mid || rect.bottom < mid) return
      onKey(event)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })
}

// Scroll a card's top back into view after it changes height.
export function keepInView(ref) {
  requestAnimationFrame(() => {
    const rect = ref.current?.getBoundingClientRect()
    if (rect && rect.top < 0) ref.current.scrollIntoView({ block: 'start', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  })
}

// Word-level difference between two printed sentences: which words of `b`
// are not in `a` at the same place (a longest-common-subsequence diff).
export function changedWords(a, b) {
  const x = String(a ?? '').split(/\s+/).filter(Boolean)
  const y = String(b ?? '').split(/\s+/).filter(Boolean)
  const strip = w => w.replace(/[.,;:!?"“”]/g, '').toLowerCase()
  const dp = Array.from({ length: x.length + 1 }, () => new Array(y.length + 1).fill(0))
  for (let i = x.length - 1; i >= 0; i -= 1) {
    for (let j = y.length - 1; j >= 0; j -= 1) {
      dp[i][j] = strip(x[i]) === strip(y[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const same = new Set()
  let i = 0
  let j = 0
  while (i < x.length && j < y.length) {
    if (strip(x[i]) === strip(y[j])) { same.add(j); i += 1; j += 1 } else if (dp[i + 1][j] >= dp[i][j + 1]) i += 1
    else j += 1
  }
  return y.map((word, k) => ({ word, changed: !same.has(k) }))
}

// Typed Samoan: fold what a keyboard makes hard (the glottal stop as any
// apostrophe, curly quotes, case, spacing, the final stop) without touching
// the letters. `loose` also drops macrons and the glottal stop, to tell a
// spelling slip from a wrong word.
export function foldTyped(s, { loose = false } = {}) {
  let t = String(s ?? '')
    .normalize('NFC')
    .replace(/[‘’'`ʼ]/g, 'ʻ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.?!,;:]+$/g, '')
    .toLowerCase()
  if (loose) t = t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ʻ/g, '')
  return t
}

// Keep Enter, Space and the number keys inside a widget from also reaching
// page-level handlers. Run in the bubble phase so the control itself can
// handle the key before it is kept away from window-level shortcuts.
export function keepControlKeysLocal(event) {
  const isShortcut = event.key === 'Enter' || event.key === ' ' || /^[1-9]$/.test(event.key)
  if (isShortcut && event.target.closest?.('button, a, input, textarea, select, [role="button"], [contenteditable="true"]')) {
    event.stopPropagation()
  }
}
