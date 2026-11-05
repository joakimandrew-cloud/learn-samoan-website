// Chapter 25's figures, as data (plan 2026-11-06-chapter-page-simplify). Every Sāmoan and
// English string here is copied from book/Chapter-25.md, every macron and ʻ kept; titles,
// captions, labels and text alternatives are phrases the book prints. Rich strings mark
// Sāmoan with *asterisks*. The look lives in chapter-page.css and the engine: this file
// carries no colour, size, style or class. npm run check:figures -- 25 holds it to the book.
//
// 25.1 turns the verb slot over while ʻAua ʻe te holds still: the book's "Change the verb
// and you forbid a different action". It sits after the table, never between the sentence
// and the table it introduces.
// 25.2 swaps the person ʻe (you) for tātou (we, you and I) and the verb agrees, nofo to
// nonofo, in one beat: no held frame shows the plural pronoun with the singular verb.
// No figure for "A Command Has No Not-Word" (the four-tools grid covers it, and the book's
// point there is a slot that does not exist) or for the stop verb (the toggle and the pick
// beside it already set ʻaua against sōia).

const face = (text, role, label) => (label != null ? { text, role, label } : { text, role })

export const FIGURES = [
  {
    id: '25.1',
    kind: 'row',
    types: ['swap'],
    title: 'Change the verb and you forbid a different action.',
    caption: 'The pattern has three parts after *ʻaua*: the person, the general particle *te*, then the verb.',
    // After the table of four, before "ʻAua can also stand on its own".
    after: { section: 'the-do-not-verb-aua', block: b => b.type === 'table' && JSON.stringify(b).includes('Don\'t gossip.') },
    alt: [
      '*ʻAua ʻe te faitala.*',
      'Don\'t gossip.',
      '*ʻAua ʻe te siva.*',
      'Don\'t dance.',
      '*ʻAua ʻe te taumafai.*',
      'Don\'t try.',
      '*ʻAua ʻe te moe.*',
      'Don\'t sleep.',
      'The pattern has three parts after *ʻaua*: the person, the general particle *te*, then the verb.',
    ],
    chips: [
      { state: 0, sm: 'faitala' },
      { state: 1, sm: 'siva' },
      { state: 2, sm: 'taumafai' },
      { state: 3, sm: 'moe' },
    ],
    scenes: [{
      key: 'aua',
      tiles: {
        aua: [face('ʻAua', 'verb', 'do-not verb')],
        e: [face('ʻe', 'pronoun', 'the person')],
        te: [face('te', 'tense', 'general particle')],
        verb: [face('faitala', 'verb'), face('siva', 'verb'), face('taumafai', 'verb'), face('moe', 'verb')],
      },
      lines: [
        { say: 'ʻAua ʻe te faitala.', en: 'Don\'t gossip.' },
        { say: 'ʻAua ʻe te siva.', en: 'Don\'t dance.' },
        { say: 'ʻAua ʻe te taumafai.', en: 'Don\'t try.' },
        { say: 'ʻAua ʻe te moe.', en: 'Don\'t sleep.' },
      ],
      states: [0, 1, 2, 3].map(k => [['aua', 0], ['e', 0], ['te', 0], ['verb', k]]),
      beats: [
        { kind: 'swap', tile: 'verb', to: 1 },
        { kind: 'swap', tile: 'verb', to: 2 },
        { kind: 'swap', tile: 'verb', to: 3 },
      ],
    }],
  },
  {
    id: '25.2',
    kind: 'row',
    types: ['swap'],
    title: 'When More Than One Is Meant',
    caption: 'Because the group is more than one, the verb agrees and takes its plural form *nonofo*.',
    // After the paragraph that explains the pair, at the end of the section.
    after: { section: 'when-more-than-one-is-meant', block: b => b.type === 'p' && b.text.includes('Because the group is more than one') },
    alt: [
      '*ʻAua ʻe te nofo.* Don\'t stay.',
      '*ʻAua tātou te nonofo.* Let us not stay.',
      'Because the group is more than one, the verb agrees and takes its plural form *nonofo*.',
    ],
    scenes: [{
      key: 'nofo',
      tiles: {
        aua: [face('ʻAua', 'verb', 'do-not verb')],
        who: [face('ʻe', 'pronoun', 'you'), face('tātou', 'pronoun', 'we, you and I')],
        te: [face('te', 'tense', '')],
        verb: [face('nofo', 'verb', 'singular'), face('nonofo', 'verb', 'plural form')],
      },
      before: { say: 'ʻAua ʻe te nofo.', en: 'Don\'t stay.' },
      after: { say: 'ʻAua tātou te nonofo.', en: 'Let us not stay.' },
      states: [
        [['aua', 0], ['who', 0], ['te', 0], ['verb', 0]],
        [['aua', 0], ['who', 1], ['te', 0], ['verb', 1]],
      ],
      // Both turn over in one beat (the in-between rule, Step 9 batch 3): a held frame between two
      // swaps would show a plural pronoun with the singular verb, which the book never prints.
      beats: [
        { kind: 'swap', tile: ['who', 'verb'], to: 1 },
        { kind: 'en' },
      ],
    }],
  },
]
