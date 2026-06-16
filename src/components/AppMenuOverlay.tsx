import { type CSSProperties, useEffect } from 'react'
import { buildLauncherApps } from '../lib/appLauncher'
import { AppLauncherIcon, LAUNCHER_GROUP_CLASS } from './AppLauncherIcon'

export function AppMenuOverlay({
  open,
  onClose,
  onOpenApp,
  canViewFinance = false,
  canViewTasks = false,
}: {
  open: boolean
  onClose: () => void
  onOpenApp: (view: string) => void
  canViewFinance?: boolean
  canViewTasks?: boolean
}) {
  const apps = buildLauncherApps({ canViewFinance, canViewTasks })

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="odoo-app-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menú de aplicaciones"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="odoo-app-menu__panel">
        <header className="odoo-app-menu__head">
          <h2 className="odoo-app-menu__title">Aplicaciones</h2>
          <button
            type="button"
            className="odoo-app-menu__close btn-secondary btn-compact"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            Cerrar
          </button>
        </header>
        <ul className="odoo-app-menu__grid">
          {apps.map((app, index) => (
            <li
              key={app.view}
              className="odoo-app-menu__cell"
              style={{ '--launcher-i': index } as CSSProperties}
            >
              <button
                type="button"
                className={`odoo-app-tile ${LAUNCHER_GROUP_CLASS[app.group]}`}
                onClick={() => {
                  onOpenApp(app.view)
                  onClose()
                }}
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
    </div>
  )
}
