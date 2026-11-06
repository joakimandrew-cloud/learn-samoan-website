// Chapter 40 figures. Every string is copied from book/Chapter-40.md.
const face = (text, role, label) => (label != null ? { text, role, label } : { text, role })

// 40.1 shows the same change as the toggle ch40-if-when, but lets the reader watch the two words
// leave and the one word land in their place, which is the sentence the book states.
export const REPLACES = ['ch40-if-when']

export const FIGURES = [
  {
    id: '40.1',
    kind: 'row',
    title: 'The Condition Clause Without a Joining Word',
    // Caption is the book's hedge, not the slot sentence: the final English beat must not read as
    // ʻā meaning "when" (judge finding 1). The slot sentence is the paragraph the figure follows.
    caption: 'English renders it "if", "when" or "whenever", according to how expected the speaker thinks the condition is, and Sāmoan does not mark that difference anywhere in the sentence.',
    after: { section: 'the-condition-clause-without-a-joining-word', block: b => b.type === 'p' && b.text.includes('one word stands where the two of them were') },
    alt: [
      '*ʻĀfai e timu taeao, e lē alu le malaga.* If it rains tomorrow, the trip will not go.',
      '*ʻĀ timu taeao, e lē alu le malaga.* When it rains tomorrow, the trip will not go.',
      'The if-word and the tense particle behind it are both gone from the second sentence, and one word stands where the two of them were: *ʻā*, the short form of the future particle.',
      'The choice among the three English words is therefore the translator\'s rather than the Sāmoan sentence\'s.',
    ],
    scenes: [
      {
        key: 'timu',
        tiles: {
          afai: [face('ʻĀfai', 'marker', 'if-word')],
          e: [face('e', 'tense', 'general particle')],
          a: [face('ʻĀ', 'tense', 'short future particle')],
          timu: [face('timu', 'verb')],
          taeao: [face('taeao,', 'quiet')],
          main: [face('e lē alu le malaga', 'quiet', 'main clause')],
        },
        before: { say: 'ʻĀfai e timu taeao, e lē alu le malaga.', en: 'If it rains tomorrow, the trip will not go.' },
        after: { say: 'ʻĀ timu taeao, e lē alu le malaga.', en: 'When it rains tomorrow, the trip will not go.' },
        states: [
          [['afai', 0], ['e', 0], ['timu', 0], ['taeao', 0], ['main', 0]],
          [['GHOST'], ['timu', 0], ['taeao', 0], ['main', 0]],
          [['a', 0], ['timu', 0], ['taeao', 0], ['main', 0]],
        ],
        beats: [{ kind: 'drop', tile: ['afai', 'e'], to: 1 }, { kind: 'add', tile: 'a', to: 2 }, { kind: 'en' }],
      },
    ],
  },
]
