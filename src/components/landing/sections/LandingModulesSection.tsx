import { motion } from 'framer-motion'
import type { MouseEvent } from 'react'
import {
  AppLauncherIcon,
  type LauncherIconView,
} from '../../AppLauncherIcon'
import { BRAND_NAME } from '../../../lib/brand'
import { fadeUp, GlassCard, LandingSection, LandingSectionHeader } from './shared'

type ModuleCard = {
  view: LauncherIconView
  name: string
  text: string
  badge?: string
  anchorId?: string
}

type ModuleGroup = {
  id: string
  title: string
  intro: string
  modules: ModuleCard[]
}

const MODULE_GROUPS: ModuleGroup[] = [
  {
    id: 'comercial',
    title: 'Comercial',
    intro: 'Catálogo, cobro y canales de venta en un mismo flujo.',
    modules: [
      {
        view: 'products',
        name: 'Catálogo',
        text: 'Productos, precios, categorías y recetas. Lo que vendés queda definido una vez y se usa en el POS, la tienda y los reportes.',
      },
      {
        view: 'sales',
        name: 'Ventas',
        text: 'Historial unificado de tickets: salón, web y pedidos. Filtros por fecha, canal y medio de pago, con el detalle de cada venta.',
      },
      {
        view: 'pos',
        name: 'Punto de venta',
        text: 'Mesas, comandas y cobro en el salón. Pensado para operar rápido en caja o en el celular, con el inventario en vivo.',
      },
      {
        view: 'shop',
        name: 'Tienda en línea',
        text: 'Catálogo público para pedir por la web. Mismos precios y stock del negocio; el pedido entra al mismo sistema de ventas.',
      },
      {
        view: 'cash-close',
        name: 'Cierre de caja',
        text: 'Arqueo al final del turno: efectivo, transferencias y diferencia. El reporte del día queda listo para gerencia.',
      },
    ],
  },
  {
    id: 'operacion',
    title: 'Operación',
    intro: 'Stock, compras y costos conectados a lo que realmente se vende.',
    modules: [
      {
        view: 'inventory',
        name: 'Inventario',
        text: 'Existencias, movimientos y mínimos. Ves qué se agota antes de que falte en caja, cocina o góndola.',
      },
      {
        view: 'purchases',
        name: 'Compras',
        text: 'Lotes, proveedores y costos de entrada. El stock sube cuando llega la mercancía, con comprobante y trazabilidad.',
      },
      {
        view: 'recipes',
        name: 'Recetas',
        text: 'Insumos por producto y rendimiento. Sirve para costear platos o bebidas y descontar inventario con cada venta.',
      },
      {
        view: 'costs',
        name: 'Costos',
        text: 'Costo de producción y margen por ítem. Sabés si un producto deja utilidad antes de promocionarlo.',
      },
    ],
  },
  {
    id: 'equipo',
    title: 'Equipo y servicios',
    intro: 'Quién trabaja, qué hay que hacer y cómo se atiende al cliente.',
    modules: [
      {
        view: 'booking',
        name: 'Agenda de citas',
        badge: 'Nuevo',
        anchorId: 'agenda',
        text: 'Reservas en tiempo real, sin doble asignación. El cliente elige servicio, profesional y horario desde el celular.',
      },
      {
        view: 'staff',
        name: 'Personal',
        text: 'Turnos y liquidación por hora. El equipo queda atado a la operación del día, no a una planilla aparte.',
      },
      {
        view: 'tasks',
        name: 'Tareas',
        text: 'Pendientes del equipo en calendario: asignadas, con fecha y seguimiento. Lo operativo deja de vivir en el chat.',
      },
      {
        view: 'projects',
        name: 'Proyectos',
        text: 'Historial de obras y servicios (instalaciones, visitas, trabajos a medida): lo ejecutado, no solo la factura.',
      },
    ],
  },
  {
    id: 'direccion',
    title: 'Dirección',
    intro: 'Números del negocio y un asistente que responde con datos reales.',
    modules: [
      {
        view: 'analytics',
        name: 'Finanzas',
        text: 'Utilidad, margen, ingresos y costos. El análisis usa ventas, inventario y operación — no un Excel desconectado.',
      },
      {
        view: 'gastos',
        name: 'Gastos',
        text: 'Egresos operativos del mes: arriendo, servicios y otros. Entran al mismo panorama financiero del negocio.',
      },
    ],
  },
]

type Props = {
  accessUrl: string
  onAccess?: (e: MouseEvent<HTMLAnchorElement>) => void
}

export function LandingModulesSection({ accessUrl, onAccess }: Props) {
  return (
    <LandingSection id="modulos" ariaLabelledBy="modules-title" className="lp-modules">
      <LandingSectionHeader
        kicker="Plataforma"
        titleId="modules-title"
        title="Todos los módulos, en un solo sistema"
        subtitle={`${BRAND_NAME} cubre la operación completa: vender, comprar, controlar stock, agendar, coordinar al equipo y leer las finanzas. Cada módulo comparte los mismos datos — no hay islas ni dobles digitaciones.`}
      />

      {MODULE_GROUPS.map((group) => (
        <div key={group.id} className="lp-modules__group">
          <header className="lp-modules__group-head">
            <h3 className="lp-modules__group-title">{group.title}</h3>
            <p className="lp-modules__group-intro">{group.intro}</p>
          </header>
          <div className="lp-modules__grid">
            {group.modules.map((mod, i) => (
              <motion.div
                key={mod.view}
                id={mod.anchorId}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={fadeUp}
                transition={{ duration: 0.4, delay: (i % 4) * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <GlassCard
                  hover
                  className={`lp-module-card h-full p-4 sm:p-5${mod.badge ? ' lp-module-card--new' : ''}`}
                >
                  <div className="lp-module-card__top">
                    <span className="lp-module-card__icon" aria-hidden>
                      <AppLauncherIcon view={mod.view} />
                    </span>
                    {mod.badge ? <p className="lp-module-card__group">{mod.badge}</p> : null}
                  </div>
                  <h4 className="lp-module-card__name">{mod.name}</h4>
                  <p className="lp-module-card__text">{mod.text}</p>
                </GlassCard>
              </motion.div>
            ))}
            {group.id === 'direccion' ? (
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={fadeUp}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <GlassCard hover className="lp-module-card lp-module-card--ai h-full p-4 sm:p-5">
                  <p className="lp-module-card__group">Inteligencia</p>
                  <h4 className="lp-module-card__name">Asistente IA</h4>
                  <p className="lp-module-card__text">
                    Preguntás en lenguaje natural y responde con ventas, stock, compras, citas y
                    finanzas de tu empresa. No inventa cifras: lee la operación.
                  </p>
                </GlassCard>
              </motion.div>
            ) : null}
          </div>
        </div>
      ))}

      <div className="lp-modules__cta">
        <a
          className="public-btn public-btn--accent landing-v2__btn-solid"
          href={accessUrl}
          onClick={onAccess}
        >
          Registrarme
        </a>
      </div>
    </LandingSection>
  )
}
