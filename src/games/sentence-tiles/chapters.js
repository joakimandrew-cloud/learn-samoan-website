/**
 * Sentence Tiles: chapter order and saved progress (pure apart from storage).
 *
 * Every game is one chapter. A new player starts at the first chapter that has
 * a game; finishing a chapter moves them on to the next one that has one.
 * Inside a game the chapter's sentences come once each, in a shuffled order
 * (the shared shuffle bag), and the game ends when the last of them is built.
 *
 * Progress is kept on this device under PROGRESS_KEY as
 *   { furthest, done }
 *   furthest  the chapter to play next: the one after the highest finished
 *             (the first chapter for a new player)
 *   done      the chapters finished at least once, in order
 * Opening a chapter from the menu does not move `furthest`; finishing one does.
 */
import { makeBag, drawFromBag } from '../shared/bag.js'
import { readStore, writeStore } from '../shared/store.js'
import { SENTENCES, CHAPTERS, FIRST_CHAPTER, chapterEntry, nextChapter } from './deck.js'

export const PROGRESS_KEY = 'ls-sentence-tiles-progress'

const offered = new Set(CHAPTERS.map(c => c.chapter))
const byId = new Map(SENTENCES.map(s => [s.id, s]))

/** A chapter number the game offers: `n` itself, else the first offered chapter after it, else the last. */
function offeredChapter(n) {
  const v = Math.floor(Number(n))
  if (!Number.isFinite(v)) return FIRST_CHAPTER
  if (offered.has(v)) return v
  const after = CHAPTERS.find(c => c.chapter > v)
  return after ? after.chapter : (CHAPTERS.length ? CHAPTERS[CHAPTERS.length - 1].chapter : null)
}

/** Progress for a new player: the first chapter, nothing finished. */
export function freshProgress() {
  return { furthest: FIRST_CHAPTER, done: [] }
}

/** Progress read back from stored text (anything unreadable gives a new player's progress). */
export function parseProgress(raw) {
  let v = null
  try { v = JSON.parse(raw ?? 'null') } catch { v = null }
  if (!v || typeof v !== 'object') return freshProgress()
  const done = [...new Set((Array.isArray(v.done) ? v.done : []).map(Number).filter(n => offered.has(n)))].sort((a, b) => a - b)
  const furthest = v.furthest == null ? FIRST_CHAPTER : offeredChapter(v.furthest)
  return { furthest: furthest ?? FIRST_CHAPTER, done }
}

/** Progress after finishing `chapter`: it is marked done, and `furthest` moves on to the next chapter (never back). */
export function progressAfter(progress, chapter) {
  const p = progress ?? freshProgress()
  const n = Number(chapter)
  if (!offered.has(n)) return p
  const done = [...new Set([...p.done, n])].sort((a, b) => a - b)
  const reached = nextChapter(n) ?? n
  return { furthest: Math.max(p.furthest ?? FIRST_CHAPTER, reached), done }
}

/** The chapter the game opens on: the furthest reached (the first chapter for a new player). */
export function startingChapter(progress) {
  return offeredChapter(progress?.furthest ?? FIRST_CHAPTER)
}

/** Progress kept on this device. */
export function loadProgress() {
  return parseProgress(readStore(PROGRESS_KEY))
}

/** Keep progress on this device. */
export function saveProgress(progress) {
  writeStore(PROGRESS_KEY, JSON.stringify({ furthest: progress.furthest, done: progress.done }))
}

/**
 * A shuffle bag holding one chapter's sentences, each once. `last` is the
 * sentence the last game ended on, so playing the chapter again does not open
 * with it.
 */
export function chapterBag(chapter, rng = Math.random, { last = null } = {}) {
  return makeBag(chapterEntry(chapter).cards.map(s => s.id), rng, { last })
}

/**
 * The chapter's next sentence: { sentence, bag }. Once every sentence of the
 * chapter has been dealt, `sentence` is null (the bag is never refilled
 * inside a game, so a game is the chapter once through).
 */
export function dealFromChapter(bag, rng = Math.random) {
  if (!bag || !bag.order.length) return { sentence: null, bag }
  const { id, bag: next } = drawFromBag(bag, rng)
  return { sentence: id == null ? null : byId.get(id) ?? null, bag: next }
}
