import { useParams, NavLink } from 'react-router-dom'
import MapPane from './panes/MapPane.jsx'
import LensesPane from './panes/LensesPane.jsx'
import DialsPane from './panes/DialsPane.jsx'
import AuditPane from './panes/AuditPane.jsx'
import s from './AdminPage.module.css'

const PANES = [
  { id: 'map', label: 'Map', Component: MapPane },
  { id: 'lenses', label: 'Lenses', Component: LensesPane },
  { id: 'dials', label: 'Dials', Component: DialsPane },
  { id: 'audit', label: 'Audit', Component: AuditPane },
]

export default function AdminPage() {
  const { pane } = useParams()
  const current = PANES.find((p) => p.id === pane) || PANES[0]
  const Pane = current.Component

  return (
    <div className={s.shell}>
      <header className={s.header}>
        <div className={s.brand}>
          <span className={s.wordmark}>Luminode</span>
          <span className={s.sub}>design space</span>
        </div>
        <nav className={s.nav} aria-label="Panes">
          {PANES.map((p) => (
            <NavLink
              key={p.id}
              to={`/admin/${p.id}`}
              className={({ isActive }) => (isActive || (p.id === 'map' && !pane) ? `${s.tab} ${s.tabOn}` : s.tab)}
              aria-current={current.id === p.id ? 'page' : undefined}
              end
            >
              {p.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className={s.main} key={current.id}>
        <Pane />
      </main>
    </div>
  )
}
