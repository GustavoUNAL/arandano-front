import type { NavGroupId } from '../navTypes'

export type HubTargetView =
  | 'products'
  | 'recipes'
  | 'inventory'
  | 'sales'
  | 'purchases'
  | 'costs'
  | 'gastos'
  | 'explorer'

type HubSection = {
  id: NavGroupId
  title: string
  hint: string
  items: { view: HubTargetView; label: string; hint: string }[]
}

export function NavigationHub({
  inventoryHint,
  purchasesHint,
  onNavigate,
}: {
  inventoryHint: string
  purchasesHint: string
  onNavigate: (view: HubTargetView) => void
}) {
  const sections: HubSection[] = [
    {
      id: 'catalog',
      title: 'Catálogo',
      hint: 'Carta, recetas e insumos',
      items: [
        {
          view: 'products',
          label: 'Productos',
          hint: 'Carta y precios de venta',
        },
        {
          view: 'recipes',
          label: 'Recetas',
          hint: 'Fichas técnicas y costeo',
        },
      ],
    },
    {
      id: 'stock',
      title: 'Inventario',
      hint: inventoryHint,
      items: [
        {
          view: 'inventory',
          label: 'Inventario',
          hint: 'Existencias y movimientos físicos',
        },
      ],
    },
    {
      id: 'sales',
      title: 'Ventas',
      hint: 'Ingresos del día',
      items: [
        {
          view: 'sales',
          label: 'Ventas',
          hint: 'Tickets y cobros',
        },
      ],
    },
    {
      id: 'purchases',
      title: 'Compras',
      hint: purchasesHint,
      items: [
        {
          view: 'purchases',
          label: 'Compras',
          hint: 'Lotes y proveedores (evento financiero)',
        },
      ],
    },
    {
      id: 'finance',
      title: 'Finanzas',
      hint: 'Costos y gastos',
      items: [
        {
          view: 'costs',
          label: 'Costos',
          hint: 'Estructura de costos y márgenes',
        },
        {
          view: 'gastos',
          label: 'Gastos',
          hint: 'Gastos operativos',
        },
      ],
    },
    {
      id: 'data',
      title: 'Datos',
      hint: 'Solo lectura',
      items: [
        {
          view: 'explorer',
          label: 'Explorador DB',
          hint: 'Consulta tablas (lectura)',
        },
      ],
    },
  ]

  return (
    <div className="nav-hub">
      <header className="nav-hub__hero">
        <h1 className="nav-hub__title">Arándano Café</h1>
        <p className="nav-hub__subtitle muted">Operación del local</p>
        <p className="nav-hub__lede">
          Elegí una sección. Las tarjetas agrupan el mismo criterio que la barra
          lateral compacta.
        </p>
      </header>

      <div className="nav-hub__sections">
        {sections.map((section) => (
          <section
            key={section.id}
            className={`nav-hub__section nav-hub__section--${section.id}`}
            aria-labelledby={`hub-${section.id}-title`}
          >
            <div className="nav-hub__section-head">
              <h2 className="nav-hub__section-title" id={`hub-${section.id}-title`}>
                {section.title}
              </h2>
              <p className="nav-hub__section-hint muted">{section.hint}</p>
            </div>
            <ul className="nav-hub__cards">
              {section.items.map((item) => (
                <li key={item.view}>
                  <button
                    type="button"
                    className="nav-hub-card"
                    onClick={() => onNavigate(item.view)}
                  >
                    <span className="nav-hub-card__label">{item.label}</span>
                    <span className="nav-hub-card__hint muted">{item.hint}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
