// Chapter 6's figures, as data (plan 2026-11-06-chapter-page-simplify). Every Sāmoan and
// English string here is copied from book/Chapter-06.md, every macron and ʻ kept; titles,
// captions, labels and text alternatives are phrases the book prints. Rich strings mark
// Sāmoan with *asterisks*. This file carries no colour, size, style or class.
// npm run check:figures -- 6 holds it to the book.

const face = (text, role, label) => (label ? { text, role, label } : { text, role })

// The two toggles are replaced: Figure 6.1 shows which two words leave the statement, the
// answer to the book's own question, and Figure 6.3 shows the urging word landing straight
// after the verb, with both urging words the section teaches.
export const REPLACES = ['ch6-statement-to-command', 'ch6-urging-word']

const urge = (key, word, en) => ({
  key,
  tiles: {
    nofo: [face('Nofo', 'verb')],
    urge: [face(word, 'marker', 'urging word')],
  },
  before: { say: 'Nofo.', en: 'Sit down.' },
  after: { say: `Nofo ${word}.`, en },
  states: [[['nofo', 0]], [['nofo', 0], ['urge', 0]]],
  beats: [{ kind: 'add', tile: 'urge', to: 1 }, { kind: 'en' }],
})

export const FIGURES = [
  {
    id: '6.1',
    kind: 'row',
    types: ['drop'],
    title: 'What is gone from the second?',
    caption: 'What remains is the bare verb, and the bare verb is the command.',
    after: { section: 'the-command', block: b => b.type === 'p' && b.text.includes('Two words are gone') },
    alt: [
      '*Sā ia nofo.* She stayed.',
      '*Nofo.* Sit down.',
      'Two words are gone: the past particle *sā* and the preverbal pronoun *ia*.',
    ],
    scenes: [
      {
        key: 'nofo',
        tiles: {
          sa: [face('Sā', 'tense', 'past particle')],
          ia: [face('ia', 'pronoun')],
          nofo: [face('nofo', 'verb'), face('Nofo', 'verb')],
        },
        before: { say: 'Sā ia nofo.', en: 'She stayed.' },
        after: { say: 'Nofo.', en: 'Sit down.' },
        states: [
          [['sa', 0], ['ia', 0], ['nofo', 0]],
          [['ia', 0], ['nofo', 0]],
          [['nofo', 1]],
        ],
        beats: [{ kind: 'drop', tile: 'sa', to: 1 }, { kind: 'drop', tile: 'ia', roll: 'nofo', to: 2 }, { kind: 'en' }],
      },
    ],
  },
  {
    id: '6.2',
    kind: 'row',
    types: ['add'],
    title: 'Commands with a Describing Word',
    caption: 'The describing word sits after the verb in a command, the same position it takes in a statement.',
    after: { section: 'commands-with-a-describing-word', block: b => b.type === 'p' && b.text.includes('presses for speed') },
    alt: [
      '*Nofo.* Sit down.',
      '*Nofo vave.* Sit down at once.',
      'The describing word sits after the verb in a command, the same position it takes in a statement.',
    ],
    scenes: [
      {
        key: 'vave',
        tiles: {
          nofo: [face('Nofo', 'verb')],
          vave: [face('vave', 'verb', 'describing word')],
        },
        before: { say: 'Nofo.', en: 'Sit down.' },
        after: { say: 'Nofo vave.', en: 'Sit down at once.' },
        states: [[['nofo', 0]], [['nofo', 0], ['vave', 0]]],
        beats: [{ kind: 'add', tile: 'vave', to: 1 }, { kind: 'en' }],
      },
    ],
  },
  {
    id: '6.3',
    kind: 'row',
    types: ['add'],
    title: 'The Urging Words *Ia* and *ʻEa*',
    caption: 'These words add force or friendliness; the command is complete without them.',
    after: { section: 'the-urging-words-ia-and-ea', block: b => b.type === 'p' && b.text.includes('add force or friendliness') },
    alt: [
      '*Nofo.* Sit down.',
      '*Nofo ia.* Do sit down, then.',
      '*Nofo ʻea.* Do sit down.',
      'These words add force or friendliness; the command is complete without them.',
    ],
    scenes: [urge('ia', 'ia', 'Do sit down, then.'), urge('ea', 'ʻea', 'Do sit down.')],
  },
]
