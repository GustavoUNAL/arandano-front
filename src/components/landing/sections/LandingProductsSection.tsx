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
    badge: 'Operaciones',
    name: BRAND_NAME,
    tagline: 'Sistema operativo para tu negocio',
    description:
      'Lo que opera un negocio real: ventas, inventario, compras, POS, tienda, agenda, equipo y un asistente IA con tus datos.',
    points: [
      'Punto de venta, pedidos web y agenda',
      'Inventario, compras y costos',
      'Finanzas, personal y reportes',
    ],
    ctaLabel: 'Iniciar sesión',
    ctaHref: getLoginUrl(),
  },
  {
    id: 'vos-ia-health',
    badge: 'Salud',
    name: 'VOS IA HEALTH',
    tagline: 'Clínicas y consultorios bajo control',
    description:
      'Pacientes, agenda clínica, historia, odontograma, costos e inventario en un solo lugar — con la misma inteligencia de VOS IA.',
    points: [
      'Pacientes, agenda y odontograma',
      'Ingresos, gastos y bioseguridad',
      'Asistente IA orientado a clínica',
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
        title="Una plataforma. Dos formas de operar."
        subtitle={`${BRAND_NAME} cubre el negocio completo — comercio, inventario, agenda y finanzas. VOS IA HEALTH aplica la misma arquitectura a clínicas y consultorios.`}
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
                className={`public-btn landing-v2__btn-solid lp-product-card__cta ${
                  product.id === 'vos-ai' ? 'public-btn--accent' : 'public-btn--ghost'
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
