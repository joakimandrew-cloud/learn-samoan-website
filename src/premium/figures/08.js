// Chapter 8: The Naming Sentence. Every string is copied from book/Chapter-08.md.
const face = (text, role, label) => (label != null ? { text, role, label } : { text, role })

export const FIGURES = [
  {
    id: '8.1',
    kind: 'row',
    title: 'The word *ʻo* goes in front of the naming part that does the telling',
    caption: 'In *ʻO se uō le tama* the presenting particle marks *se uō*, so the sentence tells you that the boy is a friend, not that the friend is a boy.',
    after: { section: 'naming-without-a-verb', block: b => b.type === 'p' && b.text.includes('the presenting particle marks') },
    alt: [
      '*ʻO se uō le tama.* The boy is a friend. (Lit. "a friend, the boy")',
      'In *ʻO se uō le tama* the presenting particle marks *se uō*, so the sentence tells you that the boy is a friend, not that the friend is a boy.',
    ],
    scenes: [{
      key: 'uo-tama',
      tiles: {
        o: [face('ʻO', 'marker', 'presenting particle')],
        tell: [face('se uō', 'noun', 'the telling part'), face('se tama', 'noun', 'the telling part')],
        about: [face('le tama', 'noun', 'the part the sentence is about'), face('le uō', 'noun', 'the part the sentence is about')],
      },
      before: { say: 'ʻO se uō le tama.', en: 'The boy is a friend.' },
      after: { say: 'ʻO se tama le uō.', en: 'The friend is a boy.' },
      states: [[['o', 0], ['tell', 0], ['about', 0]], [['o', 0], ['tell', 1], ['about', 1]]],
      beats: [{ kind: 'swap', tile: ['tell', 'about'], to: 1 }, { kind: 'en' }],
    }],
  },
]
