/**
 * Sentence Tiles: the words that say what the game marks. The game follows the
 * order the book prints; another order is "not the book's order", never a
 * wrong sentence. test/games-sentence-tiles.test.js holds these lines.
 */
export const ORDER_NOTE = 'This game follows the order the book prints, and some Sāmoan sentences can be said in more than one order.'

/** The how-to on the title screen. */
export const HOW_TO = `Tap the tiles into the order the book prints. ${ORDER_NOTE}`

/** The head of the message an off-order tap shows. */
export const OFF_ORDER_HEAD = "Not the book's order"

/** The label of the end card's count of off-order taps. */
export const OFF_ORDER_LABEL = "Taps off the book's order"
