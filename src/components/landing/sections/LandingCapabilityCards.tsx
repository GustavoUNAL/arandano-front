import { motion } from 'framer-motion'
import {
  AppLauncherIcon,
  type LauncherIconView,
} from '../../AppLauncherIcon'
import { fadeUp, GlassCard, LandingSection, LandingSectionHeader } from './shared'

type Status = 'disponible' | 'desarrollo' | 'proxima'

type Card = {
  view: LauncherIconView
  name: string
  text: string
  line: string
  status: Status
}

const STATUS_LABEL: Record<Status, string> = {
  disponible: 'Disponible',
  desarrollo: 'En desarrollo',
  proxima: 'Próximamente',
}

const CARDS: Card[] = [
  {
    view: 'sales',
    name: 'Ventas',
    text: 'Registre y controle las ventas de su negocio en el momento.',
    line: 'Cada venta queda registrada al instante.',
    status: 'disponible',
  },
  {
    view: 'inventory',
    name: 'Inventario',
    text: 'Controle existencias y sepa qué productos e insumos hay que reponer.',
    line: 'Sepa qué hay en stock y qué reponer.',
    status: 'desarrollo',
  },
  {
    view: 'recipes',
    name: 'Recetas',
    text: 'Relacione productos e insumos para actualizar el inventario con cada venta.',
    line: 'La venta descuenta los insumos sola.',
    status: 'desarrollo',
  },
  {
    view: 'booking',
    name: 'Citas',
    text: 'Gestione reservas, horarios y clientes desde una agenda centralizada.',
    line: 'Agenda, horarios y clientes juntos.',
    status: 'disponible',
  },
  {
    view: 'customers',
    name: 'Clientes',
    text: 'Construya un historial organizado de sus clientes y sus visitas.',
    line: 'Quién compra, quién vuelve y cuándo.',
    status: 'desarrollo',
  },
  {
    view: 'analytics',
    name: 'Analítica',
    text: 'Convierta los datos de su operación en indicadores para entender el negocio.',
    line: 'Los números de su operación, a la vista.',
    status: 'desarrollo',
  },
  {
    view: 'tasks',
    name: 'Automatización',
    text: 'Reduzca tareas repetitivas con alertas, avisos y procesos automáticos.',
    line: 'Alertas y procesos que corren solos.',
    status: 'proxima',
  },
]

export function LandingCapabilityCards() {
  return (
    <LandingSection id="modulos" ariaLabelledBy="modules-title" className="lp-caps">
      <LandingSectionHeader
        align="left"
        className="lp-caps__head"
        titleId="modules-title"
        kicker="Módulos"
        title="Independientes. Una sola base."
        subtitle="Cada herramienta cubre una parte del negocio. La información es la misma para todas."
      />
      <div className="lp-caps__grid">
        {CARDS.map((card, i) => (
          <motion.div
            key={card.name}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={fadeUp}
            transition={{ duration: 0.4, delay: (i % 3) * 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <GlassCard
              hover
              className={`lp-cap h-full p-5 lp-cap--${card.status}`}
            >
              <div className="lp-cap__top">
                <span className="lp-cap__icon" aria-hidden>
                  <AppLauncherIcon view={card.view} />
                </span>
                <span className="lp-cap__status">{STATUS_LABEL[card.status]}</span>
              </div>
              <div className="lp-cap__copy">
                <h3>{card.name}</h3>
                <p className="lp-cap__text">{card.text}</p>
                <p className="lp-cap__line">{card.line}</p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </LandingSection>
  )
}
