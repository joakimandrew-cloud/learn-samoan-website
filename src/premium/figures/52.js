const face = (text, role, label) => (label != null ? { text, role, label } : { text, role })
export const FIGURES = [
  {
    id: '52.1',
    kind: 'row',
    title: 'A Belonging Form After *Si*',
    caption: 'The order is fixed: the article, then the belonging form, then the noun.',
    after: { section: 'the-article-si', block: b => b.type === 'p' && b.text.includes('The order is fixed') },
    alt: ['A belonging form can stand between *si* and the noun, and nothing about that form changes when it goes there.', 'The order is fixed: the article, then the belonging form, then the noun.'],
    scenes: [
      {
        key: 'pepe',
        tiles: { si: [face('si', 'marker', 'article')], au: [face('aʻu', 'marker', 'belonging form')], pepe: [face('pepe', 'noun')] },
        before: { say: 'si pepe', en: 'the dear baby' },
        after: { say: 'si aʻu pepe', en: 'my dear baby' },
        states: [[['si', 0], ['pepe', 0]], [['si', 0], ['au', 0], ['pepe', 0]]],
        beats: [{ kind: 'add', tile: 'au', to: 1 }, { kind: 'en' }],
      },
      {
        key: 'tama',
        caption: 'A father is an *o*-word noun, so after *si* he takes *oʻu*, the *o*-word form with no article inside it.',
        tiles: { si: [face('si', 'marker', 'article')], ou: [face('oʻu', 'marker', 'belonging form')], tama: [face('tamā', 'noun')] },
        before: { say: 'si tamā', en: 'the dear father' },
        after: { say: 'si oʻu tamā', en: 'my dear father' },
        states: [[['si', 0], ['tama', 0]], [['si', 0], ['ou', 0], ['tama', 0]]],
        beats: [{ kind: 'add', tile: 'ou', to: 1 }, { kind: 'en' }],
      },
    ],
  },
  {
    id: '52.2',
    kind: 'build',
    title: 'The Article *Sina*',
    caption: 'When the belonging form for one owner (my, your, his or her) follows *sina*, the two can run together into one word, though they are also found written apart.',
    after: { section: 'the-article-sina', block: b => b.text && b.text.includes('can run together into one word') },
    alt: ['*Sinaʻu* is *sina* and *aʻu* run together.', 'When the belonging form for one owner (my, your, his or her) follows *sina*, the two can run together into one word, though they are also found written apart.'],
    scenes: [
      {
        role: 'marker',
        from: { say: 'sina aʻu', en: null },
        to: { say: 'sinaʻu', en: null },
        pieces: [{ text: 'sin' }, { text: 'a ', removed: true }, { text: 'aʻu' }],
      },
      {
        role: 'marker',
        from: { say: 'sina oʻu', en: null },
        to: { say: 'sinoʻu', en: null },
        pieces: [{ text: 'sin' }, { text: 'a ', removed: true }, { text: 'oʻu' }],
      },
    ],
  },
  {
    id: '52.3',
    kind: 'build',
    title: '*Lota* is the emotional partner of *loʻu*.',
    caption: 'Both hold the specific article and the *o*, and then the person: *loʻu* carries the ordinary person joined behind the *o*, and *lota* carries *ta*, joined in the same place.',
    after: { section: 'the-emotional-first-person', block: b => b.type === 'p' && b.text.includes('is the emotional partner of') },
    alt: ['*Lota* is the emotional partner of *loʻu*.', 'Both hold the specific article and the *o*, and then the person: *loʻu* carries the ordinary person joined behind the *o*, and *lota* carries *ta*, joined in the same place.'],
    scenes: [
      {
        role: 'marker',
        label: 'belonging form',
        from: { say: 'loʻu', en: null },
        to: { say: 'lota', en: null },
        pieces: [{ text: 'lo' }, { text: 'ta', was: 'ʻu' }],
      },
    ],
  },
]
