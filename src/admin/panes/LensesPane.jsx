import SpaceLens from '../lenses/SpaceLens.jsx'
import StreamLens from '../lenses/StreamLens.jsx'
import AttentionLens from '../lenses/AttentionLens.jsx'
import FeaturesLens from '../lenses/FeaturesLens.jsx'
import CircuitLens from '../lenses/CircuitLens.jsx'
import ui from '../ui.module.css'
import s from './LensesPane.module.css'

const LENSES = [
  { id: 'space', title: 'Space', chapters: '1–4, 12', blurb: 'A word is a neuron: core and halo. Neighbours are filaments. Meaning is activity that spreads and fades.', Lens: SpaceLens },
  { id: 'stream', title: 'Stream', chapters: '5–7', blurb: 'One vector per token travels down through twelve layers; every block adds to it; the answer can be read early.', Lens: StreamLens },
  { id: 'attention', title: 'Attention', chapters: '8–9', blurb: 'A head is one reading rule. Its filaments run from each token back to what it reads.', Lens: AttentionLens },
  { id: 'features', title: 'Features', chapters: '10–12', blurb: 'A sparse dictionary pulls overlapped directions apart into features you can name.', Lens: FeaturesLens },
  { id: 'circuit', title: 'Circuit', chapters: '13–17', blurb: 'Heads and features pass information along a graph; patch a node and the output moves.', Lens: CircuitLens },
]

export default function LensesPane() {
  return (
    <div className={s.pane}>
      <header className={s.intro}>
        <h1 className={s.title}>Lenses</h1>
        <p className={s.lede}>
          One live prototype per lens on example data, drawn with the tokens. Change a dial and these re-skin in
          place. Each caption says what is fake.
        </p>
        <nav className={s.jump} aria-label="Lenses on this page">
          {LENSES.map((l) => (
            <a key={l.id} href={`#lens-${l.id}`} className={s.jumpLink}>
              {l.title}
            </a>
          ))}
        </nav>
      </header>
      {LENSES.map((l) => {
        const { Lens } = l
        return (
          <section key={l.id} id={`lens-${l.id}`} className={`${ui.card} ${s.card}`} aria-labelledby={`lens-h-${l.id}`}>
            <div className={s.cardHead}>
              <h2 id={`lens-h-${l.id}`} className={ui.cardTitle}>
                {l.title}
              </h2>
              <span className={`${ui.tag} ${ui.tagAmber}`}>chapters {l.chapters}</span>
            </div>
            <p className={s.blurb}>{l.blurb}</p>
            <Lens />
          </section>
        )
      })}
    </div>
  )
}
