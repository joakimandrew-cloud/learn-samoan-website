// Samoan display helpers.
//
// The Samoan course files already print the glottal stop as ʻ (U+02BB) and the
// long vowels with macrons, so display changes no character: okinafy() is the
// identity here. It keeps the name the shared components call.
export function okinafy(text) {
  return text
}

// "Is this italic span Samoan?" The book's convention is italics = Samoan, but
// a few English labels are italic too. A letter outside the Samoan alphabet
// (a e i o u, f g l m n p s t v, with h k r in loanwords, plus ʻ and macrons)
// marks the span as English.
const NON_SAMOAN_LETTER = /[bcdjqwxyz]/i

export function looksSamoan(text) {
  if (typeof text !== 'string' || !text.trim()) return false
  if (NON_SAMOAN_LETTER.test(text)) return false
  return /[a-zāēīōūʻ]/i.test(text)
}
