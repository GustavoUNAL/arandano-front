const AGENTS = [
  {
    name: 'Agente de citas',
    handle: '@barberia',
    initials: 'CI',
    quote: 'Confirmé los turnos de mañana y envié los recordatorios. El salón ya no depende del chat.',
  },
  {
    name: 'Agente de agenda',
    handle: '@consultorio',
    initials: 'AG',
    quote: 'Organicé la agenda, dejé la información lista y cerré lo administrativo del día.',
  },
  {
    name: 'Agente de documentos',
    handle: '@ingenieria',
    initials: 'DO',
    quote: 'Analicé el expediente, armé el informe y lo dejé listo para revisar.',
  },
  {
    name: 'Agente de cotizaciones',
    handle: '@proyectos',
    initials: 'CO',
    quote: 'Preparé la propuesta con tus reglas de margen y programé el seguimiento a 48 h.',
  },
  {
    name: 'Agente de atención',
    handle: '@clientes',
    initials: 'AT',
    quote: 'Recibí, clasifiqué y cerré los casos de hoy. Solo quedan dos para tu criterio.',
  },
  {
    name: 'Agente de ventas',
    handle: '@comercial',
    initials: 'VE',
    quote: 'Seguí los leads, actualicé el pipeline y dejé el próximo paso en cada ficha.',
  },
  {
    name: 'Agente de operaciones',
    handle: '@equipo',
    initials: 'OP',
    quote: 'Asigné pendientes, avisé al equipo y dejé el tablero del día al día.',
  },
  {
    name: 'Agente de administración',
    handle: '@estudio',
    initials: 'AD',
    quote: 'Ordené la información, completé los procesos y dejé los documentos en su lugar.',
  },
  {
    name: 'Agente de análisis',
    handle: '@direccion',
    initials: 'AN',
    quote: 'Resumí el día, crucé agenda y tareas, y generé el informe para que solo revises.',
  },
  {
    name: 'Agente de proyectos',
    handle: '@obras',
    initials: 'PR',
    quote: 'Detecté dos hitos de esta semana, avisé al equipo y dejé el siguiente paso en cada obra.',
  },
  {
    name: 'Agente de informes',
    handle: '@profesional',
    initials: 'IN',
    quote: 'Recibí el contexto, tomé las reglas que definiste y completé el documento de punta a punta.',
  },
  {
    name: 'Agente de recordatorios',
    handle: '@servicios',
    initials: 'RE',
    quote: 'Confirmé horarios, cubrí un hueco a las 16:00 y avisé a quienes tenían cita mañana.',
  },
] as const

function chunk<T>(items: readonly T[], size: number): T[][] {
  const cols: T[][] = Array.from({ length: size }, () => [])
  items.forEach((item, i) => {
    cols[i % size].push(item)
  })
  return cols
}

export function LandingTestimonialsSection() {
  const columns = chunk(AGENTS, 4)

  return (
    <section className="attio-social" aria-label="Agentes inteligentes de VOS AI">
      <div className="attio-dots" aria-hidden />
      <div className="attio-tweets">
        {columns.map((col, i) => (
          <div key={i} className="attio-tweets__col">
            {col.map((item) => (
              <article key={item.handle} className="attio-tweet">
                <span className="attio-tweet__avatar" aria-hidden>
                  {item.initials}
                </span>
                <p className="attio-tweet__meta">
                  <span className="attio-tweet__name">{item.name}</span>
                  <span className="attio-tweet__handle">{item.handle}</span>
                </p>
                <p className="attio-tweet__quote">{item.quote}</p>
              </article>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
