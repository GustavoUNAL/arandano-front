const BOGOTA_TZ = 'America/Bogota'

export function bogotaDateKey(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: BOGOTA_TZ }).format(d)
}

function bogotaClock(now = new Date()): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: BOGOTA_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  return { hour, minute }
}

/** true si el día ya pasó la hora de cierre automático (23:59 Bogotá). */
export function isPastAutoCloseTime(dateKey: string, now = new Date()): boolean {
  const todayKey = bogotaDateKey(now)
  if (dateKey < todayKey) return true
  if (dateKey > todayKey) return false
  const { hour, minute } = bogotaClock(now)
  return hour > 23 || (hour === 23 && minute >= 59)
}

export function isCashCloseEditable(
  dateKey: string,
  status: 'DRAFT' | 'CLOSED' | null | undefined,
): boolean {
  if (status === 'CLOSED') return false
  return !isPastAutoCloseTime(dateKey)
}

export function msUntilAutoClose(dateKey: string, now = new Date()): number | null {
  if (isPastAutoCloseTime(dateKey, now)) return null
  const todayKey = bogotaDateKey(now)
  if (dateKey !== todayKey) return null
  const closeAt = new Date(`${dateKey}T23:59:00-05:00`)
  return Math.max(0, closeAt.getTime() - now.getTime())
}
