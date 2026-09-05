import { motion } from 'framer-motion'
import { fadeUp, LandingSection, LandingSectionHeader } from './shared'

const SOURCES = [
  'Cada venta genera información.',
  'Cada cita genera información.',
  'Cada movimiento de inventario genera información.',
] as const

const NEXT = [
  'Indicadores',
  'Reportes',
  'Automatizaciones',
  'Predicciones',
  'Recomendaciones',
  'Inteligencia artificial',
] as const

export function LandingDataSection() {
  return (
    <LandingSection id="como-funciona" ariaLabelledBy="data-title" className="lp-data">
      <LandingSectionHeader
        align="left"
        titleId="data-title"
        title="Tu negocio genera datos. VOS-AI los convierte en información."
        subtitle="Toda esa información se almacena y se estructura. Por eso la arquitectura está pensada para evolucionar hacia automatización e inteligencia, sin cambiar de plataforma."
      />
      <div className="lp-data__grid">
        <motion.ul
          className="lp-data__sources"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
        >
          {SOURCES.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </motion.ul>
        <motion.div
          className="lp-data__next"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
        >
          <p>Después puede utilizarse para</p>
          <ul>
            {NEXT.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </motion.div>
      </div>
    </LandingSection>
  )
}
