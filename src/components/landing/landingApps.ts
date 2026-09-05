import type { LauncherIconView } from '../AppLauncherIcon'

export type LandingAppStatus = 'disponible' | 'desarrollo' | 'proxima'

export type LandingApp = {
  view: LauncherIconView
  name: string
  tone: string
  text: string
  from: string
  status: LandingAppStatus
}

export const LANDING_APP_STATUS: Record<LandingAppStatus, string> = {
  disponible: 'Disponible',
  desarrollo: 'En desarrollo',
  proxima: 'Próximamente',
}

export const LANDING_APPS: Record<string, LandingApp> = {
  sales: {
    view: 'sales',
    name: 'Ventas',
    tone: 'sales',
    text: 'Registre y controle las ventas de su negocio en el momento.',
    from: 'Nace en caja, POS o tienda web.',
    status: 'disponible',
  },
  inventory: {
    view: 'inventory',
    name: 'Inventario',
    tone: 'stock',
    text: 'Controle existencias y sepa qué hay que reponer.',
    from: 'Se mueve cuando hay una venta o una compra.',
    status: 'desarrollo',
  },
  recipes: {
    view: 'recipes',
    name: 'Recetas',
    tone: 'catalog',
    text: 'Cada venta descuenta los insumos del producto.',
    from: 'Sale del producto vendido.',
    status: 'desarrollo',
  },
  booking: {
    view: 'booking',
    name: 'Citas',
    tone: 'booking',
    text: 'Gestione reservas, horarios y clientes desde una agenda.',
    from: 'Entra por la agenda pública o el panel.',
    status: 'disponible',
  },
  customers: {
    view: 'customers',
    name: 'Clientes',
    tone: 'staff',
    text: 'Historial organizado de sus clientes y sus visitas.',
    from: 'Se arma con ventas y citas ya registradas.',
    status: 'desarrollo',
  },
  analytics: {
    view: 'analytics',
    name: 'Analítica',
    tone: 'data',
    text: 'Indicadores a partir de lo que ya registró su operación.',
    from: 'Lee ventas, caja e inventario.',
    status: 'desarrollo',
  },
  tasks: {
    view: 'tasks',
    name: 'Automatización',
    tone: 'tasks',
    text: 'Alertas y procesos automáticos sobre esos mismos datos.',
    from: 'Parte de los movimientos ya registrados.',
    status: 'proxima',
  },
  'cash-close': {
    view: 'cash-close',
    name: 'Cierre de caja',
    tone: 'cash',
    text: 'Cierre el día y deje el dinero de caja cuadrado.',
    from: 'Sale de las ventas registradas en el día.',
    status: 'disponible',
  },
  staff: {
    view: 'staff',
    name: 'Personal',
    tone: 'staff',
    text: 'Registre turnos y el equipo que atiende su operación.',
    from: 'Se usa junto a ventas y citas.',
    status: 'desarrollo',
  },
  products: {
    view: 'products',
    name: 'Catálogo',
    tone: 'catalog',
    text: 'Mantenga el catálogo de lo que vende.',
    from: 'Alimenta ventas, recetas e inventario.',
    status: 'desarrollo',
  },
  shop: {
    view: 'shop',
    name: 'Tienda',
    tone: 'shop',
    text: 'Venda en línea con el mismo catálogo y las mismas existencias.',
    from: 'Parte de las ventas de su negocio.',
    status: 'desarrollo',
  },
  projects: {
    view: 'projects',
    name: 'Proyectos',
    tone: 'projects',
    text: 'Organice trabajos y el seguimiento de cada servicio.',
    from: 'Se arma con clientes y la operación diaria.',
    status: 'desarrollo',
  },
  settings: {
    view: 'settings',
    name: 'Enlace público',
    tone: 'booking',
    text: 'Comparta un enlace para que reserven sin escribirle.',
    from: 'Entra directo a la agenda de citas.',
    status: 'disponible',
  },
}

export const LANDING_CORE_APPS: LandingApp[] = [
  LANDING_APPS.sales,
  LANDING_APPS.inventory,
  LANDING_APPS.recipes,
  LANDING_APPS.booking,
  LANDING_APPS.customers,
  LANDING_APPS.analytics,
  LANDING_APPS.tasks,
]
