const face = (text, role, label) => (label != null ? { text, role, label } : { text, role })

export const FIGURES = [
  {
    id: '23.1',
    kind: 'row',
    title: 'Where does the number *tolu* stand?',
    caption: 'It stands exactly where *mālosi* stands, in the place a verb takes.',
    after: { section: 'counting-things', block: b => b.type === 'p' && b.text.includes('It stands exactly where') },
    alt: [
      '*E mālosi le tama.* The boy is strong.',
      '*E tolu tama.* There are three boys.',
      'It stands exactly where *mālosi* stands, in the place a verb takes.',
      'Notice that the noun carries no article: a particular plural drops *le*, exactly as it did when you first met plurals earlier in this book, so *tama e tolu* is "the three boys", not "three of some boys".',
    ],
    scenes: [{
      key: 'tolu',
      tiles: {
        e: [face('E', 'tense', 'general particle')],
        verb: [face('mālosi', 'verb'), face('tolu', 'verb')],
        le: [face('le', 'quiet')],
        tama: [face('tama', 'noun')],
      },
      before: { say: 'E mālosi le tama.', en: 'The boy is strong.' },
      after: { say: 'E tolu tama.', en: 'There are three boys.' },
      states: [
        [['e', 0], ['verb', 0], ['le', 0], ['tama', 0]],
        [['e', 0], ['verb', 0], ['GHOST'], ['tama', 0]],
        [['e', 0], ['verb', 1], ['tama', 0]],
      ],
      // le leaves its place open, then tolu turns over where mālosi stood and the gap closes: no
      // held frame reads as a sentence the book never prints (the in-between rule, Step 9 batch 3).
      beats: [{ kind: 'drop', tile: 'le', to: 1 }, { kind: 'swap', tile: 'verb', to: 2 }, { kind: 'en' }],
    }],
  },
  {
    id: '23.2',
    kind: 'row',
    title: 'Naming a Number of Things',
    caption: 'The noun keeps its plain shape and the number does the counting.',
    after: { section: 'counting-things', block: b => b.type === 'p' && b.text.includes('The noun keeps its plain shape') },
    alt: [
      '*E tolu tama.* There are three boys.',
      '*Tama e tolu* is "the three boys", built as "boys that are three": the piece *e tolu* is a number acting as a verb, set in behind the noun to describe it.',
    ],
    scenes: [{
      key: 'tama',
      tiles: {
        tama: [face('tama', 'noun'), face('Tama', 'noun')],
        e: [face('E', 'tense', 'general particle'), face('e', 'tense', 'general particle')],
        tolu: [face('tolu', 'verb')],
      },
      before: { say: 'E tolu tama.', en: 'There are three boys.' },
      after: { say: 'tama e tolu', en: 'the three boys' },
      states: [
        [['e', 0], ['tolu', 0], ['tama', 0]],
        [['tama', 0], ['e', 1], ['tolu', 0]],
      ],
      beats: [{ kind: 'move', tile: 'tama', roll: 'e', to: 1 }, { kind: 'en' }],
    }],
  },
  {
    id: '23.3',
    kind: 'build',
    title: '*fia* becomes *toʻafia*',
    caption: 'The how-many word takes the prefix in the same way when what you ask about is people: *fia* becomes *toʻafia*.',
    after: { section: 'counting-people', block: b => b.type === 'p' && b.text.includes('becomes *toʻafia*') },
    alt: [
      'The how-many word takes the prefix in the same way when what you ask about is people: *fia* becomes *toʻafia*.',
    ],
    scenes: [{
      key: 'toafia',
      role: 'verb',
      label: 'how-many word',
      from: { say: 'fia', en: null },
      to: { say: 'toʻafia', en: null },
      pieces: [{ text: 'toʻa', added: true, label: 'prefix' }, { text: 'fia' }],
    }],
  },
  {
    id: '23.4',
    kind: 'row',
    title: 'The two forms mean the same thing; only their place changes.',
    caption: '"First" has a second form, *uluaʻi*, which stands in front of the noun instead: *le uluaʻi tama* is also "the first boy".',
    after: { section: 'putting-things-in-order', block: b => b.type === 'p' && b.text.includes('only their place changes') },
    alt: [
      '"First" has a second form, *uluaʻi*, which stands in front of the noun instead: *le uluaʻi tama* is also "the first boy".',
      'The two forms mean the same thing; only their place changes.',
    ],
    scenes: [{
      key: 'uluai',
      tiles: {
        le: [face('le', 'quiet')],
        tama: [face('tama', 'noun')],
        muamua: [face('muamua', 'marker', 'first')],
        uluai: [face('uluaʻi', 'marker', 'first')],
      },
      before: { say: 'le tama muamua', en: 'the first boy' },
      after: { say: 'le uluaʻi tama', en: null },
      states: [
        [['le', 0], ['tama', 0], ['muamua', 0]],
        [['le', 0], ['tama', 0]],
        [['le', 0], ['uluai', 0], ['tama', 0]],
      ],
      beats: [{ kind: 'drop', tile: 'muamua', to: 1 }, { kind: 'add', tile: 'uluai', to: 2 }],
    }],
  },
]
