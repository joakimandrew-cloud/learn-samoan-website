// The three bands of the ratified chapter spine (design/Book-Structure.md,
// "Level boundaries"): Beginner 1 to 23, Intermediate 24 to 41, Advanced 42 to 51.
// The sync script writes each chapter's band into chapters.json.

export const LESSON_GROUPS = [
  { key: 'beginner', name: 'Beginner', verbPhrase: 'Chapters 1 to 23', lead: 'From the basic sentence to numbers and the time, closing with Checkpoint 1.' },
  { key: 'intermediate', name: 'Intermediate', verbPhrase: 'Chapters 24 to 41', lead: 'Combining clauses, closing with Checkpoint 2.' },
  { key: 'advanced', name: 'Advanced', verbPhrase: 'Chapters 42 to 51', lead: 'Completions and systematizations.' },
]

export const LESSON_TIERS = [
  { key: 'beginner', name: 'Beginner', blurb: 'Build the sentence.', groupKeys: ['beginner'] },
  { key: 'intermediate', name: 'Intermediate', blurb: 'Combine and connect.', groupKeys: ['intermediate'] },
  { key: 'advanced', name: 'Advanced', blurb: 'Complete the system.', groupKeys: ['advanced'] },
]

export function lessonLevel(lesson) {
  return lesson.level || null
}

export function normalizeLessonSearch(value) {
  return String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ʻ'‘’`]/g, '').trim().toLocaleLowerCase()
}

export function matchesLesson(lesson, query) {
  const q = normalizeLessonSearch(query)
  if (!q) return true
  const searchable = [String(lesson.chapter), lesson.title, ...(lesson.sections || [])].map(normalizeLessonSearch).join(' ')
  return searchable.includes(q)
}

export function filterLessons(lessons, { query = '', level = 'all' } = {}) {
  return lessons.filter(lesson => (level === 'all' || lessonLevel(lesson) === level) && matchesLesson(lesson, query))
}
