import { useRef, useState, useMemo } from 'react'
import { useCanvasSize, usePalette } from '../lib/useCanvas.js'
import { useAnimationFrame } from '../lib/useAnimationFrame.js'
import { rgba, mix } from '../lib/tokens.js'
import ui from '../ui.module.css'
import s from './lens.module.css'

// A small, made-up slice of the IOI circuit. `effect` is the fake drop in logit difference when the node is patched.
const NODES = [
  { id: 'subj', label: 'subject is a name', kind: 'feature', layer: 0, effect: 0.4 },
  { id: 'dup', label: 'L0H1 duplicate token', kind: 'head', layer: 0, effect: 0.5 },
  { id: 'prev', label: 'L3H0 previous token', kind: 'head', layer: 3, effect: 0.3 },
  { id: 'ind', label: 'L5H5 induction', kind: 'head', layer: 5, effect: 0.6 },
  { id: 'sinh1', label: 'L7H3 S-inhibition', kind: 'head', layer: 7, effect: 0.7 },
  { id: 'sinh2', label: 'L8H6 S-inhibition', kind: 'head', layer: 8, effect: 0.7 },
  { id: 'nm1', label: 'L9H9 name mover', kind: 'head', layer: 9, effect: 1.1 },
  { id: 'nm2', label: 'L9H6 name mover', kind: 'head', layer: 9, effect: 0.6 },
  { id: 'nm3', label: 'L10H0 name mover', kind: 'head', layer: 10, effect: 0.5 },
  { id: 'out', label: 'logit difference', kind: 'output', layer: 12, effect: 0 },
]
const EDGES = [
  ['subj', 'dup', 0.6], ['subj', 'prev', 0.4], ['dup', 'sinh1', 0.7], ['dup', 'sinh2', 0.5],
  ['prev', 'ind', 0.8], ['ind', 'sinh1', 0.6], ['ind', 'sinh2', 0.6], ['sinh1', 'nm1', 0.9],
  ['sinh1', 'nm2', 0.5], ['sinh2', 'nm1', 0.7], ['sinh2', 'nm3', 0.5], ['nm1', 'out', 1], ['nm2', 'out', 0.6],
  ['nm3', 'out', 0.5], ['subj', 'nm1', 0.3],
]
const BASE_DIFF = 3.4

function layoutNodes() {
  const layers = [...new Set(NODES.map((n) => n.layer))].sort((a, b) => a - b)
  const col = Object.fromEntries(layers.map((l, i) => [l, i]))
  const byCol = {}
  return NODES.map((n) => {
    const c = col[n.layer]
    byCol[c] = (byCol[c] || 0) + 1
    return { ...n, col: c, rowIdx: byCol[c] - 1 }
  }).map((n, _, all) => {
    const inCol = all.filter((m) => m.col === n.col).length
    return { ...n, cols: layers.length, u: (n.col + 0.5) / layers.length, v: (n.rowIdx + 0.5) / inCol }
  })
}

export default function CircuitLens() {
  const wrap = useRef(null)
  const canvas = useRef(null)
  const { w: W, h: H } = useCanvasSize(wrap, canvas)
  const p = usePalette()
  const nodes = useMemo(layoutNodes, [])
  const [patched, setPatched] = useState(() => new Set())
  const st = useRef({ shown: BASE_DIFF, from: BASE_DIFF, target: BASE_DIFF, changedAt: 0 })

  const target = BASE_DIFF - NODES.filter((n) => patched.has(n.id)).reduce((a, n) => a + n.effect, 0)
  const toggle = (id) =>
    setPatched((set) => {
      const next = new Set(set)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const { reduced } = useAnimationFrame(
    (t, dt, now) => {
      const ctx = canvas.current?.getContext('2d')
      if (!ctx || !W || !H) return
      const S = st.current
      const BEAT = p.beat
      if (S.target !== target) {
        S.from = S.shown
        S.target = target
        S.changedAt = now
      }
      // the logit-difference bar moves to its new value over one beat
      const u = reduced ? 1 : Math.min(1, (now - S.changedAt) / BEAT)
      const e = 1 - Math.pow(1 - u, 3)
      S.shown = S.from + (S.target - S.from) * e
      const phase = reduced ? 0.5 : (t % BEAT) / BEAT

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = rgba(p.field, 1)
      ctx.fillRect(0, 0, W, H)

      const barW = Math.min(W * 0.18, p.textSm * 7)
      const padX = p.textSm * 1.5
      const padY = p.textMd * 2.2
      const gw = W - padX * 2 - barW - p.textSm
      const gh = H - padY * 2
      const pos = Object.fromEntries(nodes.map((n) => [n.id, [padX + n.u * gw, padY + n.v * gh]]))
      const isDim = (id) => patched.has(id)

      // influence edges, with a pulse travelling along each live edge every beat
      EDGES.forEach(([a, b, wgt]) => {
        const [x1, y1] = pos[a]
        const [x2, y2] = pos[b]
        const dead = isDim(a) || isDim(b)
        ctx.strokeStyle = rgba(dead ? p.mute : p.phosphor, dead ? 0.12 : 0.15 + wgt * 0.5)
        ctx.lineWidth = dead ? 1 : 0.5 + wgt * 2.5
        const cx = (x1 + x2) / 2
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.bezierCurveTo(cx, y1, cx, y2, x2, y2)
        ctx.stroke()
        if (!dead && !reduced) {
          const q = 1 - Math.pow(1 - phase, 2)
          const bx = (1 - q) ** 3 * x1 + 3 * (1 - q) ** 2 * q * cx + 3 * (1 - q) * q * q * cx + q ** 3 * x2
          const by = (1 - q) ** 3 * y1 + 3 * (1 - q) ** 2 * q * y1 + 3 * (1 - q) * q * q * y2 + q ** 3 * y2
          const gg = ctx.createRadialGradient(bx, by, 0, bx, by, 6)
          gg.addColorStop(0, rgba(p.amber, 0.6 * wgt))
          gg.addColorStop(1, rgba(p.amber, 0))
          ctx.fillStyle = gg
          ctx.beginPath()
          ctx.arc(bx, by, 6, 0, 7)
          ctx.fill()
        }
      })
      ctx.lineWidth = 1

      // nodes
      nodes.forEach((n) => {
        const [x, y] = pos[n.id]
        const dim = isDim(n.id)
        const col = n.kind === 'feature' ? p.phosphor : n.kind === 'output' ? p.amber : p.fg
        const r = n.kind === 'output' ? 7 : 5
        const gg = ctx.createRadialGradient(x, y, 0, x, y, r * 3)
        gg.addColorStop(0, rgba(col, dim ? 0.05 : 0.25))
        gg.addColorStop(1, rgba(col, 0))
        ctx.fillStyle = gg
        ctx.beginPath()
        ctx.arc(x, y, r * 3, 0, 7)
        ctx.fill()
        ctx.fillStyle = rgba(dim ? p.mute : col, dim ? 0.4 : 1)
        ctx.beginPath()
        if (n.kind === 'feature') ctx.rect(x - r, y - r, r * 2, r * 2)
        else ctx.arc(x, y, r, 0, 7)
        ctx.fill()
        if (dim) {
          ctx.strokeStyle = rgba(p.mute, 0.8)
          ctx.beginPath()
          ctx.moveTo(x - r - 2, y - r - 2)
          ctx.lineTo(x + r + 2, y + r + 2)
          ctx.stroke()
        }
        ctx.font = `${p.textXs}px ${p.fontMono}`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.lineWidth = 3
        ctx.lineJoin = 'round'
        ctx.strokeStyle = rgba(p.field, 0.9)
        const label = gw / n.cols < p.textXs * 9 ? n.label.split(' ')[0] : n.label
        ctx.strokeText(label, x, y + r + 3)
        ctx.fillStyle = rgba(dim ? p.mute : p.fg, dim ? 0.6 : 0.9)
        ctx.fillText(label, x, y + r + 3)
        ctx.lineWidth = 1
      })

      // logit-difference bar on the right
      const bx = W - padX - barW
      const by = padY
      const bh = gh
      ctx.strokeStyle = rgba(p.fg, 0.12)
      ctx.strokeRect(bx, by, barW, bh)
      const frac = Math.max(0, S.shown) / BASE_DIFF
      const fillH = bh * frac
      const warmth = Math.min(1, frac)
      ctx.fillStyle = rgba(mix(p.phosphor, p.amber, warmth), 0.75)
      ctx.fillRect(bx, by + bh - fillH, barW, fillH)
      ctx.font = `${p.textMd}px ${p.fontMono}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillStyle = rgba(p.fg, 1)
      ctx.fillText(S.shown.toFixed(2), bx + barW / 2, by - p.textXs * 0.4)
      ctx.font = `${p.textXs}px ${p.fontMono}`
      ctx.textBaseline = 'top'
      ctx.fillStyle = rgba(p.mute, 1)
      ctx.fillText('logit diff', bx + barW / 2, by + bh + p.textXs * 0.4)
      ctx.textAlign = 'left'
      ctx.fillText(`${patched.size} patched`, padX, padY * 0.3)
    },
    [W, H, p, patched, target, nodes],
  )

  return (
    <div className={s.lens}>
      <div ref={wrap} className={s.stage}>
        <canvas
          ref={canvas}
          role="img"
          aria-label="Circuit lens: ten heads and features laid out left to right by layer with influence edges, and a logit-difference bar that drops when a node is patched."
        />
      </div>
      <ul className={s.nodeList} aria-label="Patch a node">
        {NODES.filter((n) => n.kind !== 'output').map((n) => (
          <li key={n.id}>
            <button
              type="button"
              className={s.nodeButton}
              aria-pressed={patched.has(n.id)}
              onClick={() => toggle(n.id)}
            >
              {patched.has(n.id) ? 'unpatch' : 'patch'} {n.label}
            </button>
          </li>
        ))}
      </ul>
      <p className={ui.caption}>
        <em>Fake:</em> the nodes, edges and every effect size; this is a made-up slice of the IOI circuit, and the logit
        difference is simply base minus the sum of patched effects. <em>Real:</em> layered left-to-right layout,
        dimming a patched node and its edges, the bar easing to its new value over one beat.
      </p>
    </div>
  )
}
