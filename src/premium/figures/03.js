// Chapter 3's figures, as data (plan 2026-11-06-chapter-page-simplify). Every Sāmoan and
// English string here is copied from book/Chapter-03.md, every macron and ʻ kept; titles,
// captions, labels and text alternatives are phrases the book prints. Rich strings mark
// Sāmoan with *asterisks*. This file carries no colour, size, style or class.
// npm run check:figures -- 3 holds it to the book.

const face = (text, role, label) => (label ? { text, role, label } : { text, role })

// 3.1 shows the added word landing after the verb while the rest holds still, which the
// two-step contrast only lists. 3.2 sets the two new words side by side, fiafia in the slot
// straight after the verb and fia in the slot directly before it (ownSlots: each lane fills
// its own slot). The Interactive ch3-fia-before-the-action stays: it adds fia to a bare
// sentence, which 3.2 does not show; 3.2 shows the two positions against each other.
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
  {
    id: '3.2',
    kind: 'fork',
    ownSlots: true,
    title: '*Fia* is the word for wanting to do something, and it sits directly before the verb.',
    caption: 'The describing verb of the last section came after the action; *fia* comes before it.',
    // After the fia table, not between its lead-in sentence and the table.
    after: { section: 'the-want-word-fia', block: b => b.type === 'table' && JSON.stringify(b).includes('I wanted to ask') },
    alt: [
      '*Sā ʻou foʻi fiafia.* I returned happily.',
      '*Sā ʻou fia alu.* I wanted to go.',
      'The describing verb of the last section came after the action; *fia* comes before it.',
    ],
    lanes: [
      { label: 'straight after the verb', forms: ['fiafia'] },
      { label: 'directly before the verb', forms: ['fia'] },
    ],
    scenes: [
      {
        key: 'ou',
        cases: [
          { lane: 0, say: 'Sā ʻou foʻi fiafia.', en: 'I returned happily.', row: [face('Sā', 'tense', ''), face('ʻou', 'pronoun'), face('foʻi', 'verb', 'action verb'), { slot: true, form: face('fiafia', 'verb', 'describing verb') }] },
          { lane: 1, say: 'Sā ʻou fia alu.', en: 'I wanted to go.', row: [face('Sā', 'tense', ''), face('ʻou', 'pronoun'), { slot: true, form: face('fia', 'marker', 'want word') }, face('alu', 'verb', 'action verb')] },
        ],
      },
      {
        key: 'ia',
        cases: [
          { lane: 0, say: 'Sā ia siva fiafia.', en: 'She danced happily.', row: [face('Sā', 'tense', ''), face('ia', 'pronoun'), face('siva', 'verb', 'action verb'), { slot: true, form: face('fiafia', 'verb', 'describing verb') }] },
          { lane: 1, say: 'Sā ia fia siva.', en: 'She wanted to dance.', row: [face('Sā', 'tense', ''), face('ia', 'pronoun'), { slot: true, form: face('fia', 'marker', 'want word') }, face('siva', 'verb', 'action verb')] },
        ],
      },
    ],
  },
]
