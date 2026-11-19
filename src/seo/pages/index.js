// The topic pages: single-subject articles written for a search and served whole.
// Plain JS with no JSON import, so the prerender, the tests and the app all load it.
import alphabet from './alphabet.js'
import greetings from './greetings.js'

export const TOPIC_PAGES = [greetings, alphabet]

export const topicByPath = path => TOPIC_PAGES.find(doc => doc.path === path) || null
