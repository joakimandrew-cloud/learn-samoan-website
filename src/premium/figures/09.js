// Chapter 9: Who and What Questions. Every string is copied from book/Chapter-09.md.
const face = (text, role, label) => (label != null ? { text, role, label } : { text, role })

// The Fork below draws the same two printed questions as the grid, and adds what the grid
// cannot: the article's own slot in the what lane, and ai coloured as a pronoun, ā as a noun.
export const REPLACES = ['ch9-who-and-what']

export const FIGURES = [
  {
    id: '9.1',
    kind: 'row',
    title: 'When it is clear what the answer is about, the presented part can stand alone',
    caption: 'A who-question is answered with a naming sentence.',
    after: { section: 'asking-who', block: b => b.type === 'p' && b.text.includes('the presented part can stand alone') },
    alt: [
      '*ʻO ai lenā?* Who is that?',
      '*ʻO le teine.* The girl.',
    ],
    scenes: [{
      key: 'teine',
      tiles: {
        o: [face('ʻO', 'marker', 'presenting particle')],
        ask: [face('ai', 'pronoun', 'question word'), face('le teine', 'noun')],
        lena: [face('lenā', 'quiet')],
      },
      before: { say: 'ʻO ai lenā?', en: 'Who is that?' },
      after: { say: 'ʻO le teine.', en: 'The girl.' },
      states: [[['o', 0], ['ask', 0], ['lena', 0]], [['o', 0], ['ask', 1], ['lena', 0]], [['o', 0], ['ask', 1]]],
      beats: [{ kind: 'swap', tile: 'ask', to: 1 }, { kind: 'drop', tile: 'lena', to: 2 }, { kind: 'en' }],
    }],
  },
  {
    id: '9.2',
    kind: 'fork',
    ownSlots: true,
    title: 'That one difference gives the two question shapes: *ʻo ai* for who, *ʻo le ā* for what.',
    caption: '*Ai* behaves like a pronoun, and a pronoun takes no article.',
    after: { section: 'asking-what', block: b => b.type === 'p' && b.text.includes('That one difference gives the two') },
    alt: [
      '*ʻO ai lenā?* Who is that?',
      '*ʻO le ā lenā?* What is that?',
      '*Ai* behaves like a pronoun, and a pronoun takes no article.',
    ],
    lanes: [
      { label: 'for who', forms: ['ai'] },
      { label: 'for what', forms: ['ā'] },
    ],
    scenes: [{
      key: 'lena',
      cases: [
        { lane: 0, say: 'ʻO ai lenā?', en: 'Who is that?', row: [face('ʻO', 'marker', 'presenting particle'), { slot: true, form: face('ai', 'pronoun', 'question word') }, face('lenā', 'quiet')] },
        { lane: 1, say: 'ʻO le ā lenā?', en: 'What is that?', row: [face('ʻO', 'marker', 'presenting particle'), face('le', 'marker', 'specific article'), { slot: true, form: face('ā', 'noun', 'question word') }, face('lenā', 'quiet')] },
      ],
    }],
  },
  {
    id: '9.3',
    kind: 'row',
    title: 'The Question Markers *Po* and *ʻEa*',
    caption: 'They add no meaning of their own, the question is complete without them, and you will usually hear one or the other, not both.',
    after: { section: 'the-question-markers', block: b => b.type === 'p' && b.text.includes('whose whole job is to mark') },
    alt: [
      '*Po ʻo ai le fafine?* Who is the woman?',
      '*ʻO se uō ʻea le tama?* Is the boy a friend?',
      'A question with *po* or *ʻea* asks the same thing as its bare twin; the marker only makes the asking visible.',
    ],
    scenes: [
      {
        key: 'po',
        caption: '*Po* stands at the very front, before the asking part.',
        tiles: {
          po: [face('Po', 'marker', 'question marker')],
          o: [face('ʻO', 'marker', 'presenting particle'), face('ʻo', 'marker', 'presenting particle')],
          ai: [face('ai', 'pronoun', 'question word')],
          about: [face('le fafine', 'noun')],
        },
        before: { say: 'ʻO ai le fafine?', en: 'Who is the woman?' },
        after: { say: 'Po ʻo ai le fafine?', en: 'Who is the woman?' },
        states: [[['o', 0], ['ai', 0], ['about', 0]], [['po', 0], ['o', 1], ['ai', 0], ['about', 0]]],
        beats: [{ kind: 'add', tile: 'po', roll: 'o', to: 1 }, { kind: 'en' }],
      },
      {
        key: 'ea-who',
        caption: '*ʻEa* follows the first part of the sentence instead.',
        tiles: {
          o: [face('ʻO', 'marker', 'presenting particle')],
          ai: [face('ai', 'pronoun', 'question word')],
          ea: [face('ʻea', 'marker', 'question marker')],
          about: [face('le matua', 'noun')],
        },
        before: { say: 'ʻO ai le matua?', en: 'Who is the parent?' },
        after: { say: 'ʻO ai ʻea le matua?', en: 'Who is the parent?' },
        states: [[['o', 0], ['ai', 0], ['about', 0]], [['o', 0], ['ai', 0], ['ea', 0], ['about', 0]]],
        beats: [{ kind: 'add', tile: 'ea', to: 1 }, { kind: 'en' }],
      },
      {
        key: 'ea-yesno',
        caption: 'Both appear in who-questions and what-questions as well as in yes or no questions.',
        tiles: {
          o: [face('ʻO', 'marker', 'presenting particle')],
          tell: [face('se uō', 'noun')],
          ea: [face('ʻea', 'marker', 'question marker')],
          about: [face('le tama', 'noun')],
        },
        before: { say: 'ʻO se uō le tama?', en: 'Is the boy a friend?' },
        after: { say: 'ʻO se uō ʻea le tama?', en: 'Is the boy a friend?' },
        states: [[['o', 0], ['tell', 0], ['about', 0]], [['o', 0], ['tell', 0], ['ea', 0], ['about', 0]]],
        beats: [{ kind: 'add', tile: 'ea', to: 1 }, { kind: 'en' }],
      },
    ],
  },
]
