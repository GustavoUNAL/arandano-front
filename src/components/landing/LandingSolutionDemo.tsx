import { BRAND_NAME } from '../../lib/brand'
import { LandingChatMock, type LandingChatTurn } from './LandingChatMock'

const USER = 'María'

/** Una sola conversación: el agente recibe trabajo y lo completa */
export const SOLUTION_CONVERSATION: LandingChatTurn[] = [
  {
    who: USER,
    role: 'user',
    text: 'Confirma las citas de mañana y envía recordatorios.',
  },
  {
    who: BRAND_NAME,
    role: 'ai',
    badge: 'Agente · agenda',
    text: 'Revisé la agenda, confirmé los horarios disponibles y envié recordatorios con las reglas que definiste.',
    metrics: [
      { label: 'Confirmadas', value: '8 citas', hint: 'mañana', trend: 'up' },
      { label: 'Recordatorios', value: '8 enviados' },
      { label: 'Hueco cubierto', value: '16:00' },
    ],
  },
  {
    who: USER,
    role: 'user',
    text: 'Prepara la cotización del proyecto Norte.',
  },
  {
    who: BRAND_NAME,
    role: 'ai',
    badge: 'Agente · documentos',
    text: 'Analicé el expediente, armé la propuesta y la dejé lista para enviar.',
    metrics: [
      { label: 'Estado', value: 'Lista', hint: 'por revisar', trend: 'up' },
      { label: 'Ítems', value: '14' },
      { label: 'Seguimiento', value: '48 h' },
    ],
    bullets: [
      '<strong>Alcance</strong> — extraído del briefing y de 3 documentos adjuntos',
      '<strong>Valores</strong> — según tu tabla de tarifas y reglas de margen',
      '<strong>Entrega</strong> — 12 días hábiles, con hitos semanales',
    ],
  },
  {
    who: USER,
    role: 'user',
    text: 'Genera el informe de la semana.',
  },
  {
    who: BRAND_NAME,
    role: 'ai',
    badge: 'Agente · análisis',
    text: 'Cruce de agenda, tareas cerradas y pendientes. El informe ya está en tu bandeja.',
    metrics: [
      { label: 'Tareas hechas', value: '27', hint: '+6 vs semana ant.', trend: 'up' },
      { label: 'Pendientes', value: '5' },
      { label: 'Informe', value: 'Listo' },
    ],
  },
  {
    who: USER,
    role: 'user',
    text: 'Da seguimiento a los proyectos que vencen.',
  },
  {
    who: BRAND_NAME,
    role: 'ai',
    badge: 'Agente · proyectos',
    text: 'Identifiqué hitos próximos, avisé al equipo y dejé el siguiente paso en cada ficha.',
    metrics: [
      { label: 'Hitos', value: '2 esta semana', trend: 'down' },
      { label: 'Avisos', value: 'Enviados' },
      { label: 'Bloqueos', value: '1 por resolver' },
    ],
    bullets: [
      '<strong>Obra Norte</strong> — entrega viernes · el equipo ya está enterado',
      '<strong>Lote 12</strong> — espera un documento del cliente',
    ],
  },
  {
    who: USER,
    role: 'user',
    text: 'Quédate con la atención de hoy. Yo reviso al final.',
  },
  {
    who: BRAND_NAME,
    role: 'ai',
    badge: 'Agente · atención',
    text: 'Recibo, clasifico y cierro lo que esté dentro de tus reglas. Lo demás queda marcado para ti.',
    metrics: [
      { label: 'Resueltas', value: '14 consultas' },
      { label: 'Derivadas', value: '3' },
      { label: 'Por revisar', value: '2' },
    ],
    insight:
      'Las 2 que requieren tu criterio están resumidas. El resto ya se completó.',
  },
]

export function LandingSolutionDemo() {
  return (
    <div className="landing-solution-demo">
      <LandingChatMock
        turns={SOLUTION_CONVERSATION}
        framed
        readOnly
        conversationLoop
        className="landing-section__demo"
        caption="Un agente que recibe trabajo y lo completa"
      />
    </div>
  )
}
