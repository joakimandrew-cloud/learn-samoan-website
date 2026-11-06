// Chapter 41: modifiers in depth. Every string is copied from book/Chapter-41.md.
const face = (text, role, label) => (label != null ? { text, role, label } : { text, role })

export const REPLACES = ['ch41-description-position', 'ch41-description-number']

export const FIGURES = [
  {
    id: '41.1',
    kind: 'row',
    title: 'Compare the two lines. Where did *uliuli* go, and what did it stop doing?',
    caption: 'It moved in behind the name of the thing, and it stopped being the whole statement.',
    after: { section: 'the-describing-verb-after-a-noun', block: b => b.type === 'p' && b.text.includes('It moved in behind the name of the thing') },
    alt: [
      '*E uliuli le taʻavale.* The car is black.',
      '*le taʻavale uliuli*. the black car (Lit. "the car black")',
      'It moved in behind the name of the thing, and it stopped being the whole statement.',
    ],
    scenes: [{
      key: 'uliuli',
      tiles: {
        e: [face('E', 'tense', 'general particle')],
        uliuli: [face('uliuli', 'verb', 'describing verb')],
        le: [face('le', 'marker', 'article')],
        taavale: [face('taʻavale', 'noun')],
      },
      before: { say: 'E uliuli le taʻavale.', en: 'The car is black.' },
      after: { say: 'le taʻavale uliuli', en: 'the black car' },
      states: [
        [['e', 0], ['uliuli', 0], ['le', 0], ['taavale', 0]],
        [['GHOST'], ['uliuli', 0], ['le', 0], ['taavale', 0]],
        [['le', 0], ['taavale', 0], ['uliuli', 0]],
      ],
      beats: [{ kind: 'drop', tile: 'e', to: 1 }, { kind: 'move', tile: 'uliuli', to: 2 }, { kind: 'en' }],
    }],
  },
  {
    id: '41.2',
    kind: 'row',
    title: 'Plural Describing Verbs After a Noun',
    caption: 'More than one is *pusi uli*, with the plural *uli* in the describing slot and the plural of the noun marked by leaving the article off.',
    after: { section: 'plural-describing-verbs-after-a-noun', block: b => b.type === 'p' && b.text.includes('One cat is *le pusi uliuli*') },
    alt: [
      '*le pusi uliuli*. the black cat',
      '*pusi uli*. black cats',
      'One cat is *le pusi uliuli*. More than one is *pusi uli*, with the plural *uli* in the describing slot and the plural of the noun marked by leaving the article off.',
    ],
    scenes: [{
      key: 'pusi',
      tiles: {
        le: [face('le', 'marker', 'article')],
        pusi: [face('pusi', 'noun')],
        uli: [face('uliuli', 'verb', 'describing verb'), face('uli', 'verb', 'describing verb')],
      },
      before: { say: 'le pusi uliuli', en: 'the black cat' },
      after: { say: 'pusi uli', en: 'black cats' },
      states: [
        [['le', 0], ['pusi', 0], ['uli', 0]],
        [['GHOST'], ['pusi', 0], ['uli', 0]],
        [['GHOST'], ['pusi', 0], ['uli', 1]],
      ],
      beats: [{ kind: 'drop', tile: 'le', to: 1 }, { kind: 'swap', tile: 'uli', to: 2 }, { kind: 'en' }],
    }],
  },
  {
    id: '41.3',
    kind: 'row',
    title: 'A pointing word comes after the describing verbs.',
    after: { section: 'describing-verbs-in-a-row', block: b => b.type === 'p' && b.text.includes('Put the presenting particle in front') },
    alt: [
      '*le pusa paʻepaʻe mānaia*. the nice white box',
      '*le pusa paʻepaʻe mānaia lenā*. that nice white box',
      '*ʻO le pusa paʻepaʻe mānaia lenā.* That is the nice white box.',
    ],
    scenes: [{
      key: 'pusa',
      tiles: {
        o: [face('ʻO', 'marker', 'presenting particle')],
        le: [face('le', 'marker', 'article')],
        pusa: [face('pusa', 'noun')],
        pae: [face('paʻepaʻe mānaia', 'verb', 'describing verbs')],
        lena: [face('lenā', 'marker', 'pointing word')],
      },
      before: { say: 'le pusa paʻepaʻe mānaia', en: 'the nice white box' },
      after: { say: 'ʻO le pusa paʻepaʻe mānaia lenā.', en: 'That is the nice white box.' },
      states: [
        [['le', 0], ['pusa', 0], ['pae', 0]],
        [['le', 0], ['pusa', 0], ['pae', 0], ['lena', 0]],
        [['o', 0], ['le', 0], ['pusa', 0], ['pae', 0], ['lena', 0]],
      ],
      beats: [{ kind: 'add', tile: 'lena', to: 1 }, { kind: 'add', tile: 'o', to: 2 }, { kind: 'en' }],
    }],
  },
  {
    id: '41.4',
    kind: 'build',
    title: 'The Endings *=gatā* and *=gōfie*',
    caption: '*Fai* is the verb for doing, so *faigatā* is difficult and *faigōfie* is easy.',
    after: { section: 'the-endings-gata-and-gofie', block: b => b.type === 'p' && b.text.includes('is the verb for doing, so') },
    alt: [
      'Sāmoan has two endings that build its difficult-words and easy-words.',
      '*Fai* is the verb for doing, so *faigatā* is difficult and *faigōfie* is easy.',
      '*Faʻalogo* is to listen, and *faʻalogogatā* is disobedient rather than hard to hear.',
      '*Mau* is to have plenty, and *maugatā* is mean rather than hard to have.',
    ],
    scenes: [
      {
        key: 'faigata',
        role: 'verb',
        from: { say: 'fai', en: 'do' },
        to: { say: 'faigatā', en: 'difficult' },
        pieces: [{ text: 'fai' }, { text: 'gatā', added: true, label: 'ending' }],
      },
      {
        key: 'faigofie',
        role: 'verb',
        from: { say: 'fai', en: 'do' },
        to: { say: 'faigōfie', en: 'easy' },
        pieces: [{ text: 'fai' }, { text: 'gōfie', added: true, label: 'ending' }],
      },
      {
        key: 'faalogogata',
        role: 'verb',
        caption: '*Faʻalogo* is to listen, and *faʻalogogatā* is disobedient rather than hard to hear.',
        from: { say: 'faʻalogo', en: 'listen, hear' },
        to: { say: 'faʻalogogatā', en: 'disobedient' },
        pieces: [{ text: 'faʻalogo' }, { text: 'gatā', added: true, label: 'ending' }],
      },
      {
        key: 'maugata',
        role: 'verb',
        caption: '*Mau* is to have plenty, and *maugatā* is mean rather than hard to have.',
        from: { say: 'mau', en: 'have plenty' },
        to: { say: 'maugatā', en: 'mean, tight-fisted' },
        pieces: [{ text: 'mau' }, { text: 'gatā', added: true, label: 'ending' }],
      },
    ],
  },
]
