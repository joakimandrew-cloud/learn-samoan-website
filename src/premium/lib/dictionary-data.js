// The dictionary's data as the React pages use it: the same index the node
// scripts build through scripts/lib/dictionary-data.mjs, from the same files.
// Imported only by the lazy dictionary pages, so the word data stays out of the
// first bundle.

import glossary from '@app/data/glossary.json'
import vocabulary from '@app/data/book-vocabulary.json'
import chapters from '@app/data/chapters.json'
import exampleData from '../data/dictionary-examples.json'
import { buildDictionaryIndex } from './dictionary-pages.js'

export const DICTIONARY = buildDictionaryIndex({ glossary, vocabulary, chapters, examples: exampleData.examples })

// What the letters browse and the search read: every entry, in the glossary's order.
export const ENTRIES = DICTIONARY.entries
export const LETTERS = DICTIONARY.letters
