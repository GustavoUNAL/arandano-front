import type { DentalPatient } from './dentalApi'

export type DentalView =
  | 'home'
  | 'patients'
  | 'agenda'
  | 'ingresos'
  | 'financiamiento'
  | 'gastos'
  | 'reportes'
  | 'inventory'
  | 'bio-temp'
  | 'bio-sterilization'
  | 'bio-waste'
  | 'dental-config'
  | 'analytics'

export const DENTAL_VIEWS = new Set<string>([
  'home',
  'patients',
  'agenda',
  'ingresos',
  'financiamiento',
  'gastos',
  'reportes',
  'inventory',
  'bio-temp',
  'bio-sterilization',
  'bio-waste',
  'dental-config',
  'analytics',
])

export type DentalNavItem = {
  view: DentalView
  label: string
  icon: string
  children?: Array<{ view: DentalView; label: string }>
}

export const DENTAL_NAV: DentalNavItem[] = [
  { view: 'home', label: 'Inicio', icon: 'home' },
  { view: 'patients', label: 'Pacientes', icon: 'patients' },
  { view: 'agenda', label: 'Agenda', icon: 'agenda' },
  { view: 'ingresos', label: 'Ingresos', icon: 'ingresos' },
  { view: 'financiamiento', label: 'Financiamiento', icon: 'financing' },
  { view: 'gastos', label: 'Gastos', icon: 'gastos' },
  { view: 'reportes', label: 'Reportes', icon: 'reportes' },
  { view: 'inventory', label: 'Inventario', icon: 'inventory' },
  {
    view: 'bio-temp',
    label: 'Bioseguridad',
    icon: 'bio',
    children: [
      { view: 'bio-temp', label: 'Temperatura y Humedad' },
      { view: 'bio-sterilization', label: 'Esterilizaciones' },
      { view: 'bio-waste', label: 'Residuos' },
    ],
  },
]

export function isDentalView(v: string | null | undefined): v is DentalView {
  return !!v && DENTAL_VIEWS.has(v)
}

export function formatMoney(value: string | number | null | undefined): string {
  const n = typeof value === 'string' ? Number(value) : value ?? 0
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0)
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

export function needsValuation(patient: DentalPatient): boolean {
  const notes = (patient.notes ?? '').toLowerCase()
  if (notes.includes('valoraci')) return true
  const hist = patient.clinicalHistory as
    | { tratamientos?: Array<{ status?: string; name?: string }> }
    | null
    | undefined
  const txs = hist?.tratamientos ?? []
  return txs.some(
    (t) =>
      (t.status ?? '').toLowerCase() === 'pendiente' &&
      (t.name ?? '').toLowerCase().includes('valoraci'),
  )
}
