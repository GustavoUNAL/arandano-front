import { PLATFORM_MODE } from '../appScope'
import { BRAND_NAME } from '../lib/brand'
import { buildLauncherApps } from '../lib/appLauncher'
import { AppLauncherIcon, LAUNCHER_GROUP_CLASS } from './AppLauncherIcon'
import { mobileViewClass } from './mobile/mobileView'
import { type CSSProperties } from 'react'

export function OdooHomeScreen({
  onOpenApp,
  canViewFinance = false,
  canViewTasks = false,
  companyName,
}: {
  onOpenApp: (view: string) => void
  canViewFinance?: boolean
  canViewTasks?: boolean
  companyName?: string | null
}) {
  const apps = buildLauncherApps({ canViewFinance, canViewTasks })

  return (
    <div className={mobileViewClass('home', 'odoo-home')}>
      <header className="odoo-home__hero">
        <p className="odoo-home__brand muted small">
          {companyName ? `${BRAND_NAME} · ${companyName}` : BRAND_NAME}
        </p>
        <h1 className="odoo-home__title">Aplicaciones</h1>
        <p className="odoo-home__lead muted">
          {PLATFORM_MODE
            ? 'Selecciona un módulo para comenzar'
            : 'Tu espacio de trabajo — como en Odoo'}
        </p>
      </header>
      <ul className="odoo-home__grid">
        {apps.map((app, index) => (
          <li
            key={app.view}
            className="odoo-home__cell"
            style={{ '--launcher-i': index } as CSSProperties}
          >
            <button
              type="button"
              className={`odoo-app-tile odoo-app-tile--home ${LAUNCHER_GROUP_CLASS[app.group]}`}
              onClick={() => onOpenApp(app.view)}
            >
              <span className="odoo-app-tile__icon" aria-hidden>
                <AppLauncherIcon view={app.view} />
              </span>
              <span className="odoo-app-tile__label">{app.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
