const face = (text, role, label) => (label != null ? { text, role, label } : { text, role })
export const REPLACES = ['ch50-real-unreal', 'ch50-condition-second']
export const FIGURES = [
  {
    id: '50.1',
    kind: 'row',
    title: 'Which words changed, and what did the change do to the meaning?',
    caption: 'The if-word *ʻāfai* has become *ʻana*, the *te* after *ʻe* is gone, and the main clause now opens with *sēmanū* (probably).',
    after: { section: 'the-second-if-word-ana', block: b => b.type === 'p' && b.text.includes('Three things changed') },
    alt: [
      '*ʻĀfai ʻe te lē sau, ʻou te alu atu.* If you do not come, I will go and see you. (Lit. "If you not come, I go away.")',
      '*ʻAna ʻe lē sau, sēmanū ʻou te alu atu.* Had you not come, I was probably going to go and see you. (Lit. "If you not come, probably I go away.")',
      'The if-word *ʻāfai* has become *ʻana*, the *te* after *ʻe* is gone, and the main clause now opens with *sēmanū* (probably).',
    ],
    scenes: [{
      key: 'alu',
      tiles: {
        if: [face('ʻĀfai', 'marker', 'the if-word'), face('ʻAna', 'marker', 'the if-word')],
        e: [face('ʻe', 'pronoun', '')],
        te: [face('te', 'tense')],
        sau: [face('lē sau,', 'quiet')],
        sem: [face('sēmanū', 'quiet', 'probably')],
        main: [face('ʻou te alu atu', 'quiet')],
      },
      before: { say: 'ʻĀfai ʻe te lē sau, ʻou te alu atu.', en: 'If you do not come, I will go and see you.' },
      after: { say: 'ʻAna ʻe lē sau, sēmanū ʻou te alu atu.', en: 'Had you not come, I was probably going to go and see you.' },
      states: [
        [['if', 0], ['e', 0], ['te', 0], ['sau', 0], ['main', 0]],
        [['if', 1], ['e', 0], ['GHOST'], ['sau', 0], ['main', 0]],
        [['if', 1], ['e', 0], ['sau', 0], ['sem', 0], ['main', 0]],
      ],
      beats: [{ kind: 'drop', tile: 'te', roll: 'if', to: 1 }, { kind: 'add', tile: 'sem', to: 2 }, { kind: 'en' }],
    }],
  },
  {
    id: '50.2',
    kind: 'row',
    title: 'Putting the Condition Second',
    caption: 'The pattern has three parts in a fixed order: the main clause, then *pē*, then the *ʻana* clause.',
    after: { section: 'the-second-if-word-ana', block: b => b.type === 'p' && b.text.includes('can stand after the main clause') },
    alt: [
      'An *ʻana* clause can stand after the main clause.',
      '*ʻOu te ita pē ʻana ʻe lē sau.* I would have been angry if you had not come.',
      'The pattern has three parts in a fixed order: the main clause, then *pē*, then the *ʻana* clause.',
    ],
    scenes: [{
      key: 'ita',
      tiles: {
        cond: [face('ʻAna ʻe lē sau,', 'quiet'), face('ʻana ʻe lē sau', 'quiet')],
        main: [face('ʻou te ita', 'quiet', 'the main clause'), face('ʻOu te ita', 'quiet', 'the main clause')],
        pe: [face('pē', 'marker', 'question opener')],
      },
      before: { say: 'ʻAna ʻe lē sau, ʻou te ita.', en: 'Had you not come, I would have been angry.' },
      after: { say: 'ʻOu te ita pē ʻana ʻe lē sau.', en: 'I would have been angry if you had not come.' },
      states: [
        [['cond', 0], ['main', 0]],
        [['GHOST'], ['main', 1], ['cond', 1]],
        [['main', 1], ['pe', 0], ['cond', 1]],
      ],
      beats: [{ kind: 'move', tile: 'cond', roll: 'main', to: 1 }, { kind: 'add', tile: 'pe', to: 2 }, { kind: 'en' }],
    }],
  },
]
