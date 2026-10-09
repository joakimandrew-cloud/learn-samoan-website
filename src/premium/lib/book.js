import quickPractice from '@app/data/quick-practice.json'
import bookExercises from '@app/data/book-exercises.json'
import { slugify } from '@app/lib/slugify.js'
import { parseInlineTokens, parseLessonContent } from './lesson-content.js'

const files = import.meta.glob('@book/*.md', { query: '?raw', import: 'default' })
// Each chapter's figures and practice (src/data/interactives/NN.json).
const interactiveFiles = import.meta.glob('@app/data/interactives/[0-9][0-9].json', { import: 'default' })

function fileFor(name) {
  return Object.keys(files).find(k => k.endsWith(`/${name}`))
}

export async function loadInteractives(n) {
  const key = Object.keys(interactiveFiles).find(k => k.endsWith(`/${String(n).padStart(2, '0')}.json`))
  if (!key) return []
  const data = await interactiveFiles[key]()
  return Array.isArray(data?.items) ? data.items : []
}

export async function loadLesson(n) {
  const key = fileFor(`Chapter-${String(n).padStart(2, '0')}.md`)
  if (!key) return null
  const [md, interactives] = await Promise.all([files[key](), loadInteractives(n)])
  const lesson = parseLessonContent(md, {
    chapter: n,
    quickPractices: quickPractice[String(n)] || [],
    exercises: bookExercises[String(n)] || [],
    interactives,
    slugify,
  })
  return { ...lesson, interactives }
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
