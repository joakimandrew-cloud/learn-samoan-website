// Writes the dictionary's generated file (Build-Spec part f):
//   src/premium/data/dictionary-examples.json  printed chapter pairs per entry
//
// Run it after any change to book/Chapter-NN.md or src/data/glossary.json:
// `npm run build:dictionary-data` (and `npm run sync` runs it after the course
// sync). `npm test` fails while the file is stale. `--check` writes nothing and
// exits 1 when the file would change.

import fs from 'node:fs'
import path from 'node:path'
import { buildDictionaryIndex } from '../src/premium/lib/dictionary-pages.js'
import { APP_ROOT, EXAMPLES_FILE, drawExamples, englishDropCounts, examplesFileText, readDictionarySources } from './lib/dictionary-data.mjs'

const check = process.argv.includes('--check')
const examples = drawExamples()
const index = buildDictionaryIndex({ ...readDictionarySources(), examples })
const text = examplesFileText(examples)

const target = path.join(APP_ROOT, EXAMPLES_FILE)
const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null
const stale = current === text ? 0 : 1
if (stale && !check) fs.writeFileSync(target, text, 'utf8')

const withExamples = index.entries.filter(entry => entry.examples.length).length
console.log(JSON.stringify({
  mode: check ? 'check' : 'write',
  changedFiles: stale,
  entries: index.entries.length,
  wordPages: index.pages.length,
  pagesWithSeveralHeadwords: index.pages.filter(page => page.words.length > 1).length,
  pagesWithSeveralEntries: index.pages.filter(page => page.entries.length > 1).length,
  englishPages: index.english.length,
  entriesWithExamples: withExamples,
  entriesWithoutExamples: index.entries.length - withExamples,
  examplePairs: index.entries.reduce((sum, entry) => sum + entry.examples.length, 0),
  englishSensesDropped: englishDropCounts(index),
}, null, 2))
if (check && stale) process.exit(1)
