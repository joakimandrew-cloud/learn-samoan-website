// Chapter 17's figures, as data (plan 2026-11-06-chapter-page-simplify). Every Sāmoan and
// English string here is copied from book/Chapter-17.md, every macron and ʻ kept; titles,
// captions, labels and text alternatives are phrases the book prints. Rich strings mark
// Sāmoan with *asterisks*. The look lives in chapter-page.css and the engine: this file
// carries no colour, size, style or class. npm run check:figures -- 17 holds it to the book.

const face = (text, role, label) => (label ? { text, role, label } : { text, role })

// 17.1 replaces the steps contrast: it shows the place phrase leaving the end of the sentence
// and ai arriving in its own seat after the verb, where the steps only swapped whole sentences.
export const REPLACES = ['ch17-place-to-ai']

export const FIGURES = [
  {
    id: '17.1',
    kind: 'row',
    types: ['drop', 'add'],
    title: '*Ai* takes its own seat.',
    caption: 'In the second the place is gone, and a single word, *ai*, stands straight after the verb here.',
    // After "Compare the two sentences", before "Ai takes its own seat" and the table.
    after: { section: 'pointing-back-to-a-place', block: b => b.type === 'p' && b.text.includes('Compare the two sentences') },
    alt: [
      '*Sā nofo le teine ʻi le nuʻu.* The girl lived in the village.',
      '*Sā nofo ai le teine.* The girl lived there.',
      'In the second the place is gone, and a single word, *ai*, stands straight after the verb here.',
    ],
    scenes: [{
      key: 'nofo',
      tiles: {
        sa: [face('Sā', 'tense')],
        nofo: [face('nofo', 'verb')],
        ai: [face('ai', 'marker', 'pointing-back word')],
        teine: [face('le teine', 'noun', 'doer')],
        i: [face('ʻi', 'marker', 'place word')],
        nuu: [face('le nuʻu', 'noun')],
      },
      before: { say: 'Sā nofo le teine ʻi le nuʻu.', en: 'The girl lived in the village.' },
      after: { say: 'Sā nofo ai le teine.', en: 'The girl lived there.' },
      states: [
        [['sa', 0], ['nofo', 0], ['teine', 0], ['i', 0], ['nuu', 0]],
        [['sa', 0], ['nofo', 0], ['teine', 0], ['i', 0]],
        [['sa', 0], ['nofo', 0], ['teine', 0]],
        [['sa', 0], ['nofo', 0], ['ai', 0], ['teine', 0]],
      ],
      beats: [
        { kind: 'drop', tile: 'nuu', to: 1 },
        { kind: 'drop', tile: 'i', to: 2 },
        { kind: 'add', tile: 'ai', to: 3 },
        { kind: 'en' },
      ],
    }],
  },
  {
    id: '17.2',
    kind: 'row',
    types: ['swap'],
    title: 'Going There: *ʻi ai*',
    caption: 'In the second, *ʻi ai* takes that slot and means "to there".',
    // After "In the first sentence the goal is", before the sorting by verb.
    after: { section: 'going-there-i-ai', block: b => b.type === 'p' && b.text.includes('In the first sentence the goal is') },
    alt: [
      '*Sā alu le tama ʻi le fale.* The boy went to the house.',
      '*Sā alu le tama ʻi ai.* The boy went there.',
      'In the second, *ʻi ai* takes that slot and means "to there".',
    ],
    scenes: [{
      key: 'alu',
      tiles: {
        sa: [face('Sā', 'tense')],
        alu: [face('alu', 'verb')],
        tama: [face('le tama', 'noun', 'doer')],
        i: [face('ʻi', 'marker', 'place word')],
        goal: [face('le fale', 'noun'), face('ai', 'marker', 'pointing-back word')],
      },
      before: { say: 'Sā alu le tama ʻi le fale.', en: 'The boy went to the house.' },
      after: { say: 'Sā alu le tama ʻi ai.', en: 'The boy went there.' },
      states: [
        [['sa', 0], ['alu', 0], ['tama', 0], ['i', 0], ['goal', 0]],
        [['sa', 0], ['alu', 0], ['tama', 0], ['i', 0], ['goal', 1]],
      ],
      beats: [{ kind: 'swap', tile: 'goal', to: 1 }, { kind: 'en' }],
    }],
  },
]
