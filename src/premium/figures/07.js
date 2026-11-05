const face = (text, role, label) => (label != null ? { text, role, label } : { text, role })

// ch7-one-and-many toggles *le teine* and *teine*; 7.2 shows the same point as a drop that
// leaves the article slot drawn empty while the noun holds still, which is the book's point.
export const REPLACES = ['ch7-one-and-many']

export const FIGURES = [
  {
    id: '7.1',
    kind: 'fork',
    title: '*Le* and *Se* Are Not "the" and "a"',
    caption: 'Sāmoan chooses *le* or *se* by whether the speaker has one particular thing in mind.',
    after: { section: 'the-non-specific-articles', block: b => b.type === 'p' && b.text.includes('The speaker has one particular girl in mind') },
    alt: [
      '*ʻUa sau le teine.* A girl is coming.',
      'The speaker has one particular girl in mind, so *le* goes in front of *teine*, even though the English says "a".',
      '*ʻAumai se ipu.* Bring a cup.',
      'If any example of the thing would do, use *se*.',
    ],
    lanes: [
      { label: 'one particular thing in mind', forms: ['le'] },
      { label: 'Any one will do', forms: ['se'] },
    ],
    scenes: [{
      key: 'le-se',
      cases: [
        {
          lane: 0,
          say: 'ʻUa sau le teine.',
          en: 'A girl is coming.',
          row: [face('ʻUa', 'tense'), face('sau', 'verb'), { slot: true, label: 'specific article', form: face('le', 'marker', 'specific article') }, face('teine', 'noun')],
        },
        {
          lane: 1,
          say: 'ʻAumai se ipu.',
          en: 'Bring a cup.',
          row: [face('ʻAumai', 'verb'), { slot: true, label: 'non-specific article', form: face('se', 'marker', 'non-specific article') }, face('ipu', 'noun')],
        },
      ],
    }],
  },
  {
    id: '7.2',
    kind: 'row',
    title: 'One and Many: The Article Carries the Number',
    caption: 'The emptiness is the plural.',
    after: { section: 'one-and-many', block: b => b.type === 'p' && b.text.includes('The article did.') },
    alt: [
      '*le teine*. the girl',
      '*teine*. the girls',
      'To go from "the girl" to "the girls", *le* is dropped and nothing takes its place.',
    ],
    scenes: [
      {
        key: 'teine',
        tiles: { le: [face('le', 'marker', 'specific article')], teine: [face('teine', 'noun')] },
        before: { say: 'le teine', en: 'the girl' },
        after: { say: 'teine', en: 'the girls' },
        states: [[['le', 0], ['teine', 0]], [['GHOST', 0], ['teine', 0]]],
        beats: [{ kind: 'drop', tile: 'le', to: 1 }, { kind: 'en' }],
      },
      {
        key: 'laau',
        tiles: { le: [face('le', 'marker', 'specific article')], laau: [face('lāʻau', 'noun')] },
        before: { say: 'le lāʻau', en: 'the tree' },
        after: { say: 'lāʻau', en: 'the trees' },
        states: [[['le', 0], ['laau', 0]], [['GHOST', 0], ['laau', 0]]],
        beats: [{ kind: 'drop', tile: 'le', to: 1 }, { kind: 'en' }],
      },
      {
        key: 'fiafia',
        caption: 'A full sentence works the same way.',
        tiles: { sa: [face('Sā', 'tense', '')], fiafia: [face('fiafia', 'verb', '')], le: [face('le', 'marker', 'specific article')], teine: [face('teine', 'noun')] },
        before: { say: 'Sā fiafia le teine.', en: 'The girl was happy.' },
        after: { say: 'Sā fiafia teine.', en: 'The girls were happy.' },
        states: [[['sa', 0], ['fiafia', 0], ['le', 0], ['teine', 0]], [['sa', 0], ['fiafia', 0], ['GHOST', 0], ['teine', 0]]],
        beats: [{ kind: 'drop', tile: 'le', to: 1 }, { kind: 'en' }],
      },
    ],
  },
]
