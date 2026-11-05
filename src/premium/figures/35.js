// Chapter 35's figures, as data (plan 2026-11-06-chapter-page-simplify). Every Sāmoan and
// English string here is copied from book/Chapter-35.md, every macron and ʻ kept; titles,
// captions, labels and text alternatives are phrases the book prints. Rich strings mark
// Sāmoan with *asterisks*. This file carries no colour, size, style or class.
// npm run check:figures -- 35 holds it to the book.

const face = (text, role, label) => (label !== undefined ? { text, role, label } : { text, role })

export const FIGURES = [
  {
    id: '35.1',
    kind: 'row',
    types: ['move', 'add'],
    title: 'Moving the Doer to the Front',
    caption: 'Nothing else changed, and the English is the same either way.',
    // After the paragraph that answers "which of the words has moved".
    after: { section: 'moving-the-doer-to-the-front', block: b => b.type === 'p' && b.text.includes('The doer is what moved') },
    alt: [
      '*Sā galue le tama ʻi le faʻatoʻaga.* The boy worked in the plantation.',
      '*ʻO le tama sā galue ʻi le faʻatoʻaga.* The boy worked in the plantation. (Lit. "Presenting the boy, past work in the plantation.")',
      'In the second, *le tama* stands at the head of the sentence with the presenting particle *ʻo* in front of it, and the verb phrase comes after.',
      'Nothing else changed, and the English is the same either way.',
    ],
    scenes: [
      {
        key: 'tama',
        tiles: {
          sa: [face('Sā', 'tense', ''), face('sā', 'tense', '')],
          galue: [face('galue', 'verb', '')],
          tama: [face('le tama', 'noun', 'the doer')],
          place: [face('ʻi le faʻatoʻaga', 'quiet')],
          o: [face('ʻO', 'marker', 'presenting particle')],
        },
        before: { say: 'Sā galue le tama ʻi le faʻatoʻaga.', en: 'The boy worked in the plantation.' },
        after: { say: 'ʻO le tama sā galue ʻi le faʻatoʻaga.', en: 'The boy worked in the plantation.' },
        states: [
          [['sa', 0], ['galue', 0], ['tama', 0], ['place', 0]],
          [['tama', 0], ['sa', 1], ['galue', 0], ['GHOST', 0], ['place', 0]],
          [['o', 0], ['tama', 0], ['sa', 1], ['galue', 0], ['GHOST', 0], ['place', 0]],
        ],
        beats: [
          { kind: 'move', tile: 'tama', to: 1, arc: 'GHOST', roll: 'sa' },
          { kind: 'add', tile: 'o', to: 2 },
          { kind: 'en' },
        ],
      },
    ],
  },
  {
    id: '35.2',
    kind: 'row',
    types: ['move', 'add'],
    title: 'What moves to the front is the whole phrase, however long it runs',
    caption: 'The thing heard is *le leo o le pepe*, the voice of the baby, and all five words travel to the front together.',
    // After the paragraph on the five words travelling together, before the Note on *lea* and *ia*.
    after: { section: 'the-shape-of-the-verb', block: b => b.type === 'p' && b.text.includes('all five words') },
    alt: [
      '*Na lagona e le tinā le leo o le pepe.* The mother heard the voice of the baby.',
      '*ʻO le leo o le pepe na lagona e le tinā.* The mother heard the voice of the baby.',
      'The thing heard is *le leo o le pepe*, the voice of the baby, and all five words travel to the front together.',
    ],
    scenes: [
      {
        key: 'leo',
        tiles: {
          na: [face('Na', 'tense', ''), face('na', 'tense', '')],
          lagona: [face('lagona', 'verb', '')],
          tina: [face('e le tinā', 'quiet')],
          leo: [face('le leo o le pepe', 'noun', 'the thing heard')],
          o: [face('ʻO', 'marker', 'presenting particle')],
        },
        before: { say: 'Na lagona e le tinā le leo o le pepe.', en: 'The mother heard the voice of the baby.' },
        after: { say: 'ʻO le leo o le pepe na lagona e le tinā.', en: 'The mother heard the voice of the baby.' },
        states: [
          [['na', 0], ['lagona', 0], ['tina', 0], ['leo', 0]],
          [['leo', 0], ['na', 1], ['lagona', 0], ['tina', 0], ['GHOST', 0]],
          [['o', 0], ['leo', 0], ['na', 1], ['lagona', 0], ['tina', 0], ['GHOST', 0]],
        ],
        beats: [
          { kind: 'move', tile: 'leo', to: 1, arc: 'GHOST', roll: 'na' },
          { kind: 'add', tile: 'o', to: 2 },
          { kind: 'en' },
        ],
      },
    ],
  },
  {
    id: '35.3',
    kind: 'row',
    types: ['move', 'add', 'swap'],
    title: 'Putting the Setting First',
    caption: 'So a setting has two front positions open to it, one keeping its place word and one presented like a doer, and *ai* appears in both.',
    // After the paragraph on the two front positions, before the summary table.
    after: { section: 'putting-the-setting-first', block: b => b.type === 'p' && b.text.includes('two front positions') },
    alt: [
      '*Sā galue le tama ʻi le faʻatoʻaga.* The boy worked in the plantation.',
      '*ʻI le faʻatoʻaga sā galue ai le tama.* In the plantation the boy worked there.',
      '*ʻO le faʻatoʻaga sā galue ai le tama.* The boy worked in the plantation. (Lit. "Presenting the plantation, past work there the boy.")',
      'So a setting has two front positions open to it, one keeping its place word and one presented like a doer, and *ai* appears in both.',
    ],
    scenes: [
      {
        key: 'i',
        tiles: {
          sa: [face('Sā', 'tense', ''), face('sā', 'tense', '')],
          galue: [face('galue', 'verb', '')],
          tama: [face('le tama', 'quiet')],
          i: [face('ʻi', 'marker', 'place word'), face('ʻI', 'marker', 'place word')],
          fa: [face('le faʻatoʻaga', 'noun', '')],
          ai: [face('ai', 'marker', 'pointing-back word')],
        },
        before: { say: 'Sā galue le tama ʻi le faʻatoʻaga.', en: 'The boy worked in the plantation.' },
        after: { say: 'ʻI le faʻatoʻaga sā galue ai le tama.', en: 'In the plantation the boy worked there.' },
        states: [
          [['sa', 0], ['galue', 0], ['tama', 0], ['i', 0], ['fa', 0]],
          [['i', 1], ['fa', 0], ['sa', 1], ['galue', 0], ['tama', 0], ['GHOST', 0]],
          [['i', 1], ['fa', 0], ['sa', 1], ['galue', 0], ['ai', 0], ['tama', 0], ['GHOST', 0]],
        ],
        beats: [
          { kind: 'move', tile: ['i', 'fa'], to: 1, roll: 'sa' },
          { kind: 'add', tile: 'ai', to: 2 },
          { kind: 'en' },
        ],
      },
      {
        key: 'o',
        tiles: {
          i: [face('ʻI', 'marker', 'place word'), face('ʻO', 'marker', 'presenting particle')],
          fa: [face('le faʻatoʻaga', 'noun', '')],
          sa: [face('sā', 'tense', '')],
          galue: [face('galue', 'verb', '')],
          ai: [face('ai', 'marker', 'pointing-back word')],
          tama: [face('le tama', 'quiet')],
        },
        before: { say: 'ʻI le faʻatoʻaga sā galue ai le tama.', en: 'In the plantation the boy worked there.' },
        after: { say: 'ʻO le faʻatoʻaga sā galue ai le tama.', en: 'The boy worked in the plantation.' },
        states: [
          [['i', 0], ['fa', 0], ['sa', 0], ['galue', 0], ['ai', 0], ['tama', 0]],
          [['i', 1], ['fa', 0], ['sa', 0], ['galue', 0], ['ai', 0], ['tama', 0]],
        ],
        beats: [{ kind: 'swap', tile: 'i', to: 1 }, { kind: 'en' }],
      },
    ],
  },
]
