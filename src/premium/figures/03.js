// Chapter 3's figures, as data (plan 2026-11-06-chapter-page-simplify). Every Sāmoan and
// English string here is copied from book/Chapter-03.md, every macron and ʻ kept; titles,
// captions, labels and text alternatives are phrases the book prints. Rich strings mark
// Sāmoan with *asterisks*. This file carries no colour, size, style or class.
// npm run check:figures -- 3 holds it to the book.

const face = (text, role, label) => (label ? { text, role, label } : { text, role })

// 3.1 shows the added word landing after the verb while the rest holds still, which the
// two-step contrast only lists. The want word fia keeps its Interactive: the point is two
// words in two different slots (fiafia after the verb, fia before it), and the Fork draws
// every lane's branch into the one slot of the current case, so a Fork would show fiafia
// before the verb and fia after it. Remake it once the engine has a fork whose lanes each
// own a slot.
export const REPLACES = ['ch3-after-the-action']

export const FIGURES = [
  {
    id: '3.1',
    kind: 'row',
    types: ['add'],
    title: 'Which word was added, and what does it add?',
    caption: 'Nothing else in the sentence moved.',
    // After the paragraph that answers the question, before the adjectives paragraph.
    after: { section: 'the-describing-verb', block: b => b.type === 'p' && b.text.includes('Nothing else in the sentence moved') },
    alt: [
      '*Sā ʻou foʻi.* I returned.',
      '*Sā ʻou foʻi fiafia.* I returned happily.',
      'The added word is *fiafia*, and it sits straight after the verb.',
    ],
    scenes: [
      {
        key: 'foi',
        tiles: {
          sa: [face('Sā', 'tense', 'past particle')],
          ou: [face('ʻou', 'pronoun')],
          foi: [face('foʻi', 'verb', 'action verb')],
          fiafia: [face('fiafia', 'verb', 'describing verb')],
        },
        before: { say: 'Sā ʻou foʻi.', en: 'I returned.' },
        after: { say: 'Sā ʻou foʻi fiafia.', en: 'I returned happily.' },
        states: [
          [['sa', 0], ['ou', 0], ['foi', 0]],
          [['sa', 0], ['ou', 0], ['foi', 0], ['fiafia', 0]],
        ],
        beats: [{ kind: 'add', tile: 'fiafia', to: 1 }, { kind: 'en' }],
      },
    ],
  },
]
