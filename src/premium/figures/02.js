// Chapter 2's figures, as data (plan 2026-11-06-chapter-page-simplify). Every Sāmoan and
// English string here is copied from book/Chapter-02.md, every macron and ʻ kept; titles,
// captions, labels and text alternatives are phrases the book prints. Rich strings mark
// Sāmoan with *asterisks*. This file carries no colour, size, style or class.
// npm run check:figures -- 2 holds it to the book.

const face = (text, role, label) => (label ? { text, role, label } : { text, role })

export const FIGURES = [
  {
    id: '2.1',
    kind: 'row',
    types: ['swap'],
    title: 'Two of these forms sit a single sound apart.',
    caption: '*Tātou* pulls the listener in: we, you included. *Mātou* shuts the listener out: we, but not you.',
    // After the paragraph that answers "Which word changed", before the two Notes.
    after: { section: 'the-pattern', block: b => b.type === 'p' && b.text.includes('hides what') },
    alt: [
      '*Sā tātou siva.* We danced.',
      '*Sā mātou siva.* We danced.',
      'The word changed from *tātou* to *mātou*, and the plain English "we" hides what Sāmoan makes plain.',
    ],
    scenes: [
      {
        key: 'siva',
        tiles: {
          sa: [face('Sā', 'tense', 'past particle')],
          we: [face('tātou', 'pronoun', 'we (you and I, and others)'), face('mātou', 'pronoun', 'we (others and I, but not you)')],
          siva: [face('siva', 'verb')],
        },
        before: { say: 'Sā tātou siva.', en: 'We danced.' },
        after: { say: 'Sā mātou siva.', en: 'We danced.' },
        states: [
          [['sa', 0], ['we', 0], ['siva', 0]],
          [['sa', 0], ['we', 1], ['siva', 0]],
        ],
        beats: [{ kind: 'swap', tile: 'we', to: 1 }, { kind: 'en' }],
      },
    ],
  },
]
