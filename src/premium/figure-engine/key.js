// The fixed role key and the two key people-mark labels (Direction.md part 4). Colour follows
// the kind of word, one axis for the whole course; what a word does is said by its label, the
// book's own term. A marker always names itself, and a quiet tile carries no label unless its
// chapter prints one. scripts/premium/check-figures.mjs reads ROLES and KEY_LABELS from here.
export const ROLE_LABEL = {
  tense: 'tense particle',
  verb: 'verb',
  pronoun: 'preverbal pronoun',
  noun: 'noun',
  marker: null,
  quiet: null,
}

export const ROLES = Object.keys(ROLE_LABEL)

// Every label of the key: the defaults and the other book terms each role may carry.
export const KEY_LABELS = [
  'tense particle', 'verb', 'describing verb', 'preverbal pronoun', 'independent pronoun', 'noun',
  'agent marker', 'presenting particle', 'not-word', 'not-yet word', 'place word', 'from-word',
  'with-word', 'for-word', 'direction word', 'belonging word', 'possessive form', 'specific article',
  'non-specific article', 'prefix', 'ending',
]

// The speaker and the person spoken to are the book's words (Chapters 2 and 30); a third mark
// takes a label printed in its chapter (def.thirdLabel), or none.
export const PERSON_LABEL = { speaker: 'the speaker', listener: 'the person spoken to', third: null }
export const PEOPLE_LABELS = ['the speaker', 'the person spoken to']
