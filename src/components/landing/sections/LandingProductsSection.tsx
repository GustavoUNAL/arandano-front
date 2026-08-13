import { motion } from 'framer-motion'
import { getHealthLoginUrl, getLoginUrl } from '../../../lib/authRoutes'
import { BRAND_NAME } from '../../../lib/brand'
import { cn } from '../../../lib/utils'
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
  featured?: boolean
}

const PRODUCTS: ProductCard[] = [
  {
    id: 'vos-ai',
    badge: 'Operaciones',
    name: BRAND_NAME,
    tagline: 'Sistema operativo para tu negocio',
    description:
      'Ventas, inventario, compras y un asistente IA con los datos reales de tu operación.',
    points: ['Punto de venta y pedidos', 'Inventario y compras', 'Finanzas y reportes'],
    ctaLabel: 'Entrar a mi negocio',
    ctaHref: getLoginUrl(),
  },
  {
    id: 'vos-ia-health',
    badge: 'Salud',
    name: 'VOS IA HEALTH',
    tagline: 'Clínicas y consultorios bajo control',
    description:
      'Ayudamos a empresas del sector salud a digitalizar pacientes, agenda, historia clínica, costos e inventario en un solo lugar.',
    points: [
      'Pacientes, agenda y odontograma',
      'Ingresos, gastos y bioseguridad',
      'Asistente IA orientado a clínica',
    ],
    ctaLabel: 'Entrar a VOS IA HEALTH',
    ctaHref: getHealthLoginUrl(),
    featured: true,
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
        title="Una plataforma. Productos pensados por industria."
        subtitle={`${BRAND_NAME} crece con verticales especializadas. VOS IA HEALTH lleva la misma inteligencia a clínicas y consultorios.`}
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
            <GlassCard
              hover
              className={cn(
                'lp-product-card h-full p-5 sm:p-6',
                product.featured && 'lp-product-card--featured',
              )}
            >
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
                className={cn(
                  'public-btn landing-v2__btn-solid lp-product-card__cta',
                  product.featured ? 'public-btn--accent' : 'public-btn--ghost',
                )}
                href={product.ctaHref}
                onClick={(e) => {
                  if (product.id === 'vos-ia-health' && onHealthLogin) {
                    e.preventDefault()
                    onHealthLogin()
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
