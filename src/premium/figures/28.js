// Chapter 28's figures, as data (plan 2026-11-06-chapter-page-simplify). Every Sāmoan and
// English string here is copied from book/Chapter-28.md, every macron and ʻ kept; titles,
// captions, lane labels and text alternatives are phrases the book prints. Rich strings mark
// Sāmoan with *asterisks*. This file carries no colour, size, style or class.
// npm run check:figures -- 28 holds it to the book.

const face = (text, role, label) => (label ? { text, role, label } : { text, role })

// The toggle of the two printed sentences is replaced by Figure 28.4, which shows the doer
// leaving and the gap staying empty, the point the book's question asks the reader to find.
export const REPLACES = ['ch28-omit-doer']

const dropDoer = (key, sa, verb, doer, done, before, after) => ({
  key,
  tiles: {
    sa: [face(sa, 'tense')],
    verb: [face(verb, 'verb')],
    doer: [face(doer, 'noun', 'the doer')],
    done: [face(done, 'noun', 'the one it happened to')],
  },
  before,
  after,
  states: [
    [['sa', 0], ['verb', 0], ['doer', 0], ['done', 0]],
    [['sa', 0], ['verb', 0], ['GHOST', 0], ['done', 0]],
  ],
  // old: true reserves the lane above the row, so the struck doer stays clear of the English line.
  beats: [{ kind: 'drop', tile: 'doer', to: 1, old: true }, { kind: 'en' }],
})

export const FIGURES = [
  {
    id: '28.1',
    kind: 'row',
    types: ['move'],
    title: 'The marker rides on the doer rather than on a position in the sentence',
    caption: 'Both orders are found, and the marker settles who did it either way.',
    // After the paragraph on the two orders, before "The Doer as a Preverbal Pronoun".
    after: { section: 'the-agent-marker-e', block: b => b.type === 'p' && b.text.includes('never') && b.text.includes('counting places along the line') },
    alt: [
      '*Sā fafaga e le tama le moa.* The boy fed the hen.',
      '*Sā fafaga le moa e le tama.* The boy fed the hen.',
      'Reading a sentence of this pattern means finding *e* and taking whatever follows it as the doer, never counting places along the line.',
    ],
    scenes: [
      {
        key: 'fafaga',
        tiles: {
          sa: [face('Sā', 'tense')],
          verb: [face('fafaga', 'verb')],
          doer: [face('e le tama', 'noun', 'the doer')],
          done: [face('le moa', 'noun', 'the one it happened to')],
        },
        before: { say: 'Sā fafaga e le tama le moa.', en: 'The boy fed the hen.' },
        after: { say: 'Sā fafaga le moa e le tama.', en: 'The boy fed the hen.' },
        states: [
          [['sa', 0], ['verb', 0], ['doer', 0], ['done', 0]],
          [['sa', 0], ['verb', 0], ['done', 0], ['doer', 0]],
        ],
        beats: [{ kind: 'move', tile: 'doer', to: 1, arc: true }, { kind: 'en' }],
      },
    ],
  },
  {
    id: '28.2',
    kind: 'fork',
    types: ['fork-readings'],
    title: 'Position separates them every time',
    // After the paragraph that tells the two apart, before "The two words meet again".
    after: { section: 'the-agent-marker-e', block: b => b.type === 'p' && b.text.includes('Position separates') },
    lanes: [
      { label: 'the general particle', forms: [] },
      { label: 'the agent marker', forms: [] },
    ],
    alt: [
      '*E tausi pepe e le fafine.* The woman takes care of the babies.',
      'Position separates them every time: *e* in front of a bare verb is the general particle, and *e* in front of a noun after the verb is the agent marker.',
    ],
    scenes: [
      {
        key: 'tausi',
        cases: [
          {
            lane: 0, say: 'E tausi pepe e le fafine.', en: 'The woman takes care of the babies.',
            // The second e stays quiet in this lane; it takes its role and label when lane 1 lights.
            row: [{ ...face('E', 'tense', 'general particle'), reads: true }, { ...face('tausi', 'verb', 'bare verb'), ring: true }, face('pepe', 'noun'), face('e', 'quiet'), face('le fafine', 'noun')],
          },
          {
            lane: 1, say: 'E tausi pepe e le fafine.', en: 'The woman takes care of the babies.',
            row: [face('E', 'tense', 'general particle'), face('tausi', 'verb'), face('pepe', 'noun'), { ...face('e', 'marker', 'agent marker'), reads: true }, { ...face('le fafine', 'noun', 'noun after the verb'), ring: true }],
          },
        ],
      },
    ],
  },
  {
    id: '28.3',
    kind: 'fork',
    types: ['fork-readings'],
    title: 'The verb decides which reading the bare noun gets.',
    // After the paragraph that names the verb as the deciding word.
    after: { section: 'verbs-that-take-a-doer', block: b => b.type === 'p' && b.text.includes('decides which reading the bare noun gets') },
    lanes: [
      { label: 'the one who went', forms: [] },
      { label: 'the one the hitting happened to', forms: [] },
    ],
    alt: [
      '*Sā alu le teine.* The girl went.',
      '*Sā sasa le teine.* The girl was hit.',
      'The verb decides which reading the bare noun gets.',
    ],
    scenes: [
      {
        key: 'teine',
        cases: [
          {
            lane: 0, say: 'Sā alu le teine.', en: 'The girl went.',
            row: [face('Sā', 'tense'), { ...face('alu', 'verb'), ring: true }, { ...face('le teine', 'noun'), reads: true }],
          },
          {
            lane: 1, say: 'Sā sasa le teine.', en: 'The girl was hit.',
            row: [face('Sā', 'tense'), { ...face('sasa', 'verb'), ring: true }, { ...face('le teine', 'noun'), reads: true }],
          },
        ],
      },
    ],
  },
  {
    id: '28.4',
    kind: 'row',
    types: ['drop'],
    title: 'What is gone from the second one?',
    caption: 'The doer has gone, and nothing has moved in to fill the gap: the verb keeps its shape, no word has been added, and the box still stands bare after the verb.',
    // After the paragraph that answers the question, before the table "The same subtraction".
    after: { section: 'leaving-the-doer-out', block: b => b.type === 'p' && b.text.includes('nothing has moved in to fill the gap') },
    alt: [
      '*Sā tatala e le teine le pusa.* The girl opened the box.',
      '*Sā tatala le pusa.* The box was opened.',
      'The doer has gone, and nothing has moved in to fill the gap: the verb keeps its shape, no word has been added, and the box still stands bare after the verb.',
      '*Sā fafaga e le tama le moa.* The boy fed the hen.',
      '*Sā fafaga le moa.* The hen was fed.',
      'The agent phrase is never required in the first place, because a verb of this kind needs only the one the action happened to.',
    ],
    scenes: [
      dropDoer('tatala', 'Sā', 'tatala', 'e le teine', 'le pusa',
        { say: 'Sā tatala e le teine le pusa.', en: 'The girl opened the box.' },
        { say: 'Sā tatala le pusa.', en: 'The box was opened.' }),
      // The figure's caption names the box, so the hen scene carries its own caption.
      {
        ...dropDoer('fafaga', 'Sā', 'fafaga', 'e le tama', 'le moa',
          { say: 'Sā fafaga e le tama le moa.', en: 'The boy fed the hen.' },
          { say: 'Sā fafaga le moa.', en: 'The hen was fed.' }),
        caption: 'The agent phrase is never required in the first place, because a verb of this kind needs only the one the action happened to.',
      },
    ],
  },
]
