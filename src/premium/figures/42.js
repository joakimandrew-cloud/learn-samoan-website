// Chapter 42's figures, as data (plan 2026-11-06-chapter-page-simplify). Every Sāmoan and
// English string here is copied from book/Chapter-42.md, every macron and ʻ kept; titles,
// captions, labels and text alternatives are phrases the book prints. Rich strings mark
// Sāmoan with *asterisks*. This file carries no colour, size, style or class.
// npm run check:figures -- 42 holds it to the book.

const face = (text, role, label) => (label ? { text, role, label } : { text, role })

export const FIGURES = [
  {
    id: '42.1',
    kind: 'row',
    types: ['swap'],
    title: 'That particle is read against the time the first half names, not against the moment of speaking',
    caption: '*ʻua sau le teine* stays word for word the same while the English moves from "has come" to "had come".',
    // After the paragraph on the report after a knowing word, before Exercise 5.
    after: { section: 'reported-speech', block: b => b.type === 'p' && b.text.includes('read against the time the first half names') },
    alt: [
      '*ʻUa iloa e le tama ʻua sau le teine.* The boy knows that the girl has come.',
      '*Na iloa e le tama ʻua sau le teine.* The boy knew that the girl had come.',
      'That particle is read against the time the first half names, not against the moment of speaking, so *ʻua sau le teine* stays word for word the same while the English moves from "has come" to "had come".',
    ],
    scenes: [
      {
        key: 'iloa',
        tiles: {
          tense: [face('ʻUa', 'tense'), face('Na', 'tense')],
          verb: [face('iloa', 'verb', 'knowing word')],
          doer: [face('e le tama', 'noun', 'the doer')],
          report: [face('ʻua sau le teine', 'quiet', 'the report')],
        },
        before: { say: 'ʻUa iloa e le tama ʻua sau le teine.', en: 'The boy knows that the girl has come.' },
        after: { say: 'Na iloa e le tama ʻua sau le teine.', en: 'The boy knew that the girl had come.' },
        states: [
          [['tense', 0], ['verb', 0], ['doer', 0], ['report', 0]],
          [['tense', 1], ['verb', 0], ['doer', 0], ['report', 0]],
        ],
        beats: [{ kind: 'swap', tile: 'tense', to: 1 }, { kind: 'en' }],
      },
    ],
  },
  {
    id: '42.2',
    kind: 'row',
    types: ['move'],
    title: 'Putting Things First',
    caption: 'When the thing acted on goes first, the verb mostly keeps its short form.',
    // After the paragraph on fronting, before Exercise 6.
    after: { section: 'putting-things-first', block: b => b.type === 'p' && b.text.includes('putting a participant first') },
    alt: [
      '*Sā tapē e le tama le puaʻa.* The boy killed the pig.',
      '*ʻO le puaʻa sā tapē e le tama.* The boy killed the pig.',
      '*ʻO le tama sā tapē=ina le puaʻa.* The boy killed the pig.',
      'In the pattern practised here, putting a participant first moves its noun phrase to the head of the sentence behind the presenting particle *ʻo* and leaves its ordinary slot empty, and the English stays the same.',
    ],
    scenes: [
      {
        key: 'puaa',
        tiles: {
          rest: [face('Sā tapē e le tama', 'quiet'), face('sā tapē e le tama', 'quiet')],
          done: [face('le puaʻa', 'noun', 'the thing acted on'), face('ʻO le puaʻa', 'noun', 'the thing acted on')],
        },
        before: { say: 'Sā tapē e le tama le puaʻa.', en: 'The boy killed the pig.' },
        after: { say: 'ʻO le puaʻa sā tapē e le tama.', en: 'The boy killed the pig.' },
        states: [
          [['rest', 0], ['done', 0]],
          [['done', 1], ['rest', 1], ['GHOST', 0]],
        ],
        beats: [{ kind: 'move', tile: 'done', to: 1, arc: true, roll: 'rest' }, { kind: 'en' }],
      },
      {
        key: 'tama',
        caption: 'When the doer goes first, the verb usually takes the long form.',
        tiles: {
          rest: [face('Sā tapē', 'quiet'), face('sā tapē=ina', 'quiet')],
          doer: [face('e le tama', 'noun', 'the doer'), face('ʻO le tama', 'noun', 'the doer')],
          done: [face('le puaʻa', 'quiet')],
        },
        before: { say: 'Sā tapē e le tama le puaʻa.', en: 'The boy killed the pig.' },
        after: { say: 'ʻO le tama sā tapē=ina le puaʻa.', en: 'The boy killed the pig.' },
        states: [
          [['rest', 0], ['doer', 0], ['done', 0]],
          [['doer', 1], ['rest', 1], ['GHOST', 0], ['done', 0]],
        ],
        beats: [{ kind: 'move', tile: 'doer', to: 1, arc: true, roll: 'rest' }, { kind: 'en' }],
      },
    ],
  },
]
