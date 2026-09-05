import { useState } from 'react'
import { cn } from '../../../lib/utils'
import { GlassCard, LandingSection, LandingSectionHeader } from './shared'

type Sector = {
  id: string
  name: string
  modules: string[]
}

const SECTORS: Sector[] = [
  {
    id: 'cafes',
    name: 'Cafeterías',
    modules: ['Ventas', 'Inventario', 'Recetas', 'Cierre de caja'],
  },
  {
    id: 'rest',
    name: 'Restaurantes',
    modules: ['Ventas', 'Inventario', 'Recetas', 'Personal'],
  },
  {
    id: 'barber',
    name: 'Barberías',
    modules: ['Citas', 'Clientes', 'Ventas', 'Agenda pública'],
  },
  {
    id: 'shop',
    name: 'Comercios',
    modules: ['Ventas', 'Inventario', 'Catálogo', 'Tienda'],
  },
  {
    id: 'svc',
    name: 'Empresas de servicios',
    modules: ['Citas', 'Clientes', 'Proyectos', 'Analítica'],
  },
]

export function LandingSectorsSection() {
  const [active, setActive] = useState(SECTORS[0].id)
  const current = SECTORS.find((s) => s.id === active) ?? SECTORS[0]

  return (
    <LandingSection id="sectores" ariaLabelledBy="sectors-title" className="lp-sectors">
      <LandingSectionHeader
        align="left"
        titleId="sectors-title"
        title="Una plataforma. Diferentes negocios."
        subtitle="Los mismos módulos se combinan según el tipo de operación. No todos aplican igual en cada sector."
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
      <GlassCard className="lp-sectors__panel p-5 sm:p-6">
        <p className="lp-sectors__label">Módulos aplicables</p>
        <ul>
          {current.modules.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </GlassCard>
    </LandingSection>
  )
}
