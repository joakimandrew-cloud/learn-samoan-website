import '../styles/entry-motif.css'

// The mark at the end of a call-to-action. The Tongan site draws a kupesi motif
// here; with no approved Samoan motif this is a plain arrow.
export default function EntryMotif({ size = 24, className = '' }) {
  return (
    <span className={`entry-motif ${className}`.trim()} aria-hidden="true">
      <svg className="entry-arrow" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square">
        <path d="M4 12h15M13 6l6 6-6 6" />
      </svg>
    </span>
  )
}
