import { motion } from 'framer-motion'
import { fadeUp, LandingSection, LandingSectionHeader } from './shared'

const FLOW = ['Ventas', 'Inventario', 'Clientes', 'Citas', 'Analítica'] as const

export function LandingModularSection() {
  return (
    <LandingSection id="producto" ariaLabelledBy="modular-title" className="lp-modular">
      <LandingSectionHeader
        align="left"
        titleId="modular-title"
        title="Diseñada para crecer contigo"
        subtitle="VOS-AI está construida como una plataforma modular. Cada herramienta resuelve una necesidad específica, mientras toda la información permanece conectada en una misma plataforma."
      />
      <motion.ol
        className="lp-flow"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={fadeUp}
        aria-label="Módulos conectados a la misma base de datos"
      >
        {FLOW.map((name, i) => (
          <li key={name}>
            <span>{name}</span>
            {i < FLOW.length - 1 ? (
              <span className="lp-flow__join" aria-hidden>
                ↓
              </span>
            ) : null}
          </li>
        ))}
      </motion.ol>
      <p className="lp-flow__note">Todos los módulos leen y escriben sobre la misma información del negocio.</p>
    </LandingSection>
  )
}
