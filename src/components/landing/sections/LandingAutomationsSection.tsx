import { motion } from 'framer-motion'
import {
  CalendarClock,
  FileSearch,
  FileSpreadsheet,
  FolderKanban,
  ListChecks,
  type LucideIcon,
} from 'lucide-react'
import { BRAND_NAME } from '../../../lib/brand'
import { fadeUp, GlassCard, LandingSection, LandingSectionHeader, staggerContainer } from './shared'

type AutomationCard = {
  id: string
  title: string
  icon: LucideIcon
  preview: { label: string; value: string; hint?: string }[]
}

const AUTOMATION_CARDS: AutomationCard[] = [
  {
    id: 'booking',
    title: 'Citas y recordatorios',
    icon: CalendarClock,
    preview: [
      { label: 'Agenda', value: '3 citas confirmadas y 2 recordatorios enviados', hint: 'hoy' },
    ],
  },
  {
    id: 'documents',
    title: 'Análisis de documentos',
    icon: FileSearch,
    preview: [{ label: 'Expediente', value: 'Informe listo a partir de 12 archivos', hint: 'completado' }],
  },
  {
    id: 'quotes',
    title: 'Cotizaciones',
    icon: FileSpreadsheet,
    preview: [
      { label: 'Propuesta', value: 'Cotización enviada al cliente' },
      { label: 'Seguimiento', value: 'Recordatorio en 48 h' },
    ],
  },
  {
    id: 'daily-report',
    title: 'Informe del día',
    icon: ListChecks,
    preview: [
      { label: 'Resumen', value: 'Tareas, agenda y pendientes' },
      { label: 'Estado', value: 'Listo para revisar' },
    ],
  },
  {
    id: 'follow-up',
    title: 'Seguimiento de proyectos',
    icon: FolderKanban,
    preview: [
      {
        label: 'Proyecto',
        value: '2 hitos vencen esta semana · el agente ya avisó al equipo',
      },
    ],
  },
]

export function LandingAutomationsSection() {
  return (
    <LandingSection ariaLabelledBy="auto-title">
      <LandingSectionHeader
        titleId="auto-title"
        title="Agentes que ejecutan, no solo responden"
        subtitle={`${BRAND_NAME} conecta tu contexto y completa tareas reales: agenda, documentos, ventas, operaciones y más.`}
      />

      <motion.div
        className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={staggerContainer}
      >
        {AUTOMATION_CARDS.map((card) => (
          <AutomationCardItem key={card.id} card={card} />
        ))}
      </motion.div>
    </LandingSection>
  )
}

function AutomationCardItem({ card }: { card: AutomationCard }) {
  const Icon = card.icon

  return (
    <motion.div variants={fadeUp} transition={{ duration: 0.45 }}>
      <GlassCard
        hover
        className="group relative h-full overflow-hidden p-3 transition-shadow duration-300 hover:shadow-[0_0_40px_color-mix(in_srgb,var(--accent)_12%,transparent)] sm:p-5"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 70%)',
          }}
        />
        <div className="relative">
          <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--accent)_30%,var(--border))] bg-[color-mix(in_srgb,var(--accent-soft)_50%,transparent)] text-[var(--berry-light)] sm:mb-4 sm:h-10 sm:w-10 sm:rounded-xl">
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} aria-hidden />
          </div>
          <h3 className="mb-2.5 text-xs font-semibold leading-snug text-[var(--heading)] sm:mb-4 sm:text-base">
            {card.title}
          </h3>
          <div className="space-y-1.5 rounded-lg border border-[color-mix(in_srgb,var(--border)_60%,transparent)] bg-[color-mix(in_srgb,var(--surface)_55%,transparent)] p-2 sm:space-y-2 sm:rounded-xl sm:p-3">
            {card.preview.map((row) => (
              <div key={row.label} className="flex flex-col gap-0.5">
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--muted)]">
                  {row.label}
                </span>
                <span className="text-[0.72rem] font-medium leading-snug text-[var(--heading)] sm:text-sm">
                  {row.value}
                </span>
                {row.hint ? (
                  <span className="text-xs text-[var(--muted)]">{row.hint}</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}
