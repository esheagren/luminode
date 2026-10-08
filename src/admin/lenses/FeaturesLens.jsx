import { useRef, useState } from 'react'
import { useCanvasSize, usePalette } from '../lib/useCanvas.js'
import { useAnimationFrame } from '../lib/useAnimationFrame.js'
import { rgba, mix } from '../lib/tokens.js'
import ui from '../ui.module.css'
import s from './lens.module.css'

const TOKENS = ['She', 'said', '“', 'Paris', 'is', 'beautiful', '”', 'and', 'left', '.']

// Fake sparse features: explanation string and the tokens it fires on, with a made-up activation.
// Every token has between three and five features.
const FEATURES = [
  { label: 'beginning of a sentence', fires: { 0: 0.9 } },
  { label: 'tokens inside quotation marks', fires: { 3: 0.7, 4: 0.8, 5: 0.85 } },
  { label: 'names of cities', fires: { 3: 0.95 } },
  { label: 'quotation-mark punctuation', fires: { 2: 0.9, 6: 0.9 } },
  { label: 'speech verbs (said, asked)', fires: { 1: 0.9, 2: 0.3 } },
  { label: 'positive adjectives', fires: { 5: 0.9, 4: 0.2 } },
  { label: 'sentence-final punctuation', fires: { 9: 0.95, 8: 0.3 } },
  { label: 'pronouns referring to a person', fires: { 0: 0.85, 1: 0.25, 8: 0.2 } },
  { label: 'verbs of leaving or motion', fires: { 8: 0.9, 7: 0.2 } },
  { label: 'the copula "is"', fires: { 4: 0.9 } },
  { label: 'coordinating conjunctions', fires: { 7: 0.9 } },
  { label: 'end of quoted speech', fires: { 6: 0.6, 7: 0.4 } },
  { label: 'subject of a clause', fires: { 0: 0.7, 3: 0.6 } },
  { label: 'past-tense verbs', fires: { 1: 0.8, 8: 0.8 } },
  { label: 'start of quoted speech', fires: { 2: 0.8, 3: 0.3 } },
  { label: 'end of a sentence or document', fires: { 9: 0.8, 6: 0.2, 5: 0.5 } },
  { label: 'tokens after a quote closes', fires: { 7: 0.5, 9: 0.3, 8: 0.3 } },
]

export default function FeaturesLens() {
  const wrap = useRef(null)
  const canvas = useRef(null)
  const { w: W, h: H } = useCanvasSize(wrap, canvas)
  const p = usePalette()
  const [hover, setHover] = useState({ feature: -1, token: -1 })
  const st = useRef({ hoverAt: 0, prev: null, labelKey: '', labels: [] })

  const layout = () => {
    const labelW = Math.min(W * 0.42, p.textSm * 20)
    const cellW = (W - labelW - p.textSm) / TOKENS.length
    const narrow = cellW < p.textLg * 3
    const top = p.textMd * (narrow ? 3.6 : 2.6)
    const rowH = (H - top - p.textSm) / FEATURES.length
    return { labelW, top, rowH, cellW, narrow }
  }

  const { reduced, redraw } = useAnimationFrame(
    (t, dt, now) => {
      const ctx = canvas.current?.getContext('2d')
      if (!ctx || !W || !H) return
      const S = st.current
      const key = `${hover.feature}:${hover.token}`
      if (S.prev !== key) {
        S.prev = key
        S.hoverAt = now
      }
      const ease = reduced ? 1 : 1 - Math.pow(1 - Math.min(1, (now - S.hoverAt) / p.quarter), 3)
      const { labelW, top, rowH, cellW, narrow } = layout()
      const anyHover = hover.feature >= 0 || hover.token >= 0

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = rgba(p.field, 1)
      ctx.fillRect(0, 0, W, H)

      const colX = (i) => labelW + cellW * (i + 0.5)
      const litToken = (i) =>
        hover.token === i || (hover.feature >= 0 && FEATURES[hover.feature].fires[i] !== undefined)
      const litFeature = (f) =>
        hover.feature === f || (hover.token >= 0 && FEATURES[f].fires[hover.token] !== undefined)

      // token header, display face
      TOKENS.forEach((tok, i) => {
        const lit = litToken(i)
        const col = lit ? mix(p.fg, p.amber, ease) : p.fg
        const al = anyHover && !lit ? 1 - 0.55 * ease : 1
        ctx.font = `italic ${narrow ? p.textSm : p.textLg}px ${p.fontDisplay}`
        ctx.fillStyle = rgba(col, al)
        if (narrow) {
          ctx.save()
          ctx.translate(colX(i), top * 0.75)
          ctx.rotate(-Math.PI / 4)
          ctx.textAlign = 'left'
          ctx.textBaseline = 'middle'
          ctx.fillText(tok, 0, 0)
          ctx.restore()
        } else {
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(tok, colX(i), top * 0.5)
        }
        if (lit) {
          ctx.fillStyle = rgba(p.amber, 0.08 * ease)
          ctx.fillRect(colX(i) - cellW / 2, top, cellW, H - top - p.textSm)
        }
      })

      // feature labels truncated to the label column; measured only when the column or the type changes
      ctx.font = `${p.textXs}px ${p.fontMono}`
      const labelKey = `${labelW}|${p.textXs}|${p.fontMono}`
      if (S.labelKey !== labelKey) {
        S.labelKey = labelKey
        S.labels = FEATURES.map((f) => {
          let shown = f.label
          while (ctx.measureText(shown).width > labelW - p.textSm && shown.length > 4) shown = shown.slice(0, -2)
          return shown !== f.label ? shown.slice(0, -1) + '…' : shown
        })
      }

      // feature rows
      FEATURES.forEach((f, fi) => {
        const y = top + rowH * (fi + 0.5)
        const lit = litFeature(fi)
        const al = anyHover && !lit ? 1 - 0.55 * ease : 1
        ctx.strokeStyle = rgba(p.fg, 0.05)
        ctx.beginPath()
        ctx.moveTo(p.textSm * 0.5, y + rowH / 2)
        ctx.lineTo(W - p.textSm * 0.5, y + rowH / 2)
        ctx.stroke()
        if (lit) {
          ctx.fillStyle = rgba(p.amber, 0.06 * ease)
          ctx.fillRect(0, y - rowH / 2, W, rowH)
        }
        ctx.font = `${p.textXs}px ${p.fontMono}`
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = rgba(lit ? mix(p.fg, p.amber, ease) : p.mute, al)
        ctx.fillText(S.labels[fi], p.textSm * 0.5, y)

        TOKENS.forEach((tok, ti) => {
          const v = f.fires[ti]
          if (v === undefined) return
          const bothLit = lit && litToken(ti)
          const barW = (cellW - p.textXs * 0.6) * v
          const barH = rowH * 0.5
          const x = colX(ti) - (cellW - p.textXs * 0.6) / 2
          const col = bothLit && anyHover ? mix(p.phosphor, p.amber, ease) : p.phosphor
          ctx.fillStyle = rgba(col, (0.35 + 0.5 * v) * al)
          ctx.fillRect(x, y - barH / 2, barW, barH)
        })
      })
    },
    [W, H, p, hover],
  )

  const select = (next) => {
    if (next.feature !== hover.feature || next.token !== hover.token) {
      setHover(next)
      if (reduced) redraw()
    }
  }
  const onMove = (e) => {
    const r = canvas.current.getBoundingClientRect()
    const mx = e.clientX - r.left
    const my = e.clientY - r.top
    const { labelW, top, rowH, cellW } = layout()
    let next = { feature: -1, token: -1 }
    if (my >= top) {
      const fi = Math.floor((my - top) / rowH)
      if (fi >= 0 && fi < FEATURES.length) next = { feature: fi, token: -1 }
    } else if (mx >= labelW) {
      const ti = Math.floor((mx - labelW) / cellW)
      if (ti >= 0 && ti < TOKENS.length) next = { feature: -1, token: ti }
    }
    select(next)
  }
  // left/right walk the tokens, up/down walk the features
  const onKey = (e) => {
    const nt = TOKENS.length
    const nf = FEATURES.length
    if (e.key === 'ArrowRight') select({ feature: -1, token: (hover.token + 1 + nt) % nt })
    else if (e.key === 'ArrowLeft') select({ feature: -1, token: (hover.token - 1 + nt) % nt })
    else if (e.key === 'ArrowDown') select({ feature: (hover.feature + 1 + nf) % nf, token: -1 })
    else if (e.key === 'ArrowUp') select({ feature: (hover.feature - 1 + nf) % nf, token: -1 })
    else if (e.key === 'Escape') select({ feature: -1, token: -1 })
    else return
    e.preventDefault()
  }

  const announce = (() => {
    if (hover.token >= 0) {
      const fs = FEATURES.filter((f) => f.fires[hover.token] !== undefined).map((f) => f.label)
      return `${TOKENS[hover.token]}, token ${hover.token + 1} of ${TOKENS.length}. Features: ${fs.join('; ')}.`
    }
    if (hover.feature >= 0) {
      const f = FEATURES[hover.feature]
      const toks = Object.keys(f.fires).map((i) => `${TOKENS[i]} ${Math.round(f.fires[i] * 100)}%`)
      return `${f.label}, feature ${hover.feature + 1} of ${FEATURES.length}. Fires on ${toks.join(', ')}.`
    }
    return ''
  })()

  return (
    <div className={s.lens}>
      <div ref={wrap} className={`${s.stage} ${s.stageTall}`}>
        <canvas
          ref={canvas}
          tabIndex={0}
          role="img"
          aria-label="Features lens: a ten-token sentence across the top and seventeen sparse features as rows, each with bars under the tokens it fires on. Left and right arrows move between tokens, up and down between features."
          onPointerMove={onMove}
          onPointerLeave={() => select({ feature: -1, token: -1 })}
          onKeyDown={onKey}
          onFocus={() => {
            if (hover.feature < 0 && hover.token < 0) select({ feature: -1, token: 0 })
          }}
          onBlur={() => select({ feature: -1, token: -1 })}
        />
      </div>
      <div className={ui.srOnly} aria-live="polite">
        {announce}
      </div>
      <p className={s.hint}>
        hover a feature to light the tokens it fires on · hover a token to light its features · arrows from the keyboard
      </p>
      <p className={ui.caption}>
        <em>Fake:</em> the features, their explanation strings and their activations are written by hand (each token
        carries three to five). <em>Real:</em> the shape of a dictionary-learning readout: sparse features per token,
        bar length = activation, hover to cross-highlight.
      </p>
    </div>
  )
}
