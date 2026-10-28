/**
 * The fish above a finished chapter's message: a pointed fish with a forked
 * tail, drawn from reference 5.webp (design-concepts/tile-references/ in the
 * parent workspace, preview.html revision 6). Decoration only; the words carry
 * the meaning. Colours come from the kp-bg / kp-fg CSS, like the tiles.
 */
export default function LessonFish({ className = '' }) {
  return (
    <svg viewBox="0 0 100 100" className={`kp-tile lesson-fish ${className}`.trim()} aria-hidden="true">
      <rect width="100" height="100" className="kp-bg" />
      <path className="kp-fg" d="M49.8 8L69.4 53.8L63.4 45.7L50.8 64.3L65.3 92L49.8 74.1L34.7 91.7L48.8 64.3L36.7 45.7L30.3 54Z" />
    </svg>
  )
}
