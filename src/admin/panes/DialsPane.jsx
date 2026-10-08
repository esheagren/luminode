import { useState, useEffect, useMemo } from 'react'
import {
  COLOR_TOKENS,
  FONT_TOKENS,
  FONT_CHOICES,
  EASING_PRESETS,
  getCommitted,
  readToken,
  setToken,
  setBaseSize,
  setBpm,
  resetTokens,
  exportTokensCss,
  toHex,
  parseMs,
  beatToBpm,
  bpmToDurations,
  useTokenVersion,
} from '../lib/tokens.js'
import ui from '../ui.module.css'
import s from './DialsPane.module.css'

const COLOR_ROLES = {
  ink: 'page',
  field: 'stage',
  raise: 'rail, cards',
  fg: 'text',
  mute: 'secondary',
  amber: 'query, near',
  ember: 'firing',
  phosphor: 'far, attenuated',
}
const cap = (k) => k.charAt(0).toUpperCase() + k.slice(1)
const FONT_LABELS = { 'font-display': 'Display', 'font-body': 'Interface', 'font-mono': 'Data' }

function familyOf(value) {
  return String(value).split(',')[0].replace(/["']/g, '').trim()
}

function readState() {
  const colors = Object.fromEntries(COLOR_TOKENS.map((k) => [k, toHex(readToken(k))]))
  const fonts = Object.fromEntries(FONT_TOKENS.map((k) => [k, familyOf(readToken(k))]))
  const bpm = beatToBpm(parseMs(readToken('beat')))
  const ease = readToken('ease').replace(/\s+/g, '')
  const base = parseFloat(getComputedStyle(document.documentElement).fontSize)
  return { colors, fonts, bpm, ease, base }
}

export default function DialsPane() {
  const version = useTokenVersion()
  const [state, setState] = useState(() => {
    getCommitted()
    return readState()
  })
  const [exported, setExported] = useState('')
  const [copied, setCopied] = useState(false)
  const [play, setPlay] = useState(false)

  // Keep inputs in step with the tokens if something else wrote them (e.g. Reset).
  useEffect(() => {
    setState(readState())
  }, [version])

  const durations = useMemo(() => bpmToDurations(state.bpm), [state.bpm])

  const onColor = (k, v) => {
    if (!/^#[0-9a-f]{6}$/i.test(v)) {
      setState((st) => ({ ...st, colors: { ...st.colors, [k]: v } }))
      return
    }
    setToken(k, v)
  }
  const onFont = (k, label) => {
    const choice = FONT_CHOICES[k].find((c) => c.label === label)
    if (choice) setToken(k, choice.value)
  }

  const doExport = () => {
    setExported(exportTokensCss())
    setCopied(false)
  }
  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(exported)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className={s.pane}>
      <header className={s.intro}>
        <div>
          <h1 className={s.title}>Dials</h1>
          <p className={s.lede}>
            The token system as controls. Every change writes a custom property on the root, so the lenses and the
            map re-skin in place. Reset restores the committed tokens.css.
          </p>
        </div>
        <div className={s.actions}>
          <button type="button" className={ui.button} onClick={doExport}>
            Export tokens.css
          </button>
          <button type="button" className={`${ui.button} ${ui.buttonQuiet}`} onClick={resetTokens}>
            Reset
          </button>
        </div>
      </header>

      <div className={s.grid}>
        <section className={ui.card} aria-labelledby="d-colour">
          <h2 id="d-colour" className={ui.cardTitle}>
            Colour
          </h2>
          <div className={s.colors}>
            {COLOR_TOKENS.map((k) => (
              <div key={k} className={s.colorRow}>
                <label className={s.colorLabel}>
                  <input
                    type="color"
                    className={ui.color}
                    value={/^#[0-9a-f]{6}$/i.test(state.colors[k]) ? state.colors[k] : '#000000'}
                    onChange={(e) => onColor(k, e.target.value)}
                  />
                  <span className={ui.srOnly}>{k} swatch</span>
                </label>
                <label className={s.colorName}>
                  <span className={s.colorKey}>--{k}</span>
                  <span className={s.colorRole}>{COLOR_ROLES[k]}</span>
                  <input
                    type="text"
                    className={`${ui.input} ${ui.mono} ${s.hex}`}
                    value={state.colors[k]}
                    onChange={(e) => onColor(k, e.target.value.trim())}
                    spellCheck={false}
                    aria-label={`${k} hex`}
                  />
                </label>
              </div>
            ))}
          </div>
        </section>

        <section className={ui.card} aria-labelledby="d-type">
          <h2 id="d-type" className={ui.cardTitle}>
            Type
          </h2>
          <div className={s.stack}>
            {FONT_TOKENS.map((k) => (
              <label key={k} className={ui.field}>
                <span className={ui.label}>{FONT_LABELS[k]}</span>
                <select className={ui.select} value={state.fonts[k]} onChange={(e) => onFont(k, e.target.value)}>
                  {FONT_CHOICES[k].map((c) => (
                    <option key={c.label} value={c.label}>
                      {c.label}
                      {c.loaded ? '' : ' (not loaded)'}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <label className={ui.field}>
              <span className={ui.label}>Base size: {state.base}px</span>
              <input
                type="range"
                className={ui.range}
                min="14"
                max="20"
                step="1"
                value={state.base}
                onChange={(e) => setBaseSize(Number(e.target.value))}
              />
            </label>
            <p className={ui.caption}>
              Only Cormorant Garamond, Manrope and JetBrains Mono are loaded; the other families fall back to the
              generic serif/sans/mono until their fonts are added to index.html.
            </p>
          </div>
        </section>

        <section className={ui.card} aria-labelledby="d-tempo">
          <h2 id="d-tempo" className={ui.cardTitle}>
            Tempo
          </h2>
          <div className={s.stack}>
            <label className={ui.field}>
              <span className={ui.label}>
                {state.bpm} bpm · beat {durations.beat}ms
              </span>
              <input
                type="range"
                className={ui.range}
                min="60"
                max="180"
                step="1"
                value={state.bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
              />
            </label>
            <dl className={s.durations}>
              {['eighth', 'quarter', 'beat', 'bar'].map((d) => (
                <div key={d} className={s.duration}>
                  <dt>--{d}</dt>
                  <dd>{durations[d]}ms</dd>
                </div>
              ))}
            </dl>
            <label className={ui.field}>
              <span className={ui.label}>Easing</span>
              <select
                className={`${ui.select} ${ui.mono}`}
                value={EASING_PRESETS.find((p) => p.value.replace(/\s+/g, '') === state.ease)?.value || EASING_PRESETS[0].value}
                onChange={(e) => setToken('ease', e.target.value)}
              >
                {EASING_PRESETS.map((p) => (
                  <option key={p.label} value={p.value}>
                    {p.label} · {p.value}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className={`${ui.card} ${s.specimen}`} aria-labelledby="d-specimen">
          <h2 id="d-specimen" className={ui.cardTitle}>
            Specimen
          </h2>
          <p className={s.display}>king − man + woman ≈ queen</p>
          <p className={s.body}>
            A word is a neuron: a core and a halo. Its neighbours are filaments. Meaning is activity that spreads along
            them and fades. Results arrive as an arpeggio, one per eighth; similarity is consonance.
          </p>
          <p className={s.mono}>cos(king, queen) = 0.7252 · dim 1024 · layer 9 · top-1 Paris 0.61</p>
        </section>

        <section className={`${ui.card} ${s.motion}`} aria-labelledby="d-motion">
          <div className={s.motionHead}>
            <h2 id="d-motion" className={ui.cardTitle}>
              Motion
            </h2>
            <button type="button" className={ui.button} onClick={() => setPlay((p) => !p)} aria-pressed={play}>
              {play ? 'Return' : 'Play'}
            </button>
          </div>
          <div className={s.strip}>
            {['eighth', 'quarter', 'beat', 'bar'].map((d) => (
              <div key={d} className={s.lane}>
                <span className={s.laneLabel}>
                  {d} · {durations[d]}ms
                </span>
                <div className={s.track}>
                  <span className={`${s.ball} ${s[`ball${cap(d)}`]} ${play ? s.ballOn : ''}`} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {exported && (
        <section className={`${ui.card} ${s.export}`} aria-labelledby="d-export">
          <div className={s.motionHead}>
            <h2 id="d-export" className={ui.cardTitle}>
              tokens.css
            </h2>
            <button type="button" className={ui.button} onClick={doCopy}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className={s.pre}>{exported}</pre>
        </section>
      )}
    </div>
  )
}
