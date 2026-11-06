// Chapter 38's figures, as data (plan 2026-11-06-chapter-page-simplify). Every Sāmoan and
// English string here is copied from book/Chapter-38.md, every macron and ʻ kept; titles,
// captions, labels and text alternatives are phrases the book prints. Rich strings mark
// Sāmoan with *asterisks*. This file carries no colour, size, style or class.
// npm run check:figures -- 38 holds it to the book.

const face = (text, role, label) => (label != null ? { text, role, label } : { text, role })

// The Drop figure shows *ʻo* leaving together with *lea* and staying when only *ona* goes,
// which the contrast steps only state in their notes.
export const REPLACES = ['ch38-then-shapes']

export const FIGURES = [
  {
    id: '38.1',
    kind: 'row',
    types: ['add'],
    title: 'Which word was added to the second sentence, and what did the English do?',
    caption: 'It carries the succession by itself, so putting it inside a construction that already carries the succession changes little if anything.',
    // After the paragraph that answers the question, before the paragraph on *ai*.
    after: { section: 'adding-loa', block: b => b.type === 'p' && b.text.includes('The added word is') },
    alt: [
      '*Ona alu lea ʻo le tama.* Then the boy went.',
      '*Ona alu loa lea ʻo le tama.* Then the boy went.',
      'The added word is *loa*, and the English did nothing at all.',
    ],
    scenes: [
      {
        key: 'loa',
        tiles: {
          ona: [face('Ona', 'marker', 'opening word')],
          alu: [face('alu', 'verb', '')],
          loa: [face('loa', 'marker', 'then-word')],
          lea: [face('lea', 'marker', 'closing word')],
          rest: [face('ʻo le tama', 'quiet')],
        },
        before: { say: 'Ona alu lea ʻo le tama.', en: 'Then the boy went.' },
        after: { say: 'Ona alu loa lea ʻo le tama.', en: 'Then the boy went.' },
        states: [
          [['ona', 0], ['alu', 0], ['lea', 0], ['rest', 0]],
          [['ona', 0], ['alu', 0], ['loa', 0], ['lea', 0], ['rest', 0]],
        ],
        beats: [{ kind: 'add', tile: 'loa', to: 1 }, { kind: 'en' }],
      },
    ],
  },
  {
    id: '38.2',
    kind: 'row',
    types: ['drop'],
    title: 'The Shorter Shapes of the Then-Construction',
    caption: 'What the clause names changes shape with them: with *lea* gone it stands in its plain form, and after *lea* it usually takes the presenting particle *ʻo*, whether *ona* is there or not.',
    // After the paragraph that says either word can drop, before the paragraph on modern writing.
    after: { section: 'the-shorter-shapes', block: b => b.type === 'p' && b.text.includes('runs the construction short') },
    alt: [
      '*Ona alu lea ʻo le tama.* Then the boy went.',
      '*Ona alu le tama.* Then the boy went.',
      '*Alu lea ʻo le tama.* Then the boy went.',
      'Drop *lea* and *ona* carries the succession on its own; drop *ona* and *lea* carries it.',
    ],
    scenes: [
      {
        key: 'nolea',
        tiles: {
          ona: [face('Ona', 'marker', 'opening word')],
          alu: [face('alu', 'verb', '')],
          lea: [face('lea', 'marker', 'closing word')],
          o: [face('ʻo', 'marker', 'presenting particle')],
          tama: [face('le tama', 'noun')],
        },
        before: { say: 'Ona alu lea ʻo le tama.', en: 'Then the boy went.' },
        after: { say: 'Ona alu le tama.', en: 'Then the boy went.' },
        states: [
          [['ona', 0], ['alu', 0], ['lea', 0], ['o', 0], ['tama', 0]],
          [['ona', 0], ['alu', 0], ['tama', 0]],
        ],
        beats: [{ kind: 'drop', tile: ['lea', 'o'], to: 1 }, { kind: 'en' }],
      },
      {
        key: 'noona',
        tiles: {
          ona: [face('Ona', 'marker', 'opening word')],
          alu: [face('alu', 'verb', ''), face('Alu', 'verb', '')],
          lea: [face('lea', 'marker', 'closing word')],
          o: [face('ʻo', 'marker', 'presenting particle')],
          tama: [face('le tama', 'noun')],
        },
        before: { say: 'Ona alu lea ʻo le tama.', en: 'Then the boy went.' },
        after: { say: 'Alu lea ʻo le tama.', en: 'Then the boy went.' },
        states: [
          [['ona', 0], ['alu', 0], ['lea', 0], ['o', 0], ['tama', 0]],
          [['alu', 1], ['lea', 0], ['o', 0], ['tama', 0]],
        ],
        beats: [{ kind: 'drop', tile: 'ona', roll: 'alu', to: 1 }, { kind: 'en' }],
      },
    ],
  },
]
