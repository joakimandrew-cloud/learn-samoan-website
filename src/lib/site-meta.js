// Page titles and descriptions for every public route, shared by the app's
// useTitle and scripts/prerender.mjs (which writes them into each route's
// static HTML file so links and search results name the page).
export const COURSE = 'Learn Samoan'
export const HOME_TITLE = 'Learn Samoan · A free course in 51 chapters'
export const DEFAULT_DESCRIPTION = 'Learn Samoan, free. A complete 51-chapter course with worked examples, exercises, quizzes and flip cards.'

export const HUBS = {
  '/chapters': { title: 'All 51 chapters', description: 'The whole Samoan course in 51 chapters, Beginner to Advanced. Every chapter has worked examples, exercises with answers and a 10-question quiz.' },
  '/quizzes': { title: 'Chapter quizzes', description: 'A ten-question quiz for every chapter of the Samoan course, with every answer explained.' },
  '/cards': { title: 'Vocabulary flip cards', description: 'Flip cards for every Words to Learn list in the Samoan course, by chapter or by band.' },
  '/glossary': { title: 'Glossary', description: 'Every Samoan word the course teaches, with its meaning. Search with or without macrons and the glottal stop.' },
  '/reference': { title: 'Reference', description: 'The Introduction, the Pronunciation Guide and the Reference Charts of the Samoan course.' },
}
