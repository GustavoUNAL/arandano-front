import { apiFetch, getApiBase } from '../api'

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'

export type BookingService = {
  id: string
  name: string
  description: string
  durationMin: number
  price: number | string
  currency?: string
  active: boolean
}

export type BookingStaff = {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  photoUrl?: string | null
  active: boolean
  serviceIds?: string[]
  serviceLinks?: { serviceId: string }[]
}

export type BookingCustomer = {
  id: string
  name: string
  phone: string
  email?: string | null
  notes?: string | null
  appointments?: BookingAppointment[]
}

export type BookingAppointment = {
  id: string
  startAt: string
  endAt: string
  date: string
  status: BookingStatus
  source: 'ADMIN' | 'PUBLIC_BOOKING'
  notes?: string | null
  customer: { id: string; name: string; phone: string; email?: string | null }
  service: { id: string; name: string; durationMin: number; price: number; currency?: string }
  staff: { id: string; name: string }
}

export type BookingDashboard = {
  date: string
  total: number
  completed: number
  cancelled: number
  revenue: number
  next: BookingAppointment | null
  appointments: BookingAppointment[]
}

export type BookingSettings = {
  publicSlug: string
  publicEnabled: boolean
  welcomeMessage: string
  noticeMessage?: string
  whatsappPhone?: string
  slotIntervalMin: number
  bufferMin: number
  timezone: string
}

export type BookingHours = {
  id: string
  weekday: number
  startMin: number
  endMin: number
  staffId: string | null
}

export type BookingBlock = {
  id: string
  startAt: string
  endAt: string
  reason?: string | null
  staffId?: string | null
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string | string[] }
    const msg = Array.isArray(body.message) ? body.message.join(', ') : body.message
    throw new Error(msg || res.statusText)
  }
  return res.json() as Promise<T>
}

export const bookingApi = {
  dashboard: (base: string) =>
    apiFetch(`${base}/booking/dashboard`).then((r) => json<BookingDashboard>(r)),
  settings: (base: string) =>
    apiFetch(`${base}/booking/settings`).then((r) => json<BookingSettings>(r)),
  updateSettings: (base: string, body: Partial<BookingSettings>) =>
    apiFetch(`${base}/booking/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => json<BookingSettings>(r)),
  services: (base: string) =>
    apiFetch(`${base}/booking/services?all=1`).then((r) => json<BookingService[]>(r)),
  createService: (base: string, body: object) =>
    apiFetch(`${base}/booking/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => json<BookingService>(r)),
  updateService: (base: string, id: string, body: object) =>
    apiFetch(`${base}/booking/services/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => json<BookingService>(r)),
  staff: (base: string) =>
    apiFetch(`${base}/booking/staff?all=1`).then((r) => json<BookingStaff[]>(r)),
  createStaff: (base: string, body: object) =>
    apiFetch(`${base}/booking/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => json<BookingStaff>(r)),
  updateStaff: (base: string, id: string, body: object) =>
    apiFetch(`${base}/booking/staff/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => json<BookingStaff>(r)),
  customers: (base: string, q = '') =>
    apiFetch(`${base}/booking/customers?q=${encodeURIComponent(q)}`).then((r) =>
      json<BookingCustomer[]>(r),
    ),
  upsertCustomer: (base: string, body: object) =>
    apiFetch(`${base}/booking/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => json<BookingCustomer>(r)),
  hours: (base: string, staffId?: string) =>
    apiFetch(
      `${base}/booking/hours${staffId != null ? `?staffId=${encodeURIComponent(staffId)}` : ''}`,
    ).then((r) => json<BookingHours[]>(r)),
  replaceHours: (
    base: string,
    hours: { weekday: number; startMin: number; endMin: number }[],
    staffId: string | null = null,
  ) =>
    apiFetch(`${base}/booking/hours`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId, hours }),
    }).then((r) => json<BookingHours[]>(r)),
  blocks: (base: string) =>
    apiFetch(`${base}/booking/blocks`).then((r) => json<BookingBlock[]>(r)),
  createBlock: (base: string, body: object) =>
    apiFetch(`${base}/booking/blocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => json<BookingBlock>(r)),
  deleteBlock: (base: string, id: string) =>
    apiFetch(`${base}/booking/blocks/${id}`, { method: 'DELETE' }).then((r) =>
      json<{ ok: boolean }>(r),
    ),
  appointments: (base: string, from: string, to: string) =>
    apiFetch(`${base}/booking/appointments?from=${from}&to=${to}`).then((r) =>
      json<BookingAppointment[]>(r),
    ),
  availability: (base: string, date: string, serviceId: string, staffId: string) =>
    apiFetch(
      `${base}/booking/availability?date=${date}&serviceId=${serviceId}&staffId=${staffId}`,
    ).then((r) => json<{ slots: string[]; durationMin: number }>(r)),
  createAppointment: (base: string, body: object) =>
    apiFetch(`${base}/booking/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => json<BookingAppointment>(r)),
  updateAppointment: (base: string, id: string, body: object) =>
    apiFetch(`${base}/booking/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => json<BookingAppointment>(r)),
  cancelAppointment: (base: string, id: string) =>
    apiFetch(`${base}/booking/appointments/${id}/cancel`, {
      method: 'POST',
    }).then((r) => json<BookingAppointment>(r)),
  customerHistory: (base: string, id: string) =>
    apiFetch(`${base}/booking/customers/${id}/appointments`).then((r) =>
      json<{ customer: BookingCustomer; appointments: BookingAppointment[] }>(r),
    ),
}

export async function fetchPublicCatalog(slug: string) {
  const base = getApiBase()
  const res = await fetch(`${base}/public/booking/${encodeURIComponent(slug)}`)
  return json<{
    business: {
      name: string
      slug: string
      welcomeMessage: string
      noticeMessage?: string
      whatsappPhone?: string
      timezone?: string
    }
    hours?: Array<{ weekday: number; startMin: number; endMin: number }>
    services: Array<{
      id: string
      name: string
      description: string
      durationMin: number
      price: number
    }>
    staff: Array<{ id: string; name: string; photoUrl: string | null; serviceIds: string[] }>
  }>(res)
}

export async function fetchPublicAvailability(
  slug: string,
  date: string,
  serviceId: string,
  staffId: string,
) {
  const base = getApiBase()
  const res = await fetch(
    `${base}/public/booking/${encodeURIComponent(slug)}/availability?date=${date}&serviceId=${serviceId}&staffId=${staffId}`,
  )
  return json<{ slots: string[]; durationMin: number }>(res)
}

export async function createPublicAppointment(slug: string, body: object) {
  const base = getApiBase()
  const res = await fetch(`${base}/public/booking/${encodeURIComponent(slug)}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return json<BookingAppointment>(res)
}

export function isPublicBookingRoute(): boolean {
  const hash = window.location.hash ?? ''
  if (
    (hash.startsWith('#/agenda/') || hash.startsWith('#/booking/')) &&
    !hash.startsWith('#/booking/login')
  ) {
    return true
  }
  const path = window.location.pathname.replace(/\/$/, '')
  return (
    (path.startsWith('/agenda/') && path !== '/agenda') ||
    (path.startsWith('/booking/') && path !== '/booking')
  )
}

export function getPublicBookingSlug(): string {
  const hash = window.location.hash ?? ''
  if (hash.startsWith('#/agenda/')) {
    return decodeURIComponent(hash.replace('#/agenda/', '').split(/[/?#]/)[0] ?? '')
  }
  if (hash.startsWith('#/booking/')) {
    return decodeURIComponent(hash.replace('#/booking/', '').split(/[/?#]/)[0] ?? '')
  }
  const parts = window.location.pathname.split('/').filter(Boolean)
  if (parts[0] === 'agenda' || parts[0] === 'booking') {
    return decodeURIComponent(parts[1] ?? '')
  }
  return ''
}

export function publicBookingUrl(slug: string): string {
  return `${window.location.origin}/agenda/${encodeURIComponent(slug)}`
}

export function publicDisplayName(
  welcomeMessage: string | null | undefined,
  companyName?: string | null,
): string {
  const welcome = welcomeMessage?.trim() ?? ''
  const stale =
    !welcome ||
    welcome.length > 48 ||
    /elige servicio|profesional y horario/i.test(welcome)
  if (!stale) return welcome
  return companyName?.trim() && !/demo/i.test(companyName) ? companyName.trim() : 'Ricky Barbero'
}

export function hourlyTurns(slots: string[]): string[] {
  const hours = slots.filter((s) => s.endsWith(':00'))
  return hours.length ? hours : slots
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Horas del día según el horario de atención (turnos de 60 min). */
export function hourSlotsForDate(
  hours: Array<{ weekday: number; startMin: number; endMin: number }> | undefined,
  date: string,
): string[] {
  const wd = new Date(`${date}T12:00:00`).getDay()
  const blocks = (hours ?? []).filter((h) => h.weekday === wd)
  const use = blocks.length ? blocks : [{ startMin: 8 * 60, endMin: 18 * 60 }]
  const out: string[] = []
  const seen = new Set<string>()
  for (const block of use) {
    for (let start = block.startMin; start + 60 <= block.endMin; start += 60) {
      const label = `${pad2(Math.floor(start / 60))}:${pad2(start % 60)}`
      if (seen.has(label)) continue
      seen.add(label)
      out.push(label)
    }
  }
  return out.sort()
}

function minutesOf(hhmmValue: string): number {
  const [h, m] = hhmmValue.split(':').map(Number)
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0)
}

/** true si esa hora ya pasó (zona America/Bogota). */
export function isHourPast(date: string, time: string, today: string): boolean {
  if (date < today) return true
  if (date > today) return false
  const now = new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Bogota',
  })
  return minutesOf(time) <= minutesOf(now)
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

export function turnRangeLabel(start: string): string {
  const [h, m] = start.split(':').map(Number)
  if (!Number.isFinite(h)) return start
  const endH = h + 1
  const mm = String(m || 0).padStart(2, '0')
  return `${start} – ${String(endH).padStart(2, '0')}:${mm}`
}

export const DEFAULT_BOOKING_NOTICE =
  'Su turno quedó confirmado. Escríbanos por WhatsApp si necesita cambiar algo.'

export function bookingNoticeText(notice?: string | null): string {
  const t = notice?.trim() ?? ''
  if (!t || /pendiente de confirmación/i.test(t)) return DEFAULT_BOOKING_NOTICE
  return t
}

/** Arma el enlace wa.me a partir de un celular colombiano o internacional. */
export function bookingWhatsAppUrl(
  phone: string | null | undefined,
  prefill?: string,
): string | null {
  const digits = (phone ?? '').replace(/\D/g, '')
  if (digits.length < 10) return null
  const e164 =
    digits.startsWith('57') && digits.length >= 12
      ? digits
      : `57${digits.replace(/^0+/, '')}`
  const base = `https://wa.me/${e164}`
  if (!prefill?.trim()) return base
  return `${base}?text=${encodeURIComponent(prefill.trim())}`
}

export function formatCOP(value: number | string): string {
  const n = typeof value === 'string' ? Number(value) : value
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0)
}

export function hhmm(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Bogota',
  })
}

export const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: 'Por aceptar',
  CONFIRMED: 'Confirmada',
  COMPLETED: 'Terminado',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No asistió',
}
