const face = (text, role, label) => (label != null ? { text, role, label } : { text, role })
export const REPLACES = ['ch39-reason-position']
export const FIGURES = [
  {
    id: '39.1',
    kind: 'row',
    title: 'What sets it apart is that it can also go first.',
    caption: 'When the reason comes first, the other clause usually carries the pointing-back word *ai* after its verb.',
    after: { section: 'the-because-word-ona', block: b => b.type === 'p' && b.text.includes('to any one word inside it') },
    alt: [
      '*Na alu le tama ʻi le fale ʻona ʻua maʻi le teine.*',
      'The boy went to the house because the girl was sick.',
      '*ʻOna ʻua maʻi le teine, na alu ai le tama ʻi le fale.* Because the girl was sick, the boy went to the house.',
      'When the reason comes first, the other clause usually carries the pointing-back word *ai* after its verb.',
    ],
    scenes: [{
      key: 'alu',
      tiles: {
        na: [face('Na', 'tense', ''), face('na', 'tense', '')],
        alu: [face('alu', 'verb', '')],
        ai: [face('ai', 'marker', 'pointing-back word')],
        tama: [face('le tama', 'noun', '')],
        fale: [face('ʻi le fale', 'quiet')],
        ona: [face('ʻona', 'marker', 'because-word'), face('ʻOna', 'marker', 'because-word')],
        reason: [face('ʻua maʻi le teine', 'quiet', 'the reason'), face('ʻua maʻi le teine,', 'quiet', 'the reason')],
      },
      before: { say: 'Na alu le tama ʻi le fale ʻona ʻua maʻi le teine.', en: 'The boy went to the house because the girl was sick.' },
      after: { say: 'ʻOna ʻua maʻi le teine, na alu ai le tama ʻi le fale.', en: 'Because the girl was sick, the boy went to the house.' },
      states: [
        [['na', 0], ['alu', 0], ['tama', 0], ['fale', 0], ['ona', 0], ['reason', 0]],
        [['ona', 1], ['reason', 1], ['na', 1], ['alu', 0], ['GHOST'], ['tama', 0], ['fale', 0]],
        [['ona', 1], ['reason', 1], ['na', 1], ['alu', 0], ['ai', 0], ['tama', 0], ['fale', 0]],
      ],
      beats: [{ kind: 'move', tile: ['ona', 'reason'], to: 1 }, { kind: 'add', tile: 'ai', to: 2 }, { kind: 'en' }],
    }],
  },
  {
    id: '39.2',
    kind: 'fork',
    ownSlots: true,
    title: 'The Purpose Clause',
    caption: 'After a preverbal pronoun that particle takes its other shape, *te*, exactly as it does after any preverbal pronoun.',
    after: { section: 'the-purpose-clause', block: b => b.type === 'p' && b.text.includes('exactly as it does after any preverbal pronoun') },
    alt: [
      '*Sā alu le tama e ʻaumai le niu.* The boy went to bring the coconut.',
      '*Sā ʻou alu ʻou te ʻaumai le niu.* I went to bring the coconut.',
      'After a preverbal pronoun that particle takes its other shape, *te*, exactly as it does after any preverbal pronoun.',
    ],
    lanes: [
      { label: 'the general particle *e*', forms: ['e'] },
      { label: 'after a preverbal pronoun', forms: ['te'] },
    ],
    scenes: [{
      key: 'aumai',
      cases: [
        {
          lane: 0,
          say: 'Sā alu le tama e ʻaumai le niu.',
          en: 'The boy went to bring the coconut.',
          row: [
            face('Sā', 'tense', ''),
            face('alu', 'verb', ''),
            face('le tama', 'noun', ''),
            { slot: true, form: face('e', 'tense', 'general particle') },
            face('ʻaumai', 'verb', ''),
            face('le niu', 'noun', ''),
          ],
        },
        {
          lane: 1,
          say: 'Sā ʻou alu ʻou te ʻaumai le niu.',
          en: 'I went to bring the coconut.',
          row: [
            face('Sā', 'tense', ''),
            face('ʻou', 'pronoun', ''),
            face('alu', 'verb', ''),
            { ...face('ʻou', 'pronoun', 'preverbal pronoun'), ring: true },
            { slot: true, form: face('te', 'tense', 'general particle') },
            face('ʻaumai', 'verb', ''),
            face('le niu', 'noun', ''),
          ],
        },
      ],
    }],
  },
]
