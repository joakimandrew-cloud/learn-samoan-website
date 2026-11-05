const face = (text, role, label) => (label != null ? { text, role, label } : { text, role })
export const REPLACES = ['ch12-place-word-range']
export const FIGURES = [
  {
    id: '12.1',
    kind: 'row',
    title: 'The Place Word *ʻi*',
    caption: 'Put *ʻi* in front of a naming part for a place and the sentence gains a where.',
    after: { section: 'the-place-word-i', block: b => b.type === 'p' && b.text.includes('that is the') && b.text.includes('order to build with first') },
    alt: [
      'Each of these sentences is one you could already build, with one part added at the end: a place.',
      '*Sā ʻou alu ʻi le nuʻu.* I went to the village.',
      'It comes after the verb and its subject, at the end, and that is the order to build with first.',
    ],
    scenes: [{
      key: 'nuu',
      tiles: {
        sa: [face('Sā', 'tense')],
        ou: [face('ʻou', 'pronoun')],
        alu: [face('alu', 'verb')],
        i: [face('ʻi', 'marker', 'place word')],
        nuu: [face('le nuʻu', 'noun')],
      },
      before: { say: 'Sā ʻou alu', en: 'I went' },
      after: { say: 'Sā ʻou alu ʻi le nuʻu.', en: 'I went to the village.' },
      states: [
        [['sa', 0], ['ou', 0], ['alu', 0]],
        [['sa', 0], ['ou', 0], ['alu', 0], ['i', 0]],
        [['sa', 0], ['ou', 0], ['alu', 0], ['i', 0], ['nuu', 0]],
      ],
      beats: [{ kind: 'add', tile: 'i', to: 1 }, { kind: 'add', tile: 'nuu', to: 2 }, { kind: 'en' }],
    }],
  },
  {
    id: '12.2',
    kind: 'fork',
    title: 'The place word does not change from one English meaning to the next.',
    caption: 'In the sentences here the verb in front of it decides whether *ʻi* lands in English as "in", "at", "to", or "into". The place named can decide as well, and where neither settles it, the rest of what is being said does.',
    after: { section: 'the-place-word-i', block: b => b.type === 'p' && b.text.includes('stands where English uses a whole handful of words') },
    alt: [
      'The one word *ʻi* stands where English uses a whole handful of words.',
      'The place word does not change from one English meaning to the next.',
      'In the sentences here the verb in front of it decides whether *ʻi* lands in English as "in", "at", "to", or "into".',
    ],
    lanes: [{ label: 'in' }, { label: 'to' }, { label: 'into' }],
    scenes: [
      {
        key: 'fale',
        cases: [
        {
          lane: 0,
          say: 'Sā nofo le tama ʻi le fale.',
          en: 'The boy stayed in the house.',
          row: [
            face('Sā', 'tense'),
            { text: 'nofo', role: 'verb', label: 'verb of staying', ring: true },
            face('le tama', 'noun'),
            { text: 'ʻi', role: 'marker', label: 'place word', reads: true },
            face('le fale', 'noun'),
          ],
        },
        {
          lane: 1,
          say: 'Sā lele le ʻāgelu ʻi le nuʻu.',
          en: 'The angel flew to the village.',
          row: [
            face('Sā', 'tense'),
            { text: 'lele', role: 'verb', label: 'verb of moving', ring: true },
            face('le ʻāgelu', 'noun'),
            { text: 'ʻi', role: 'marker', label: 'place word', reads: true },
            face('le nuʻu', 'noun'),
          ],
        },
        ],
      },
      {
        key: 'laau',
        cases: [
        {
          lane: 0,
          say: 'Sā nofo le pusi ʻi le lāʻau.',
          en: 'The cat stayed in the tree.',
          row: [
            face('Sā', 'tense'),
            { text: 'nofo', role: 'verb', label: 'verb of staying', ring: true },
            face('le pusi', 'noun'),
            { text: 'ʻi', role: 'marker', label: 'place word', reads: true },
            face('le lāʻau', 'noun'),
          ],
        },
        {
          lane: 2,
          say: 'Sā oso le pusi ʻi le lāʻau.',
          en: 'The cat jumped into the tree.',
          row: [
            face('Sā', 'tense'),
            { text: 'oso', role: 'verb', label: 'verb of moving', ring: true },
            face('le pusi', 'noun'),
            { text: 'ʻi', role: 'marker', label: 'place word', reads: true },
            face('le lāʻau', 'noun'),
          ],
        },
        ],
      },
    ],
  },
]
