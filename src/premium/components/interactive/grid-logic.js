/**
 * Pure logic for the Grid figure (the paradigm explorer): which cells hold a
 * form, where the arrow keys go, what each quiz prompt asks, and the
 * Find-the-form round as a reducer. No React here, so Grid.jsx exports only
 * its component (React Fast Refresh), and the round can be tested alone.
 */

// Every cell that holds a form, in reading order: { key, r, c, cell }.
// A short or missing cells array reads as empty squares.
export function gridCells(rows, colCount) {
  const out = []
  ;(rows || []).forEach((row, r) => {
    for (let c = 0; c < colCount; c += 1) {
      const cell = row?.cells?.[c]
      if (cell) out.push({ key: `${r}-${c}`, r, c, cell })
    }
  })
  return out
}

// The cell an arrow key moves to from (r, c): the next form in that
// direction, stepping over empty squares; null at the edge of the grid.
export function stepCell(rows, colCount, r, c, [dr, dc]) {
  let i = r + dr
  let j = c + dc
  while (i >= 0 && i < rows.length && j >= 0 && j < colCount) {
    if (rows[i]?.cells?.[j]) return `${i}-${j}`
    i += dr
    j += dc
  }
  return null
}

// Free text without its *italic* stars, for screen-reader lines.
export const plain = s => String(s ?? '').replace(/\*/g, '')

// Display only: straight double quotes in English become curly, as the
// shared Inline renderer does (T.jsx). The data keeps the printed text.
export const curly = s => String(s ?? '').replace(/"([^"]*)"/g, '“$1”')

// A full stop to close a phrase, unless it already ends in one (a cell can
// hold a whole printed sentence, "Sā tātou siva.").
export const stop = s => (/[.?!]["”')]*$/.test(String(s ?? '').trim()) ? '' : '.')

// The verdict line under a prompt, as parts: plain strings, and { sm } for
// Samoan. One source for the visible line and the screen-reader line.
export function verdictParts(last, byKey) {
  if (!last || last.type === 'new') return null
  const entry = byKey.get(last.key)
  if (!entry) return null
  const is = e => (e.cell.en ? [{ sm: e.cell.sm }, ` is ${e.cell.en}${stop(e.cell.en)}`] : [{ sm: e.cell.sm }, stop(e.cell.sm)])
  if (last.type === 'right') return ['Right: ', ...is(entry)]
  if (last.type === 'late') return is(entry)
  const tapped = byKey.get(last.tapped)
  if (last.type !== 'wrong' || !tapped) return null
  const head = tapped.cell.en ? is(tapped) : ['That is ', { sm: tapped.cell.sm }, stop(tapped.cell.sm)]
  return [...head, ' Tap the outlined answer: ', { sm: entry.cell.sm }, stop(entry.cell.sm)]
}

const fold = s => plain(s).trim().toLowerCase()

// What each quiz prompt asks for: the cell's English. When two cells share
// that English, or a cell has none, `where` is set and the prompt also names
// the row and the column.
export function promptsFor(entries) {
  const count = new Map()
  for (const e of entries) if (e.cell.en) count.set(fold(e.cell.en), (count.get(fold(e.cell.en)) || 0) + 1)
  const out = {}
  for (const e of entries) {
    const en = e.cell.en || null
    out[e.key] = { en, where: !en || count.get(fold(en)) > 1 }
  }
  return out
}

/**
 * One Find-the-form round: every form asked once, in `order`.
 *   at         index of the prompt being asked (order.length when done)
 *   missed     the current prompt has had a wrong tap
 *   found      key -> 'first' (found first time) or 'late' (after a miss)
 *   wrong      the last wrong tap, drawn red; shake counts them so the
 *              same cell can shake twice in a row
 *   firstTime  prompts found first time; asked: prompts resolved
 *   last       what the status line reports: { type, key, tapped }
 */
export function newRound(keys, order = keys) {
  return { keys, order, at: 0, missed: false, found: {}, wrong: null, shake: 0, firstTime: 0, asked: 0, last: null }
}

export function quizReducer(state, action) {
  if (action.type === 'new') return { ...newRound(state.keys, action.order ?? state.keys), last: { type: 'new' } }
  if (action.type !== 'tap') return state
  const target = state.order[state.at]
  // A finished round, or a form already found (the second tap of a double
  // tap lands here), changes nothing.
  if (target == null || state.found[action.key]) return state
  if (action.key === target) {
    return {
      ...state,
      at: state.at + 1,
      missed: false,
      found: { ...state.found, [target]: state.missed ? 'late' : 'first' },
      wrong: null,
      firstTime: state.firstTime + (state.missed ? 0 : 1),
      asked: state.asked + 1,
      last: { type: state.missed ? 'late' : 'right', key: target },
    }
  }
  return { ...state, missed: true, wrong: action.key, shake: state.shake + 1, last: { type: 'wrong', key: target, tapped: action.key } }
}
