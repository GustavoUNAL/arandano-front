import { PLATFORM_MODE, SALES_FLOOR_ONLY } from '../appScope'
import type { LauncherIconView } from '../components/AppLauncherIcon'
import type { NavGroupId } from '../navTypes'

export type LauncherApp = {
  view: LauncherIconView
  label: string
  group: NavGroupId
}

export function buildLauncherApps(options?: {
  canViewTasks?: boolean
  canViewFinance?: boolean
}): LauncherApp[] {
  if (SALES_FLOOR_ONLY) {
    return [
      { view: 'products', label: 'Productos', group: 'catalog' },
      { view: 'sales', label: 'Ventas', group: 'sales' },
    ]
  }

  if (PLATFORM_MODE) {
    const apps: LauncherApp[] = [
      { view: 'products', label: 'Catálogo', group: 'catalog' },
      { view: 'inventory', label: 'Stock', group: 'stock' },
      { view: 'sales', label: 'Ventas', group: 'sales' },
      { view: 'pos', label: 'Punto de venta', group: 'sales' },
      { view: 'shop', label: 'Tienda', group: 'sales' },
      { view: 'cash-close', label: 'Cierre del día', group: 'sales' },
      { view: 'purchases', label: 'Compras', group: 'purchases' },
      { view: 'staff', label: 'Personal', group: 'staff' },
    ]
    if (options?.canViewTasks) {
      apps.push({ view: 'tasks', label: 'Tareas', group: 'tasks' })
    }
    if (options?.canViewFinance) {
      apps.push({ view: 'analytics', label: 'Finanzas', group: 'finance' })
    }
    return apps
  }

  return [
    { view: 'products', label: 'Productos', group: 'catalog' },
    { view: 'recipes', label: 'Recetas', group: 'stock' },
    { view: 'inventory', label: 'Inventario', group: 'stock' },
    { view: 'purchases', label: 'Compras', group: 'stock' },
    { view: 'sales', label: 'Ventas', group: 'sales' },
    { view: 'pos', label: 'Punto de venta', group: 'sales' },
    { view: 'costs', label: 'Costos', group: 'finance' },
    { view: 'gastos', label: 'Gastos', group: 'finance' },
    { view: 'explorer', label: 'Base de datos', group: 'data' },
  ]
}
