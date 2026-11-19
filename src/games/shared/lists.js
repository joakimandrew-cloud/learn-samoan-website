/**
 * Word Balloons: the sets a player may choose (pure, no React).
 *
 * The three bands the /cards page offers under "By band", with its labels
 * (src/premium/pages/Cards.jsx), each holding the deck's cards that a row of
 * that band prints. A band is read from src/data/chapters.json (`level`), the
 * same field /cards reads. test/games-word-balloons.test.js holds the three
 * labels to the text of Cards.jsx, so the two cannot drift apart.
 */
import vocabulary from '../../data/book-vocabulary.json' with { type: 'json' }
import chapters from '../../data/chapters.json' with { type: 'json' }
import { buildDeck } from './deck.js'

/** The three band sets, labelled as /cards labels them. */
export const BAND_SETS = [
  { id: 'beginner', label: 'Beginner (Chapters 1 to 24)' },
  { id: 'intermediate', label: 'Intermediate (Chapters 25 to 42)' },
  { id: 'advanced', label: 'Advanced (Chapters 43 to 52)' },
]

/** Every card the game can play. */
export const ALL_WORDS = buildDeck(vocabulary)

const BAND_OF = new Map(chapters.map(c => [c.chapter, c.level]))

/** The sets as the page offers them: { id, label, cards, count }. */
export const SETS = BAND_SETS.map(band => {
  const cards = ALL_WORDS.filter(card => card.chapters.some(n => BAND_OF.get(n) === band.id))
  return { ...band, cards, count: cards.length }
})

export const DEFAULT_SET_ID = SETS[0].id

const byId = new Map(SETS.map(s => [s.id, s]))

/** The set an id names, or the first band for an id the game does not offer. */
export function setById(id) {
  return byId.get(id) ?? byId.get(DEFAULT_SET_ID)
}
