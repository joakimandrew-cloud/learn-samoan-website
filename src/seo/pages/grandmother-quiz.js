// /quiz: the short test "Can you still understand your grandmother?".
//
// Content only. No JSX and no imports, so `node` can load this during the build:
// src/premium/pages/GrandmotherQuiz.jsx plays it in the app, and
// scripts/lib/served-text.mjs serves the headline, the lead-in and the six
// sentences as static HTML.
//
// SOURCES. Each question's `sm` is word for word, mark for mark, the Sāmoan its
// `source` line of book/ prints, and its right answer (`options[answer]`) is
// the English that line prints beside it. The six were copied from the book by
// a script, not typed. test/grandmother-quiz.test.js reads every named line and
// fails on one changed character, in the Sāmoan or in the right answer.
//
// THE CHOICE. Six things a grandmother could say to a grandchild at home, in
// the order of a visit: a greeting, a request to sit, a word about eating, an
// errand that sends the child somewhere to bring something, thanks, a goodbye.
// The book prints no question about eating or about going somewhere that is put
// to "you", so those two are covered by the command and the errand it does print.
//
// THE WRONG CHOICES are English only and are this page's own: the same shape as
// the right one, and never a second reading of the Sāmoan. Kept out on purpose:
// "Stay" for the sitting verb (the book glosses it "sit, stay"), "If" and "take"
// in the errand (the book says its first word can be "if", "when" or "whenever",
// and glosses the bringing verb "bring, take"), "No, thank you" for the thanks
// (the book says the formula also declines), and any word of sympathy for the
// greeting or of health for the goodbye, which the book gives them too.
//
// COPY. Every English line a visitor reads on the page is in COPY and RESULTS
// below, so the test can hold all of it to the house rules: no word of cost or
// access, no U+2014, no CEFR label, "Chapter" and never "Lesson".

export const QUIZ_PATH = '/quiz'

export const QUESTIONS = [
  {
    id: 'hello',
    sm: 'Tālofa.',
    source: { file: 'Chapter-10.md', line: 49 },
    chapter: 10,
    prompt: 'What does she say to you?',
    options: ['Goodbye.', 'Hello.', 'Thank you.', 'Good night.'],
    answer: 1,
  },
  {
    id: 'mat',
    sm: 'Nofo ʻi luga o le fala.',
    source: { file: 'Chapter-27.md', line: 49 },
    chapter: 27,
    prompt: 'What does she want you to do?',
    options: ['Sit by the door.', 'Sleep on the mat.', 'Sit on the mat.', 'Roll up the mat.'],
    answer: 2,
  },
  {
    id: 'eat',
    sm: 'ʻAi.',
    source: { file: 'Chapter-33.md', line: 99 },
    chapter: 33,
    prompt: 'She says one word. What does she mean?',
    options: ['Eat.', 'Drink.', 'Sleep.', 'Wait.'],
    answer: 0,
  },
  {
    id: 'towel',
    sm: 'ʻĀ ʻe alu ʻi le matāfaga, ʻaumai le solo.',
    source: { file: 'Chapter-40.md', line: 127 },
    chapter: 40,
    prompt: 'She gives you a job. What is it?',
    options: ['When you go to the beach, bring the basket.', 'When you go to the village, bring the towel.', 'When you go to the village, bring the basket.', 'When you go to the beach, bring the towel.'],
    answer: 3,
  },
  {
    id: 'thanks',
    sm: 'Faʻafetai.',
    source: { file: 'Chapter-10.md', line: 86 },
    chapter: 10,
    prompt: 'What is she saying now?',
    options: ['Thank you.', 'Please.', 'Excuse me.', 'Good luck.'],
    answer: 0,
  },
  {
    id: 'goodbye',
    sm: 'Tōfā soifua.',
    source: { file: 'Chapter-10.md', line: 59 },
    chapter: 10,
    prompt: 'What does this one mean?',
    options: ['Hello.', 'Welcome.', 'Goodbye.', 'Come in.'],
    answer: 2,
  },
]

export const COPY = {
  eyebrow: 'A short test · Six sentences',
  h1: ['Can you still understand', 'your grandmother?'],
  lead:
    'Six things a Sāmoan grandmother might say at home, each a sentence printed in the course book. ' +
    'Choose what each one means.',
  kicker: 'Your grandmother says',
  right: 'Right.',
  wrong: 'Not this one.',
  sheSaid: 'She said:',
  printedIn: 'The book prints this sentence in',
  next: 'Next sentence',
  finish: 'See how you did',
  skip: 'Go straight to Chapter 1',
  resultKicker: 'Your result',
  start: 'Start Chapter 1',
  again: 'Take the test again',
  recap: 'What she said',
  youChose: 'You chose:',
  servedList: 'The six sentences',
}

// The result bands, by the lowest score that earns each. Six questions: 0 to 2, 3 or 4, 5 or 6.
export const RESULTS = [
  {
    min: 0,
    band: 'Most of it went past you.',
    body:
      'A score of two or less means most of what she said did not reach you. The course starts with a ' +
      'three-word sentence in Chapter 1 and builds from there, and all six of these sentences are taught along the way.',
  },
  {
    min: 3,
    band: 'You follow some of what she says.',
    body:
      'Part of it reached you and part of it did not. The course fills the gaps in order, from a ' +
      'three-word sentence in Chapter 1 to the longer ones she used here.',
  },
  {
    min: 5,
    band: 'You still understand her.',
    body:
      'A score of five or six means her sentences still reach you. The next step is answering ' +
      'her, and the course teaches you to build sentences of your own, starting in Chapter 1.',
  },
]

/** The band a score earns. */
export const resultFor = score => [...RESULTS].reverse().find(r => score >= r.min) || RESULTS[0]
