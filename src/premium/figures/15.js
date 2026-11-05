const face = (text, role, label) => (label ? { text, role, label } : { text, role })

// The swap shows the one slot that changes while e, se and the noun hold still, which answers the
// book's own question ("Which word changed?") better than the two-state toggle it replaces.
export const REPLACES = ['ch15-there-is-or-none']

export const FIGURES = [
  {
    id: '15.1',
    kind: 'fork',
    types: ['fork-readings'],
    ownSlots: true,
    title: 'Same string, two jobs',
    // After the Note on sau, before the table of having sentences.
    after: { section: 'saying-what-you-have', block: b => b.type === 'note' && b.text.includes('Same string, two jobs') },
    lanes: [
      { label: 'the come-word', forms: [] },
      { label: 'possessive form', forms: [] },
    ],
    alt: [
      'This *sau* has the same shape as the word for "come" met earlier, as in the command *Sau* (come).',
      'Same string, two jobs: the come-word is the verb of its sentence, in the verb\'s place or alone as a command, while this one sits in front of a noun and says whose it is.',
      'What the word sits next to tells you which job it is doing.',
      '*E iai sau tusi?* Do you have a book?',
    ],
    scenes: [
      {
        key: 'sau',
        cases: [
          {
            lane: 0, say: 'Sau', en: 'come',
            row: [{ ...face('Sau', 'verb'), reads: true }],
          },
          {
            lane: 1, say: 'E iai sau tusi?', en: 'Do you have a book?',
            row: [
              face('E', 'tense', 'general particle'),
              face('iai', 'verb', 'there-is verb'),
              { ...face('sau', 'marker', 'possessive form'), reads: true },
              { ...face('tusi', 'noun'), ring: true },
            ],
          },
        ],
      },
    ],
  },
  {
    id: '15.2',
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
