// Chapter 45: Time Expressions. Every string is copied from book/Chapter-45.md.
const face = (text, role, label) => (label != null ? { text, role, label } : { text, role })

// 45.1 shows the since-clause travelling whole to the far side of the main clause, the point the
// toggle made by swapping two printed lines; the move keeps the clause one unit and the rest still.
export const REPLACES = ['ch45-since-position']

export const FIGURES = [
  {
    id: '45.1',
    kind: 'row',
    title: 'Where the Since-Clause Stands',
    caption: 'The same two clauses, in the other order.',
    after: { section: 'where-the-since-clause-stands', block: b => b.type === 'p' && b.text.includes('The same two clauses, in the other order') },
    alt: [
      '*Talu ona ʻou sau ʻou te leʻi maua se mea lelei.* Since I came, I have not got anything good.',
      '*ʻOu te leʻi maua se mea lelei talu ona ʻou sau.* I have not got anything good since I came.',
      'The same two clauses, in the other order.',
    ],
    scenes: [{
      key: 'sau',
      tiles: {
        talu: [face('Talu', 'marker', 'the since-word'), face('talu', 'marker', 'the since-word')],
        clause: [face('ona ʻou sau', 'quiet')],
        main: [face('ʻou te leʻi maua se mea lelei', 'quiet', 'the main clause'), face('ʻOu te leʻi maua se mea lelei', 'quiet', 'the main clause')],
      },
      before: { say: 'Talu ona ʻou sau ʻou te leʻi maua se mea lelei.', en: 'Since I came, I have not got anything good.' },
      after: { say: 'ʻOu te leʻi maua se mea lelei talu ona ʻou sau.', en: 'I have not got anything good since I came.' },
      states: [
        [['talu', 0], ['clause', 0], ['main', 0]],
        [['main', 1], ['talu', 1], ['clause', 0]],
      ],
      beats: [{ kind: 'move', tile: ['talu', 'clause'], roll: 'main', to: 1 }, { kind: 'en' }],
    }],
  },
  {
    id: '45.2',
    kind: 'row',
    title: 'What follows it comes in two shapes.',
    caption: 'One puts the main predication on the but-word *ʻae*.',
    after: { section: 'the-le-phrase-at-the-head-of-a-sentence', block: b => b.type === 'p' && b.text.includes('What follows it comes in two shapes') },
    alt: [
      '*ʻO le vivini a moa, e ʻāmata sāuni ai faiva.* When the roosters crow, people begin preparing for fishing trips. (Lit. "The crowing of the fowls, begin prepare then fishing trips.")',
      '*ʻO le vivini a moa, ʻae ʻāmata le pese.* When the roosters crow, the song begins. (Lit. "The crowing of the fowls, but begins the song.")',
      'What follows it comes in two shapes.',
      'One puts the main predication on the but-word *ʻae*.',
    ],
    scenes: [{
      key: 'vivini',
      tiles: {
        o: [face('ʻO', 'marker', 'presenting particle')],
        phrase: [face('le vivini a moa,', 'quiet', 'the fronted le-phrase')],
        p: [face('e', 'tense'), face('ʻae', 'marker', 'but-word')],
        amata: [face('ʻāmata', 'verb', '')],
        rest: [face('sāuni ai faiva', 'quiet'), face('le pese', 'quiet')],
      },
      before: { say: 'ʻO le vivini a moa, e ʻāmata sāuni ai faiva.', en: 'When the roosters crow, people begin preparing for fishing trips.' },
      after: { say: 'ʻO le vivini a moa, ʻae ʻāmata le pese.', en: 'When the roosters crow, the song begins.' },
      states: [
        [['o', 0], ['phrase', 0], ['p', 0], ['amata', 0], ['rest', 0]],
        [['o', 0], ['phrase', 0], ['p', 1], ['amata', 0], ['rest', 1]],
      ],
      beats: [{ kind: 'swap', tile: ['p', 'rest'], to: 1 }, { kind: 'en' }],
    }],
  },
  {
    id: '45.3',
    kind: 'row',
    title: '*Soʻo* means "often", and it stands behind the verb it is about.',
    caption: 'The second of those is an ordinary sentence, with the general particle at the front and *soʻo* in the same place, straight behind the verb.',
    after: { section: 'saying-how-often', block: b => b.type === 'p' && b.text.includes('The second of those is an ordinary sentence') },
    alt: [
      '*le talatalanoa soʻo o oʻu mātua*. the frequent talking of my parents',
      '*E talatalanoa soʻo oʻu mātua.* My parents talk often.',
      'The second of those is an ordinary sentence, with the general particle at the front and *soʻo* in the same place, straight behind the verb.',
    ],
    scenes: [{
      key: 'talatalanoa',
      tiles: {
        le: [face('le', 'marker', 'specific article'), face('E', 'tense', 'general particle')],
        verb: [face('talatalanoa', 'verb')],
        soo: [face('soʻo', 'quiet', 'often')],
        matua: [face('o oʻu mātua', 'noun'), face('oʻu mātua', 'noun')],
      },
      before: { say: 'le talatalanoa soʻo o oʻu mātua', en: 'the frequent talking of my parents' },
      after: { say: 'E talatalanoa soʻo oʻu mātua.', en: 'My parents talk often.' },
      states: [
        [['le', 0], ['verb', 0], ['soo', 0], ['matua', 0]],
        [['le', 1], ['verb', 0], ['soo', 0], ['matua', 1]],
      ],
      beats: [{ kind: 'swap', tile: ['le', 'matua'], to: 1 }, { kind: 'en' }],
    }],
  },
  {
    id: '45.4',
    kind: 'build',
    title: '*Taʻi=* goes on the front of a number word',
    caption: '*Taʻi=* goes on the front of a number word, and *tasi* is the word for one, so *taʻi=tasi* is one by one, one to each.',
    after: { section: 'saying-how-often', block: b => b.type === 'p' && b.text.includes('is one by one, one to each') },
    alt: [
      '*Taʻi=* goes on the front of a number word, and *tasi* is the word for one, so *taʻi=tasi* is one by one, one to each.',
    ],
    scenes: [{
      key: 'tasi',
      role: 'quiet',
      label: 'number word',
      from: { say: 'tasi', en: 'one' },
      to: { say: 'taʻi=tasi', en: 'one by one, one to each' },
      pieces: [{ text: 'taʻi=', added: true, label: 'prefix' }, { text: 'tasi' }],
    }],
  },
]
