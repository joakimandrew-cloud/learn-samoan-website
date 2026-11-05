// Chapter 5: The Change and Future Particles. Two figures.
// 5.1 replaces the Interactive ch5-tense-line: the same sentence across all four particles,
// but the first slot turns over in place while ʻou and alu hold still, which is the point the
// book states ("Only the first word changes"). Titled with the section heading, since the
// book's swap sentence is about sā to ʻoleʻā and the two pasts do not differ in time.
// 5.2 is a Fork by meaning on maʻi: what you want to report picks the particle.
const face = (text, role, label) => (label != null ? { text, role, label } : { text, role })

export const REPLACES = ['ch5-tense-line']

export const FIGURES = [
  {
    id: '5.1',
    kind: 'row',
    types: ['swap'],
    title: 'The Four Tense Particles',
    caption: 'That first slot holds a tense particle, and with this chapter it can be filled four ways: the two pasts *sā* and *na*, the change particle *ʻua*, and the future *ʻoleʻā*.',
    // After the paragraph that states the swap, before the four-way table.
    after: { section: 'the-four-tense-particles', block: b => b.type === 'p' && b.text.includes('Only the first word changes') },
    alt: [
      '*Sā ʻou alu.*', 'I went (how things were: I was going, I used to go).',
      '*Na ʻou alu.*', 'I went (one trip, begun and finished).',
      '*ʻUa ʻou alu.*', 'I have gone.',
      '*ʻOleʻā ʻou alu.*', 'I will go.',
    ],
    chips: [
      { state: 0, sm: 'sā' },
      { state: 1, sm: 'na' },
      { state: 2, sm: 'ʻua' },
      { state: 3, sm: 'ʻoleʻā' },
    ],
    scenes: [{
      key: 'alu',
      tiles: {
        tp: [face('Sā', 'tense'), face('Na', 'tense'), face('ʻUa', 'tense'), face('ʻOleʻā', 'tense')],
        ou: [face('ʻou', 'pronoun')],
        alu: [face('alu', 'verb')],
      },
      lines: [
        { say: 'Sā ʻou alu.', en: 'I went (how things were: I was going, I used to go).' },
        { say: 'Na ʻou alu.', en: 'I went (one trip, begun and finished).' },
        { say: 'ʻUa ʻou alu.', en: 'I have gone.' },
        { say: 'ʻOleʻā ʻou alu.', en: 'I will go.' },
      ],
      states: [
        [['tp', 0], ['ou', 0], ['alu', 0]],
        [['tp', 1], ['ou', 0], ['alu', 0]],
        [['tp', 2], ['ou', 0], ['alu', 0]],
        [['tp', 3], ['ou', 0], ['alu', 0]],
      ],
      beats: [
        { kind: 'swap', tile: 'tp', to: 1 },
        { kind: 'swap', tile: 'tp', to: 2 },
        { kind: 'swap', tile: 'tp', to: 3 },
      ],
    }],
  },
  {
    id: '5.2',
    kind: 'fork',
    title: 'The two pasts and the change particle can all stand on the same state word.',
    caption: '*Na* reports the start as a past event, marked off by its limits. *ʻUa* reports that a change has happened and that something new is now the case.',
    // After the maʻi table, one paragraph before the Interactive ch5-state-and-change.
    after: { section: 'the-change-particle-ua', block: b => b.type === 'table' && JSON.stringify(b).includes('the start of the state') },
    alt: [
      '*Sā ʻou maʻi.*', 'I was sick (how things were).',
      '*Na ʻou maʻi.*', 'I fell sick (one event: the sickness began).',
      '*ʻUa ʻou maʻi.*', 'I have become sick.',
    ],
    lanes: [
      { label: 'the state, in the past', forms: ['sā'] },
      { label: 'the start of the state', forms: ['na'] },
      { label: 'the change', forms: ['ʻua'] },
    ],
    scenes: [{
      key: 'mai',
      cases: [
        { lane: 0, say: 'Sā ʻou maʻi.', en: 'I was sick (how things were).', row: [{ slot: true, form: face('Sā', 'tense') }, face('ʻou', 'pronoun'), face('maʻi', 'verb', 'state word')] },
        { lane: 1, say: 'Na ʻou maʻi.', en: 'I fell sick (one event: the sickness began).', row: [{ slot: true, form: face('Na', 'tense') }, face('ʻou', 'pronoun'), face('maʻi', 'verb', 'state word')] },
        { lane: 2, say: 'ʻUa ʻou maʻi.', en: 'I have become sick.', row: [{ slot: true, form: face('ʻUa', 'tense') }, face('ʻou', 'pronoun'), face('maʻi', 'verb', 'state word')] },
      ],
    }],
  },
]
