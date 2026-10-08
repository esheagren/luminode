import { AUDIT_ITEMS, GROUPS, AUDIT_STATUSES } from '../data/audit.js'
import { createStore, useStore } from '../lib/sessionStore.js'
import ui from '../ui.module.css'
import s from './AuditPane.module.css'

const cap = (k) => k.charAt(0).toUpperCase() + k.slice(1)

// Lives outside the component so status changes survive switching panes.
const statusStore = createStore(Object.fromEntries(AUDIT_ITEMS.map((i) => [i.id, i.status])))

export default function AuditPane() {
  const statuses = useStore(statusStore)
  const setStatuses = statusStore.set
  const counts = AUDIT_STATUSES.map((st) => [st, Object.values(statuses).filter((v) => v === st).length])

  return (
    <div className={s.pane}>
      <header className={s.intro}>
        <div>
          <h1 className={s.title}>Audit</h1>
          <p className={s.lede}>
            Findings from the 2026-10-07 audit of the legacy app, grouped, with the plan step that absorbs each one.
            Status changes last for the session.
          </p>
        </div>
        <dl className={s.counts}>
          {counts.map(([st, n]) => (
            <div key={st} className={`${s.count} ${s[`count${cap(st)}`] || ''}`}>
              <dt>{st}</dt>
              <dd>{n}</dd>
            </div>
          ))}
          <div className={s.count}>
            <dt>total</dt>
            <dd>{AUDIT_ITEMS.length}</dd>
          </div>
        </dl>
      </header>

      {GROUPS.map((g) => {
        const items = AUDIT_ITEMS.filter((i) => i.group === g)
        const open = items.filter((i) => statuses[i.id] === 'open').length
        return (
          <section key={g} className={s.group} aria-labelledby={`g-${g}`}>
            <h2 id={`g-${g}`} className={s.groupTitle}>
              {g}
              <span className={s.groupCount}>
                {open} open / {items.length}
              </span>
            </h2>
            <ul className={s.list}>
              {items.map((item) => (
                <li key={item.id} className={`${s.item} ${s[`item${cap(statuses[item.id])}`] || ''}`}>
                  <span className={s.text}>{item.text}</span>
                  <span className={`${ui.tag} ${s.step}`}>step {item.step}</span>
                  <label className={s.status}>
                    <span className={ui.srOnly}>Status for: {item.text}</span>
                    <select
                      className={`${ui.select} ${ui.mono}`}
                      value={statuses[item.id]}
                      onChange={(e) => setStatuses((st) => ({ ...st, [item.id]: e.target.value }))}
                    >
                      {AUDIT_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
