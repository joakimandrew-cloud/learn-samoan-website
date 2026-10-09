// Guards on the synced course data. These read only files inside this app, so
// they run in a standalone checkout without the parent course.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import chapters from '../src/data/chapters.json'
import quizzes from '../src/data/quizzes.json'
import exercises from '../src/data/book-exercises.json'
import vocabulary from '../src/data/book-vocabulary.json'
import glossary from '../src/data/glossary.json'
import { parseLessonContent } from '../src/premium/lib/lesson-content.js'
import { slugify } from '../src/lib/slugify.js'

const book = name => fs.readFileSync(path.join(__dirname, '..', 'book', name), 'utf8')
const pad = n => String(n).padStart(2, '0')

describe('synced course', () => {
  it('has every chapter in order', () => {
    expect(chapters.map(c => c.chapter)).toEqual(Array.from({ length: chapters.length }, (_, i) => i + 1))
    expect(chapters.length).toBe(51)
  })

  it('keeps author-only material out of every learner copy', () => {
    for (const file of fs.readdirSync(path.join(__dirname, '..', 'book'))) {
      const text = book(file)
      expect(text, file).not.toMatch(/Author Verification|<!--|\[(SOURCE|REMIX|FRAME)[:\s]/)
    }
  })

  it('has ten questions per quiz, each with four options, one key and every explanation', () => {
    for (const quiz of Object.values(quizzes)) {
      expect(quiz.questions).toHaveLength(10)
      for (const q of quiz.questions) {
        expect(q.options).toHaveLength(4)
        expect(q.options.filter(o => o.correct)).toHaveLength(1)
        for (const o of q.options) expect(o.explanation.length).toBeGreaterThan(0)
      }
    }
  })

  it('gives every asked exercise item its answer-key entry', () => {
    for (const list of Object.values(exercises)) {
      for (const ex of list) {
        for (const item of ex.items) {
          if (!item.given) expect(item.answer, item.id).toBeTruthy()
          if (ex.type === 'mcq') expect(item.options, item.id).toContain(item.correct)
        }
      }
    }
  })

  it('places every exercise exactly once on its chapter page', () => {
    for (const c of chapters) {
      const list = exercises[String(c.chapter)] || []
      const lesson = parseLessonContent(book(`Chapter-${pad(c.chapter)}.md`), { chapter: c.chapter, exercises: list, slugify })
      const inline = lesson.blocks.filter(b => b.type === 'exercise').map(b => b.id)
      const slot = lesson.slotExercises.map(e => e.id)
      expect([...inline, ...slot].sort(), `Chapter ${c.chapter}`).toEqual(list.map(e => e.id).sort())
    }
  })

  it('carries every Words to Learn row and every glossary row', () => {
    expect(vocabulary.length).toBeGreaterThan(600)
    expect(glossary.length).toBeGreaterThan(600)
    for (const row of vocabulary) expect(row.samoan && row.english, row.id).toBeTruthy()
  })
})
