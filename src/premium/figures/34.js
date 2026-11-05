const face = (text, role, label) => (label !== undefined ? { text, role, label } : { text, role })

export const REPLACES = ['ch34-report-time']

export const FIGURES = [
  {
    id: '34.1',
    kind: 'row',
    title: 'Which word changed?',
    caption: '*ʻUa iloa* became *Na iloa*, and the second half of the sentence stayed word for word the same, *ʻua sau le teine*, while the English moved from "has come" to "had come".',
    after: { section: 'reporting-what-someone-knew', block: b => b.type === 'p' && b.text.includes('became *Na iloa*') },
    alt: [
      '*ʻUa iloa e le tama ʻua sau le teine.* The boy knows that the girl has come.',
      '*Na iloa e le tama ʻua sau le teine.* The boy knew that the girl had come.',
      '*ʻUa iloa* became *Na iloa*, and the second half of the sentence stayed word for word the same, *ʻua sau le teine*, while the English moved from "has come" to "had come".',
    ],
    scenes: [{
      key: 'sau',
      tiles: {
        first: [face('ʻUa', 'tense'), face('Na', 'tense')],
        iloa: [face('iloa', 'verb', 'knowing word')],
        tama: [face('e le tama', 'quiet')],
        inner: [face('ʻua', 'tense')],
        teine: [face('sau le teine', 'quiet')],
      },
      before: { say: 'ʻUa iloa e le tama ʻua sau le teine.', en: 'The boy knows that the girl has come.' },
      after: { say: 'Na iloa e le tama ʻua sau le teine.', en: 'The boy knew that the girl had come.' },
      states: [
        [['first', 0], ['iloa', 0], ['tama', 0], ['inner', 0], ['teine', 0]],
        [['first', 1], ['iloa', 0], ['tama', 0], ['inner', 0], ['teine', 0]],
      ],
      beats: [{ kind: 'swap', tile: 'first', to: 1 }, { kind: 'en' }],
    }],
  },
  {
    id: '34.2',
    kind: 'row',
    title: 'The Tense Particle Inside the Report',
    caption: 'Both this sentence and the fourth row of the second table above read "would come" in English, but the future particle itself places the coming later, while under the general particle *e* the particle sets no time of its own and the still-to-come reading is not marked by it.',
    after: { section: 'the-tense-particle-inside-the-report', block: b => b.type === 'examples' && JSON.stringify(b.pairs).includes('ʻoleʻā sau le teine') },
    alt: [
      '*Na iloa e le tama ʻoleʻā sau le teine.* The boy knew that the girl would come.',
      '*Na iloa e le tama e sau le teine.*',
      'The boy knew that the girl would come.',
      'Both this sentence and the fourth row of the second table above read "would come" in English, but the future particle itself places the coming later, while under the general particle *e* the particle sets no time of its own and the still-to-come reading is not marked by it.',
    ],
    scenes: [{
      key: 'olea',
      tiles: {
        na: [face('Na', 'tense', '')],
        iloa: [face('iloa', 'verb', '')],
        tama: [face('e le tama', 'quiet')],
        inner: [face('ʻoleʻā', 'tense', 'future particle'), face('e', 'tense', 'general particle')],
        teine: [face('sau le teine', 'quiet')],
      },
      before: { say: 'Na iloa e le tama ʻoleʻā sau le teine.', en: 'The boy knew that the girl would come.' },
      after: { say: 'Na iloa e le tama e sau le teine.', en: 'The boy knew that the girl would come.' },
      states: [
        [['na', 0], ['iloa', 0], ['tama', 0], ['inner', 0], ['teine', 0]],
        [['na', 0], ['iloa', 0], ['tama', 0], ['inner', 1], ['teine', 0]],
      ],
      beats: [{ kind: 'swap', tile: 'inner', to: 1 }, { kind: 'en' }],
    }],
  },
]
