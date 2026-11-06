// Chapter 48's figures, as data (plan 2026-11-06-chapter-page-simplify). Every Sāmoan and
// English string here is copied from book/Chapter-48.md, every macron and ʻ kept; titles,
// captions, labels and text alternatives are phrases the book prints. Rich strings mark
// Sāmoan with *asterisks*. This file carries no colour, size, style or class.
// npm run check:figures -- 48 holds it to the book.

const face = (text, role, label) => (label != null ? { text, role, label } : { text, role })

export const FIGURES = [
  {
    id: '48.1',
    kind: 'row',
    types: ['drop', 'swap'],
    title: 'Number in the Two Slots',
    caption: 'The noun *teine* keeps one shape, and its number shows in the article, *le* for one particular girl and no article for the particular girls.',
    // After the paragraph that sets out the two halves, before the fana paragraph.
    after: { section: 'number-in-the-two-slots', block: b => b.type === 'p' && b.text.includes('About 350 words') },
    alt: [
      '*Sā nofo le teine.* The girl stayed.',
      '*Sā nonofo teine.* The girls stayed.',
      'The verb changes shape for more than one: *nofo* becomes *nonofo*, as *uliuli* (black) becomes *uli*.',
    ],
    scenes: [
      {
        key: 'nofo',
        tiles: {
          sa: [face('Sā', 'tense', 'past particle')],
          nofo: [face('nofo', 'verb', 'verb'), face('nonofo', 'verb', 'verb')],
          le: [face('le', 'marker', 'article')],
          teine: [face('teine', 'noun', 'noun')],
        },
        before: { say: 'Sā nofo le teine.', en: 'The girl stayed.' },
        after: { say: 'Sā nonofo teine.', en: 'The girls stayed.' },
        states: [
          [['sa', 0], ['nofo', 0], ['le', 0], ['teine', 0]],
          [['sa', 0], ['nofo', 0], ['GHOST'], ['teine', 0]],
          [['sa', 0], ['nofo', 1], ['teine', 0]],
        ],
        beats: [{ kind: 'drop', tile: 'le', to: 1 }, { kind: 'swap', tile: 'nofo', to: 2 }, { kind: 'en' }],
      },
    ],
  },
]
