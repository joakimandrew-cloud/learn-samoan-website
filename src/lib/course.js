// One place for the course's own facts, so pages never hard-code them.
import chapters from '../data/chapters.json'

export const COURSE_NAME = 'Learn Samoan'
export const LANGUAGE = 'Samoan'
export const LANG_CODE = 'sm'
export const CHAPTER_COUNT = chapters.length
// Local progress keys. Distinct from the Tongan site's so the two never mix.
export const STORAGE_PREFIX = 'ls'
