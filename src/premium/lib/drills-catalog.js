/**
 * The drills hub and drill pages, derived at run time from the chapter
 * practice the site already carries (src/data/interactives/NN.json) plus the
 * Daily words deck. Pure functions only: no JSON is imported here, so
 * scripts/check-interactives.mjs can import this file under Node and check
 * exactly the strings the pages show. No Samoan is typed in this file.
 *
 * The groups (names, notes, which drill ids) live in
 * src/premium/data/drills-catalog.json, in the Tongan shape
 * { key, name, note, drills: [ids], inChapters: [] }.
 */

export const DAILY_WORDS_ID = 'daily-words'
export const PRACTICE_KINDS = ['pick', 'order', 'match', 'sort', 'type']

export const LEVELS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }
export const LEVEL_FILTERS = [['all', 'All'], ...Object.entries(LEVELS)]

export const ACTION_BY_KIND = { pick: 'Pick', order: 'Order', match: 'Match', sort: 'Sort', type: 'Type', [DAILY_WORDS_ID]: 'Choose' }

export const DAILY_WORDS_ENTRY = {
  title: 'Daily words',
  blurb: 'Read the English and choose the Sāmoan word. Words you miss come back first next time.',
  eyebrow: 'Every chapter · Words to Learn',
}

export const stripStars = s => String(s ?? '').replace(/\*+/g, '').replace(/\s+/g, ' ').trim()

/** The chapter a drill id belongs to ("ch12-..." is Chapter 12); null for Daily words. */
export function drillChapter(id) {
  const m = /^ch(\d+)-/.exec(String(id))
  return m ? Number(m[1]) : null
}

export function chapterLevel(chapters, n) {
  return chapters.find(c => c.chapter === n)?.level ?? null
}

/** "Chapter N · Level" for the drill page eyebrow. */
export function drillEyebrow(id, chapters) {
  if (id === DAILY_WORDS_ID) return DAILY_WORDS_ENTRY.eyebrow
  const ch = drillChapter(id)
  if (ch == null) return ''
  const level = LEVELS[chapterLevel(chapters, ch)]
  return level ? `Chapter ${ch} · ${level}` : `Chapter ${ch}`
}

/**
 * The two lines on a card's dark sample: an English line (q) and a Samoan line
 * (sm). Each is one field of the item's own data, as stored, so the gate that
 * checks the item checks the sample.
 */
export function cardSample(item) {
  const d = item?.data ?? {}
  if (item?.kind === 'pick') {
    const p = d.prompts?.[0]
    if (!p) return { q: null, sm: null }
    if (p.sm != null) return { q: d.question ?? null, sm: p.sm }
    const option = (p.options || d.options || []).find(o => o.id === p.answer)
    return { q: p.en ?? null, sm: option?.sm ?? null }
  }
  if (item?.kind === 'match') return { q: d.pairs?.[0]?.en ?? null, sm: d.pairs?.[0]?.sm ?? null }
  if (['order', 'sort', 'type'].includes(item?.kind)) return { q: d.items?.[0]?.en ?? null, sm: d.items?.[0]?.sm ?? null }
  return { q: null, sm: null }
}

/** The Daily words sample: the first deck row in chapter order. */
export function dailyWordsSample(deck) {
  const first = [...deck].sort((a, b) => a.chapter - b.chapter)[0]
  return first ? { q: first.english, sm: first.samoan } : { q: null, sm: null }
}

/** One hub card for a practice item. */
export function itemCard(item, chapter, chapters) {
  return {
    id: item.id,
    ch: chapter,
    level: chapterLevel(chapters, chapter),
    title: item.title,
    blurb: item.intro ?? '',
    action: ACTION_BY_KIND[item.kind],
    sample: cardSample(item),
  }
}

export function dailyWordsCard(deck) {
  return {
    id: DAILY_WORDS_ID,
    ch: null,
    level: 'beginner',
    title: DAILY_WORDS_ENTRY.title,
    blurb: DAILY_WORDS_ENTRY.blurb,
    action: ACTION_BY_KIND[DAILY_WORDS_ID],
    sample: dailyWordsSample(deck),
  }
}

/** Every practice item in the chapter files, by id: { item, chapter }. */
export function practiceItemsById(chapterFiles) {
  const out = new Map()
  for (const file of chapterFiles) {
    for (const item of file?.items ?? []) {
      if (PRACTICE_KINDS.includes(item.kind)) out.set(item.id, { item, chapter: file.chapter })
    }
  }
  return out
}

/** The catalogue groups with each drill id replaced by its card. */
export function buildDrillGroups(catalog, itemsById, chapters, deck) {
  return catalog.map(group => ({
    ...group,
    drills: group.drills.map(id => {
      if (id === DAILY_WORDS_ID) return dailyWordsCard(deck)
      const hit = itemsById.get(id)
      if (!hit) throw new Error(`drills catalogue: no practice item "${id}"`)
      return itemCard(hit.item, hit.chapter, chapters)
    }),
  }))
}

export const catalogIds = catalog => catalog.flatMap(g => g.drills)
