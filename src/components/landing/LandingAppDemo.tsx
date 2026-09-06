import type { LauncherIconView } from '../AppLauncherIcon'

type DemoRow = { label: string; value: string; mute?: boolean; warn?: boolean }

type AppDemo = {
  kicker: string
  title: string
  rows: DemoRow[]
  bars?: { label: string; pct: number; warn?: boolean }[]
}

const DEMOS: Partial<Record<LauncherIconView, AppDemo>> = {
  sales: {
    kicker: 'Ticket · caja',
    title: '$22.500',
    rows: [
      { label: 'Americano ×2', value: '$14.000' },
      { label: 'Latte ×1', value: '$8.500' },
      { label: 'Hace 2 min · efectivo', value: 'Caja', mute: true },
    ],
  },
  inventory: {
    kicker: 'Existencias · ahora',
    title: '24 ítems',
    rows: [
      { label: '3 insumos bajos', value: 'Reponer', warn: true },
    ],
    bars: [
      { label: 'Café blend · 8 kg', pct: 72 },
      { label: 'Leche · 12 L', pct: 54 },
      { label: 'Vasos 12 oz · 40 u', pct: 22, warn: true },
    ],
  },
  recipes: {
    kicker: 'Receta · Latte',
    title: '1 venta',
    rows: [
      { label: 'Café blend', value: '18 g' },
      { label: 'Leche', value: '180 ml' },
      { label: 'Vaso 12 oz', value: '1 u' },
      { label: 'Se descuenta al cobrar', value: 'Automático', mute: true },
    ],
  },
  booking: {
    kicker: 'Agenda · hoy',
    title: '6 citas',
    rows: [
      { label: '09:00 · Ana López', value: 'Confirmada' },
      { label: '11:30', value: 'Libre', mute: true },
      { label: '16:00 · Carlos M.', value: 'Confirmada' },
    ],
  },
  customers: {
    kicker: 'Clientes · historial',
    title: '128 fichas',
    rows: [
      { label: 'Ana López', value: '12 visitas' },
      { label: 'Carlos M.', value: 'Hoy · corte' },
      { label: 'María G.', value: 'Hace 8 días' },
    ],
  },
  analytics: {
    kicker: 'Indicadores · semana',
    title: '+18%',
    rows: [
      { label: 'Ventas', value: '$2.140.000' },
      { label: 'Ticket medio', value: '$26.800' },
      { label: 'Canal web', value: '28%' },
    ],
    bars: [
      { label: 'Lun–Dom', pct: 82 },
      { label: 'Vs. semana anterior', pct: 64 },
    ],
  },
  tasks: {
    kicker: 'Reglas · automáticas',
    title: '2 activas',
    rows: [
      { label: 'Si stock < 20%', value: 'Alerta' },
      { label: 'Si hay cita mañana', value: 'Recordatorio' },
      { label: 'Sin planillas de por medio', value: 'Sobre sus datos', mute: true },
    ],
  },
  'cash-close': {
    kicker: 'Cierre · hoy',
    title: 'Cuadrado',
    rows: [
      { label: 'Esperado', value: '$482.400' },
      { label: 'Contado', value: '$482.400' },
      { label: 'Diferencia', value: '$0' },
    ],
  },
  staff: {
    kicker: 'Equipo · turno',
    title: '4 en sala',
    rows: [
      { label: 'Laura', value: 'Barista · AM' },
      { label: 'Diego', value: 'Caja · PM' },
      { label: 'Sofía', value: 'Salón · tarde' },
    ],
  },
  products: {
    kicker: 'Catálogo · activo',
    title: '18 ítems',
    rows: [
      { label: 'Latte', value: '$8.500' },
      { label: 'Americano', value: '$7.000' },
      { label: 'Combo casa', value: '$22.000' },
    ],
  },
  shop: {
    kicker: 'Tienda · pedidos',
    title: '3 hoy',
    rows: [
      { label: '#1042 Combo casa', value: 'Pagado' },
      { label: '#1043 Latte ×2', value: 'En camino' },
      { label: 'Mismo stock que caja', value: 'Un inventario', mute: true },
    ],
  },
  projects: {
    kicker: 'Trabajos · en curso',
    title: '11 activos',
    rows: [
      { label: 'Instalación Norte', value: 'En curso' },
      { label: 'Mantenimiento 12', value: 'Por iniciar' },
      { label: 'Visita técnica', value: 'Entregado' },
    ],
  },
  settings: {
    kicker: 'Enlace · público',
    title: '3 hoy',
    rows: [
      { label: 'vos-ia.com/agenda/su-negocio', value: 'Activo' },
      { label: 'Reservas por el enlace', value: '14 esta semana' },
      { label: 'Sin copiar chats a la agenda', value: 'Entra sola', mute: true },
    ],
  },
}

export function LandingAppDemo({ view }: { view: LauncherIconView }) {
  const demo = DEMOS[view]
  if (!demo) return null

  return (
    <figure className="lp-app-demo" aria-label={`Demo de ${demo.kicker}`}>
      <header className="lp-app-demo__head">
        <p className="lp-app-demo__kicker">{demo.kicker}</p>
        <p className="lp-app-demo__title">{demo.title}</p>
      </header>
      <ul className="lp-app-demo__rows">
        {demo.rows.map((row) => (
          <li
            key={row.label}
            className={row.warn ? 'is-warn' : row.mute ? 'is-mute' : undefined}
          >
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </li>
        ))}
      </ul>
      {demo.bars ? (
        <ul className="lp-app-demo__bars">
          {demo.bars.map((bar) => (
            <li key={bar.label}>
              <div>
                <span>{bar.label}</span>
              </div>
              <span className="lp-app-demo__bar">
                <span
                  className={bar.warn ? 'is-warn' : undefined}
                  style={{ width: `${bar.pct}%` }}
                />
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </figure>
  )
}
