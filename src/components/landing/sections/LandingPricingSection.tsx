import { motion } from 'framer-motion'
import type { MouseEvent } from 'react'
import { getAccessRequestUrl } from '../../../lib/authRoutes'
import { cn } from '../../../lib/utils'
import { fadeUp, GlassCard, LandingSection, LandingSectionHeader, staggerContainer } from './shared'

type Props = {
  accessUrl: string
  onAccess?: (e: MouseEvent<HTMLAnchorElement>) => void
}

const PLANS = [
  {
    id: 'free' as const,
    name: 'Free',
    price: 'Gratis',
    hint: 'Para probar agentes con tu negocio',
    featured: false,
    features: [
      'Crea y prueba agentes especializados',
      'Conecta tus herramientas y tu contexto',
      'Agenda, documentos, ventas y más',
      'La inteligencia que trabaja contigo',
    ],
    cta: 'Empieza gratis',
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: 'A medida',
    hint: 'Un negocio, agentes que ejecutan todos los días',
    featured: true,
    features: [
      'Todo lo de Free, sin límites',
      'Agentes que completan tareas de principio a fin',
      'Reglas, herramientas y seguimiento',
      'Soporte directo con el equipo',
    ],
    cta: 'Continuar con Pro',
  },
  {
    id: 'empresa' as const,
    name: 'Empresa',
    price: 'Bajo petición',
    hint: 'Equipos completos y agentes a escala',
    featured: false,
    features: [
      'Todo lo de Pro',
      'Agentes para cada área o equipo',
      'Acompañamiento al arrancar',
      'Soporte prioritario',
    ],
    cta: 'Hablar con ventas',
  },
]

function CheckIcon() {
  return (
    <svg className="attio-check" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.265 3.076a.75.75 0 0 1 .159 1.049L8.279 8.797l-.013.021c-.3.48-.543.87-.764 1.16-.224.296-.465.545-.78.69a1.75 1.75 0 0 1-1.512.064c-.326-.118-.587-.345-.836-.621-.244-.271-.52-.638-.86-1.091L2.6 7.8a.75.75 0 1 1 1.2-.9l.9 1.2c.358.477.606.808.817 1.041.21.232.336.315.432.35a.75.75 0 0 0 .756-.032c.093-.043.212-.137.4-.386.19-.25.41-.6.726-1.107L10.576 3.235a.75.75 0 0 1 1.049-.159Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function LandingPricingSection({ accessUrl, onAccess }: Props) {
  return (
    <LandingSection id="planes" ariaLabelledBy="planes-title">
      <LandingSectionHeader
        kicker="Planes"
        titleId="planes-title"
        title="Empieza gratis hoy"
        subtitle="Diseñado para cada etapa. Free para probar agentes. Pro para delegar trabajo real. Empresa si tenés equipos y quieres escalar."
      />

      <motion.div
        className="lp-pricing__grid"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={staggerContainer}
      >
        {PLANS.map((plan) => {
          const href =
            plan.id === 'free' ? accessUrl : getAccessRequestUrl(undefined, plan.id)
          return (
            <motion.div key={plan.id} variants={fadeUp}>
              <GlassCard
                hover
                className={cn(
                  'lp-pricing__card flex h-full flex-col p-5 sm:p-6',
                  plan.featured && 'lp-pricing__card--featured',
                )}
              >
                {plan.featured ? <p className="lp-pricing__badge">Recomendado</p> : null}
                <h3 className="lp-pricing__name">{plan.name}</h3>
                <p className="lp-pricing__price">{plan.price}</p>
                <p className="lp-pricing__hint">{plan.hint}</p>
                <ul className="lp-pricing__features">
                  {plan.features.map((item) => (
                    <li key={item}>
                      <CheckIcon />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <a
                  className={cn(
                    'attio-btn attio-btn--block lp-pricing__cta',
                    plan.featured ? 'attio-btn--primary' : 'attio-btn--outline',
                  )}
                  href={href}
                  onClick={plan.id === 'free' ? onAccess : undefined}
                >
                  {plan.cta}
                </a>
              </GlassCard>
            </motion.div>
          )
        })}
      </motion.div>
    </LandingSection>
  )
}
