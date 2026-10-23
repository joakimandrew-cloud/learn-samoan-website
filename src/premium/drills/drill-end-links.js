/**
 * The exits a drill's end card offers: { backTo, chapterNum }.
 *
 * Its own file so DrillFrame can provide it and DeckComplete (in
 * components/interactive/Shells.jsx) can read it without either importing the
 * other's component. Null wherever no frame supplies it, which is the
 * in-chapter case: a drill embedded in Chapter 7 should not end by offering
 * the way out of Chapter 7.
 */
import { createContext } from 'react'

export const DrillEndLinks = createContext(null)

export default DrillEndLinks
