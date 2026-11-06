// Chapter 26: The Possessive System in Full. Two rows.
// 26.1 turns laʻu into aʻu in place: nothing is added for the plural.
// 26.2 drops le in front of the pronoun owner and keeps its place drawn empty.
// The control rule (a or o) is left without a figure: ch26-pick-owner-after-thing quizzes the
// same radio and house, and the book hedges the rule ("sorts most of the language").
// The son pair (a le fafine / o le tamāloa) is left without a figure: ch26-pick-family-a-o
// quizzes those two sentences in the same section.
const face = (text, role, label) => (label != null ? { text, role, label } : { text, role })

export const FIGURES = [
  {
    id: '26.1',
    kind: 'row',
    title: 'Nothing was added for the plural.',
    caption: 'The form itself changed, from *laʻu* to *aʻu*.',
    after: { section: 'the-four-sets-of-possessive-forms', block: b => b.type === 'p' && b.text.includes('Nothing was added for the plural.') },
    alt: [
      '*ʻO laʻu taʻavale.* My car.',
      '*ʻO aʻu taʻavale.* My cars.',
      'Nothing was added for the plural.',
      'The form itself changed, from *laʻu* to *aʻu*.',
    ],
    scenes: [
      {
        key: 'taavale',
        tiles: {
          o: [face('ʻO', 'marker', 'presenting particle')],
          pf: [face('laʻu', 'marker', 'possessive form'), face('aʻu', 'marker', 'possessive form')],
          n: [face('taʻavale', 'noun')],
        },
        before: { say: 'ʻO laʻu taʻavale.', en: 'My car.' },
        after: { say: 'ʻO aʻu taʻavale.', en: 'My cars.' },
        states: [[['o', 0], ['pf', 0], ['n', 0]], [['o', 0], ['pf', 1], ['n', 0]]],
        beats: [{ kind: 'swap', tile: 'pf', to: 1 }, { kind: 'en' }],
      },
    ],
  },
  {
    id: '26.2',
    kind: 'row',
    title: 'Owners in Pairs and Groups',
    caption: 'The pronoun stays separate, and the article stands in front of it: *le* for one thing, and nothing at all for more than one.',
    after: { section: 'owners-in-pairs-and-groups', block: b => b.type === 'p' && b.text.includes('The pronoun stays separate') },
    alt: [
      '*ʻO le mātou fale.* Our house. (Lit. "the our house")',
      '*ʻO mātou fale.* Our houses.',
      'The pronoun stays separate, and the article stands in front of it: *le* for one thing, and nothing at all for more than one.',
    ],
    scenes: [
      {
        key: 'matou',
        tiles: {
          o: [face('ʻO', 'marker', 'presenting particle')],
          le: [face('le', 'marker', 'specific article')],
          p: [face('mātou', 'pronoun', 'pronoun')],
          n: [face('fale', 'noun')],
        },
        before: { say: 'ʻO le mātou fale.', en: 'Our house.' },
        after: { say: 'ʻO mātou fale.', en: 'Our houses.' },
        states: [[['o', 0], ['le', 0], ['p', 0], ['n', 0]], [['o', 0], ['GHOST', 0], ['p', 0], ['n', 0]]],
        beats: [{ kind: 'drop', tile: 'le', to: 1 }, { kind: 'en' }],
      },
      {
        key: 'la',
        tiles: {
          le: [face('le', 'marker', 'specific article')],
          p: [face('lā', 'pronoun', 'pronoun')],
          n: [face('ipu', 'noun')],
        },
        before: { say: 'le lā ipu', en: 'their cup (the two of them)' },
        after: { say: 'lā ipu', en: 'their cups (the two of them)' },
        states: [[['le', 0], ['p', 0], ['n', 0]], [['GHOST', 0], ['p', 0], ['n', 0]]],
        beats: [{ kind: 'drop', tile: 'le', to: 1 }, { kind: 'en' }],
      },
    ],
  },
  // 26.3 (rework, 2026-11-06): added last in the file so 26.1 and 26.2 keep their ids; it stands first
  // in reading order, in What Takes A and What Takes O. The thing decides the form: a kilt (clothes
  // worn) takes loʻu, a spoon (things got and used) takes laʻu. The sort Interactive places words in
  // bins; it never shows the possessive form following the sort. Placed after the sentence that states
  // the point, so the examples block stands between it and the sort Interactive at the section's end.
  {
    id: '26.3',
    kind: 'fork',
    title: 'The possessive forms follow the same sort they always have',
    caption: 'A kilt is worn, and clothes worn are *o*-words. A spoon is got and used, and things got and used are *a*-words.',
    after: { section: 'what-takes-a-and-what-takes-o', block: b => b.type === 'p' && b.text.includes('they always have') },
    alt: [
      'A kilt is worn, and clothes worn are *o*-words.',
      'A spoon is got and used, and things got and used are *a*-words.',
      '*ʻO loʻu ʻie.* My kilt.',
      '*ʻO laʻu sipuni.* My spoon.',
    ],
    lanes: [
      { label: 'clothes worn', forms: ['loʻu'] },
      { label: 'things got and used', forms: ['laʻu'] },
    ],
    scenes: [
      {
        key: 'ie-sipuni',
        cases: [
          {
            lane: 0,
            say: 'ʻO loʻu ʻie.',
            en: 'My kilt.',
            row: [
              face('ʻO', 'marker', 'presenting particle'),
              { slot: true, form: face('loʻu', 'marker', 'possessive form') },
              { ...face('ʻie', 'noun', 'the thing'), ring: true },
            ],
          },
          {
            lane: 1,
            say: 'ʻO laʻu sipuni.',
            en: 'My spoon.',
            row: [
              face('ʻO', 'marker', 'presenting particle'),
              { slot: true, form: face('laʻu', 'marker', 'possessive form') },
              { ...face('sipuni', 'noun', 'the thing'), ring: true },
            ],
          },
        ],
      },
    ],
  },
]
