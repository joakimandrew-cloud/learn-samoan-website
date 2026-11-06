// Chapter 49's figures, as data (plan 2026-11-06-chapter-page-simplify). Every Sāmoan and
// English string here is copied from book/Chapter-49.md, every macron and ʻ kept; titles,
// captions, labels and text alternatives are phrases the book prints. Rich strings mark
// Sāmoan with *asterisks*. This file carries no colour, size, style or class.
// npm run check:figures -- 49 holds it to the book.
//
// 49.1 answers the book's own question at "How Firm the Request Is": which word changed. Seʻi
// turns over to ʻia while alofa and atu hold still. The book prints English only for the whole
// plea, so each half carries en: null and the scene's whole line shows that English at rest.
// 49.2 replaces the toggle ch49-warning-order: te drops out behind ʻe, its gap held open, and
// neʻi lands in front of ʻe, so the pronoun is seen to change sides. Placed after the
// two-row table, never between it and the paragraph above it.
// No figure for the four particles (the grid covers it), seʻi's three jobs (the table prints
// them and Exercise 5 asks them), purpose with or without ʻina (the toggle covers it), seʻia
// (its point is a pronoun that never comes) or the worry verbs (the book hedges: "perhaps",
// "sometimes").

const face = (text, role, label) => (label != null ? { text, role, label } : { text, role })

export const REPLACES = ['ch49-warning-order']

export const FIGURES = [
  {
    id: '49.1',
    kind: 'row',
    types: ['swap'],
    title: 'How Firm the Request Is',
    caption: '*Seʻi* has become *ʻia*, and the speaker, saying the plea a second time, makes it firmer.',
    // After the paragraph that answers the section's question, at the end of the section.
    after: { section: 'the-wish-and-permission-particle-sei', block: b => b.type === 'p' && b.text.includes('The verb *alofa* and the direction word') },
    alt: [
      '*Seʻi alofa atu, ʻia alofa atu.* Please take pity on me, take pity on me. (Lit. "Seʻi love away, ʻia love away.")',
      'The verb *alofa* and the direction word *atu* stay.',
      '*Seʻi* has become *ʻia*, and the speaker, saying the plea a second time, makes it firmer.',
    ],
    scenes: [{
      key: 'alofa',
      tiles: {
        mood: [face('Seʻi', 'tense', 'mood particle'), face('ʻIa', 'tense', 'mood particle')],
        alofa: [face('alofa', 'verb', 'verb')],
        atu: [face('atu', 'marker', 'direction word')],
      },
      before: { say: 'Seʻi alofa atu', en: null },
      after: { say: 'ʻIa alofa atu', en: null },
      whole: { say: 'Seʻi alofa atu, ʻia alofa atu.', en: 'Please take pity on me, take pity on me.' },
      states: [
        [['mood', 0], ['alofa', 0], ['atu', 0]],
        [['mood', 1], ['alofa', 0], ['atu', 0]],
      ],
      beats: [{ kind: 'swap', tile: 'mood', to: 1 }, { kind: 'en' }],
    }],
  },
  {
    id: '49.2',
    kind: 'row',
    types: ['drop', 'add'],
    title: 'The pronoun stands in front of *te* but behind *neʻi*.',
    caption: 'The second has *neʻi*, then the pronoun, then the verb.',
    // After the two-row order table, before the ʻAua neʻi ʻe pisa example.
    after: { section: 'the-warning-particle-nei', block: b => b.type === 'table' && JSON.stringify(b).includes('pronoun, *te*, verb') },
    alt: [
      '*ʻAua ʻe te siva.* Don\'t dance.',
      '*ʻAua neʻi ʻe siva.* Don\'t dance.',
      'The pronoun stands in front of *te* but behind *neʻi*.',
    ],
    scenes: [{
      key: 'siva',
      tiles: {
        aua: [face('ʻAua', 'verb', 'do-not verb')],
        e: [face('ʻe', 'pronoun', 'preverbal pronoun')],
        te: [face('te', 'tense', 'general particle')],
        nei: [face('neʻi', 'tense', 'warning particle')],
        siva: [face('siva', 'verb', '')],
      },
      before: { say: 'ʻAua ʻe te siva.', en: 'Don\'t dance.' },
      after: { say: 'ʻAua neʻi ʻe siva.', en: 'Don\'t dance.' },
      states: [
        [['aua', 0], ['e', 0], ['te', 0], ['siva', 0]],
        [['aua', 0], ['e', 0], ['GHOST'], ['siva', 0]],
        [['aua', 0], ['nei', 0], ['e', 0], ['siva', 0]],
      ],
      beats: [{ kind: 'drop', tile: 'te', to: 1 }, { kind: 'add', tile: 'nei', to: 2 }, { kind: 'en' }],
    }],
  },
]
