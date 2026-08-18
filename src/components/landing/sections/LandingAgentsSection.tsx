import { motion } from 'framer-motion'
import { BRAND_NAME } from '../../../lib/brand'
import { fadeUp, GlassCard, LandingSection, LandingSectionHeader, staggerContainer } from './shared'

const AGENTS = [
  {
    id: 'barberia',
    label: 'Barbería',
    title: 'Citas y recordatorios',
    text: 'Un agente que gestione la agenda, confirme turnos y envíe recordatorios para que el salón no dependa del chat.',
  },
  {
    id: 'consultorio',
    label: 'Consultorio',
    title: 'Agenda e información',
    text: 'Agentes para organizar la agenda, gestionar información y apoyar los procesos administrativos del día a día.',
  },
  {
    id: 'ingenieria',
    label: 'Ingeniería',
    title: 'Documentos y proyectos',
    text: 'Agentes para analizar documentos, preparar cotizaciones, generar informes y dar seguimiento a cada proyecto.',
  },
] as const

export function LandingAgentsSection() {
  return (
    <LandingSection id="agentes" ariaLabelledBy="agentes-title">
      <LandingSectionHeader
        kicker="Un agente para cada necesidad"
        titleId="agentes-title"
        title="Cada negocio trabaja de una manera diferente"
        subtitle={`${BRAND_NAME} permite crear y utilizar agentes especializados según las necesidades de cada empresa o profesional.`}
      />

      <motion.div
        className="attio-agents"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={staggerContainer}
      >
        {AGENTS.map((agent) => (
          <motion.div key={agent.id} variants={fadeUp}>
            <GlassCard hover className="attio-agent-card h-full p-5 sm:p-6">
              <p className="attio-agent-card__label">{agent.label}</p>
              <h3 className="attio-agent-card__title">{agent.title}</h3>
              <p className="attio-agent-card__text">{agent.text}</p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>
    </LandingSection>
  )
}
