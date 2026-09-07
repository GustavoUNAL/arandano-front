import type { AuthUser } from '../api'

/**
 * El propietario debe elegir tipo de negocio si la empresa aún no lo tiene.
 * Plataforma admin y staff no pasan por este paso.
 */
export function userNeedsBusinessSetup(user: AuthUser | null | undefined): boolean {
  if (!user) return false
  if (user.isPlatformAdmin && (user.platformView || !user.companyId?.trim())) {
    return false
  }
  if (user.role !== 'owner') return false
  const company = user.companies?.find((c) => c.id === user.companyId)
  if (!company) return false
  return !company.businessType?.trim()
}
