import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import EntryMotif from '../components/EntryMotif.jsx'
import T from '../components/T.jsx'
import { useTitle } from '../lib/title.js'
import { STATIC_META } from '@app/seo/meta.js'
import { GAMES } from '@app/games/registry.js'
import '../styles/catalog.css'

function GameCard({ game, sample }) {
  return (
    <Link className="catalog-card" to={game.route}>
      <span className="catalog-card-top">
        <span>Game</span>
        <span>{game.words} {game.unit ?? 'words'}</span>
      </span>
      <span className="catalog-sample" aria-hidden="true">
        <span>{sample.q}</span>
        <T>{sample.sm}</T>
      </span>
      <strong>{game.title}</strong>
      <span className="catalog-card-copy">{game.blurb}</span>
      <span className="catalog-card-action">{game.action} <EntryMotif size={20} /></span>
    </Link>
  )
}

// The games hub at /games. The title and description are the ones in
// src/seo/meta.js; the cards read the registry, so a card never shows a count
// or a sample the game's own deck does not hold.
export default function Games() {
  useTitle(STATIC_META['/games'].title)
  const samples = useMemo(() => GAMES.map(game => game.sample()), [])
  return (
    <div className="catalog-page games-page">
      <header className="catalog-hero band grain">
        <div className="wrap">
          <p className="eyebrow">Games · Practice by play</p>
          <h1 className="display">Play with<br />the words.</h1>
          <p>{STATIC_META['/games'].description}</p>
        </div>
      </header>
      <div className="wrap catalog-body">
        <p className="catalog-count">{GAMES.length} {GAMES.length === 1 ? 'game' : 'games'}</p>
        <div className="catalog-grid" data-testid="games-grid">
          {GAMES.map((game, i) => <GameCard key={game.key} game={game} sample={samples[i]} />)}
        </div>
      </div>
    </div>
  )
}
