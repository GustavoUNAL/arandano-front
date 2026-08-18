import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { cn } from '../../../lib/utils'
import { fadeUp, GlassCard, LandingSection, LandingSectionHeader } from './shared'

type IndustryId =
  | 'barberias'
  | 'consultorios'
  | 'ingenieria'
  | 'cafeterias'
  | 'tiendas'
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
    id: 'barberias',
    label: 'Barberías',
    products: ['Agente de citas', 'Recordatorios', 'Agenda del salón'],
    kpis: [
      { label: 'Citas confirmadas', value: '18' },
      { label: 'Recordatorios', value: '14 enviados' },
      { label: 'Huecos cubiertos', value: '3 hoy' },
    ],
    inventory: [
      { item: 'Confirmar turno de las 16:00', status: 'Hecho' },
      { item: 'Recordatorio a 6 clientes', status: 'Enviado' },
      { item: 'Reagendar cancelación', status: 'Pendiente' },
    ],
    chart: { label: 'Citas de la semana', unit: 'citas', points: [8, 11, 9, 14, 16, 18, 12] },
  },
  {
    id: 'consultorios',
    label: 'Consultorios',
    products: ['Agente de agenda', 'Información de pacientes', 'Apoyo administrativo'],
    kpis: [
      { label: 'Citas hoy', value: '12' },
      { label: 'Expedientes al día', value: '286' },
      { label: 'Tareas administrativas', value: '9 cerradas' },
    ],
    inventory: [
      { item: 'Confirmar agenda de mañana', status: 'Hecho' },
      { item: 'Preparar información de consulta', status: 'Listo' },
      { item: 'Seguimiento administrativo', status: 'En curso' },
    ],
    chart: { label: 'Agenda de la semana', unit: 'citas', points: [8, 11, 9, 14, 12, 16, 13] },
  },
  {
    id: 'ingenieria',
    label: 'Ingeniería',
    products: ['Análisis de documentos', 'Cotizaciones', 'Seguimiento de proyectos'],
    kpis: [
      { label: 'Documentos analizados', value: '24' },
      { label: 'Cotizaciones', value: '5 listas' },
      { label: 'Proyectos activos', value: '8' },
    ],
    inventory: [
      { item: 'Informe técnico del lote 12', status: 'Listo' },
      { item: 'Cotización cliente Norte', status: 'Enviada' },
      { item: 'Hito de obra — viernes', status: 'En seguimiento' },
    ],
    chart: { label: 'Entregas de la semana', unit: 'uds', points: [3, 5, 4, 7, 6, 8, 5] },
  },
  {
    id: 'cafeterias',
    label: 'Cafeterías',
    products: ['Agente de ventas', 'Operaciones', 'Informe del día'],
    kpis: [
      { label: 'Tareas completadas', value: '21' },
      { label: 'Informe diario', value: 'Listo' },
      { label: 'Pendientes', value: '4' },
    ],
    inventory: [
      { item: 'Resumen de ventas', status: 'Hecho' },
      { item: 'Alerta de insumos', status: 'Enviada' },
      { item: 'Reporte de cierre', status: 'Listo' },
    ],
    chart: { label: 'Tareas de la semana', unit: 'uds', points: [12, 16, 14, 18, 17, 21, 19] },
  },
  {
    id: 'tiendas',
    label: 'Tiendas',
    products: ['Atención al cliente', 'Ventas', 'Administración'],
    kpis: [
      { label: 'Consultas resueltas', value: '34' },
      { label: 'Seguimientos', value: '9' },
      { label: 'Informes', value: '2 listos' },
    ],
    inventory: [
      { item: 'Responder consultas del día', status: 'Hecho' },
      { item: 'Seguimiento de pedidos', status: 'En curso' },
      { item: 'Resumen comercial', status: 'Listo' },
    ],
    chart: { label: 'Atenciones de la semana', unit: 'uds', points: [18, 22, 20, 28, 26, 34, 30] },
  },
  {
    id: 'clinicas',
    label: 'Clínicas',
    products: ['Agenda clínica', 'Información', 'Administración'],
    kpis: [
      { label: 'Citas hoy', value: '12' },
      { label: 'Pacientes activos', value: '286' },
      { label: 'Tareas administrativas', value: '11' },
    ],
    inventory: [
      { item: 'Confirmar citas de mañana', status: 'Hecho' },
      { item: 'Preparar información de consulta', status: 'Listo' },
      { item: 'Recordatorios de control', status: 'Enviados' },
    ],
    chart: { label: 'Citas de la semana', unit: 'citas', points: [8, 11, 9, 14, 12, 16, 13] },
  },
  {
    id: 'servicios',
    label: 'Profesionales',
    products: ['Agenda', 'Cotizaciones', 'Seguimiento'],
    kpis: [
      { label: 'Citas del día', value: '6' },
      { label: 'Propuestas enviadas', value: '4' },
      { label: 'Clientes activos', value: '28' },
    ],
    inventory: [
      { item: 'Cotización semanal', status: 'Enviada' },
      { item: 'Agenda de visitas', status: 'Confirmada' },
      { item: 'Seguimiento a 3 clientes', status: 'En curso' },
    ],
    chart: { label: 'Agenda de la semana', unit: 'citas', points: [4, 6, 5, 8, 7, 9, 6] },
  },
]

export function LandingIndustriesSection() {
  const [activeId, setActiveId] = useState<IndustryId>('barberias')
  const active = INDUSTRIES.find((i) => i.id === activeId) ?? INDUSTRIES[0]

  return (
    <LandingSection ariaLabelledBy="industries-title">
      <LandingSectionHeader
        titleId="industries-title"
        title="Hecho para la forma en que tu negocio trabaja"
        subtitle="Desde un profesional independiente hasta una empresa con equipos completos. Un agente para cada necesidad."
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
                Dashboard de agentes · {active.label}
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
                  Agentes
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
                  Tareas
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
