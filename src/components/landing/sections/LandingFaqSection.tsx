import { BRAND_NAME } from '../../../lib/brand'

const FAQS = [
  {
    q: '¿Por qué VOS AI?',
    a: 'En Latinoamérica, “vos” es una forma cercana, directa y humana de decir “tú”. VOS AI significa: la inteligencia artificial que trabaja para vos. La tecnología no debería pedirte que te adaptes a ella. Debería adaptarse a vos.',
  },
  {
    q: '¿Qué es un agente inteligente?',
    a: 'Un agente no solo conversa: recibe información, toma decisiones dentro de las reglas que definas, usa tus herramientas y completa tareas de principio a fin.',
  },
  {
    q: `¿${BRAND_NAME} reemplaza las herramientas que ya uso?`,
    a: 'No. Funciona como una capa inteligente sobre lo que ya utilizas. Tus datos, procesos y aplicaciones se conectan para que los agentes entiendan el contexto y ejecuten.',
  },
  {
    q: '¿Para qué tipo de negocio sirve?',
    a: 'Para cualquiera. Una barbería puede tener un agente de citas. Un consultorio, agentes de agenda y administración. Una empresa de ingeniería, agentes de documentos, cotizaciones e informes.',
  },
  {
    q: `¿${BRAND_NAME} es gratuito?`,
    a: 'Sí. Free te deja crear y probar agentes. Pro y Empresa son cuando el negocio ya delega trabajo real y necesita más capacidad.',
  },
  {
    q: '¿Puedo crear más de un agente?',
    a: 'Sí. Cada negocio trabaja distinto: puedes tener un agente para agenda, otro para documentos, otro para ventas o análisis. Un agente para cada necesidad.',
  },
  {
    q: '¿Funciona en el celular?',
    a: 'Sí. Puedes darle trabajo a tus agentes desde el teléfono, no solo desde un escritorio.',
  },
] as const

function PlusIcon() {
  return (
    <svg className="attio-faq__plus" viewBox="0 0 19 12" fill="none" aria-hidden>
      <line x1="0" y1="0.75" x2="20%" y2="0.75" stroke="currentColor" strokeWidth="1.5" />
      <line x1="0.75" y1="0" x2="0.75" y2="100%" stroke="currentColor" strokeWidth="1.5" />
      <line x1="0" y1="11.25" x2="20%" y2="11.25" stroke="currentColor" strokeWidth="1.5" />
      <line x1="6" y1="50%" x2="13.2" y2="50%" stroke="currentColor" strokeWidth="1.5" />
      <line
        className="attio-faq__plus-v"
        x1="50%"
        y1="2.4"
        x2="50%"
        y2="9.6"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line x1="80%" y1="0.75" x2="100%" y2="0.75" stroke="currentColor" strokeWidth="1.5" />
      <line x1="18.45" y1="0" x2="18.45" y2="100%" stroke="currentColor" strokeWidth="1.5" />
      <line x1="80%" y1="11.25" x2="100%" y2="11.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function LandingFaqSection() {
  return (
    <section className="attio-faq" id="faq" aria-labelledby="faq-title">
      <div className="attio-faq__inner">
        <h2 id="faq-title">Tus preguntas, respondidas.</h2>
        {FAQS.map((item) => (
          <details key={item.q} className="attio-faq__item">
            <summary>
              <span>{item.q}</span>
              <PlusIcon />
            </summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
