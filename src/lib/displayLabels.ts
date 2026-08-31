/** Etiquetas visibles sin sufijos de entorno demo. */
export function displayCompanyName(name: string | null | undefined): string {
  if (!name?.trim()) return ''
  return name
    .replace(/\s*\(demo\)\s*/gi, ' ')
    .replace(/\s*[-–]\s*demo\s*/gi, ' ')
    .replace(/\bdemo\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export function displaySaleSource(source: string | null | undefined): string {
  if (!source?.trim()) return ''
  if (source === 'POS') return 'Punto de venta'
  if (source === 'MANUAL') return 'Manual'
  if (source === 'SHOP') return 'Tienda'
  if (source === 'IMPORT') return 'Importado'
  return source
}

export function displayUserRole(role: string | null | undefined): string {
  if (!role?.trim()) return ''
  const normalized = role.replace(/\bdemo\b/gi, '').trim()
  const slug = normalized.toLowerCase()
  if (slug === 'owner' || slug === 'propietario') return 'Propietario'
  if (slug === 'member' || slug === 'miembro') return 'Equipo'
  if (slug === 'admin') return 'Administrador'
  if (slug === 'crew') return 'Operación'
  if (slug === 'manager') return 'Gerencia'
  return normalized
}
