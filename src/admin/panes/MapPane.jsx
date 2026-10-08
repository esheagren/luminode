import { useState, useRef, useEffect } from 'react'
import { CHAPTERS, MOVEMENTS, LENSES, DATA_SOURCES, STATUSES } from '../data/curriculum.js'
import { createStore, useStore } from '../lib/sessionStore.js'
import ui from '../ui.module.css'
import s from './MapPane.module.css'

// Live outside the component so edits survive switching panes (the pane remounts on each tab).
const editStore = createStore({})
const statusStore = createStore(Object.fromEntries(CHAPTERS.map((c) => [c.n, c.status])))

const FIELDS = [
  ['claim', 'Claim'],
  ['performance', 'Performance'],
  ['try', 'Try'],
  ['bridge', 'Bridge'],
]

const cap = (k) => k.charAt(0).toUpperCase() + k.slice(1)
const dotClass = (st) => `${s.dot} ${s[`dot${cap(st)}`] || ''}`
const dataLabel = (id) => DATA_SOURCES.find((d) => d.id === id)?.label || id

export default function MapPane() {
  const [selected, setSelected] = useState(null)
  const edits = useStore(editStore)
  const statuses = useStore(statusStore)
  const setStatuses = statusStore.set
  const buttons = useRef({})
  const noteTitle = useRef(null)
  const returnTo = useRef(null)

  const chapter = CHAPTERS.find((c) => c.n === selected)
  const valueOf = (c, key) => edits[c.n]?.[key] ?? c[key]
  const edit = (n, key, value) => editStore.set((e) => ({ ...e, [n]: { ...(e[n] || {}), [key]: value } }))
  const close = () => {
    returnTo.current = selected
    setSelected(null)
  }

  // Focus follows the panel: its heading when a chapter opens, the chapter's button after Close.
  useEffect(() => {
    if (selected !== null) {
      noteTitle.current?.focus()
    } else if (returnTo.current !== null) {
      buttons.current[returnTo.current]?.focus()
      returnTo.current = null
    }
  }, [selected])

  return (
    <div className={`${s.pane} ${chapter ? s.paneOpen : ''}`}>
      <div className={s.path}>
        <header className={s.intro}>
          <h1 className={s.title}>Map</h1>
          <p className={s.lede}>
            Eighteen chapters in five movements. Click a chapter for its claim, performance, try and bridge; edits last
            for the session only.
          </p>
        </header>

        {MOVEMENTS.map((m) => (
          <section key={m.id} className={s.movement} aria-labelledby={`mv-${m.id}`}>
            <h2 id={`mv-${m.id}`} className={s.movementTitle}>
              <span className={s.numeral}>{m.numeral}</span>
              {m.title}
            </h2>
            <ol className={s.row}>
              {CHAPTERS.filter((c) => c.movement === m.id).map((c) => (
                <li key={c.n} className={s.item}>
                  <button
                    type="button"
                    ref={(el) => {
                      buttons.current[c.n] = el
                    }}
                    className={`${s.node} ${selected === c.n ? s.nodeOn : ''}`}
                    onClick={() => (selected === c.n ? close() : setSelected(c.n))}
                    aria-pressed={selected === c.n}
                  >
                    <span className={s.nodeHead}>
                      <span className={s.num}>{c.n}</span>
                      <span className={dotClass(statuses[c.n])} aria-hidden="true" />
                      <span className={ui.srOnly}>{statuses[c.n]}</span>
                    </span>
                    <span className={s.nodeTitle}>{c.title}</span>
                    <span className={s.tags}>
                      <span className={`${ui.tag} ${ui.tagAmber}`}>{c.lens}</span>
                      <span className={ui.tag}>{dataLabel(c.data).split(',')[0]}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        ))}

        <section className={s.legend} aria-label="Legend">
          <div className={s.legendGroup}>
            <span className={ui.label}>Lenses</span>
            <div className={s.legendRow}>
              {LENSES.map((l) => (
                <span key={l} className={`${ui.tag} ${ui.tagAmber}`}>
                  {l}
                </span>
              ))}
            </div>
          </div>
          <div className={s.legendGroup}>
            <span className={ui.label}>Data sources</span>
            <div className={s.legendRow}>
              {DATA_SOURCES.map((d) => (
                <span key={d.id} className={ui.tag}>
                  {d.label}
                </span>
              ))}
            </div>
          </div>
          <div className={s.legendGroup}>
            <span className={ui.label}>Status</span>
            <div className={s.legendRow}>
              {STATUSES.map((st) => (
                <span key={st} className={s.legendStatus}>
                  <span className={dotClass(st)} aria-hidden="true" />
                  {st}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>

      {chapter && (
        <aside className={s.note} aria-label={`Chapter ${chapter.n} note`}>
          <div className={s.noteHead}>
            <div>
              <span className={s.noteNum}>Chapter {chapter.n}</span>
              <h2 ref={noteTitle} tabIndex={-1} className={s.noteTitle}>
                {chapter.title}
              </h2>
            </div>
            <button type="button" className={`${ui.button} ${ui.buttonQuiet}`} onClick={close}>
              Close
            </button>
          </div>
          <div className={s.noteMeta}>
            <span className={`${ui.tag} ${ui.tagAmber}`}>{chapter.lens}</span>
            <span className={ui.tag}>{dataLabel(chapter.data)}</span>
            <label className={s.statusField}>
              <span className={ui.label}>Status</span>
              <select
                className={ui.select}
                value={statuses[chapter.n]}
                onChange={(e) => setStatuses((st) => ({ ...st, [chapter.n]: e.target.value }))}
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {FIELDS.map(([key, label]) => (
            <label key={key} className={s.noteField}>
              <span className={ui.label}>{label}</span>
              <textarea
                className={ui.textarea}
                rows={key === 'bridge' ? 2 : 3}
                value={valueOf(chapter, key)}
                onChange={(e) => edit(chapter.n, key, e.target.value)}
              />
            </label>
          ))}
          <p className={s.noteFoot}>Session only. Source of truth is CURRICULUM.md.</p>
        </aside>
      )}
    </div>
  )
}
