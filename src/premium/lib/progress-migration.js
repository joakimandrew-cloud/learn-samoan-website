// Stored progress: which chapters are finished, the last one opened, and the
// best quiz score per chapter. Anything malformed is dropped on read.
import { CHAPTER_COUNT } from '@app/lib/course.js'

export const PREMIUM_PROGRESS_KEY = 'ls-progress-v1'

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

export function readProgress(storage) {
  try {
    return normalizeProgress(JSON.parse(storage?.getItem(PREMIUM_PROGRESS_KEY) || 'null'))
  } catch {
    return normalizeProgress(null)
  }
}
