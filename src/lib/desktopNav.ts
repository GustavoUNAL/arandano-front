import { PLATFORM_MODE, SALES_FLOOR_ONLY } from '../appScope'
import type { NavGroupId } from '../navTypes'

export type DesktopNavLink = {
  view: string
  label: string
}

export type DesktopNavGroup = {
  id: NavGroupId
  label: string
  items: DesktopNavLink[]
}

export function buildDesktopNavGroups(options: {
  canViewFinance?: boolean
  canViewTasks?: boolean
}): DesktopNavGroup[] {
  if (SALES_FLOOR_ONLY) {
    return [
      {
        id: 'catalog',
        label: 'Productos',
        items: [{ view: 'products', label: 'Productos a la venta' }],
      },
      {
        id: 'sales',
        label: 'Ventas',
        items: [{ view: 'sales', label: 'Ventas' }],
      },
    ]
  }

  if (PLATFORM_MODE) {
    const groups: DesktopNavGroup[] = [
      {
        id: 'catalog',
        label: 'Productos',
        items: [{ view: 'products', label: 'Catálogo' }],
      },
      {
        id: 'stock',
        label: 'Inventario',
        items: [{ view: 'inventory', label: 'Stock' }],
      },
      {
        id: 'sales',
        label: 'Ventas',
        items: [
          { view: 'sales', label: 'Ventas' },
          { view: 'pos', label: 'Punto de venta · Mesas' },
          { view: 'shop', label: 'Tienda en línea' },
          { view: 'cash-close', label: 'Cierre del día' },
        ],
      },
      {
        id: 'purchases',
        label: 'Compras',
        items: [{ view: 'purchases', label: 'Compras' }],
      },
      {
        id: 'staff',
        label: 'Personal',
        items: [{ view: 'staff', label: 'Turnos y nómina' }],
      },
    ]
    if (options.canViewTasks) {
      groups.push({
        id: 'tasks',
        label: 'Tareas',
        items: [{ view: 'tasks', label: 'Calendario' }],
      })
    }
    if (options.canViewFinance) {
      groups.push({
        id: 'finance',
        label: 'Finanzas',
        items: [{ view: 'analytics', label: 'Análisis financiero' }],
      })
    }
    return groups
  }

  return [
    {
      id: 'catalog',
      label: 'Productos',
      items: [{ view: 'products', label: 'Productos a la venta' }],
    },
    {
      id: 'stock',
      label: 'Inventario',
      items: [
        { view: 'inventory', label: 'Productos' },
        { view: 'purchases', label: 'Compras' },
      ],
    },
    {
      id: 'sales',
      label: 'Ventas',
      items: [
        { view: 'sales', label: 'Ventas' },
        { view: 'pos', label: 'Punto de venta · Mesas' },
        { view: 'cash-close', label: 'Cierre del día' },
      ],
    },
    {
      id: 'finance',
      label: 'Finanzas',
      items: [
        { view: 'costs', label: 'Costos' },
        { view: 'gastos', label: 'Gastos' },
      ],
    },
    {
      id: 'data',
      label: 'Datos',
      items: [{ view: 'explorer', label: 'Base de datos' }],
    },
  ]
}
