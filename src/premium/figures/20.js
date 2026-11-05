const face = (text, role, label) => (label != null ? { text, role, label } : { text, role })

export const REPLACES = ['ch20-number-in-two-places']

export const FIGURES = [
  {
    id: '20.1',
    kind: 'row',
    title: 'Which words changed?',
    caption: 'Number now shows in two places: on the article slot, as before, and on the verb.',
    after: { section: 'the-verb-shows-number', block: b => b.type === 'p' && b.text.includes('Two words changed together') },
    alt: [
      '*Sā nofo le teine.* The girl stayed.',
      '*Sā nonofo teine.* The girls stayed.',
      'Number now shows in two places: on the article slot, as before, and on the verb.',
    ],
    scenes: [
      {
        key: 'teine',
        tiles: {
          sa: [face('Sā', 'tense', '')],
          v: [face('nofo', 'verb', 'singular verb'), face('nonofo', 'verb', 'plural verb')],
          le: [face('le', 'marker', 'article')],
          n: [face('teine', 'noun')],
        },
        before: { say: 'Sā nofo le teine.', en: 'The girl stayed.' },
        after: { say: 'Sā nonofo teine.', en: 'The girls stayed.' },
        states: [
          [['sa', 0], ['v', 0], ['le', 0], ['n', 0]],
          [['sa', 0], ['v', 0], ['GHOST', 0], ['n', 0]],
          [['sa', 0], ['v', 1], ['GHOST', 0], ['n', 0]],
        ],
        beats: [{ kind: 'drop', tile: 'le', to: 1 }, { kind: 'swap', tile: 'v', to: 2 }, { kind: 'en' }],
      },
      {
        key: 'puaa',
        tiles: {
          sa: [face('Sā', 'tense', '')],
          v: [face('nofo', 'verb', 'singular verb'), face('nonofo', 'verb', 'plural verb')],
          le: [face('le', 'marker', 'article')],
          n: [face('puaʻa', 'noun')],
        },
        before: { say: 'Sā nofo le puaʻa.', en: 'The pig stayed.' },
        after: { say: 'Sā nonofo puaʻa.', en: 'The pigs stayed.' },
        states: [
          [['sa', 0], ['v', 0], ['le', 0], ['n', 0]],
          [['sa', 0], ['v', 0], ['GHOST', 0], ['n', 0]],
          [['sa', 0], ['v', 1], ['GHOST', 0], ['n', 0]],
        ],
        beats: [{ kind: 'drop', tile: 'le', to: 1 }, { kind: 'swap', tile: 'v', to: 2 }, { kind: 'en' }],
      },
    ],
  },
  {
    id: '20.2',
    kind: 'build',
    title: 'One way of building it is to double a piece of the singular',
    caption: 'There is no way to read the plural form off the singular, so each plural is learned with its word.',
    after: { section: 'learning-each-plural-form', block: b => b.type === 'p' && b.text.includes('The pair *uliuli* and *uli* runs the other way') },
    alt: [
      'One way of building it is to double a piece of the singular, the way *nofo* doubles its first part to make *nonofo*:',
      'There is no way to read the plural form off the singular, so each plural is learned with its word.',
    ],
    scenes: [
      {
        key: 'nofo',
        role: 'verb',
        from: { say: 'nofo', en: 'one person stays' },
        to: { say: 'nonofo', en: 'several stay' },
        pieces: [{ text: 'no' }, { text: 'no', added: true, of: 0 }, { text: 'fo' }],
      },
    ],
  },
  {
    id: '20.3',
    kind: 'fork',
    title: 'Plural Commands',
    caption: 'The words are the same command; only the number of the listeners changes, and the verb changes shape to match.',
    after: { section: 'plural-commands', block: b => b.type === 'p' && b.text.includes('The words are the same command') },
    alt: [
      '*Nofo.* Sit down. (to one person)',
      '*Nonofo.* Sit down. (to several people)',
      'The words are the same command; only the number of the listeners changes, and the verb changes shape to match.',
    ],
    lanes: [
      { label: 'to one person', forms: ['Nofo'] },
      { label: 'to several people', forms: ['Nonofo'] },
    ],
    scenes: [
      {
        key: 'nofo',
        cases: [
          { lane: 0, say: 'Nofo.', en: 'Sit down.', row: [{ slot: true, form: face('Nofo', 'verb') }] },
          { lane: 1, say: 'Nonofo.', en: 'Sit down.', row: [{ slot: true, form: face('Nonofo', 'verb') }] },
        ],
      },
    ],
  },
]
