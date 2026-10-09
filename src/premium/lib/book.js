import quickPractice from '@app/data/quick-practice.json'
import bookExercises from '@app/data/book-exercises.json'
import { slugify } from '@app/lib/slugify.js'
import { parseInlineTokens, parseLessonContent } from './lesson-content.js'

const files = import.meta.glob('@book/*.md', { query: '?raw', import: 'default' })

function fileFor(name) {
  return Object.keys(files).find(k => k.endsWith(`/${name}`))
}

export async function loadLesson(n) {
  const key = fileFor(`Chapter-${String(n).padStart(2, '0')}.md`)
  if (!key) return null
  return parseLessonContent(await files[key](), {
    chapter: n,
    quickPractices: quickPractice[String(n)] || [],
    exercises: bookExercises[String(n)] || [],
    slugify,
  })
}

// The Introduction and the appendices read like a chapter, without exercises.
export async function loadBookPage(name) {
  const key = fileFor(name)
  if (!key) return null
  return parseLessonContent(await files[key](), { slugify })
}

// Inline markdown: **bold**, *italic* (Samoan), \_ escapes.
export function tokenizeInline(text) {
  // Display-only: straight double quotes become curly. The words are untouched.
  text = text.replace(/"([^"]*)"/g, '\u201c$1\u201d')
  return parseInlineTokens(text)
}
