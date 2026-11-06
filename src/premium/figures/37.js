const face = (text, role, label) => (label != null ? { text, role, label } : { text, role })

export const FIGURES = [
  {
    id: '37.1',
    kind: 'fork',
    ownSlots: true,
    title: 'Matching the Tense Particle',
    caption: 'That is the rule for the clause after *ma*: when it carries a tense particle of its own, the particle is the one already standing in front of the first clause.',
    after: { section: 'matching-the-tense-particle', block: b => b.type === 'p' && b.text.includes('The same one, twice over') },
    alt: [
      '*Sā timu ma sā lolo le vai.* It rained and the water overflowed.',
      '*ʻUa ala le tama ma ʻua usu le teine.* The boy has woken and the girl has stood up.',
      'That is the rule for the clause after *ma*: when it carries a tense particle of its own, the particle is the one already standing in front of the first clause.',
    ],
    lanes: [
      { label: '*sā* and then *sā*', forms: ['sā'] },
      { label: '*ʻua* and then *ʻua*', forms: ['ʻua'] },
    ],
    scenes: [{
      key: 'ma',
      cases: [
        { lane: 0, say: 'Sā timu ma sā lolo le vai.', en: 'It rained and the water overflowed.', row: [{ ...face('Sā', 'tense'), ring: true }, face('timu', 'verb', ''), face('ma', 'marker', 'with-word'), { slot: true, form: face('sā', 'tense') }, face('lolo', 'verb', ''), face('le vai', 'quiet')] },
        { lane: 1, say: 'ʻUa ala le tama ma ʻua usu le teine.', en: 'The boy has woken and the girl has stood up.', row: [{ ...face('ʻUa', 'tense'), ring: true }, face('ala', 'verb', ''), face('le tama', 'quiet'), face('ma', 'marker', 'with-word'), { slot: true, form: face('ʻua', 'tense') }, face('usu', 'verb', ''), face('le teine', 'quiet')] },
      ],
    }],
  },
  {
    id: '37.2',
    kind: 'fork',
    ownSlots: true,
    title: 'One shape of the general particle turns up inside this pattern.',
    after: { section: 'saying-what-came-before', block: b => b.type === 'p' && b.text.includes('One shape of the general particle') },
    alt: [
      '*Na taunuʻu mai le pasi ʻae leʻi tā=ina le ono.* The bus arrived before six o\'clock. (Lit. "The bus arrived but it was not yet striking the six.")',
      '*Na sele laʻu ʻava ʻae ʻou te leʻi tuʻu=a loʻu fale.* I shaved before I left the house. (Lit. "My beard was shaved but I had not yet left my house.")',
      'When a preverbal pronoun stands between *ʻae* and *leʻi*, the general particle takes the *te* shape it always takes after a preverbal pronoun, and it sits between the pronoun and *leʻi*.',
    ],
    lanes: [
      { label: 'no preverbal pronoun', forms: [] },
      { label: 'a preverbal pronoun', forms: ['te'] },
    ],
    scenes: [{
      key: 'lei',
      cases: [
        { lane: 0, say: 'Na taunuʻu mai le pasi ʻae leʻi tā=ina le ono.', en: 'The bus arrived before six o\'clock.', row: [face('Na', 'tense', ''), face('taunuʻu', 'verb', ''), face('mai', 'quiet'), face('le pasi', 'quiet'), face('ʻae', 'marker', 'but-word'), { slot: true }, face('leʻi', 'marker', 'not-yet word'), face('tā=ina', 'quiet'), face('le ono', 'quiet')] },
        { lane: 1, say: 'Na sele laʻu ʻava ʻae ʻou te leʻi tuʻu=a loʻu fale.', en: 'I shaved before I left the house.', row: [face('Na', 'tense', ''), face('sele', 'verb', ''), face('laʻu ʻava', 'quiet'), face('ʻae', 'marker', 'but-word'), { ...face('ʻou', 'pronoun', 'preverbal pronoun'), ring: true }, { slot: true, form: face('te', 'tense', 'general particle') }, face('leʻi', 'marker', 'not-yet word'), face('tuʻu=a', 'quiet'), face('loʻu fale', 'quiet')] },
      ],
    }],
  },
]
