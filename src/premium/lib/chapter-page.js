// The calm chapter page's pure functions (plan 2026-11-06-chapter-page-simplify;
// reviews/lesson-simplify-2026-11-06/Direction.md parts 2, 3, 5 and 8). Plain JavaScript, so
// the page, scripts/premium/check-figures.mjs and test/chapter-page.test.js share one copy.

export const FIGURE_KINDS = new Set(['anatomy', 'builder', 'contrast', 'grid', 'scale', 'dialogue'])

/** A chapter's blocks grouped into its sections, with the Exercises slot as a section of its own. */
export function groupSections(blocks) {
  const sections = []
  let cur = null
  for (const b of blocks) {
    if (b.type === 'h2') { cur = { id: b.id, title: b.text, blocks: [] }; sections.push(cur); continue }
    if (b.type === 'exercises-slot') { sections.push({ id: 'exercises', title: 'Exercises', exercises: true, blocks: [] }); continue }
    if (b.type === 'hr') continue
    if (cur) cur.blocks.push(b)
  }
  return sections
}

/** Which of a chapter's figures sit after which block of a section: each at its first matching block. */
export function figurePlaces(section, figures) {
  const out = new Map()
  for (const def of figures || []) {
    if (!def?.after || !section.id.startsWith(def.after.section)) continue
    const index = section.blocks.findIndex(def.after.block)
    if (index < 0) continue
    out.set(index, [...(out.get(index) || []), def])
  }
  return out
}

/**
 * One "Figure {n}.{k}" sequence per chapter, in reading order, over the new figures and the
 * Interactive figure kinds alike (Direction.md part 5). A replaced Interactive is skipped and
 * leaves no gap; practice stays unnumbered. Returns the number of each Interactive block by id
 * and of each new figure by its own id.
 */
export function figureNumbers({ n, sections, interactives = new Map(), figures = [], replaces = [] }) {
  const skip = new Set(replaces)
  const interactive = new Map()
  const figure = new Map()
  let k = 0
  for (const section of sections) {
    if (section.exercises) continue
    const places = figurePlaces(section, figures)
    section.blocks.forEach((block, index) => {
      if (block.type === 'interactive' && !skip.has(block.id)) {
        const item = interactives.get(block.id)
        if (item && FIGURE_KINDS.has(item.kind)) interactive.set(block.id, `${n}.${k += 1}`)
      }
      for (const def of places.get(index) || []) figure.set(def.id, `${n}.${k += 1}`)
    })
  }
  return { interactive, figure, count: k }
}

/** The hero's one muted length line, in place of the three chips (Direction.md part 8). */
export function lengthLine({ mins, exercises, words }) {
  const parts = []
  if (mins) parts.push(`${mins} min read`)
  if (exercises > 0) parts.push(`${exercises} ${exercises === 1 ? 'exercise' : 'exercises'}`)
  if (words > 0) parts.push(`${words} ${words === 1 ? 'new word' : 'new words'}`)
  return parts.join(', ')
}

/** Where the student is, for the Contents button and the chapter bar: "{k} of {total}". */
export function sectionCount(sections, active) {
  if (!sections.length) return ''
  if (active === 'finish') return `${sections.length} of ${sections.length}`
  const index = sections.findIndex(section => section.id === active)
  return `${Math.max(0, index) + 1} of ${sections.length}`
}

/** The Words to Learn tables' row count, which the length line reports. */
export function vocabularyCount(sections) {
  return sections
    .filter(s => /^words-to-learn/.test(s.id))
    .flatMap(s => s.blocks.filter(b => b.type === 'table'))
    .reduce((a, t) => a + t.body.length, 0)
}

/** The reading minutes the hero has always shown: words / 200, at least 3. */
export function readingMinutes(lesson) {
  const words = (JSON.stringify(lesson.blocks) + JSON.stringify(lesson.intro)).split(/\s+/).length
  return Math.max(3, Math.round(words / 200))
}
