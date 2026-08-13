import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { cn } from '../../../lib/utils'
import { fadeUp, GlassCard, LandingSection, LandingSectionHeader } from './shared'

type IndustryId =
  | 'cafeterias'
  | 'bares'
  | 'restaurantes'
  | 'tiendas'
  | 'ferreterias'
  | 'farmacias'
  | 'clinicas'
  | 'servicios'

type IndustryPreset = {
  id: IndustryId
  label: string
  products: string[]
  kpis: { label: string; value: string }[]
  inventory: { item: string; status: string }[]
  chart: { label: string; points: number[]; unit: string }
}

const INDUSTRIES: IndustryPreset[] = [
  {
    id: 'cafeterias',
    label: 'Cafeterías',
    products: ['Capuccino', 'Latte', 'Espresso'],
    kpis: [
      { label: 'Ventas del día', value: '$1.250.000' },
      { label: 'Margen promedio', value: '34,2%' },
      { label: 'Inventario de café', value: '12 kg' },
    ],
    inventory: [
      { item: 'Café molido', status: '4 días' },
      { item: 'Leche entera', status: '2 días' },
      { item: 'Vasos 12 oz', status: 'OK' },
    ],
    chart: { label: 'Ventas de la semana', unit: 'miles', points: [42, 58, 51, 73, 68, 91, 84] },
  },
  {
    id: 'bares',
    label: 'Bares',
    products: ['Mojito', 'Gin tonic', 'Cerveza artesanal'],
    kpis: [
      { label: 'Ventas del día', value: '$2.180.000' },
      { label: 'Ticket promedio', value: '$48.500' },
      { label: 'Hora pico', value: '21:00' },
    ],
    inventory: [
      { item: 'Ron blanco', status: '3 días' },
      { item: 'Menta fresca', status: 'Crítico' },
      { item: 'Hielo', status: 'OK' },
    ],
    chart: { label: 'Tickets por noche', unit: 'uds', points: [28, 36, 44, 61, 88, 96, 72] },
  },
  {
    id: 'restaurantes',
    label: 'Restaurantes',
    products: ['Pasta del día', 'Proteína a la plancha', 'Postre de temporada'],
    kpis: [
      { label: 'Cubiertos hoy', value: '186' },
      { label: 'Food cost', value: '28,4%' },
      { label: 'Rotación mesa', value: '2,1x' },
    ],
    inventory: [
      { item: 'Proteína res', status: '2 días' },
      { item: 'Verduras', status: '1 día' },
      { item: 'Aceite', status: 'OK' },
    ],
    chart: { label: 'Cubiertos por día', unit: 'cub.', points: [112, 128, 141, 156, 148, 186, 174] },
  },
  {
    id: 'tiendas',
    label: 'Tiendas',
    products: ['Camiseta básica', 'Jean slim', 'Zapatillas urbanas'],
    kpis: [
      { label: 'Ventas del día', value: '$890.000' },
      { label: 'Conversión', value: '18,6%' },
      { label: 'Stock bajo', value: '7 SKUs' },
    ],
    inventory: [
      { item: 'Talla M — camiseta', status: 'Crítico' },
      { item: 'Jean 32', status: 'OK' },
      { item: 'Zapatillas 42', status: '5 uds' },
    ],
    chart: { label: 'Conversión semanal', unit: '%', points: [12, 14, 16, 15, 18, 21, 19] },
  },
  {
    id: 'ferreterias',
    label: 'Ferreterías',
    products: ['Cable THHN', 'Breakers', 'Tubería PVC'],
    kpis: [
      { label: 'Inventario crítico', value: '5 ítems' },
      { label: 'Compras sugeridas', value: '$1.420.000' },
      { label: 'Productos más vendidos', value: 'Cable 2.5 mm' },
    ],
    inventory: [
      { item: 'Cable THHN', status: 'Crítico' },
      { item: 'Breakers 20A', status: '3 días' },
      { item: 'Tubería PVC', status: 'OK' },
    ],
    chart: { label: 'Pedidos sugeridos', unit: 'ítems', points: [8, 11, 9, 14, 12, 16, 13] },
  },
  {
    id: 'farmacias',
    label: 'Farmacias',
    products: ['Acetaminofén', 'Omeprazol', 'Suero oral'],
    kpis: [
      { label: 'Ventas del día', value: '$980.000' },
      { label: 'Controlados', value: '142 ítems' },
      { label: 'Vencimientos', value: '8 próximos' },
    ],
    inventory: [
      { item: 'Acetaminofén 500 mg', status: 'OK' },
      { item: 'Suero oral', status: 'Crítico' },
      { item: 'Alcohol antiséptico', status: '5 días' },
    ],
    chart: { label: 'Ventas diarias', unit: 'miles', points: [38, 44, 41, 52, 49, 61, 57] },
  },
  {
    id: 'clinicas',
    label: 'Clínicas',
    products: ['Valoración', 'Limpieza dental', 'Resina'],
    kpis: [
      { label: 'Citas hoy', value: '12' },
      { label: 'Pacientes activos', value: '286' },
      { label: 'Ingresos del mes', value: '$18.4M' },
    ],
    inventory: [
      { item: 'Guantes nitrilo', status: 'OK' },
      { item: 'Anestesia', status: '3 cajas' },
      { item: 'Resina A2', status: 'Pedir' },
    ],
    chart: { label: 'Citas de la semana', unit: 'citas', points: [8, 11, 9, 14, 12, 16, 13] },
  },
  {
    id: 'servicios',
    label: 'Servicios',
    products: ['Consultoría', 'Mantenimiento', 'Instalación'],
    kpis: [
      { label: 'Citas del día', value: '14' },
      { label: 'Ingresos proyectados', value: '$620.000' },
      { label: 'Clientes activos', value: '128' },
    ],
    inventory: [
      { item: 'Repuestos A', status: 'OK' },
      { item: 'Kit estándar', status: '2 kits' },
      { item: 'Consumibles', status: 'Pedir' },
    ],
    chart: { label: 'Agenda de la semana', unit: 'citas', points: [6, 9, 11, 8, 14, 16, 12] },
  },
]

export function LandingIndustriesSection() {
  const [activeId, setActiveId] = useState<IndustryId>('cafeterias')
  const active = INDUSTRIES.find((i) => i.id === activeId) ?? INDUSTRIES[0]

  return (
    <LandingSection ariaLabelledBy="industries-title">
      <LandingSectionHeader
        titleId="industries-title"
        title="Hecho para negocios como el tuyo"
        subtitle="Adaptamos la plataforma a la realidad de cada negocio."
      />

      <div
        className="lp-industry-tabs mb-6 flex gap-2 overflow-x-auto pb-1 sm:mb-8 sm:flex-wrap sm:justify-center sm:overflow-visible"
        role="tablist"
        aria-label="Tipo de negocio"
      >
        {INDUSTRIES.map((industry) => (
          <button
            key={industry.id}
            type="button"
            role="tab"
            aria-selected={activeId === industry.id}
            aria-controls="industry-panel"
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 sm:px-4 sm:py-2 sm:text-sm',
              activeId === industry.id
                ? 'border-[color-mix(in_srgb,var(--accent)_50%,var(--border))] bg-[color-mix(in_srgb,var(--accent-soft)_70%,var(--surface-elevated))] text-[var(--heading)] shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_14%,transparent)]'
                : 'border-[color-mix(in_srgb,var(--border)_70%,transparent)] bg-[color-mix(in_srgb,var(--surface-elevated)_50%,transparent)] text-[var(--muted)] hover:border-[color-mix(in_srgb,var(--accent)_25%,var(--border))] hover:text-[var(--heading)]',
            )}
            onClick={() => setActiveId(industry.id)}
          >
            {industry.label}
          </button>
        ))}
      </div>

      <GlassCard className="overflow-hidden p-3 sm:p-6 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            id="industry-panel"
            role="tabpanel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="grid gap-4 sm:gap-6 lg:grid-cols-[1.1fr_0.9fr]"
          >
            <div>
              <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[var(--berry-light)] sm:mb-4 sm:text-xs">
                Dashboard de ejemplo · {active.label}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                {active.kpis.map((kpi, i) => (
                  <motion.div
                    key={kpi.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.35 }}
                    className={cn(
                      'rounded-lg border border-[color-mix(in_srgb,var(--border)_65%,transparent)] bg-[color-mix(in_srgb,var(--surface)_50%,transparent)] p-2.5 sm:rounded-xl sm:p-4',
                      i === 2 && 'col-span-2 sm:col-span-1',
                    )}
                  >
                    <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-[var(--muted)] sm:text-[0.65rem]">
                      {kpi.label}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-[var(--heading)] sm:mt-1 sm:text-lg">
                      {kpi.value}
                    </p>
                  </motion.div>
                ))}
              </div>
              <IndustrySparkChart key={active.id} chart={active.chart} />
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-1">
              <div>
                <h3 className="mb-2 text-xs font-semibold text-[var(--heading)] sm:mb-3 sm:text-sm">
                  Productos
                </h3>
                <ul className="space-y-2" role="list">
                  {active.products.map((product, i) => (
                    <motion.li
                      key={product}
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.08 + i * 0.05 }}
                      className="rounded-lg border border-[color-mix(in_srgb,var(--border)_60%,transparent)] px-2 py-1.5 text-[0.72rem] text-[var(--heading)] sm:px-3 sm:py-2 sm:text-sm"
                    >
                      {product}
                    </motion.li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-2 text-xs font-semibold text-[var(--heading)] sm:mb-3 sm:text-sm">
                  Inventario
                </h3>
                <ul className="space-y-2" role="list">
                  {active.inventory.map((row, i) => (
                    <motion.li
                      key={row.item}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.12 + i * 0.05 }}
                      className="flex flex-col gap-0.5 rounded-lg border border-[color-mix(in_srgb,var(--border)_60%,transparent)] px-2 py-1.5 sm:flex-row sm:items-center sm:justify-between sm:px-3 sm:py-2"
                    >
                      <span className="text-[0.72rem] text-[var(--heading)] sm:text-sm">{row.item}</span>
                      <span className="text-[0.65rem] font-medium text-[var(--muted)] sm:text-xs">
                        {row.status}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </GlassCard>
    </LandingSection>
  )
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function IndustrySparkChart({
  chart,
}: {
  chart: { label: string; points: number[]; unit: string }
}) {
  const max = Math.max(...chart.points, 1)
  const peak = Math.max(...chart.points)
  const peakIndex = chart.points.indexOf(peak)
  const w = 280
  const h = 88
  const padX = 10
  const padY = 12
  const step = (w - padX * 2) / Math.max(chart.points.length - 1, 1)
  const coords = chart.points.map((v, i) => {
    const x = padX + i * step
    const y = h - padY - (v / max) * (h - padY * 2)
    return { x, y, v }
  })
  const line = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const area = `${line} L ${coords[coords.length - 1].x} ${h - padY} L ${coords[0].x} ${h - padY} Z`

  return (
    <div className="lp-industry-chart mt-3 rounded-xl border border-[color-mix(in_srgb,var(--border)_65%,transparent)] bg-[color-mix(in_srgb,var(--surface)_42%,transparent)] p-3 sm:mt-4 sm:p-4">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--muted)] sm:text-xs">
          {chart.label}
        </p>
        <p className="text-[0.65rem] font-medium text-[var(--berry-light)] sm:text-xs">
          Pico {peak} {chart.unit} · {WEEKDAYS[peakIndex]}
        </p>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full sm:h-28" role="img" aria-label={chart.label}>
        <defs>
          <linearGradient id="lp-chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--berry-light)" stopOpacity="0.38" />
            <stop offset="100%" stopColor="var(--berry-light)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lp-chart-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="55%" stopColor="var(--berry-light)" />
            <stop offset="100%" stopColor="var(--tan)" />
          </linearGradient>
        </defs>
        <motion.path
          d={area}
          fill="url(#lp-chart-fill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45 }}
        />
        <motion.path
          d={line}
          fill="none"
          stroke="url(#lp-chart-stroke)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        />
        {coords.map((p, i) => (
          <motion.circle
            key={`${chart.label}-${i}`}
            cx={p.x}
            cy={p.y}
            r={i === peakIndex ? 4.2 : 3}
            fill={i === peakIndex ? 'var(--tan)' : 'var(--berry-light)'}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.12 + i * 0.05, duration: 0.28 }}
          />
        ))}
      </svg>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day, i) => (
          <span
            key={day}
            className={cn(
              'text-center text-[0.58rem] font-semibold uppercase tracking-wide sm:text-[0.65rem]',
              i === peakIndex ? 'text-[var(--tan)]' : 'text-[var(--muted)]',
            )}
          >
            {day}
          </span>
        ))}
      </div>
    </div>
  )
}
