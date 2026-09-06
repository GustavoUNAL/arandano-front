import type { LauncherIconView } from '../AppLauncherIcon'

export type LandingAppStatus = 'disponible' | 'desarrollo' | 'proxima'

export type LandingApp = {
  view: LauncherIconView
  name: string
  tone: string
  text: string
  from: string
  saves: string
  advantages: string[]
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
    saves:
      'Cada ticket queda en su empresa: ítems, canal, hora y forma de pago. No se mezcla con otro negocio.',
    advantages: [
      'Ve caja, mostrador y web en un solo historial.',
      'El ticket alimenta inventario, recetas y cierre.',
      'Consulta el día sin pasar a otra planilla.',
    ],
    status: 'disponible',
  },
  inventory: {
    view: 'inventory',
    name: 'Inventario',
    tone: 'stock',
    text: 'Controle existencias y sepa qué hay que reponer.',
    from: 'Se mueve cuando hay una venta o una compra.',
    saves:
      'Las existencias se actualizan con ventas, compras y recetas. El saldo queda por insumo o producto.',
    advantages: [
      'Sabe qué hay, qué falta y qué hay que pedir.',
      'Una venta baja el stock sin digitación extra.',
      'Evita vender lo que ya no tiene.',
    ],
    status: 'desarrollo',
  },
  recipes: {
    view: 'recipes',
    name: 'Recetas',
    tone: 'catalog',
    text: 'Cada venta descuenta los insumos del producto.',
    from: 'Sale del producto vendido.',
    saves:
      'La receta liga el producto a sus insumos. Al vender, se descuenta café, leche o lo que corresponda.',
    advantages: [
      'El menú habla con el inventario, no aparte.',
      'Ve el costo real de cada plato o bebida.',
      'Reduce merma por descuentos a mano.',
    ],
    status: 'desarrollo',
  },
  booking: {
    view: 'booking',
    name: 'Citas',
    tone: 'booking',
    text: 'Gestione reservas, horarios y clientes desde una agenda.',
    from: 'Entra por la agenda pública o el panel.',
    saves:
      'La reserva queda con horario, servicio, profesional y cliente. El hueco ocupado no se vuelve a ofrecer.',
    advantages: [
      'Menos ida y vuelta por WhatsApp.',
      'El cliente reserva solo, las 24 horas.',
      'La agenda y el cobro quedan en el mismo sistema.',
    ],
    status: 'disponible',
  },
  customers: {
    view: 'customers',
    name: 'Clientes',
    tone: 'staff',
    text: 'Historial organizado de sus clientes y sus visitas.',
    from: 'Se arma con ventas y citas ya registradas.',
    saves:
      'La ficha se arma con lo que ya ocurrió: visitas, compras y reservas. No hay que volver a cargarla.',
    advantages: [
      'Reconoce al cliente habitual sin otra libreta.',
      'Ve la última visita y lo que suele pedir.',
      'Sirve igual a un café, una barbería o un taller.',
    ],
    status: 'desarrollo',
  },
  analytics: {
    view: 'analytics',
    name: 'Analítica',
    tone: 'data',
    text: 'Indicadores a partir de lo que ya registró su operación.',
    from: 'Lee ventas, caja e inventario.',
    saves:
      'No pide datos nuevos. Lee ventas, citas, stock y caja ya guardados y los convierte en indicadores.',
    advantages: [
      'El informe sale de la operación, no de Excel.',
      'Ve el día, la semana y el canal en un vistazo.',
      'La IA trabaja sobre esos mismos números.',
    ],
    status: 'desarrollo',
  },
  tasks: {
    view: 'tasks',
    name: 'Automatización',
    tone: 'tasks',
    text: 'Alertas y procesos automáticos sobre esos mismos datos.',
    from: 'Parte de los movimientos ya registrados.',
    saves:
      'Las reglas se guardan en su empresa: si el stock baja o hay una cita mañana, el sistema actúa solo.',
    advantages: [
      'Avisa antes de que se agote un insumo.',
      'Recuerda citas sin que usted las persiga.',
      'Menos trabajo repetido al cierre del día.',
    ],
    status: 'proxima',
  },
  'cash-close': {
    view: 'cash-close',
    name: 'Cierre de caja',
    tone: 'cash',
    text: 'Cierre el día y deje el dinero de caja cuadrado.',
    from: 'Sale de las ventas registradas en el día.',
    saves:
      'El cierre toma las ventas del turno, compara lo esperado con lo contado y deja el resultado archivado.',
    advantages: [
      'Cuadra sin sumar tickets a mano.',
      'Ve efectivo, Nequi y web por separado.',
      'El día queda cerrado y consultable.',
    ],
    status: 'disponible',
  },
  staff: {
    view: 'staff',
    name: 'Personal',
    tone: 'staff',
    text: 'Registre turnos y el equipo que atiende su operación.',
    from: 'Se usa junto a ventas y citas.',
    saves:
      'Cada persona queda con rol y turno. Las citas y las ventas se pueden atribuir a quien atendió.',
    advantages: [
      'Sabe quién abre, quién atiende y quién cierra.',
      'La agenda no choca dos turnos a la misma hora.',
      'El equipo se ve en la misma plataforma.',
    ],
    status: 'desarrollo',
  },
  products: {
    view: 'products',
    name: 'Catálogo',
    tone: 'catalog',
    text: 'Mantenga el catálogo de lo que vende.',
    from: 'Alimenta ventas, recetas e inventario.',
    saves:
      'Precio, nombre y receta viven en un solo catálogo. Caja y tienda web leen el mismo listado.',
    advantages: [
      'Un cambio de precio llega a todos los canales.',
      'No duplica productos entre mostrador y web.',
      'Alimenta recetas, stock y ventas.',
    ],
    status: 'desarrollo',
  },
  shop: {
    view: 'shop',
    name: 'Tienda',
    tone: 'shop',
    text: 'Venda en línea con el mismo catálogo y las mismas existencias.',
    from: 'Parte de las ventas de su negocio.',
    saves:
      'El pedido web es una venta más: mismo catálogo, mismo stock, mismo historial de clientes.',
    advantages: [
      'No mantiene un inventario paralelo para la web.',
      'El pedido entra a caja como cualquier ticket.',
      'El cliente compra con lo que usted ya tiene.',
    ],
    status: 'desarrollo',
  },
  projects: {
    view: 'projects',
    name: 'Proyectos',
    tone: 'projects',
    text: 'Organice trabajos y el seguimiento de cada servicio.',
    from: 'Se arma con clientes y la operación diaria.',
    saves:
      'Cada trabajo queda con cliente, estado y siguiente paso. El avance no se pierde en un chat.',
    advantages: [
      'Ve qué está en curso y qué falta por entregar.',
      'El cliente y el trabajo viven juntos.',
      'La analítica lee esos mismos hitos.',
    ],
    status: 'desarrollo',
  },
  settings: {
    view: 'settings',
    name: 'Enlace público',
    tone: 'booking',
    text: 'Comparta un enlace para que reserven sin escribirle.',
    from: 'Entra directo a la agenda de citas.',
    saves:
      'El enlace apunta a su agenda. Cada reserva llega con horario y datos del cliente, sin que usted las copie.',
    advantages: [
      'El cliente reserva cuando le queda bien.',
      'Usted no media cada mensaje para agendar.',
      'Las citas del enlace son las mismas del panel.',
    ],
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
