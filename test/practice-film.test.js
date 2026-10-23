// The home practice preview's Drills tab (src/premium/lib/practice-film.js).
// Every Samoan string it shows must come whole from the Chapter 4 tense figure
// in src/data/interactives/04.json; nothing is typed into the preview code.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import chapter4 from '../src/data/interactives/04.json'
import { DRILL_PREVIEW_ITEM, drillPreviewCards, findDrillPreviewItem, practiceDuration, practiceFrame, practiceTabIndex } from '../src/premium/lib/practice-film.js'

const item = findDrillPreviewItem(chapter4)
const states = item?.data?.states || []
const cards = drillPreviewCards(item)

describe('home drills preview', () => {
  it('reads the Chapter 4 tense figure', () => {
    expect(item?.id).toBe(DRILL_PREVIEW_ITEM)
    expect(states.length).toBe(4)
    expect(cards.length).toBeGreaterThan(0)
  })

  it('uses only targets whose English is unique among the states', () => {
    for (const card of cards) {
      expect(states.filter(state => state.en === card.target)).toHaveLength(1)
    }
    const unique = states.filter(state => states.filter(other => other.en === state.en).length === 1)
    expect(cards.map(card => card.target)).toEqual(unique.map(state => state.en))
  })

  it('splits each printed sentence into its first word and the rest', () => {
    for (const card of cards) {
      expect(`${card.particle} ${card.body}`).toBe(states[card.t].sm)
      expect(card.sm).toBe(states[card.t].sm)
      expect(card.note).toBe(states[card.t].note)
      expect(card.options[card.t].p).toBe(card.particle)
    }
  })

  it('offers exactly the four first words of the states, in state order', () => {
    const firsts = states.map(state => state.sm.split(' ')[0])
    for (const card of cards) expect(card.options.map(option => option.p)).toEqual(firsts)
  })

  it('times one film segment per card and lands answered', () => {
    expect(practiceDuration('drills', cards.length)).toBe(3000 * cards.length)
    const end = practiceFrame('drills', practiceDuration('drills', cards.length), cards.length)
    expect(end).toMatchObject({ exampleIndex: cards.length - 1, selected: true, feedback: true, finished: true })
    expect(practiceFrame('drills', 3100, cards.length).exampleIndex).toBe(1)
  })

  it('moves between the three tabs with the arrow keys', () => {
    expect(practiceTabIndex(0, 'ArrowRight')).toBe(1)
    expect(practiceTabIndex(0, 'ArrowLeft')).toBe(2)
    expect(practiceTabIndex(1, 'End')).toBe(2)
  })

  it('keeps Samoan out of the preview code', () => {
    // The glottal stop letter and the long vowels mark Samoan text.
    const samoan = /[ʻĀāĒēĪīŌōŪū]/
    for (const file of [
      'src/premium/lib/practice-film.js',
      'src/premium/components/practice/DrillParts.jsx',
      'src/premium/components/practice/PracticeFilm.jsx',
      'src/premium/components/HomePracticePreview.jsx',
    ]) {
      // Allowed site copy: exactly "Sāmoa", "Sāmoan", "Sāmoans" (Andrew's ruling
      // 2026-10-24, attested at [mosel p.27]); any other marked letter still fails.
      const code = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8').replace(/(?<![\p{L}])Sāmoa(?:ns?)?(?![\p{L}])/gu, ' ')
      expect(code, file).not.toMatch(samoan)
    }
  })
})
