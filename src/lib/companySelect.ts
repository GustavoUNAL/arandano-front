import type { AuthUser, CompanySummary } from '../api'

export function userNeedsCompanyPicker(user: AuthUser): boolean {
  if (user.isPlatformAdmin) return false
  return (user.companies?.length ?? 0) > 1
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
  if (slug.includes('electric') || company.name.toLowerCase().includes('electric')) {
    return 'Servicios eléctricos'
  }
  if (
    slug.includes('arandano') ||
    slug.includes('cafe') ||
    company.name.toLowerCase().includes('café') ||
    company.name.toLowerCase().includes('cafe')
  ) {
    return 'Café y bar'
  }
  if (company.modules.includes('shop')) {
    return 'Retail y tienda online'
  }
  return 'Operación empresarial'
}
