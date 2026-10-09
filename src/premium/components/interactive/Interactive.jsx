/**
 * One chapter interactive, by kind. Figures illustrate a point and are
 * numbered (Figure 7.2); practice widgets are answered and sit in the
 * "Interactive practice" band. Data: src/data/interactives/NN.json, checked by
 * scripts/check-interactives.mjs (every Samoan string printed in the course).
 */
import Anatomy from './Anatomy.jsx'
import Builder from './Builder.jsx'
import Contrast from './Contrast.jsx'
import Grid from './Grid.jsx'
import Scale from './Scale.jsx'
import Dialogue from './Dialogue.jsx'
import Pick from './Pick.jsx'
import Order from './Order.jsx'
import Match from './Match.jsx'
import Sort from './Sort.jsx'
import Type from './Type.jsx'
import { Figure, InteractiveBoundary, Practice } from './Shells.jsx'
import '../../styles/interactive.css'

const FIGURES = { anatomy: Anatomy, builder: Builder, contrast: Contrast, grid: Grid, scale: Scale, dialogue: Dialogue }
const PRACTICE = { pick: Pick, order: Order, match: Match, sort: Sort, type: Type }

export default function Interactive({ item, figure }) {
  const Fig = FIGURES[item.kind]
  const Drill = PRACTICE[item.kind]
  if (Fig) {
    return (
      <InteractiveBoundary id={item.id}>
        <Figure label={figure ? `Figure ${figure}` : null} title={item.title} caption={item.caption}>
          <Fig data={item.data} id={item.id} />
        </Figure>
      </InteractiveBoundary>
    )
  }
  if (Drill) {
    return (
      <InteractiveBoundary id={item.id}>
        <Practice title={item.title} intro={item.intro}>
          <Drill data={item.data} id={item.id} />
        </Practice>
      </InteractiveBoundary>
    )
  }
  return null
}
