// Chapter 30's figures, as data (plan 2026-11-06-chapter-page-simplify). Every Sāmoan and
// English string here is copied from book/Chapter-30.md, every macron and ʻ kept; titles,
// captions, lane labels and text alternatives are phrases the book prints. Rich strings mark
// Sāmoan with *asterisks*. This file carries no colour, size, style or class.
// npm run check:figures -- 30 holds it to the book.

const face = (text, role, label) => (label ? { text, role, label } : { text, role })
const dir = text => face(text, 'marker', 'direction word')

export const FIGURES = [
  {
    id: '30.1',
    kind: 'row',
    types: ['swap'],
    title: 'Five of the six can be set in that slot on the verb *alu* (go), one after another, and nothing else moves',
    caption: 'The verb is "go" in every row, and the direction word after it is the whole difference between going off, going past, up, down or away.',
    // After the paragraph under the table of five, before "Two other kinds of word".
    after: { section: 'where-the-direction-word-stands', block: b => b.type === 'p' && b.text.includes('is the whole') },
    alt: [
      '*Na alu atu le tama.*',
      'The boy went off (away from me, toward you).',
      '*Na alu ane le tama.* The boy went past.',
      '*Na alu aʻe le tama.*',
      'The boy went up.',
      '*Na alu ifo le tama.* The boy went down.',
      '*Na alu ʻese le tama.*',
      'The boy went away.',
    ],
    chips: [
      { state: 0, sm: 'atu', en: 'away from the speaker' },
      { state: 1, sm: 'ane', en: 'along' },
      { state: 2, sm: 'aʻe', en: 'up' },
      { state: 3, sm: 'ifo', en: 'down' },
      { state: 4, sm: 'ʻese', en: 'away from a point' },
    ],
    scenes: [
      {
        key: 'alu',
        tiles: {
          alu: [face('Na alu', 'quiet')],
          dir: [dir('atu'), dir('ane'), dir('aʻe'), dir('ifo'), dir('ʻese')],
          tama: [face('le tama', 'noun')],
        },
        before: { say: 'Na alu atu le tama.', en: 'The boy went off (away from me, toward you).' },
        after: { say: 'Na alu ʻese le tama.', en: 'The boy went away.' },
        states: [0, 1, 2, 3, 4].map(k => [['alu', 0], ['dir', k], ['tama', 0]]),
        beats: [
          { kind: 'swap', tile: 'dir', to: 1 },
          { kind: 'swap', tile: 'dir', to: 2 },
          { kind: 'swap', tile: 'dir', to: 3 },
          { kind: 'swap', tile: 'dir', to: 4 },
          { kind: 'en' },
        ],
      },
    ],
  },
  {
    id: '30.2',
    kind: 'fork',
    types: ['fork-readings'],
    title: 'What follows the word tells the two jobs apart.',
    // After the paragraph on ʻOloʻo taʻoto mai, before ʻaumai.
    after: { section: 'the-pair-mai-and-atu', block: b => b.type === 'p' && b.text.includes('is the direction word there too') },
    lanes: [
      { label: 'from-word', forms: [] },
      { label: 'direction word', forms: [] },
    ],
    alt: [
      '*Na sau le tama mai le fale.* The boy came from the house.',
      '*ʻUa tagi mai le teine ʻi lona tamā.* The girl cried out to her father (toward the speaker).',
      'What follows the word tells the two jobs apart.',
      'A place noun directly after *mai* makes it the from-word.',
    ],
    scenes: [
      {
        key: 'mai',
        cases: [
          {
            lane: 0, say: 'Na sau le tama mai le fale.', en: 'The boy came from the house.',
            row: [face('Na sau le tama', 'quiet'), { ...face('mai', 'marker', 'from-word'), reads: true }, { ...face('le fale', 'noun', 'place noun'), ring: true }],
          },
          {
            lane: 1, say: 'ʻUa tagi mai le teine ʻi lona tamā.', en: 'The girl cried out to her father (toward the speaker).',
            row: [face('ʻUa tagi', 'quiet'), { ...face('mai', 'marker', 'direction word'), reads: true }, { ...face('le teine', 'noun', 'the doer of the action'), ring: true }, face('ʻi lona tamā', 'quiet')],
          },
        ],
      },
    ],
  },
  {
    id: '30.3',
    kind: 'row',
    types: ['add'],
    title: 'The direction word goes directly after the spatial noun, and it keeps its direction',
    // After the table of the cat and the car, before the Note on tala mai and tala atu.
    after: { section: 'a-direction-word-inside-a-spatial-noun', block: b => b.type === 'table' },
    alt: [
      '*ʻO le pusi ʻi lalo o le fale.*',
      'The cat under the house.',
      '*ʻO le pusi ʻi lalo ifo o le fale.*',
      'The cat underneath the house.',
    ],
    scenes: [
      {
        key: 'lalo',
        tiles: {
          pusi: [face('ʻO le pusi', 'quiet')],
          i: [face('ʻi', 'marker', 'place word')],
          lalo: [face('lalo', 'noun', 'spatial noun')],
          ifo: [dir('ifo')],
          fale: [face('o le fale', 'quiet')],
        },
        before: { say: 'ʻO le pusi ʻi lalo o le fale.', en: 'The cat under the house.' },
        after: { say: 'ʻO le pusi ʻi lalo ifo o le fale.', en: 'The cat underneath the house.' },
        states: [
          [['pusi', 0], ['i', 0], ['lalo', 0], ['fale', 0]],
          [['pusi', 0], ['i', 0], ['lalo', 0], ['ifo', 0], ['fale', 0]],
        ],
        beats: [{ kind: 'add', tile: 'ifo', to: 1 }, { kind: 'en' }],
      },
    ],
  },
]
