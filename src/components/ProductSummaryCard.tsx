import type { CategoryRef, ProductsCatalogSummary } from '../api'

function formatCOP(n: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)
}

type ProductSummaryCardProps = {
  summary: ProductsCatalogSummary | null
  categories: CategoryRef[]
  loading?: boolean
}

export function ProductSummaryCard({
  summary,
  categories,
  loading,
}: ProductSummaryCardProps) {
  return (
    <section
      className="product-summary-card"
      aria-label="Resumen del catálogo de productos"
    >
      <h3 className="sr-only">Resumen del catálogo</h3>

      {loading && !summary && (
        <p className="product-summary-card__loading muted">Calculando resumen…</p>
      )}

      {!loading && !summary && (
        <p className="product-summary-card__loading muted">
          No se pudo cargar el resumen del catálogo.
        </p>
      )}

      {summary && (
        <div className="product-summary-card__kpis" role="group" aria-label="Indicadores">
          <p className="product-summary-card__eyebrow" aria-hidden>
            Catálogo
          </p>
          <div className="product-summary-kpi">
            <span className="product-summary-kpi__label">Productos</span>
            <strong className="product-summary-kpi__value">{summary.total}</strong>
            <span className="product-summary-kpi__hint">en catálogo</span>
          </div>
          <div className="product-summary-kpi">
            <span className="product-summary-kpi__label">Categorías</span>
            <strong className="product-summary-kpi__value">{categories.length}</strong>
            <span className="product-summary-kpi__hint">definidas</span>
          </div>
          <div className="product-summary-kpi">
            <span className="product-summary-kpi__label">Precio prom.</span>
            <strong className="product-summary-kpi__value">
              {formatCOP(summary.averagePriceCOP)}
            </strong>
            <span className="product-summary-kpi__hint">todo el catálogo</span>
          </div>
        </div>
      )}
    </section>
  )
}
