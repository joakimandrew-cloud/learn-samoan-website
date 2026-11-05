const face = (text, role, label) => (label !== undefined ? { text, role, label } : { text, role })

export const REPLACES = ['ch32-comparison-steps']

export const FIGURES = [
  {
    id: '32.1',
    kind: 'row',
    title: 'The Comparative *Atu*',
    caption: 'No ending is added to the quality word: the degree arrives as a word standing after it, and *mālosi* is *mālosi* in both sentences above.',
    after: { section: 'the-comparative-atu', block: b => b.type === 'p' && b.text.includes('No ending is added to the quality word') },
    alt: [
      '*E mālosi le tama.* The boy is strong.',
      '*E mālosi atu le tama.* The boy is stronger.',
      'Set on a quality word it does a second job and raises the degree, so that *mālosi* is strong and *mālosi atu* is stronger.',
    ],
    scenes: [{
      key: 'malosi',
      tiles: {
        e: [face('E', 'tense', '')],
        malosi: [face('mālosi', 'verb', 'quality word')],
        atu: [face('atu', 'marker', 'direction word')],
        tama: [face('le tama', 'noun', '')],
      },
      before: { say: 'E mālosi le tama.', en: 'The boy is strong.' },
      after: { say: 'E mālosi atu le tama.', en: 'The boy is stronger.' },
      states: [
        [['e', 0], ['malosi', 0], ['tama', 0]],
        [['e', 0], ['malosi', 0], ['atu', 0], ['tama', 0]],
      ],
      beats: [{ kind: 'add', tile: 'atu', to: 1 }, { kind: 'en' }],
    }],
  },
  {
    id: '32.2',
    kind: 'row',
    title: 'Naming What You Compare With: *i lo*',
    caption: 'The thing measured against comes last, and *i lo* is the word that introduces it.',
    after: { section: 'naming-what-you-compare-with', block: b => b.type === 'p' && b.text.includes('The thing measured against comes last') },
    alt: [
      '*E mālosi atu le tama.* The boy is stronger.',
      '*E mālosi atu le tama i lo le teine.* The boy is stronger than the girl.',
      'Everything in front of it keeps the order it already had: tense particle, quality word, *atu*, then what the sentence is about, then *i lo* and its noun phrase.',
    ],
    scenes: [{
      key: 'teine',
      tiles: {
        e: [face('E', 'tense', '')],
        malosi: [face('mālosi', 'verb', 'quality word')],
        atu: [face('atu', 'marker', 'direction word')],
        tama: [face('le tama', 'noun', '')],
        ilo: [face('i lo', 'marker', 'than-word')],
        teine: [face('le teine', 'noun', '')],
      },
      before: { say: 'E mālosi atu le tama.', en: 'The boy is stronger.' },
      after: { say: 'E mālosi atu le tama i lo le teine.', en: 'The boy is stronger than the girl.' },
      states: [
        [['e', 0], ['malosi', 0], ['atu', 0], ['tama', 0]],
        [['e', 0], ['malosi', 0], ['atu', 0], ['tama', 0], ['ilo', 0], ['teine', 0]],
      ],
      beats: [{ kind: 'add', tile: ['ilo', 'teine'], to: 1 }, { kind: 'en' }],
    }],
  },
  {
    id: '32.3',
    kind: 'row',
    title: 'The two routes differ in where the degree sits',
    caption: 'The two routes differ in where the degree sits: on the quality word itself in the first pattern, and on *sili* in front of the clause in this one.',
    after: { section: 'the-most-and-the-best', block: b => b.type === 'p' && b.text.includes('The two routes differ in where the') },
    alt: [
      'That sentence compares the same two animals as *E mālosi atu le maile i lo le manulele.*',
      '*E sili atu ona mālosi le maile i lo le manulele.* The dog is stronger than the bird. (Lit. "It is more that the dog is strong than the bird.")',
      'The two routes differ in where the degree sits: on the quality word itself in the first pattern, and on *sili* in front of the clause in this one.',
    ],
    scenes: [{
      key: 'maile',
      tiles: {
        e: [face('E', 'tense', '')],
        sili: [face('sili', 'verb')],
        atu: [face('atu', 'marker', 'direction word')],
        ona: [face('ona', 'quiet')],
        malosi: [face('mālosi', 'verb', 'quality word')],
        maile: [face('le maile', 'noun', '')],
        ilo: [face('i lo', 'marker', 'than-word')],
        manulele: [face('le manulele', 'noun', '')],
      },
      before: { say: 'E mālosi atu le maile i lo le manulele.', en: null },
      after: { say: 'E sili atu ona mālosi le maile i lo le manulele.', en: 'The dog is stronger than the bird.' },
      states: [
        [['e', 0], ['malosi', 0], ['atu', 0], ['maile', 0], ['ilo', 0], ['manulele', 0]],
        [['e', 0], ['sili', 0], ['GHOST'], ['ona', 0], ['malosi', 0], ['atu', 0], ['maile', 0], ['ilo', 0], ['manulele', 0]],
        [['e', 0], ['sili', 0], ['atu', 0], ['ona', 0], ['malosi', 0], ['maile', 0], ['ilo', 0], ['manulele', 0]],
      ],
      // sili and ona land together with a gap open between them; then atu moves off the quality word
      // into the gap. No held frame reads as a sentence the book never prints (the in-between rule,
      // Step 9 batch 3).
      beats: [
        { kind: 'add', tile: ['sili', 'ona'], to: 1 },
        { kind: 'move', tile: 'atu', to: 2 },
        { kind: 'en' },
      ],
    }],
  },
]
