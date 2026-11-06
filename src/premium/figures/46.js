const face = (text, role, label) => (label != null ? { text, role, label } : { text, role })

// The le-phrase keeps everything after the verb in place: only the one the
// event is about picks up the belonging word o, and E gives way to ʻO le.
const pointsAt = (key, verb, who, aim, before, after) => ({
  key,
  tiles: {
    e: [face('E', 'tense', '')],
    O: [face('ʻO', 'quiet')],
    le: [face('le', 'marker', 'the article')],
    v: [face(verb, 'verb')],
    o: [face('o', 'marker', 'belonging word')],
    who: [face(who, 'noun', '')],
    i: [face('ʻi', 'marker', 'place word')],
    aim: [face(aim, 'noun', '')],
  },
  before,
  after,
  states: [
    [['e', 0], ['v', 0], ['who', 0], ['i', 0], ['aim', 0]],
    [['GHOST'], ['v', 0], ['who', 0], ['i', 0], ['aim', 0]],
    [['GHOST'], ['v', 0], ['o', 0], ['who', 0], ['i', 0], ['aim', 0]],
    [['O', 0], ['le', 0], ['v', 0], ['o', 0], ['who', 0], ['i', 0], ['aim', 0]],
  ],
  beats: [
    { kind: 'drop', tile: 'e', to: 1 },
    { kind: 'add', tile: 'o', to: 2 },
    { kind: 'add', tile: ['O', 'le'], to: 3 },
    { kind: 'en' },
  ],
})

export const FIGURES = [
  {
    id: '46.1',
    kind: 'row',
    title: 'What the Event Points At',
    caption: 'That is the rule for these verbs in its clearest form: the one the event is about becomes a belonging phrase, and every other part keeps its own shape.',
    after: { section: 'what-the-event-points-at', block: b => b.type === 'p' && b.text.includes('The second line has done one thing to the first') },
    alt: [
      '*E alofa le tama ʻi le teine.* The boy cares for the girl.',
      '*ʻO le alofa o le tama ʻi le teine.* The boy caring for the girl.',
      'That is the rule for these verbs in its clearest form: the one the event is about becomes a belonging phrase, and every other part keeps its own shape.',
    ],
    scenes: [
      pointsAt('alofa', 'alofa', 'le tama', 'le teine',
        { say: 'E alofa le tama ʻi le teine.', en: 'The boy cares for the girl.' },
        { say: 'ʻO le alofa o le tama ʻi le teine.', en: 'The boy caring for the girl.' }),
      pointsAt('manao', 'manaʻo', 'le tama', 'le teine',
        { say: 'E manaʻo le tama ʻi le teine.', en: 'The boy wants the girl.' },
        { say: 'ʻO le manaʻo o le tama ʻi le teine.', en: 'The boy wanting the girl.' }),
      pointsAt('matamata', 'mātamata', 'le teine', 'le taʻavale',
        { say: 'E mātamata le teine ʻi le taʻavale.', en: 'The girl watches the car.' },
        { say: 'ʻO le mātamata o le teine ʻi le taʻavale.', en: 'The girl watching the car.' }),
    ],
  },
]
