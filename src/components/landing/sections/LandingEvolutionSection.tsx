import { motion } from 'framer-motion'
import { fadeUp, LandingSection, LandingSectionHeader } from './shared'

const STEPS = [
  {
    n: '01',
    title: 'Gestión',
    text: 'Ventas, inventario, citas y clientes.',
  },
  {
    n: '02',
    title: 'Automatización',
    text: 'Alertas, reportes y procesos automáticos.',
  },
  {
    n: '03',
    title: 'Analítica',
    text: 'Indicadores y comprensión del comportamiento del negocio.',
  },
  {
    n: '04',
    title: 'Inteligencia',
    text: 'Predicciones, recomendaciones e interacción mediante lenguaje natural.',
  },
] as const

export function LandingEvolutionSection() {
  return (
    <LandingSection id="evolucion" ariaLabelledBy="evo-title" className="lp-evo">
      <LandingSectionHeader
        align="left"
        titleId="evo-title"
        title="Una plataforma que evoluciona contigo."
        subtitle="El nombre VOS-AI señala el destino de la plataforma. Hoy el trabajo está en gestión y en generar datos confiables. La inteligencia se construye encima de esa base."
      />
      <ol className="lp-evo__line">
        {STEPS.map((step, i) => (
          <motion.li
            key={step.n}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={fadeUp}
            transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="lp-evo__n">{step.n}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </motion.li>
        ))}
      </ol>
    </LandingSection>
  )
}
