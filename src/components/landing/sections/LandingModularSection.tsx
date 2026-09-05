import { motion } from 'framer-motion'
import { fadeUp, LandingSection, LandingSectionHeader } from './shared'

const FLOW = ['Ventas', 'Inventario', 'Clientes', 'Citas', 'Analítica'] as const

export function LandingModularSection() {
  return (
    <LandingSection id="producto" ariaLabelledBy="modular-title" className="lp-modular">
      <LandingSectionHeader
        align="left"
        titleId="modular-title"
        title="Diseñada para crecer con usted"
        subtitle="VOS-AI es una plataforma modular. Cada herramienta cubre una necesidad; la información de ventas, citas e inventario es la misma para todas."
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
      <p className="lp-flow__note">
        Una venta, una cita o un recuento alimentan el resto. No hay un dato por módulo.
      </p>
    </LandingSection>
  )
}
