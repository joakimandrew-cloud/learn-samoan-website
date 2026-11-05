// Chapter 24's figures, as data (plan 2026-11-06-chapter-page-simplify). Every Sāmoan and
// English string here is copied from book/Chapter-24.md, every macron and ʻ kept; titles,
// captions, labels and text alternatives are phrases the book prints. Rich strings mark
// Sāmoan with *asterisks*. This file carries no colour, size, style or class.
// npm run check:figures -- 24 holds it to the book.

const face = (text, role, label) => (label !== undefined ? { text, role, label } : { text, role })

export const FIGURES = [
  {
    id: '24.1',
    kind: 'row',
    types: ['swap'],
    title: 'A where-sentence puts a place, with a tense particle in front of it, where a verb would stand.',
    // After the paragraph that names the three types, before Exercise 1; the two
    // Interactives sit at the end of the section, after Exercise 1.
    after: { section: 'the-three-sentence-types', block: b => b.type === 'p' && b.text.includes('where a verb would stand') },
    alt: [
      '*Sā siva le teine.*',
      '*Sā ʻi le fale le teine.* The girl was in the house.',
      'The three sentence types are the frame everything else hangs on: a verb sentence puts a tense particle in front of an action or a describing verb, a naming sentence sets two naming parts side by side with the presenting particle *ʻo*, and a where-sentence puts a place, with a tense particle in front of it, where a verb would stand.',
    ],
    scenes: [
      {
        key: 'fale',
        tiles: {
          sa: [face('Sā', 'tense')],
          slot: [face('siva', 'verb'), face('ʻi le fale', 'noun', 'place')],
          teine: [face('le teine', 'noun', '')],
        },
        before: { say: 'Sā siva le teine.', en: null },
        after: { say: 'Sā ʻi le fale le teine.', en: 'The girl was in the house.' },
        states: [
          [['sa', 0], ['slot', 0], ['teine', 0]],
          [['sa', 0], ['slot', 1], ['teine', 0]],
        ],
        beats: [{ kind: 'swap', tile: 'slot', to: 1 }, { kind: 'en' }],
      },
    ],
  },
]
