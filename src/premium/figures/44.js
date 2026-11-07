const face = (text, role, label) => (label ? { text, role, label } : { text, role })

export const FIGURES = [
  {
    id: '44.1',
    kind: 'build',
    title: 'The verb of that clause usually takes its long form',
    caption: 'The rule is a preference and not a law: this is the shape you will usually hear and read in such a clause.',
    after: { section: 'when-the-doer-is-the-missing-word', block: b => b.type === 'p' && b.text.includes('becomes *fai=a*') },
    alt: ['*Fai* becomes *fai=a*.', '*ʻO tagata sā fai=a le puaʻa.* The people who were attending the pig. (Lit. "the people who were doing the pig")'],
    scenes: [{
      key: 'fai',
      role: 'verb',
      from: { say: 'fai', en: null },
      to: { say: 'fai=a', en: null },
      pieces: [{ text: 'fai' }, { text: '=a', added: true, label: 'ending' }],
    }],
  },
  {
    id: '44.2',
    kind: 'row',
    title: 'With some verbs the same clause is heard both ways',
    after: { section: 'the-thing-it-was-done-with', block: b => b.type === 'p' && b.text.includes('is one of them') },
    alt: ['*ʻO le mea ʻou te manaʻo ai.* The thing I want.', '*ʻO le mea ʻou te manaʻo ʻi ai.* The thing I want.'],
    scenes: [{
      key: 'manao',
      tiles: {
        mea: [face('ʻO le mea', 'quiet')],
        manao: [face('ʻou te manaʻo', 'quiet')],
        i: [face('ʻi', 'marker', 'place word')],
        ai: [face('ai', 'marker', 'pointing-back word')],
      },
      before: { say: 'ʻO le mea ʻou te manaʻo ai.', en: 'The thing I want.' },
      after: { say: 'ʻO le mea ʻou te manaʻo ʻi ai.', en: 'The thing I want.' },
      // The dashed place where ʻi will land is drawn from the start, as every pending slot is (polish round 2026-11-07).
      states: [[['mea', 0], ['manao', 0], ['GHOST'], ['ai', 0]], [['mea', 0], ['manao', 0], ['i', 0], ['ai', 0]]],
      beats: [{ kind: 'add', tile: 'i', to: 1 }, { kind: 'en' }],
    }],
  },
]
