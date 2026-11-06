const face = (text, role, label) => (label ? { text, role, label } : { text, role })

export const REPLACES = ['ch11-house-meaning']

export const FIGURES = [
  {
    id: '11.1',
    kind: 'row',
    title: 'What happened to the meaning?',
    caption: 'One belonging word changed, from *a* to *o*.',
    after: { section: 'the-belonging-words-a-and-o', block: b => b.type === 'p' && b.text.includes('that word alone decides') },
    alt: [
      '*ʻO le fale a le tama.* The house the boy built. (Lit. "The house belonging to the boy")',
      '*ʻO le fale o le tama.* The boy\'s house (the house he lives in).',
      'The two sentences differ only in the belonging word, and that word alone decides which house is meant.',
    ],
    scenes: [{
      key: 'fale',
      tiles: {
        o: [face('ʻO', 'marker', 'presenting particle')],
        fale: [face('le fale', 'noun')],
        bw: [face('a', 'marker', 'belonging word'), face('o', 'marker', 'belonging word')],
        tama: [face('le tama', 'noun')],
      },
      before: { say: 'ʻO le fale a le tama.', en: 'The house the boy built.' },
      after: { say: 'ʻO le fale o le tama.', en: 'The boy\'s house (the house he lives in).' },
      states: [
        [['o', 0], ['fale', 0], ['bw', 0], ['tama', 0]],
        [['o', 0], ['fale', 0], ['bw', 1], ['tama', 0]],
      ],
      beats: [{ kind: 'swap', tile: 'bw', to: 1 }, { kind: 'en' }],
    }],
  },
  {
    id: '11.2',
    kind: 'fork',
    title: 'The thing decides the form',
    caption: 'Because a knife is an *a*-word, "my knife" is *laʻu naifi*. Because a head is an *o*-word, "my head" is *loʻu ulu*.',
    after: { section: 'my-your-and-her', block: b => b.type === 'table' && b.body.some(row => row[0].includes('lona lima')) },
    alt: [
      'Because a knife is an *a*-word, "my knife" is *laʻu naifi*.',
      'Because a head is an *o*-word, "my head" is *loʻu ulu*.',
    ],
    lanes: [
      { label: '*a*-words', forms: ['laʻu'] },
      { label: '*o*-words', forms: ['loʻu'] },
    ],
    scenes: [{
      key: 'my',
      cases: [
        {
          lane: 0,
          say: 'laʻu naifi',
          en: 'my knife',
          row: [{ slot: true, form: face('laʻu', 'marker', 'possessive form') }, { text: 'naifi', role: 'noun', ring: true, label: '*a*-word' }],
        },
        {
          lane: 1,
          say: 'loʻu ulu',
          en: 'my head',
          row: [{ slot: true, form: face('loʻu', 'marker', 'possessive form') }, { text: 'ulu', role: 'noun', ring: true, label: '*o*-word' }],
        },
      ],
    }],
  },
]
