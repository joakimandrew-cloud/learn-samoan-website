// Chapter 21's figures, as data (plan 2026-11-06-chapter-page-simplify). Every Sāmoan and
// English string here is copied from book/Chapter-21.md, every macron and ʻ kept; titles,
// captions, lane labels and text alternatives are phrases the book prints. Rich strings mark
// Sāmoan with *asterisks*. This file carries no colour, size, style or class.
// npm run check:figures -- 21 holds it to the book.

const face = (text, role, label) => (label ? { text, role, label } : { text, role })

// The toggle of the two printed sentences is replaced by Figure 21.1, which rings the verb as
// the word that decides and lights the reading of *ma* it gives, the point the book's question
// "Which word changed?" asks the reader to find.
export const REPLACES = ['ch21-with-and-and']

export const FIGURES = [
  {
    id: '21.1',
    kind: 'fork',
    types: ['fork-readings'],
    title: 'The Number of the Verb Tells You Which',
    caption: 'Where the verb has a plural form to show, its number is the whole difference between a companion and a second doer.',
    // After the paragraph that answers "Which word changed?", before the Preview on *mo*.
    after: { section: 'the-number-of-the-verb-tells-you-which', block: b => b.type === 'p' && b.text.includes('Only the verb:') },
    lanes: [
      { label: 'with', forms: [] },
      { label: 'and', forms: [] },
    ],
    alt: [
      '*Sā nofo le tama ma le teine.* The boy stayed with the girl.',
      '*Sā nonofo le tama ma le teine.* The boy and the girl stayed.',
      'The singular verb *nofo* means one person did the staying and the other came along, so *ma* is "with".',
      'The plural verb *nonofo* means both did the staying together, so *ma* is "and".',
    ],
    scenes: [
      {
        key: 'nofo',
        cases: [
          {
            lane: 0, say: 'Sā nofo le tama ma le teine.', en: 'The boy stayed with the girl.',
            row: [face('Sā', 'tense', ''), { ...face('nofo', 'verb', 'singular verb'), ring: true }, face('le tama', 'noun'), { ...face('ma', 'marker', 'with-word'), reads: true }, face('le teine', 'noun', 'companion')],
          },
          {
            lane: 1, say: 'Sā nonofo le tama ma le teine.', en: 'The boy and the girl stayed.',
            row: [face('Sā', 'tense', ''), { ...face('nonofo', 'verb', 'plural verb'), ring: true }, face('le tama', 'noun'), { ...face('ma', 'marker', 'with-word'), reads: true }, face('le teine', 'noun', 'second doer')],
          },
        ],
      },
    ],
  },
]
