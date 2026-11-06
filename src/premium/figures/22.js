// Chapter 22: Question Words. Two figures, both in Asking When: Past and Future.
// Every Sāmoan and English string is copied from book/Chapter-22.md, every macron and ʻ kept.
// 22.1 replaces the Interactive ch22-when-past-future: the toggle shows the two questions,
// but the figure answers the book's own question (which words changed?) by turning over the
// when-word and the tense particle together while ʻO, moe, ai and le tama hold still.
// 22.2 is a Fork by position: anafea is ringed in both lanes. Fronted, the lane fills an ai slot
// straight after the verb; left at the end, the same place stays an empty slot (no ai).
const face = (text, role, label) => (label != null ? { text, role, label } : { text, role })

export const REPLACES = ['ch22-when-past-future']

export const FIGURES = [
  {
    id: '22.1',
    kind: 'row',
    types: ['swap'],
    title: 'Which words changed?',
    caption: 'The future when-word *āfea* rides a future sentence; the past when-word *anafea* rides a past sentence.',
    // After the paragraph that answers the question, before the ana- and ā- paragraph.
    after: { section: 'asking-when-past-and-future', block: b => b.type === 'p' && b.text.includes('Two words moved together') },
    alt: [
      '*ʻO āfea ʻoleʻā moe ai le tama?* When will the boy sleep?',
      '*ʻO anafea na moe ai le tama?* When did the boy sleep?',
      'The when-word changed from *āfea* to *anafea*, and the tense particle changed with it, from the future particle *ʻoleʻā* to the past particle *na*.',
    ],
    scenes: [{
      key: 'moe',
      tiles: {
        o: [face('ʻO', 'marker', 'presenting particle')],
        w: [face('āfea', 'marker', 'future when-word'), face('anafea', 'marker', 'past when-word')],
        tp: [face('ʻoleʻā', 'tense', 'future particle'), face('na', 'tense', 'past particle')],
        moe: [face('moe', 'verb', '')],
        ai: [face('ai', 'marker', 'pointing-back word')],
        tama: [face('le tama', 'noun', '')],
      },
      before: { say: 'ʻO āfea ʻoleʻā moe ai le tama?', en: 'When will the boy sleep?' },
      after: { say: 'ʻO anafea na moe ai le tama?', en: 'When did the boy sleep?' },
      states: [
        [['o', 0], ['w', 0], ['tp', 0], ['moe', 0], ['ai', 0], ['tama', 0]],
        [['o', 0], ['w', 1], ['tp', 1], ['moe', 0], ['ai', 0], ['tama', 0]],
      ],
      beats: [{ kind: 'swap', tile: ['w', 'tp'], to: 1 }, { kind: 'en' }],
    }],
  },
  {
    id: '22.2',
    kind: 'fork',
    ownSlots: true,
    title: 'The when-word does not have to come to the front.',
    caption: 'Fronting the when-word and copying it with *ai*, or leaving it at the end, are two ways to ask the same question.',
    // After the paragraph on the end position, before the when-question table.
    after: { section: 'asking-when-past-and-future', block: b => b.type === 'p' && b.text.includes('in the plain place a time word takes') },
    alt: [
      '*ʻO anafea na moe ai le tama?* When did the boy sleep?',
      '*Na lā faʻaipoipo anafea?* When did the two of them get married?',
      'Here *anafea* sits at the end, in the plain place a time word takes, so the verb holds no *ai*.',
    ],
    lanes: [
      { label: 'comes to the front' },
      { label: 'at the end' },
    ],
    scenes: [{
      key: 'anafea',
      cases: [
        { lane: 0, say: 'ʻO anafea na moe ai le tama?', en: 'When did the boy sleep?', row: [face('ʻO', 'marker', 'presenting particle'), { ...face('anafea', 'marker', 'past when-word'), ring: true }, face('na', 'tense', ''), face('moe', 'verb', ''), { slot: true, form: face('ai', 'marker', 'pointing-back word') }, face('le tama', 'noun', '')] },
        { lane: 1, say: 'Na lā faʻaipoipo anafea?', en: 'When did the two of them get married?', row: [face('Na', 'tense', ''), face('lā', 'pronoun', ''), face('faʻaipoipo', 'verb', ''), { slot: true }, { ...face('anafea', 'marker', 'past when-word'), ring: true }] },
      ],
    }],
  },
]
