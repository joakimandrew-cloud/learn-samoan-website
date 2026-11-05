const face = (text, role, label) => (label ? { text, role, label } : { text, role })

// The swap shows the one slot that changes while e, se and the noun hold still, which answers the
// book's own question ("Which word changed?") better than the two-state toggle it replaces.
export const REPLACES = ['ch15-there-is-or-none']

export const FIGURES = [
  {
    id: '15.1',
    kind: 'row',
    title: 'Compare them. Which word changed?',
    caption: 'Only the verb. *Iai* became *leai*, and "there is" became "there is not".',
    after: { section: 'the-there-is-none-verb-leai', block: b => b.type === 'p' && b.text.includes('Only the verb.') },
    alt: [
      '*E iai se tusi.* There is a book.',
      '*E leai se tusi.* There is no book.',
      'Only the verb.',
      '*Iai* became *leai*, and "there is" became "there is not".',
    ],
    scenes: [
      {
        key: 'tusi',
        tiles: {
          e: [face('E', 'tense', 'general particle')],
          v: [face('iai', 'verb', 'there-is verb'), face('leai', 'verb', 'there-is-none verb')],
          se: [face('se', 'marker', 'non-specific article')],
          n: [face('tusi', 'noun')],
        },
        before: { say: 'E iai se tusi.', en: 'There is a book.' },
        after: { say: 'E leai se tusi.', en: 'There is no book.' },
        states: [[['e', 0], ['v', 0], ['se', 0], ['n', 0]], [['e', 0], ['v', 1], ['se', 0], ['n', 0]]],
        beats: [{ kind: 'swap', tile: 'v', to: 1 }, { kind: 'en' }],
      },
      {
        key: 'fana',
        tiles: {
          e: [face('E', 'tense', 'general particle')],
          v: [face('iai', 'verb', 'there-is verb'), face('leai', 'verb', 'there-is-none verb')],
          se: [face('se', 'marker', 'non-specific article')],
          n: [face('fana', 'noun')],
        },
        before: { say: 'E iai se fana.', en: 'There is a gun.' },
        after: { say: 'E leai se fana.', en: 'There is no gun.' },
        states: [[['e', 0], ['v', 0], ['se', 0], ['n', 0]], [['e', 0], ['v', 1], ['se', 0], ['n', 0]]],
        beats: [{ kind: 'swap', tile: 'v', to: 1 }, { kind: 'en' }],
      },
    ],
  },
]
