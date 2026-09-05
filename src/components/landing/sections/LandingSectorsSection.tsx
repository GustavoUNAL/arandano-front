import { useState } from 'react'
import { cn } from '../../../lib/utils'
import { AppLauncherIcon } from '../../AppLauncherIcon'
import { LandingAppModal } from '../LandingAppModal'
import { LANDING_APPS, type LandingApp } from '../landingApps'
import { LandingSection, LandingSectionHeader } from './shared'

type Sector = {
  id: string
  name: string
  modules: string[]
}

const SECTORS: Sector[] = [
  {
    id: 'cafes',
    name: 'Cafeterías',
    modules: ['sales', 'inventory', 'recipes', 'cash-close'],
  },
  {
    id: 'rest',
    name: 'Restaurantes',
    modules: ['sales', 'inventory', 'recipes', 'staff'],
  },
  {
    id: 'barber',
    name: 'Barberías',
    modules: ['booking', 'customers', 'sales', 'settings'],
  },
  {
    id: 'shop',
    name: 'Comercios',
    modules: ['sales', 'inventory', 'products', 'shop'],
  },
  {
    id: 'svc',
    name: 'Empresas de servicios',
    modules: ['booking', 'customers', 'projects', 'analytics'],
  },
]

function appsFor(sector: Sector): LandingApp[] {
  return sector.modules.map((id) => LANDING_APPS[id]).filter(Boolean)
}

export function LandingSectorsSection() {
  const [active, setActive] = useState(SECTORS[0].id)
  const [open, setOpen] = useState<LandingApp | null>(null)
  const current = SECTORS.find((s) => s.id === active) ?? SECTORS[0]
  const apps = appsFor(current)

  return (
    <LandingSection id="sectores" ariaLabelledBy="sectors-title" className="lp-sectors">
      <LandingSectionHeader
        titleId="sectors-title"
        title="Una plataforma. Distintos negocios."
        subtitle="Los mismos módulos se combinan según el tipo de operación."
      />
      <div className="lp-sectors__tabs" role="tablist" aria-label="Sectores">
        {SECTORS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={s.id === active}
            className={cn('lp-sectors__tab', s.id === active && 'is-on')}
            onClick={() => setActive(s.id)}
          >
            {s.name}
          </button>
        ))}
      </div>
      <p className="lp-sectors__label">Módulos aplicables</p>
      <div className="lp-apps__board" aria-live="polite">
        {apps.map((app) => (
          <button
            key={`${current.id}-${app.view}`}
            type="button"
            className={`lp-apps__tile lp-apps__tile--${app.tone} is-in`}
            aria-haspopup="dialog"
            aria-expanded={open?.view === app.view}
            onClick={() => setOpen(app)}
          >
            <span className="lp-apps__icon" aria-hidden>
              <AppLauncherIcon view={app.view} className="lp-apps__glyph" />
            </span>
            <span className="lp-apps__label">{app.name}</span>
          </button>
        ))}
      </div>
      {open ? <LandingAppModal app={open} onClose={() => setOpen(null)} /> : null}
    </LandingSection>
  )
}
