import type { ReactNode } from 'react'

export type SectionSummaryItem = {
  label: string
  value: ReactNode
  title?: string
}

export type SectionSummarySection =
  | 'products'
  | 'recipes'
  | 'inventory'
  | 'sales'
  | 'purchases'
  | 'costs'
  | 'explorer'

const SECTION_HEADINGS: Record<SectionSummarySection, string> = {
  products: 'Resumen · Productos',
  recipes: 'Resumen · Recetas',
  inventory: 'Resumen · Inventario',
  sales: 'Resumen · Ventas',
  purchases: 'Resumen · Compras',
  costs: 'Resumen · Costos',
  explorer: 'Resumen · Explorador',
}

export function SectionSummaryBar({
  section,
  items,
  ariaLabel,
}: {
  section: SectionSummarySection
  items: SectionSummaryItem[]
  ariaLabel?: string
}) {
  if (items.length === 0) return null
  const heading = SECTION_HEADINGS[section]
  return (
    <div
      className={`section-summary-bar section-summary-bar--${section}`}
      role="region"
      aria-label={ariaLabel ?? heading}
    >
      <div className="section-summary-heading">{heading}</div>
      <div className="section-summary-pills-row">
        {items.map((it) => (
          <span
            key={it.label}
            className="section-summary-pill"
            title={it.title}
          >
            <span className="section-summary-pill-label">{it.label}</span>
            <strong className="section-summary-pill-value">{it.value}</strong>
          </span>
        ))}
      </div>
    </div>
  )
}
