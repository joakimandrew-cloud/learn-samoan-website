/**
 * The /scrub hub, test builds only (plan 2026-11-06-chapter-page-simplify). Every chapter's
 * figures, found by figure-engine/scrub-scenes.jsx from src/premium/figures/NN.js, stepped
 * frame by frame: choose a chapter and a figure, drag the time, or play it. A figure is a pure
 * function of time, so the hub only hands the time to the figure's own seek(t). The Tongan site
 * mounts its own hub here; this site had none, so this is a small one on the same scene contract
 * (id, label, variants, duration, parts, Stage, seek). A production build never reaches it.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { FIGURE_SCENES } from '../figure-engine/scrub-scenes.jsx'
import '../styles/chapter-page.css'

export default function ScrubPage() {
  const [sceneIndex, setSceneIndex] = useState(0)
  const [variant, setVariant] = useState(0)
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(false)
  const stageRef = useRef(null)
  const scene = FIGURE_SCENES[sceneIndex]
  const vals = useMemo(() => (scene ? Object.fromEntries(Object.entries(scene.defaults()).map(([k, v]) => [k, v.value])) : {}), [scene])
  const duration = scene ? scene.duration(vals, variant) : 0
  const parts = scene ? scene.parts(vals, variant) : []

  useEffect(() => {
    if (!scene || !stageRef.current) return
    const id = requestAnimationFrame(() => scene.seek(stageRef.current, t, { vals }))
    return () => cancelAnimationFrame(id)
  }, [scene, t, vals, variant])

  useEffect(() => {
    if (!playing) return undefined
    let raf = 0
    let last = performance.now()
    const step = now => {
      setT(value => {
        const next = value + (now - last)
        if (next >= duration) { setPlaying(false); return duration }
        return next
      })
      last = now
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [playing, duration])

  if (!scene) return <div className="pl-col" style={{ padding: '120px 0' }}><h1 className="display">No figures yet</h1></div>
  const Stage = scene.Stage
  return (
    <div className="pl-col" style={{ padding: '96px 0 80px' }} data-scrub="">
      <h1 className="display" style={{ fontSize: 40 }}>Figure scrubber</h1>
      <p style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', fontFamily: 'var(--f-ui)' }}>
        <label>Chapter <select value={sceneIndex} onChange={e => { setSceneIndex(Number(e.target.value)); setVariant(0); setT(0) }}>
          {FIGURE_SCENES.map((item, i) => <option key={item.id} value={i}>{item.label}</option>)}
        </select></label>
        <label>Figure <select value={variant} onChange={e => { setVariant(Number(e.target.value)); setT(0) }}>
          {scene.variants.map((item, i) => <option key={item.id} value={i}>{item.label}</option>)}
        </select></label>
        <button type="button" className="fx-b" onClick={() => { if (t >= duration) setT(0); setPlaying(p => !p) }}>{playing ? 'Pause' : 'Play'}</button>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{scene.readout(vals, variant, null, t)}</span>
      </p>
      <input type="range" min={0} max={duration} step={1000 / 60} value={t} onChange={e => { setPlaying(false); setT(Number(e.target.value)) }} style={{ width: '100%' }} aria-label="Time" />
      <div style={{ display: 'flex', height: 8, margin: '4px 0 24px' }} aria-hidden="true">
        {parts.map((part, i) => <span key={i} title={part.name} style={{ flex: `${part.end - (parts[i - 1]?.end ?? 0)} 0 0`, background: part.color, opacity: 0.8 }} />)}
      </div>
      <div ref={stageRef}><Stage variantIndex={variant} key={`${scene.id}-${variant}`} /></div>
    </div>
  )
}
