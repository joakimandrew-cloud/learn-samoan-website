const face = (text, role, label) => (label != null ? { text, role, label } : { text, role })

// The le-phrase keeps everything after the verb in place: only the one the
// event is about picks up the belonging word o, and E gives way to ʻO le.
const pointsAt = (key, verb, who, aim, before, after) => ({
  key,
  tiles: {
    e: [face('E', 'tense', '')],
    O: [face('ʻO', 'marker', 'presenting particle')],
    le: [face('le', 'marker', 'the article')],
    v: [face(verb, 'verb')],
    o: [face('o', 'marker', 'belonging word')],
    who: [face(who, 'noun', '')],
    // A wrapped row breaks before ʻi, so ʻi le teine stands together on row 2 (polish round 2026-11-07).
    i: [{ ...face('ʻi', 'marker', 'place word'), breakBefore: true }],
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

// Hearing and seeing: only the belonging word turns over; the verb and the person hold still.
const senses = (key, verb, who, before, after) => ({
  key,
  tiles: {
    le: [face('le', 'marker', 'the article')],
    v: [face(verb, 'verb')],
    ao: [face('a', 'marker', 'belonging word'), face('o', 'marker', 'belonging word')],
    who: [face(who, 'noun', '')],
  },
  before,
  after,
  states: [
    [['le', 0], ['v', 0], ['ao', 0], ['who', 0]],
    [['le', 0], ['v', 0], ['ao', 1], ['who', 0]],
  ],
  beats: [{ kind: 'swap', tile: 'ao', to: 1 }, { kind: 'en' }],
})

export const REPLACES = ['ch46-intentional-hearing']

export const FIGURES = [
  {
    id: '46.1',
    kind: 'row',
    title: 'Hearing and Seeing',
    caption: 'Sāmoan uses the belonging word to say which kind of hearing or seeing is meant.',
    after: { section: 'hearing-and-seeing', block: b => b.type === 'p' && b.text.includes('makes her a doer, and a doer of hearing') },
    alt: [
      'The *a* on *le teine* makes her a doer, and a doer of hearing is someone listening on purpose.',
      'Swap the word for *o* and the hearing becomes something that merely happened to the person, an accident rather than a thing set out to be done.',
      'Sāmoan uses the belonging word to say which kind of hearing or seeing is meant.',
    ],
    scenes: [
      senses('faalogo', 'faʻalogo', 'le tama',
        { say: 'le faʻalogo a le tama', en: 'the boy\'s listening' },
        { say: 'le faʻalogo o le tama', en: 'the boy\'s hearing' }),
      senses('vaai', 'vaʻai', 'le teine',
        { say: 'le vaʻai a le teine', en: 'the girl\'s looking' },
        { say: 'le vaʻai o le teine', en: 'the girl\'s seeing' }),
    ],
  },
  {
    id: '46.2',
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
  {
    id: '46.3',
    kind: 'row',
    title: 'Compare them. Which word changed?',
    caption: 'With nobody named as the one it was done to, the doer may keep the agent marker *e* or take the belonging word *a* instead, and the sentence says the same either way.',
    after: { section: 'the-doer-that-keeps-e', block: b => b.type === 'p' && b.text.includes('Compare them. Which word changed?') },
    alt: [
      '*E faʻa=lē=lelei le faʻa=susu fagu e tinā palagi.* The palagi mothers\' feeding with bottles is not good.',
      '*E faʻa=lē=lelei le faʻa=susu fagu a tinā palagi.* The palagi mothers\' feeding with bottles is not good.',
      'With nobody named as the one it was done to, the doer may keep the agent marker *e* or take the belonging word *a* instead, and the sentence says the same either way.',
    ],
    scenes: [{
      key: 'fagu',
      tiles: {
        E: [face('E', 'tense', '')],
        lelei: [face('faʻa=lē=lelei', 'quiet')],
        le: [face('le', 'marker', 'the article')],
        v: [face('faʻa=susu fagu', 'verb')],
        ea: [face('e', 'marker', 'agent marker'), face('a', 'marker', 'belonging word')],
        who: [face('tinā palagi', 'noun', '')],
      },
      before: { say: 'E faʻa=lē=lelei le faʻa=susu fagu e tinā palagi.', en: 'The palagi mothers\' feeding with bottles is not good.' },
      after: { say: 'E faʻa=lē=lelei le faʻa=susu fagu a tinā palagi.', en: 'The palagi mothers\' feeding with bottles is not good.' },
      states: [
        [['E', 0], ['lelei', 0], ['le', 0], ['v', 0], ['ea', 0], ['who', 0]],
        [['E', 0], ['lelei', 0], ['le', 0], ['v', 0], ['ea', 1], ['who', 0]],
      ],
      beats: [
        { kind: 'swap', tile: 'ea', to: 1 },
        { kind: 'en' },
      ],
    }],
  },
]
