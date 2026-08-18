import { motion } from 'framer-motion'
import { getHealthLoginUrl, getLoginUrl } from '../../../lib/authRoutes'
import { BRAND_NAME } from '../../../lib/brand'
import { fadeUp, GlassCard, LandingSection, LandingSectionHeader } from './shared'

type ProductCard = {
  id: string
  badge: string
  name: string
  tagline: string
  description: string
  points: string[]
  ctaLabel: string
  ctaHref: string
}

const PRODUCTS: ProductCard[] = [
  {
    id: 'vos-ai',
    badge: 'Agentes',
    name: BRAND_NAME,
    tagline: 'Agentes inteligentes para empresas y profesionales',
    description:
      'Conecta tus herramientas, entiende tu contexto y automatiza tareas reales. Un agente para cada necesidad, sobre la forma en que ya trabajas.',
    points: [
      'Agentes que reciben información y completan tareas',
      'Agenda, documentos, ventas, operaciones y análisis',
      'Reglas que tú defines, herramientas que ya usas',
    ],
    ctaLabel: 'Iniciar sesión',
    ctaHref: getLoginUrl(),
  },
  {
    id: 'vos-ia-health',
    badge: 'Salud',
    name: 'VOS IA HEALTH',
    tagline: 'Agentes para clínicas y consultorios',
    description:
      'Agentes para organizar la agenda, gestionar información y apoyar los procesos administrativos de clínicas y consultorios.',
    points: [
      'Agenda e información del consultorio',
      'Procesos administrativos con reglas tuyas',
      'Agentes especializados en salud',
    ],
    ctaLabel: 'Entrar a VOS IA HEALTH',
    ctaHref: getHealthLoginUrl(),
  },
]

type Props = {
  onBusinessLogin?: () => void
  onHealthLogin?: () => void
}

export function LandingProductsSection({ onBusinessLogin, onHealthLogin }: Props) {
  return (
    <LandingSection ariaLabelledBy="products-title" className="lp-products">
      <LandingSectionHeader
        kicker="Productos"
        titleId="products-title"
        title="Una plataforma. Cualquier negocio."
        subtitle={`${BRAND_NAME} adapta sus agentes a la forma en que cada empresa o profesional trabaja. VOS IA HEALTH aplica la misma inteligencia a clínicas y consultorios.`}
      />

      <div className="lp-products__grid">
        {PRODUCTS.map((product, i) => (
          <motion.div
            key={product.id}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={fadeUp}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <GlassCard hover className="lp-product-card h-full p-5 sm:p-6">
              <p className="lp-product-card__badge">{product.badge}</p>
              <h3 className="lp-product-card__name">{product.name}</h3>
              <p className="lp-product-card__tagline">{product.tagline}</p>
              <p className="lp-product-card__desc">{product.description}</p>
              <ul className="lp-product-card__points" role="list">
                {product.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <a
                className={`attio-btn lp-product-card__cta ${
                  product.id === 'vos-ai' ? 'attio-btn--primary' : 'attio-btn--outline'
                }`}
                href={product.ctaHref}
                onClick={(e) => {
                  if (product.id === 'vos-ia-health' && onHealthLogin) {
                    e.preventDefault()
                    onHealthLogin()
                    return
                  }
                  if (product.id === 'vos-ai' && onBusinessLogin) {
                    e.preventDefault()
                    onBusinessLogin()
                  }
                }}
              >
                {product.ctaLabel}
              </a>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </LandingSection>
  )
}
