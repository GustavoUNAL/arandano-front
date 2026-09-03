import {
  AppLauncherIcon,
  type LauncherIconView,
} from '../../AppLauncherIcon'

const ROW_A: { view: LauncherIconView; name: string }[] = [
  { view: 'booking', name: 'Agenda' },
  { view: 'pos', name: 'Punto de venta' },
  { view: 'products', name: 'Catálogo' },
  { view: 'shop', name: 'Tienda' },
  { view: 'inventory', name: 'Inventario' },
  { view: 'sales', name: 'Ventas' },
  { view: 'customers', name: 'Clientes' },
  { view: 'cash-close', name: 'Cierre de caja' },
]

const ROW_B: { view: LauncherIconView; name: string }[] = [
  { view: 'purchases', name: 'Compras' },
  { view: 'analytics', name: 'Finanzas' },
  { view: 'staff', name: 'Personal' },
  { view: 'tasks', name: 'Tareas' },
  { view: 'projects', name: 'Proyectos' },
  { view: 'services', name: 'Servicios' },
  { view: 'costs', name: 'Costos' },
  { view: 'recipes', name: 'Recetas' },
]

const ROW_C: { view: LauncherIconView; name: string }[] = [
  { view: 'booking', name: 'Citas' },
  { view: 'gastos', name: 'Gastos' },
  { view: 'explorer', name: 'Análisis' },
  { view: 'pos', name: 'Comandas' },
  { view: 'shop', name: 'Pedidos web' },
  { view: 'inventory', name: 'Stock' },
  { view: 'sales', name: 'Tickets' },
  { view: 'home', name: 'Inicio' },
]

function ModuleChip({
  view,
  name,
  index,
}: {
  view: LauncherIconView
  name: string
  index: number
}) {
  return (
    <span
      className="attio-float__chip"
      style={{ animationDelay: `${(index % 8) * -0.55}s` }}
    >
      <AppLauncherIcon view={view} className="attio-float__icon" />
      {name}
    </span>
  )
}

function MarqueeRow({
  items,
  reverse,
  duration,
}: {
  items: { view: LauncherIconView; name: string }[]
  reverse?: boolean
  duration: string
}) {
  const loop = [...items, ...items]
  return (
    <div className={reverse ? 'attio-float__row attio-float__row--rev' : 'attio-float__row'}>
      <div className="attio-float__track" style={{ animationDuration: duration }}>
        {loop.map((item, i) => (
          <ModuleChip
            key={`${item.name}-${i}`}
            view={item.view}
            name={item.name}
            index={i}
          />
        ))}
      </div>
    </div>
  )
}

export function LandingTestimonialsSection() {
  return (
    <section className="attio-float" aria-label="Módulos de VOS IA">
      <div className="attio-dots" aria-hidden />
      <MarqueeRow items={ROW_A} duration="42s" />
      <MarqueeRow items={ROW_B} reverse duration="48s" />
      <div className="attio-float__row-lg">
        <MarqueeRow items={ROW_C} duration="36s" />
      </div>
    </section>
  )
}
