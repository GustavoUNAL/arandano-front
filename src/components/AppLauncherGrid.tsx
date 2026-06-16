import { type CSSProperties } from 'react'
import { AppLauncherIcon, LAUNCHER_GROUP_CLASS } from './AppLauncherIcon'
import type { LauncherApp } from '../lib/appLauncher'

export function AppLauncherGrid({
  apps,
  onOpen,
  title = 'Aplicaciones',
  lead,
}: {
  apps: LauncherApp[]
  onOpen: (view: LauncherApp['view']) => void
  title?: string
  lead?: string
}) {
  if (apps.length === 0) return null

  return (
    <section className="app-launcher" aria-labelledby="app-launcher-title">
      <header className="app-launcher__head">
        <h2 className="app-launcher__title" id="app-launcher-title">
          {title}
        </h2>
        {lead ? <p className="app-launcher__lead muted small">{lead}</p> : null}
      </header>
      <ul className="app-launcher__grid">
        {apps.map((app, index) => (
          <li
            key={app.view}
            className="app-launcher__cell"
            style={{ '--launcher-i': index } as CSSProperties}
          >
            <button
              type="button"
              className={`app-launcher-tile ${LAUNCHER_GROUP_CLASS[app.group]}`}
              onClick={() => onOpen(app.view)}
            >
              <span className="app-launcher-tile__icon" aria-hidden>
                <AppLauncherIcon view={app.view} />
              </span>
              <span className="app-launcher-tile__label">{app.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
