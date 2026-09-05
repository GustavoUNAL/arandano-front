import { motion } from 'framer-motion'
import { fadeUp, LandingSection, LandingSectionHeader } from './shared'

const QUESTIONS = [
  '¿Cuánto vendió hoy?',
  '¿Qué productos están próximos a agotarse?',
  '¿Cómo se comportaron las ventas esta semana?',
  '¿Qué debería comprar?',
  '¿Qué tendencia hay en las ventas?',
] as const

const FUTURE = [
  'Análisis automático',
  'Predicción de ventas',
  'Recomendaciones',
  'Alertas inteligentes',
  'Integración con WhatsApp',
] as const

export function LandingIntelligenceSection() {
  return (
    <LandingSection id="inteligencia" ariaLabelledBy="intel-title" className="lp-intel">
      <LandingSectionHeader
        titleId="intel-title"
        title="La inteligencia llega a partir de sus datos."
        subtitle="VOS-AI incorpora inteligencia sobre lo que ya registró su operación. Es una capa encima de ventas, inventario y citas, no un producto aparte."
      />
      <motion.ul
        className="lp-intel__qs"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        variants={fadeUp}
      >
        {QUESTIONS.map((q) => (
          <li key={q}>
            <span>{q}</span>
          </li>
        ))}
      </motion.ul>
      <p className="lp-intel__kicker">Evolución prevista sobre esos mismos datos</p>
      <ul className="lp-intel__future">
        {FUTURE.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </LandingSection>
  )
}
