import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { BrandMark } from '../components/BrandMark'
import { Button } from '../components/ui/button'
import { PublicThemeSwitch } from '../components/PublicThemeSwitch'
import { usePublicTheme } from '../hooks/usePublicTheme'
import {
  bookingNoticeText,
  bookingWhatsAppUrl,
  createPublicAppointment,
  digitsOnly,
  fetchPublicAvailability,
  fetchPublicCatalog,
  getPublicBookingSlug,
  hhmm,
  hourSlotsForDate,
  isHourPast,
  publicDisplayName,
  turnRangeLabel,
  type BookingAppointment,
} from './bookingApi'
import { addDays, localYmd, WEEKDAYS } from './bookingNav'
import '../public-shell.css'
import './booking.css'

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

type Catalog = Awaited<ReturnType<typeof fetchPublicCatalog>>
type TurnState = 'free' | 'busy' | 'past'

function monthCells(year: number, month: number): Array<string | null> {
  const first = new Date(year, month, 1)
  const startPad = first.getDay()
  const days = new Date(year, month + 1, 0).getDate()
  const cells: Array<string | null> = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= days; d++) {
    const mm = String(month + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    cells.push(`${year}-${mm}-${dd}`)
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function firstOpenYmd(today: string, openWeekdays: Set<number>) {
  for (let i = 0; i < 21; i++) {
    const ymd = addDays(today, i)
    const wd = new Date(`${ymd}T12:00:00`).getDay()
    if (openWeekdays.has(wd)) return ymd
  }
  return today
}

export function PublicBookingApp() {
  const slug = getPublicBookingSlug()
  const { theme, toggleTheme } = usePublicTheme()
  const today = localYmd()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [serviceId, setServiceId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [cursor, setCursor] = useState(() => {
    const n = new Date()
    return { y: n.getFullYear(), m: n.getMonth() }
  })
  const [date, setDate] = useState(today)
  const [time, setTime] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [done, setDone] = useState<BookingAppointment | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!slug) {
      setError('Enlace inválido')
      setLoading(false)
      return
    }
    void fetchPublicCatalog(slug)
      .then((c) => {
        setCatalog(c)
        const hourService =
          c.services.find((s) => s.durationMin >= 60) ?? c.services[0]
        setServiceId(hourService?.id ?? '')
        const ricky =
          c.staff.find((s) => /^ricky$/i.test(s.name)) ??
          c.staff.find((s) => s.serviceIds.includes(hourService?.id ?? '')) ??
          c.staff[0]
        setStaffId(ricky?.id ?? '')
        const open = new Set((c.hours ?? []).map((h) => h.weekday))
        const start = firstOpenYmd(today, open.size ? open : new Set([1, 2, 3, 4, 5, 6]))
        setDate(start)
        const [y, m] = start.split('-').map(Number)
        setCursor({ y, m: m - 1 })
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'No disponible'))
      .finally(() => setLoading(false))
  }, [slug])

  const openWeekdays = useMemo(() => {
    const set = new Set((catalog?.hours ?? []).map((h) => h.weekday))
    return set.size ? set : new Set([1, 2, 3, 4, 5, 6])
  }, [catalog])

  const cells = useMemo(() => monthCells(cursor.y, cursor.m), [cursor])

  const loadSlots = useCallback(async () => {
    if (!slug || !serviceId || !staffId || !date) {
      setSlots([])
      return [] as string[]
    }
    setSlotsLoading(true)
    try {
      const r = await fetchPublicAvailability(slug, date, serviceId, staffId)
      setSlots(r.slots)
      return r.slots
    } catch (ex) {
      setSlots([])
      setError(ex instanceof Error ? ex.message : 'No se pudieron cargar los turnos.')
      return [] as string[]
    } finally {
      setSlotsLoading(false)
    }
  }, [slug, serviceId, staffId, date])

  const schedule = useMemo(
    () => hourSlotsForDate(catalog?.hours, date),
    [catalog, date],
  )

  const turns = useMemo(
    () =>
      schedule.map((hour) => {
        const past = isHourPast(date, hour, today)
        const free = slots.includes(hour)
        const state: TurnState = past ? 'past' : free ? 'free' : 'busy'
        return { hour, state }
      }),
    [schedule, slots, date, today],
  )

  const freeHours = useMemo(
    () => turns.filter((t) => t.state === 'free').map((t) => t.hour),
    [turns],
  )

  useEffect(() => {
    void loadSlots().then((free) => {
      setTime((prev) => (free.includes(prev) ? prev : free[0] ?? ''))
    })
  }, [loadSlots])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!slug || saving || done) return
    const trimmedName = name.trim()
    const phoneDigits = digitsOnly(phone)
    if (!date) {
      setError('Elija un día.')
      return
    }
    if (!time || !freeHours.includes(time)) {
      setError('Elija un turno libre.')
      return
    }
    if (trimmedName.length < 2) {
      setError('Indique su nombre.')
      return
    }
    if (phoneDigits.length < 7) {
      setError('Indique un teléfono válido.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      const appt = await createPublicAppointment(slug, {
        serviceId: serviceId || undefined,
        staffId: staffId || undefined,
        date,
        time,
        name: trimmedName,
        phone: phoneDigits,
        notes: note.trim() || undefined,
      })
      setDone(appt)
      const free = await loadSlots()
      setTime(free[0] ?? '')
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : 'No se pudo confirmar el turno.')
      await loadSlots()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="public-shell bk-public">
        <div className="bk-public__card">
          <p className="bk__meta">Cargando agenda…</p>
        </div>
      </div>
    )
  }
  if (!catalog) {
    return (
      <div className="public-shell bk-public">
        <div className="bk-public__card">
          <BrandMark size="sm" />
          <h1>Agenda no disponible</h1>
          <p className="bk__meta">{error || 'Este enlace no está activo.'}</p>
        </div>
      </div>
    )
  }

  const displayName = publicDisplayName(
    catalog.business.welcomeMessage,
    catalog.business.name,
  )
  const notice = bookingNoticeText(catalog.business.noticeMessage)
  const waPrefill = done
    ? [
        `Hola, soy ${name}.`,
        `Confirmé un turno el ${done.date} de ${turnRangeLabel(hhmm(done.startAt))}.`,
        note.trim() ? `Detalle: ${note.trim()}` : null,
      ]
        .filter(Boolean)
        .join(' ')
    : ''
  const waUrl = bookingWhatsAppUrl(catalog.business.whatsappPhone, waPrefill)
  const allBusy = !slotsLoading && turns.length > 0 && freeHours.length === 0

  return (
    <div className="public-shell bk-public">
      <PublicThemeSwitch theme={theme} onToggle={toggleTheme} compact className="bk-public__theme" />
      <form className="bk-public__card" onSubmit={submit} noValidate>
        <header className="bk-public__head">
          <h1>{displayName}</h1>
        </header>

        {error ? (
          <p className="bk__alert" role="alert">
            {error}
          </p>
        ) : null}

        <div className="bk-public__board">
          <fieldset className="bk-public__fieldset">
            <legend>Día</legend>
            <div className="bk-cal">
              <div className="bk-cal__nav">
                <button
                  type="button"
                  className="bk-cal__nav-btn"
                  onClick={() =>
                    setCursor((c) =>
                      c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 },
                    )
                  }
                  aria-label="Mes anterior"
                >
                  ‹
                </button>
                <strong>
                  {MONTHS[cursor.m]} {cursor.y}
                </strong>
                <button
                  type="button"
                  className="bk-cal__nav-btn"
                  onClick={() =>
                    setCursor((c) =>
                      c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 },
                    )
                  }
                  aria-label="Mes siguiente"
                >
                  ›
                </button>
              </div>
              <div className="bk-cal__grid" role="grid" aria-label="Calendario">
                {WEEKDAYS.map((d) => (
                  <span key={d} className="bk-cal__dow">
                    {d}
                  </span>
                ))}
                {cells.map((ymd, i) => {
                  if (!ymd) return <span key={`e-${i}`} className="bk-cal__day is-empty" />
                  const wd = new Date(`${ymd}T12:00:00`).getDay()
                  const past = ymd < today
                  const closed = !openWeekdays.has(wd)
                  const disabled = past || closed
                  const isToday = ymd === today
                  return (
                    <button
                      key={ymd}
                      type="button"
                      disabled={disabled}
                      className={`bk-cal__day${date === ymd ? ' is-on' : ''}${closed ? ' is-closed' : ''}${isToday ? ' is-today' : ''}`}
                      onClick={() => {
                        setDate(ymd)
                        setTime('')
                        setError(null)
                      }}
                    >
                      {Number(ymd.slice(8))}
                    </button>
                  )
                })}
              </div>
            </div>
          </fieldset>

          <fieldset className="bk-public__fieldset">
            <legend>Turnos</legend>
            {slotsLoading ? <p className="bk__meta">Buscando turnos…</p> : null}
            {!slotsLoading && turns.length === 0 ? (
              <p className="bk__meta">No hay turnos ese día. Pruebe otra fecha.</p>
            ) : null}
            {allBusy ? (
              <p className="bk__meta">Ese día no tiene horas libres. Las ocupadas aparecen abajo.</p>
            ) : null}
            {!slotsLoading && turns.length > 0 ? (
              <div className="bk-public__turns">
                {turns.map(({ hour, state }) => {
                  const taken = state !== 'free'
                  return (
                    <button
                      key={hour}
                      type="button"
                      disabled={taken || saving || !!done}
                      className={`bk-public__turn${time === hour ? ' is-on' : ''}${state === 'busy' ? ' is-busy' : ''}${state === 'past' ? ' is-past' : ''}`}
                      onClick={() => setTime(hour)}
                    >
                      <span>{turnRangeLabel(hour)}</span>
                      {state === 'busy' ? <span className="bk-public__turn-state">Ocupado</span> : null}
                      {state === 'past' ? <span className="bk-public__turn-state">Pasó</span> : null}
                    </button>
                  )
                })}
              </div>
            ) : null}
          </fieldset>
        </div>

        <fieldset className="bk-public__fieldset bk-public__data">
          <legend>Sus datos</legend>
          <div className="bk-public__data-grid">
            <label className="bk__field">
              Nombre
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </label>
            <label className="bk__field">
              Teléfono
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
                inputMode="tel"
                placeholder="300 000 0000"
              />
            </label>
            <label className="bk__field bk-public__note">
              Descripción
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={400}
                rows={3}
                placeholder="Qué se va a hacer, algún detalle…"
              />
            </label>
          </div>
        </fieldset>

        <Button type="submit" size="lg" block disabled={!time || saving || !!done}>
          {saving ? 'Confirmando…' : 'Confirmar turno'}
        </Button>
      </form>
      {done ? (
        <div
          className="bk-public__modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bk-notice-title"
          onClick={() => setDone(null)}
        >
          <div className="bk-public__modal-card" onClick={(e) => e.stopPropagation()}>
            <p className="bk-public__kicker">Listo</p>
            <h2 id="bk-notice-title">Turno confirmado</h2>
            <p className="bk-public__aviso">{notice}</p>
            <div className="bk-public__summary">
              <strong>{done.date}</strong>
              <span>{turnRangeLabel(hhmm(done.startAt))}</span>
              {note.trim() ? <span>{note.trim()}</span> : null}
            </div>
            {waUrl ? (
              <a className="bk-public__wa" href={waUrl} target="_blank" rel="noreferrer">
                Continuar en WhatsApp
              </a>
            ) : null}
            <button type="button" className="bk__ghost" onClick={() => setDone(null)}>
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
      <div className="bk-public__foot">
        <BrandMark size="sm" />
      </div>
    </div>
  )
}
