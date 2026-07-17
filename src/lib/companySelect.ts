import type { AuthUser, CompanySummary } from '../api'

/** Empresas donde el usuario es propietario (owner). */
export function ownedCompanies(user: AuthUser | null | undefined): CompanySummary[] {
  if (!user?.companies?.length) return []
  return user.companies.filter((c) => c.role === 'owner')
}

/**
 * Selector / cambio de empresa: solo owners con 2+ empresas.
 * No aplica a platform admin ni a staff/manager de una sola empresa.
 */
export function userNeedsCompanyPicker(user: AuthUser | null | undefined): boolean {
  if (!user) return false
  if (user.isPlatformAdmin) return false
  return ownedCompanies(user).length > 1
}

export function canSwitchCompany(user: AuthUser | null | undefined): boolean {
  return userNeedsCompanyPicker(user)
}

export function roleLabel(role: string): string {
  switch (role) {
    case 'owner':
      return 'Propietario'
    case 'admin':
      return 'Administrador'
    case 'manager':
      return 'Gerente'
    case 'staff':
      return 'Personal'
    default:
      return role
  }
}

export function companyInitial(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  return trimmed.charAt(0).toUpperCase()
}

export function companyHint(company: CompanySummary): string {
  const slug = company.slug.toLowerCase()
  const name = company.name.toLowerCase()
  if (slug.includes('electric') || name.includes('electric')) {
    return 'Servicios eléctricos'
  }
  if (
    slug.includes('arandano') ||
    slug.includes('cafe') ||
    name.includes('café') ||
    name.includes('cafe')
  ) {
    return 'Café y bar'
  }
  if (slug === 'main' || name === 'main') {
    return 'Holding / operación general'
  }
  if (company.modules.includes('shop')) {
    return 'Retail y tienda online'
  }
  return 'Operación empresarial'
}
