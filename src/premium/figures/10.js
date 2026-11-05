// Chapter 10's figures, as data (plan 2026-11-06-chapter-page-simplify). Every Sāmoan and
// English string here is copied from book/Chapter-10.md, every macron and ʻ kept; titles,
// captions, lane labels and text alternatives are phrases the book prints. Rich strings mark
// Sāmoan with *asterisks*. This file carries no colour, size, style or class.
// npm run check:figures -- 10 holds it to the book.

const face = (text, role, label) => (label ? { text, role, label } : { text, role })
const we = text => ({ slot: true, form: face(text, 'pronoun') })

const swapPhrase = (key, verb, one, two, before, after) => ({
  key,
  tiles: {
    verb: [face(verb, 'verb')],
    np: [face(one, 'noun', 'noun phrase'), face(two, 'noun', 'noun phrase')],
  },
  before,
  after,
  states: [
    [['verb', 0], ['np', 0]],
    [['verb', 0], ['np', 1]],
  ],
  beats: [{ kind: 'swap', tile: 'np', to: 1 }, { kind: 'en' }],
})

export const FIGURES = [
  {
    id: '10.1',
    kind: 'row',
    types: ['swap'],
    title: 'Change the noun phrase and the wish moves to a new occasion',
    caption: '*Manuia* and *mālō* head the well-wishing and congratulating formulas, each on the tense-particle-free shape from the first section.',
    // After the paragraph that states the swap, before the table of wishes.
    after: { section: 'good-wishes-and-congratulations', block: b => b.type === 'p' && b.text.includes('the wish moves to a new occasion') },
    alt: [
      '*Manuia le tausaga fou!* Happy New Year!',
      '*Manuia le ʻāiga!*',
      'Blessings on the family!',
      '*Mālō le gālue!* Congratulations on your work!',
      '*Mālō le siva!*',
      'Well done on the dancing!',
      '*Manuia* and *mālō* head the well-wishing and congratulating formulas, each on the tense-particle-free shape from the first section.',
    ],
    scenes: [
      swapPhrase('manuia', 'Manuia', 'le tausaga fou', 'le ʻāiga',
        { say: 'Manuia le tausaga fou!', en: 'Happy New Year!' },
        { say: 'Manuia le ʻāiga!', en: 'Blessings on the family!' }),
      swapPhrase('malo', 'Mālō', 'le gālue', 'le siva',
        { say: 'Mālō le gālue!', en: 'Congratulations on your work!' },
        { say: 'Mālō le siva!', en: 'Well done on the dancing!' }),
    ],
  },
  {
    id: '10.2',
    kind: 'fork',
    types: ['fork-meaning'],
    title: '*Tā* is the "we" of just two people, *tātou* the "we" of more than two',
    caption: 'These are the common invitation formulas; take them whole for now.',
    // After the paragraph that tells the two apart.
    after: { section: 'inviting-others-along', block: b => b.type === 'p' && b.text.includes('of just two people') },
    lanes: [
      { label: 'just two people', forms: ['tā'] },
      { label: 'more than two', forms: ['tātou'] },
    ],
    alt: [
      '*Tā ō!* Let\'s go, you and me.',
      '*Tātou ō!* Let\'s all go.',
      '*Tā* is the "we" of just two people, *tātou* the "we" of more than two, and each takes the listener in.',
    ],
    scenes: [
      {
        key: 'o',
        cases: [
          { lane: 0, say: 'Tā ō!', en: "Let's go, you and me.", row: [we('Tā'), face('ō', 'verb')] },
          { lane: 1, say: 'Tātou ō!', en: "Let's all go.", row: [we('Tātou'), face('ō', 'verb')] },
        ],
      },
    ],
  },
]
