// Stored progress: which chapters are finished, the last one opened, and the
// best quiz score per chapter. Anything malformed is dropped on read.
import { CHAPTER_COUNT } from '@app/lib/course.js'

export const PREMIUM_PROGRESS_KEY = 'ls-progress-v2'

// v1 numbered the book's 51 chapters. On 2026-11-02 the old Chapter 4 split in
// two and every chapter from 5 on moved up one (51 became 52), so a saved v1
// chapter 5 or above is the same chapter under a number one higher. Chapters
// 1 to 4 keep their numbers. The move runs once, the first time a browser
// that still holds v1 reads its progress, and then v1 is removed.
export const LEGACY_PROGRESS_KEY = 'ls-progress-v1'
export const FIRST_SHIFTED_CHAPTER = 5

const record = value => value !== null && typeof value === 'object' && !Array.isArray(value)

export function validLesson(value) {
  const chapter = typeof value === 'string' && /^[1-9]\d*$/.test(value) ? Number(value) : value
  return Number.isInteger(chapter) && chapter >= 1 && chapter <= CHAPTER_COUNT ? chapter : null
}

export function validScore(value) {
  if (!record(value)) return null
  const { right, total } = value
  if (!Number.isInteger(right) || !Number.isInteger(total) || total < 1 || right < 0 || right > total) return null
  return { right, total }
}

export function normalizeProgress(value) {
  const source = record(value) ? value : {}
  const quiz = {}
  if (record(source.quiz)) {
    for (const [key, score] of Object.entries(source.quiz)) {
      const chapter = validLesson(key)
      const valid = validScore(score)
      if (chapter && valid) quiz[chapter] = valid
    }
  }
  const progress = {
    done: Array.isArray(source.done) ? [...new Set(source.done.map(validLesson).filter(Boolean))] : [],
    quiz,
  }
  const last = validLesson(source.last)
  if (last) progress.last = last
  return progress
}

// One saved v1 chapter number in its v2 place: 5 and above move up one.
function shiftChapter(value) {
  const chapter = typeof value === 'string' && /^[1-9]\d*$/.test(value) ? Number(value) : value
  if (!Number.isInteger(chapter) || chapter < 1) return value
  return chapter >= FIRST_SHIFTED_CHAPTER ? chapter + 1 : chapter
}

export function migrateV1Progress(value) {
  if (!record(value)) return normalizeProgress(null)
  const quiz = {}
  if (record(value.quiz)) {
    for (const [key, score] of Object.entries(value.quiz)) quiz[shiftChapter(key)] = score
  }
  return normalizeProgress({
    done: Array.isArray(value.done) ? value.done.map(shiftChapter) : [],
    last: shiftChapter(value.last),
    quiz,
  })
}

// Runs once per browser: when v1 is present it is moved to v2 (unless v2 is
// already there, which then wins) and removed. Blocked storage is left alone.
export function migrateStoredProgress(storage) {
  try {
    const legacy = storage?.getItem(LEGACY_PROGRESS_KEY)
    if (legacy == null) return
    if (storage.getItem(PREMIUM_PROGRESS_KEY) == null) {
      let parsed = null
      try { parsed = JSON.parse(legacy) } catch { parsed = null }
      storage.setItem(PREMIUM_PROGRESS_KEY, JSON.stringify(migrateV1Progress(parsed)))
    }
    storage.removeItem(LEGACY_PROGRESS_KEY)
  } catch { /* storage blocked */ }
}

export function readProgress(storage) {
  migrateStoredProgress(storage)
  try {
    return normalizeProgress(JSON.parse(storage?.getItem(PREMIUM_PROGRESS_KEY) || 'null'))
  } catch {
    return normalizeProgress(null)
  }
}
