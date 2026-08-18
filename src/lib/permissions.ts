import type { AuthUser } from '../api'

export function hasPermission(
  user: AuthUser | null | undefined,
  slug: string,
): boolean {
  if (!user) return false
  if (user.isPlatformAdmin && user.platformView) return true
  return user.permissions?.includes(slug) ?? false
}

/** Módulos habilitados de la empresa activa. */
export function getCompanyModules(user: AuthUser | null | undefined): string[] {
  if (!user?.companyId) return []
  const company = user.companies?.find((c) => c.id === user.companyId)
  return company?.modules ?? []
}

export function hasCompanyModule(
  user: AuthUser | null | undefined,
  moduleSlug: string,
): boolean {
  if (!user) return false
  if (user.isPlatformAdmin && !user.platformView) {
    // Platform admin dentro de una empresa: respeta módulos de esa empresa.
    return getCompanyModules(user).includes(moduleSlug)
  }
  if (user.isPlatformAdmin && user.platformView) return true
  return getCompanyModules(user).includes(moduleSlug)
}

/** Vista de app → módulo de plataforma requerido (si aplica). */
export const VIEW_MODULE: Record<string, string | null> = {
  home: null,
  menu: null,
  products: 'products',
  recipes: 'products',
  inventory: 'inventory',
  sales: 'sales',
  pos: 'sales',
  shop: 'sales',
  'cash-close': 'sales',
  purchases: 'purchases',
  staff: 'staff',
  analytics: 'finance',
  tasks: 'tasks',
  projects: 'projects',
  costs: null,
  gastos: null,
  explorer: null,
  patients: 'dental',
  agenda: 'dental',
  ingresos: 'dental',
  financiamiento: 'dental',
  reportes: 'dental',
  'bio-temp': 'dental',
  'bio-sterilization': 'dental',
  'bio-waste': 'dental',
  'dental-config': 'dental',
  appointments: 'booking',
  customers: 'booking',
  services: 'booking',
  professionals: 'booking',
  hours: 'booking',
  settings: 'booking',
  booking: 'booking',
}

export function canAccessView(
  user: AuthUser | null | undefined,
  view: string,
): boolean {
  if (!user) return false
  if (hasCompanyModule(user, 'booking')) {
    if (
      view === 'home' ||
      view === 'booking' ||
      view === 'agenda' ||
      view === 'appointments' ||
      view === 'customers' ||
      view === 'services' ||
      view === 'professionals' ||
      view === 'hours' ||
      view === 'settings'
    ) {
      return hasPermission(user, 'booking.view') || user.role === 'owner' || user.role === 'manager' || user.role === 'admin'
    }
  }
  if (view === 'analytics') {
    return hasCompanyModule(user, 'finance') && hasPermission(user, 'finance.view')
  }
  if (view === 'tasks') {
    return canViewTasks(user)
  }
  if (view === 'projects') {
    return canViewProjects(user)
  }
  if (view === 'gastos' && hasCompanyModule(user, 'dental')) {
    return hasCompanyModule(user, 'dental')
  }
  if (view === 'inventory' && hasCompanyModule(user, 'dental')) {
    return hasCompanyModule(user, 'inventory')
  }
  const mod = VIEW_MODULE[view]
  if (mod == null) return true
  return hasCompanyModule(user, mod)
}

export function hasBookingModule(user: AuthUser | null | undefined): boolean {
  return hasCompanyModule(user, 'booking')
}

/** Empresa cuyo único módulo habilitado es la agenda (p. ej. Ricky). */
export function isBookingOnlyCompany(user: AuthUser | null | undefined): boolean {
  const mods = getCompanyModules(user)
  return mods.includes('booking') && mods.every((m) => m === 'booking')
}

export function hasDentalModule(user: AuthUser | null | undefined): boolean {
  return hasCompanyModule(user, 'dental')
}

/** Clínica Health: dental sin operación general (ventas). El resto usa VOS IA. */
export function isHealthClinicCompany(user: AuthUser | null | undefined): boolean {
  return hasDentalModule(user) && !hasCompanyModule(user, 'sales')
}

export function canViewFinance(user: AuthUser | null | undefined): boolean {
  return (
    hasCompanyModule(user, 'finance') && hasPermission(user, 'finance.view')
  )
}

export function canViewInventory(user: AuthUser | null | undefined): boolean {
  return (
    hasCompanyModule(user, 'inventory') &&
    (hasPermission(user, 'inventory.view') ||
      user?.role === 'owner' ||
      user?.role === 'manager')
  )
}

export function canDeleteSales(user: AuthUser | null | undefined): boolean {
  return hasPermission(user, 'sales.delete')
}

function companyHasTasksModule(user: AuthUser | null | undefined): boolean {
  return hasCompanyModule(user, 'tasks')
}

export function canViewProjects(user: AuthUser | null | undefined): boolean {
  if (!user) return false
  if (!hasCompanyModule(user, 'projects')) return false
  if (hasPermission(user, 'projects.view')) return true
  if (user.role === 'owner' || user.role === 'manager') return true
  return false
}

export function canViewTasks(user: AuthUser | null | undefined): boolean {
  if (!user) return false
  if (!companyHasTasksModule(user)) return false
  if (hasPermission(user, 'tasks.view')) return true
  if (user.role === 'owner' || user.role === 'manager') return true
  return false
}

export function canManageTasks(
  user: AuthUser | null | undefined,
  action: 'create' | 'update' | 'delete',
): boolean {
  if (!companyHasTasksModule(user)) return false
  if (hasPermission(user, `tasks.${action}`)) return true
  if (user?.role === 'owner' || user?.role === 'manager') return true
  return false
}
