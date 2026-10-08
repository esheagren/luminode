import { useRef, useState, useMemo } from 'react'
import { useCanvasSize, usePalette } from '../lib/useCanvas.js'
import { useAnimationFrame } from '../lib/useAnimationFrame.js'
import { rgba, mix } from '../lib/tokens.js'
import ui from '../ui.module.css'
import s from './lens.module.css'

const TOKENS = ['The', 'Eiffel', 'Tower', 'is', 'in', 'the']
const LAYERS = 12
// Fake logit-lens top token for the last position at each layer, converging on Paris by layer 9.
const LOGIT_LENS = [
  ['the', 0.09], ['of', 0.11], ['the', 0.12], ['in', 0.15], ['located', 0.19], ['located', 0.24],
  ['France', 0.31], ['France', 0.38], ['Europe', 0.41], ['Paris', 0.52], ['Paris', 0.61], ['Paris', 0.73],
]
const OPS = ['attn-read', 'attn-write', 'mlp', 'mlp-write']

function buildSteps() {
  const steps = [{ kind: 'embed', layer: -1 }, { kind: '+pos', layer: -1 }]
  for (let l = 0; l < LAYERS; l++) OPS.forEach((kind) => steps.push({ kind, layer: l }))
  steps.push({ kind: 'unembed', layer: LAYERS })
  return steps
}

export default function StreamLens() {
  const wrap = useRef(null)
  const canvas = useRef(null)
  const { w: W, h: H } = useCanvasSize(wrap, canvas)
  const p = usePalette()
  const steps = useMemo(buildSteps, [])
  const [step, setStep] = useState(2)
  const [playing, setPlaying] = useState(false)
  const st = useRef({ lastAdvance: 0, stepChangedAt: 0, prevStep: -1 })

  const { reduced } = useAnimationFrame(
    (t, dt, now) => {
      const ctx = canvas.current?.getContext('2d')
      if (!ctx || !W || !H) return
      const S = st.current
      const BEAT = p.beat
      if (S.prevStep !== step) {
        S.prevStep = step
        S.stepChangedAt = now
      }
      if (playing && !reduced && now - S.lastAdvance >= BEAT) {
        S.lastAdvance = now
        setStep((i) => (i + 1 < steps.length ? i + 1 : 0))
      }
      const cur = steps[step]
      const since = reduced ? BEAT : now - S.stepChangedAt
      const ease = 1 - Math.pow(1 - Math.min(1, since / (BEAT / 2)), 3)

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = rgba(p.field, 1)
      ctx.fillRect(0, 0, W, H)

      const mono = p.fontMono
      const padL = p.textSm * 3.4
      const stairW = Math.min(W * 0.3, p.textSm * 11)
      const padR = stairW + p.textSm
      const colW = (W - padL - padR) / TOKENS.length
      const narrow = colW < p.textSm * 4.5
      const top = p.textMd * (narrow ? 3.4 : 2.4)
      const bottom = p.textMd * 2.2
      const rowH = (H - top - bottom) / LAYERS
      const colX = (i) => padL + colW * (i + 0.5)
      const rowY = (l) => top + rowH * (l + 0.5)

      // layer rows
      for (let l = 0; l < LAYERS; l++) {
        const y = rowY(l)
        const active = cur.layer === l
        ctx.strokeStyle = rgba(p.fg, active ? 0.18 : 0.06)
        ctx.beginPath()
        ctx.moveTo(padL, y)
        ctx.lineTo(W - padR, y)
        ctx.stroke()
        ctx.font = `${p.textXs}px ${mono}`
        ctx.textAlign = 'right'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = rgba(active ? p.amber : p.mute, active ? 1 : 0.8)
        ctx.fillText(`L${l}`, padL - p.textXs * 0.8, y)
        if (active) {
          ctx.fillStyle = rgba(p.amber, 0.06)
          ctx.fillRect(padL, y - rowH / 2, W - padL - padR, rowH)
        }
      }

      // tokens as column headers
      TOKENS.forEach((tok, i) => {
        ctx.font = `${narrow ? p.textXs : p.textSm}px ${mono}`
        ctx.fillStyle = rgba(p.fg, 1)
        if (narrow) {
          ctx.save()
          ctx.translate(colX(i), top * 0.7)
          ctx.rotate(-Math.PI / 4)
          ctx.textAlign = 'left'
          ctx.textBaseline = 'middle'
          ctx.fillText(tok, 0, 0)
          ctx.restore()
        } else {
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(tok, colX(i), top * 0.45)
        }
      })

      // residual lines: one per token, width grows with each write that has happened at or above that layer
      const writesDone = (l) => {
        let n = 0
        for (let i = 0; i <= step; i++) {
          const sp = steps[i]
          if ((sp.kind === 'attn-write' || sp.kind === 'mlp-write') && sp.layer <= l) n++
        }
        return n
      }
      const startY = top * 0.75
      const endY = H - bottom * 0.6
      TOKENS.forEach((tok, i) => {
        const x = colX(i)
        const isLast = i === TOKENS.length - 1
        for (let l = -1; l < LAYERS; l++) {
          const y0 = l < 0 ? startY : rowY(l)
          const y1 = l + 1 < LAYERS ? rowY(l + 1) : endY
          const writes = writesDone(l)
          const width = 1 + writes * 0.28
          const warmth = Math.min(1, writes / (LAYERS * 2))
          const processed = l < 0 ? step >= 0 : cur.layer > l || cur.kind === 'unembed'
          ctx.strokeStyle = rgba(mix(p.fg, p.amber, warmth), (isLast ? 0.85 : 0.45) * (processed ? 1 : 0.35))
          ctx.lineWidth = width
          ctx.beginPath()
          ctx.moveTo(x, y0)
          ctx.lineTo(x, y1)
          ctx.stroke()
        }
        ctx.lineWidth = 1
      })

      // the current operation
      if (cur.layer >= 0 && cur.layer < LAYERS) {
        const y = rowY(cur.layer)
        if (cur.kind === 'attn-read') {
          // each token reads from earlier tokens: arcs from j to i with fake weights
          TOKENS.forEach((tok, i) => {
            for (let j = 0; j <= i; j++) {
              const wgt = j === i - 1 ? 0.6 : j === 0 ? 0.35 : 0.1
              const x1 = colX(j)
              const x2 = colX(i)
              const lift = Math.abs(x2 - x1) * 0.35 + rowH * 0.3
              ctx.strokeStyle = rgba(p.phosphor, wgt * ease * (i === TOKENS.length - 1 ? 1 : 0.5))
              ctx.lineWidth = 1 + wgt * 2
              ctx.beginPath()
              ctx.moveTo(x1, y)
              ctx.quadraticCurveTo((x1 + x2) / 2, y - lift, x2, y)
              ctx.stroke()
            }
          })
          ctx.lineWidth = 1
        } else if (cur.kind === 'attn-write' || cur.kind === 'mlp-write') {
          TOKENS.forEach((tok, i) => {
            const x = colX(i)
            const r = (cur.kind === 'mlp-write' ? 9 : 7) * (0.6 + 0.4 * ease)
            const gg = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2)
            gg.addColorStop(0, rgba(p.ember, 0.7 * (1 - ease * 0.5)))
            gg.addColorStop(1, rgba(p.ember, 0))
            ctx.fillStyle = gg
            ctx.beginPath()
            ctx.arc(x, y, r * 2.2, 0, 7)
            ctx.fill()
            ctx.fillStyle = rgba(p.ember, 0.95)
            ctx.beginPath()
            ctx.arc(x, y, 2.5, 0, 7)
            ctx.fill()
          })
        } else if (cur.kind === 'mlp') {
          TOKENS.forEach((tok, i) => {
            const x = colX(i)
            const bw = colW * 0.55 * ease
            ctx.fillStyle = rgba(p.phosphor, 0.18)
            ctx.fillRect(x - bw / 2, y - rowH * 0.3, bw, rowH * 0.6)
            ctx.strokeStyle = rgba(p.phosphor, 0.7)
            ctx.strokeRect(x - bw / 2, y - rowH * 0.3, bw, rowH * 0.6)
          })
        }
      }
      if (cur.kind === 'unembed') {
        const x = colX(TOKENS.length - 1)
        const y = H - bottom * 0.6
        ctx.font = `italic ${p.textLg}px ${p.fontDisplay}`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = rgba(p.amber, ease)
        ctx.fillText('→ Paris', x, y - p.textLg * 0.2)
      }

      // step label
      ctx.font = `${p.textXs}px ${mono}`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'bottom'
      ctx.fillStyle = rgba(p.mute, 1)
      const label = cur.layer >= 0 && cur.layer < LAYERS ? `L${cur.layer} · ${cur.kind}` : cur.kind
      ctx.fillText(`step ${step + 1}/${steps.length}  ${label}`, padL, H - p.textXs * 0.5)

      // logit-lens staircase on the right
      const sx = W - padR + p.textSm * 0.8
      ctx.font = `${p.textXs}px ${mono}`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = rgba(p.mute, 1)
      ctx.fillText('logit lens', sx, top * 0.45)
      for (let l = 0; l < LAYERS; l++) {
        const [tok, prob] = LOGIT_LENS[l]
        const y = rowY(l)
        const seen = cur.layer >= l || cur.kind === 'unembed'
        const isParis = tok === 'Paris'
        const barW = (stairW - p.textSm * 4.5) * prob
        ctx.fillStyle = rgba(isParis ? p.amber : p.phosphor, seen ? 0.25 : 0.06)
        ctx.fillRect(sx, y - rowH * 0.22, barW, rowH * 0.44)
        ctx.fillStyle = rgba(isParis ? p.amber : p.fg, seen ? 0.95 : 0.3)
        ctx.font = `${isParis ? 'italic ' : ''}${p.textSm}px ${isParis ? p.fontDisplay : mono}`
        ctx.fillText(tok, sx + barW + p.textXs * 0.6, y)
      }
    },
    [W, H, p, step, playing, steps],
  )

  const cur = steps[step]
  return (
    <div className={s.lens}>
      <div className={s.controls}>
        <button
          type="button"
          className={ui.button}
          onClick={() => setPlaying((v) => !v)}
          aria-pressed={playing}
          disabled={reduced}
          title={reduced ? 'Playback is off under reduced motion; use the scrubber' : undefined}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <label className={`${ui.field} ${s.grow}`}>
          <span className={ui.label}>
            Sub-step {step + 1} of {steps.length} · {cur.layer >= 0 && cur.layer < LAYERS ? `L${cur.layer} ` : ''}
            {cur.kind}
          </span>
          <input
            type="range"
            className={ui.range}
            min="0"
            max={steps.length - 1}
            value={step}
            onChange={(e) => {
              setPlaying(false)
              setStep(Number(e.target.value))
            }}
          />
        </label>
      </div>
      <div ref={wrap} className={s.stage}>
        <canvas
          ref={canvas}
          role="img"
          aria-label="Stream lens: six tokens as columns, twelve layers as rows, one residual line per token thickening as blocks write into it, and a logit-lens staircase on the right."
        />
      </div>
      <p className={ui.caption}>
        <em>Fake:</em> every number, the attention arcs, the residual widths and the logit-lens tokens (hard-coded to
        converge on Paris at layer 9). <em>Real:</em> the sub-step order of a GPT-2 forward pass (embed, +pos, then
        attention read/write and MLP/write per layer, then unembed), stepped one per beat.
      </p>
    </div>
  )
}
