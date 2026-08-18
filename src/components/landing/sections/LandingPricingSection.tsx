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
    hint: 'Para probar VOS IA con tu negocio',
    featured: false,
    features: [
      'Todos los módulos para conocer la app',
      '25 MB de fotos y comprobantes',
      'Hasta 40 productos, 80 ventas y 60 citas',
      'Asistente IA con tus datos',
    ],
    cta: 'Registrarme',
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: 'A medida',
    hint: 'Un negocio, sin techo de uso',
    featured: true,
    features: [
      'Todo lo de Free, sin límites',
      'Ventas, stock, POS, compras y agenda',
      'Tienda web y reportes del día a día',
      'Soporte directo con el equipo',
    ],
    cta: 'Quiero Pro',
  },
  {
    id: 'empresa' as const,
    name: 'Empresa',
    price: 'A medida',
    hint: 'Varios locales o equipos más grandes',
    featured: false,
    features: [
      'Todo lo de Pro',
      'Varios negocios o sucursales',
      'Acompañamiento al arrancar',
      'Soporte prioritario',
    ],
    cta: 'Quiero Empresa',
  },
]

export function LandingPricingSection({ accessUrl, onAccess }: Props) {
  return (
    <LandingSection id="planes" ariaLabelledBy="planes-title">
      <LandingSectionHeader
        kicker="Planes"
        titleId="planes-title"
        title="Empezá gratis. Crece cuando el negocio lo pida."
        subtitle="Free es para probar. Pro deja el negocio funcionando sin tope. Empresa es para varios locales o un equipo más grande."
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
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <a
                  className={cn(
                    'public-btn lp-pricing__cta',
                    plan.featured ? 'public-btn--accent landing-v2__btn-solid' : 'public-btn--ghost',
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
