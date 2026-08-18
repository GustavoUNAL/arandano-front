export type BookingView =
  | 'home'
  | 'booking'
  | 'agenda'
  | 'appointments'
  | 'customers'
  | 'services'
  | 'professionals'
  | 'hours'
  | 'settings'

export const BOOKING_NAV: Array<{ view: BookingView; label: string }> = [
  { view: 'agenda', label: 'Agenda' },
  { view: 'appointments', label: 'Citas' },
  { view: 'customers', label: 'Clientes' },
  { view: 'services', label: 'Servicios' },
  { view: 'professionals', label: 'Profesionales' },
  { view: 'hours', label: 'Disponibilidad' },
  { view: 'settings', label: 'Enlace público' },
]

export const BOOKING_MOBILE_DOCK: BookingView[] = [
  'agenda',
  'appointments',
  'customers',
]

export const BOOKING_MORE: BookingView[] = [
  'services',
  'professionals',
  'hours',
  'settings',
]

const VIEWS = new Set<string>([
  ...BOOKING_NAV.map((n) => n.view),
  'home',
  'booking',
])

export function isBookingView(v: string | null | undefined): v is BookingView {
  return !!v && VIEWS.has(v)
}

export function normalizeBookingView(v: string | null | undefined): BookingView {
  if (v === 'home' || v === 'booking') return 'agenda'
  if (isBookingView(v)) return v
  return 'agenda'
}

export function localYmd(d = new Date()): string {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60_000)
  return z.toISOString().slice(0, 10)
}

export function addDays(ymd: string, n: number): string {
  const d = new Date(`${ymd}T12:00:00`)
  d.setDate(d.getDate() + n)
  return localYmd(d)
}

export const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
